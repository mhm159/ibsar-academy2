import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

/**
 * GET /api/classroom/whiteboard?session=<id>
 * Returns the saved whiteboard state (Excalidraw elements JSON).
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const sessionId = new URL(req.url).searchParams.get('session')
  if (!sessionId) {
    return NextResponse.json({ error: 'معرف الحصة مطلوب' }, { status: 422 })
  }

  // Verify authorization (any participant)
  const sess = await db.session.findUnique({
    where: { id: sessionId },
    include: {
      teacher: { include: { user: { select: { id: true } } } },
      bookings: { include: { student: { include: { parent: { include: { user: { select: { id: true } } } } } } } },
    },
  })
  if (!sess) {
    return NextResponse.json({ error: 'الحصة غير موجودة' }, { status: 404 })
  }

  let authorized = false
  if (session.role === 'TEACHER' && sess.teacher.user.id === session.userId) authorized = true
  else if (session.role === 'PARENT') {
    const parent = await db.parent.findUnique({
      where: { userId: session.userId },
      include: { students: { select: { id: true } } },
    })
    if (parent) {
      const studentIds = parent.students.map((s) => s.id)
      authorized = sess.bookings.some((b) => studentIds.includes(b.studentId))
    }
  } else if (session.role === 'ADMIN') authorized = true

  if (!authorized) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const state = await db.whiteboardState.findUnique({
    where: { sessionId },
  })

  return NextResponse.json({
    elements: state?.elementsJson ? JSON.parse(state.elementsJson) : [],
    appState: state?.appStateJson ? JSON.parse(state.appStateJson) : {},
  })
}

/**
 * PUT /api/classroom/whiteboard
 * Body: { sessionId, elements, appState }
 *
 * Saves the whiteboard state. Only teacher can save (students are read-only).
 * Throttled: client should send at most every 3-5 seconds.
 */
export async function PUT(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'TEACHER') {
    return NextResponse.json({ error: 'غير مصرح — المعلم فقط يمكنه حفظ السبورة' }, { status: 403 })
  }

  const body = await req.json()
  const { sessionId, elements, appState } = body as {
    sessionId: string
    elements: any[]
    appState?: any
  }

  if (!sessionId || !Array.isArray(elements)) {
    return NextResponse.json({ error: 'بيانات غير صحيحة' }, { status: 422 })
  }

  // Verify teacher owns this session
  const sess = await db.session.findUnique({
    where: { id: sessionId },
    include: { teacher: { include: { user: { select: { id: true } } } } },
  })
  if (!sess) {
    return NextResponse.json({ error: 'الحصة غير موجودة' }, { status: 404 })
  }
  if (sess.teacher.user.id !== session.userId) {
    return NextResponse.json({ error: 'لست معلم هذه الحصة' }, { status: 403 })
  }

  await db.whiteboardState.upsert({
    where: { sessionId },
    update: {
      elementsJson: JSON.stringify(elements),
      appStateJson: JSON.stringify(appState ?? {}),
    },
    create: {
      sessionId,
      elementsJson: JSON.stringify(elements),
      appStateJson: JSON.stringify(appState ?? {}),
    },
  })

  return NextResponse.json({ ok: true })
}
