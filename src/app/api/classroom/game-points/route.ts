import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { awardPoints, checkAndUnlockBadges, POINTS } from '@/lib/gamification'

/**
 * POST /api/classroom/game-points
 * Awards QUIZ_PASS points to a student who completed the mini-game in a classroom
 * session with a passing score. Safe against double-awarding (one per session).
 */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  const body = await req.json()
  const { sessionId, score } = body as { sessionId?: string; score?: number }
  if (!sessionId) {
    return NextResponse.json({ error: 'معرف الحصة مطلوب' }, { status: 422 })
  }

  const sess = await db.session.findUnique({
    where: { id: sessionId },
    include: { bookings: { select: { studentId: true } } },
  })
  if (!sess) {
    return NextResponse.json({ error: 'الحصة غير موجودة' }, { status: 404 })
  }

  // Teacher viewing the session → no student points
  const teacher = await db.teacher.findUnique({ where: { userId: session.userId } })
  if (teacher && teacher.id === sess.teacherId) {
    return NextResponse.json({ ok: true, awarded: false, role: 'TEACHER' })
  }

  const bookingStudentIds = new Set(sess.bookings.map((b) => b.studentId))

  // Resolve the student for the current user
  let studentId: string | null = null

  const student = await db.student.findUnique({ where: { userId: session.userId } })
  if (student && bookingStudentIds.has(student.id)) {
    studentId = student.id
  } else {
    const parent = await db.parent.findUnique({
      where: { userId: session.userId },
      include: { students: { select: { id: true } } },
    })
    if (parent) {
      const linked = parent.students.find((s) => bookingStudentIds.has(s.id))
      if (linked) studentId = linked.id
    }
  }

  if (!studentId) {
    return NextResponse.json({ error: 'غير مسجل في هذه الحصة' }, { status: 403 })
  }

  // Require a passing score
  if (typeof score !== 'number' || score < 60) {
    return NextResponse.json({ ok: true, awarded: false, reason: 'LOW_SCORE' })
  }

  // Guard against double-awarding per session
  const existing = await db.pointsLog.findFirst({
    where: { studentId, reason: 'QUIZ_PASS', refId: sessionId },
  })
  if (existing) {
    return NextResponse.json({ ok: true, awarded: false, alreadyAwarded: true })
  }

  await awardPoints({
    studentId,
    points: POINTS.QUIZ_PASS,
    reason: 'QUIZ_PASS',
    description: `إكمال اللعبة المصغّرة في الحصة: ${sess.title}`,
    refId: sessionId,
  })
  await checkAndUnlockBadges(studentId)

  return NextResponse.json({ ok: true, awarded: true, points: POINTS.QUIZ_PASS })
}
