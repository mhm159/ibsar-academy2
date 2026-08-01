import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { createDailyRoom, createDailyMeetingToken } from '@/lib/daily'

/**
 * POST /api/classroom/join
 * Body: { sessionId }
 *
 * - Verifies caller is the teacher OR a parent with a booking for this session
 * - Creates (or fetches) the Daily.co room
 * - Creates a meeting token with the user's display name
 * - Returns: { roomUrl, token, sandbox, isOwner }
 *
 * Both teacher and parent call this; teacher becomes room owner (can start/stop recording).
 */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  let body: { sessionId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'صيغة غير صحيحة' }, { status: 400 })
  }

  const { sessionId } = body
  if (!sessionId) {
    return NextResponse.json({ error: 'معرف الحصة مطلوب' }, { status: 422 })
  }

  // Fetch session with teacher + bookings
  const sess = await db.session.findUnique({
    where: { id: sessionId },
    include: {
      teacher: { include: { user: { select: { id: true, name: true } } } },
      bookings: {
        include: {
          student: {
            include: {
              parent: { include: { user: { select: { id: true, name: true } } } },
            },
          },
        },
      },
    },
  })

  if (!sess) {
    return NextResponse.json({ error: 'الحصة غير موجودة' }, { status: 404 })
  }

  // Authorization: teacher OR parent with booking
  let isOwner = false
  let displayName = 'مشارك'
  let userRole = 'PARENT'

  if (session.role === 'TEACHER') {
    // Verify this teacher owns the session
    if (sess.teacher.userId !== session.userId) {
      return NextResponse.json({ error: 'لست معلم هذه الحصة' }, { status: 403 })
    }
    isOwner = true
    displayName = sess.teacher.user.name ?? 'المعلم'
    userRole = 'TEACHER'
  } else if (session.role === 'PARENT') {
    // Verify this parent has a booking for this session
    const parent = await db.parent.findUnique({
      where: { userId: session.userId },
      include: { students: { select: { id: true } }, user: { select: { name: true } } },
    })
    if (!parent) {
      return NextResponse.json({ error: 'الملف غير موجود' }, { status: 404 })
    }
    const studentIds = parent.students.map((s) => s.id)
    const booking = sess.bookings.find((b) => studentIds.includes(b.studentId) && b.status === 'CONFIRMED')
    if (!booking) {
      return NextResponse.json({ error: 'لا يوجد حجز مؤكد لك في هذه الحصة' }, { status: 403 })
    }
    displayName = parent.user.name ?? 'ولي الأمر'
    userRole = 'PARENT'
  } else if (session.role === 'ADMIN') {
    isOwner = true
    displayName = 'إدارة'
    userRole = 'ADMIN'
  } else {
    return NextResponse.json({ error: 'دور غير مدعوم' }, { status: 403 })
  }

  // Create or fetch Daily.co room
  const roomResult = await createDailyRoom({
    sessionId: sess.id,
    sessionTitle: sess.title,
    exp: Math.floor(sess.endTime.getTime() / 1000) + 2 * 60 * 60, // 2h after session end
    enableRecording: true,
  })

  if (!roomResult.ok) {
    return NextResponse.json({ error: roomResult.error }, { status: 500 })
  }

  // Store room info on session if not already
  if (!sess.dailyRoomName) {
    await db.session.update({
      where: { id: sess.id },
      data: {
        dailyRoomName: roomResult.room.name,
        dailyRoomUrl: roomResult.room.url,
        meetingUrl: roomResult.room.url,
        status: 'IN_PROGRESS',
      },
    })
  }

  // Create meeting token
  const tokenResult = await createDailyMeetingToken({
    roomName: roomResult.room.name,
    userName: displayName,
    isOwner,
    exp: Math.floor(sess.endTime.getTime() / 1000) + 2 * 60 * 60,
  })

  if (!tokenResult.ok) {
    return NextResponse.json({ error: tokenResult.error }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    userId: session.userId,
    roomUrl: roomResult.room.url,
    roomName: roomResult.room.name,
    token: tokenResult.token,
    sandbox: roomResult.sandbox || tokenResult.sandbox,
    isOwner,
    displayName,
    userRole,
    session: {
      id: sess.id,
      title: sess.title,
      track: sess.track,
      startTime: sess.startTime,
      endTime: sess.endTime,
      teacherName: sess.teacher.user.name,
    },
  })
}
