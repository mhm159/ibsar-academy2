import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

/**
 * GET /api/classroom/lesson?session=<id>
 * Returns the lesson notes content for a session (stored in Session.notes).
 * Any participant of the session can read it.
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

  return NextResponse.json({ content: sess.notes ?? '' })
}

/**
 * PUT /api/classroom/lesson
 * Body: { sessionId, content }
 *
 * Saves the lesson notes. Only the teacher of the session can save.
 */
export async function PUT(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'TEACHER') {
    return NextResponse.json({ error: 'غير مصرح — المعلم فقط يمكنه حفظ الدرس' }, { status: 403 })
  }

  const body = await req.json()
  const { sessionId, content } = body as { sessionId: string; content: string }

  if (!sessionId || typeof content !== 'string') {
    return NextResponse.json({ error: 'بيانات غير صحيحة' }, { status: 422 })
  }

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

  await db.session.update({
    where: { id: sessionId },
    data: { notes: content },
  })

  return NextResponse.json({ ok: true })
}
