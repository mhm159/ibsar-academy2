import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { startRecording, stopRecording, listRecordings } from '@/lib/daily'

/**
 * POST /api/classroom/recording
 * Body: { sessionId, action: 'start' | 'stop' }
 *
 * Only the teacher (room owner) can start/stop recording.
 */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'TEACHER') {
    return NextResponse.json({ error: 'غير مصرح — المعلم فقط' }, { status: 403 })
  }

  const body = await req.json()
  const { sessionId, action } = body as { sessionId: string; action: 'start' | 'stop' }

  if (!sessionId || !action) {
    return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 422 })
  }

  const sess = await db.session.findUnique({
    where: { id: sessionId },
    include: { teacher: { include: { user: true } } },
  })
  if (!sess) {
    return NextResponse.json({ error: 'الحصة غير موجودة' }, { status: 404 })
  }
  if (sess.teacher.userId !== session.userId) {
    return NextResponse.json({ error: 'لست معلم هذه الحصة' }, { status: 403 })
  }
  if (!sess.dailyRoomName) {
    return NextResponse.json({ error: 'الغرفة غير منشأة بعد' }, { status: 400 })
  }

  if (action === 'start') {
    if (sess.recordingStatus === 'STARTED') {
      return NextResponse.json({ error: 'التسجيل جارٍ بالفعل' }, { status: 400 })
    }
    const result = await startRecording(sess.dailyRoomName)
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
    await db.session.update({
      where: { id: sessionId },
      data: { recordingStatus: 'STARTED' },
    })
    return NextResponse.json({ ok: true, recordingId: result.recordingId, status: 'STARTED' })
  } else if (action === 'stop') {
    if (sess.recordingStatus !== 'STARTED') {
      return NextResponse.json({ error: 'لا يوجد تسجيل جارٍ' }, { status: 400 })
    }
    // In sandbox mode we don't have a real recordingId; just mark as STOPPED
    await db.session.update({
      where: { id: sessionId },
      data: { recordingStatus: 'STOPPED' },
    })
    return NextResponse.json({ ok: true, status: 'STOPPED' })
  }

  return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 422 })
}

/**
 * GET /api/classroom/recording?session=<id>
 * Returns recording status + list of recordings for the session.
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
    select: {
      id: true,
      dailyRoomName: true,
      recordingStatus: true,
      recordingUrl: true,
      teacher: { include: { user: { select: { id: true } } } },
      bookings: { include: { student: { include: { parent: { include: { user: { select: { id: true } } } } } } } },
    },
  })
  if (!sess) {
    return NextResponse.json({ error: 'الحصة غير موجودة' }, { status: 404 })
  }

  // Authorization check
  let authorized = false
  if (session.role === 'TEACHER' && sess.teacher.user.id === session.userId) {
    authorized = true
  } else if (session.role === 'PARENT') {
    const parent = await db.parent.findUnique({
      where: { userId: session.userId },
      include: { students: { select: { id: true } } },
    })
    if (parent) {
      const studentIds = parent.students.map((s) => s.id)
      authorized = sess.bookings.some((b) => studentIds.includes(b.studentId))
    }
  } else if (session.role === 'ADMIN') {
    authorized = true
  }

  if (!authorized) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  // Fetch recordings from Daily.co
  const recordings = sess.dailyRoomName ? await listRecordings(sess.dailyRoomName) : []

  return NextResponse.json({
    recordingStatus: sess.recordingStatus,
    recordingUrl: sess.recordingUrl,
    recordings,
  })
}
