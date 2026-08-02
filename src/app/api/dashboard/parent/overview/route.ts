import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

/**
 * GET /api/dashboard/parent/overview
 * Stats: students count, upcoming sessions, pending payments, total spent
 * + upcoming sessions list + recent activity
 */
export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'PARENT') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const parent = await db.parent.findUnique({
    where: { userId: session.userId },
    include: {
      students: {
        select: { id: true, name: true, birthDate: true, gender: true, grade: true, levelsJson: true },
      },
    },
  })

  if (!parent) {
    return NextResponse.json({ error: 'الملف غير موجود' }, { status: 404 })
  }

  const studentIds = parent.students.map((s) => s.id)
  const now = new Date()

  // Upcoming sessions (via bookings)
  const upcomingBookings = await db.booking.findMany({
    where: {
      studentId: { in: studentIds },
      status: 'CONFIRMED',
      session: { startTime: { gt: now } },
    },
    include: {
      session: {
        include: {
          teacher: { include: { user: { select: { name: true } } } },
        },
      },
      student: { select: { id: true, name: true } },
    },
    orderBy: { session: { startTime: 'asc' } },
    take: 5,
  })

  // Past sessions count (completed)
  const completedSessions = await db.booking.count({
    where: {
      studentId: { in: studentIds },
      status: 'COMPLETED',
    },
  })

  // Transactions
  const transactions = await db.transaction.findMany({
    where: { parentId: parent.id },
    orderBy: { createdAt: 'desc' },
  })
  const totalSpentEGP = transactions
    .filter((t) => t.status === 'PAID')
    .reduce((sum, t) => sum + t.amountEGP, 0)
  const totalSpentUSD = transactions
    .filter((t) => t.status === 'PAID')
    .reduce((sum, t) => sum + t.amountUSD, 0)
  const pendingPayments = transactions.filter((t) => t.status === 'PENDING').length

  // Latest progress reports
  const recentReports = await db.progressReport.findMany({
    where: { studentId: { in: studentIds } },
    include: {
      session: { select: { title: true, track: true, startTime: true } },
      student: { select: { id: true, name: true } },
      teacher: { include: { user: { select: { name: true } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: 3,
  })

  return NextResponse.json({
    stats: {
      studentsCount: parent.students.length,
      upcomingSessions: upcomingBookings.length,
      completedSessions,
      pendingPayments,
      totalSpentEGP,
      totalSpentUSD,
    },
    students: parent.students,
    upcomingSessions: upcomingBookings.map((b) => ({
      id: b.id,
      sessionId: b.session.id,
      title: b.session.title,
      track: b.session.track,
      startTime: b.session.startTime,
      endTime: b.session.endTime,
      durationMins: b.session.durationMins,
      status: b.session.status,
      isTrial: b.session.isTrial,
      teacherName: b.session.teacher.user.name,
      studentName: b.student.name,
      meetingUrl: b.session.meetingUrl,
    })),
    recentReports: recentReports.map((r) => ({
      id: r.id,
      score: r.score,
      engagement: r.engagement,
      understanding: r.understanding,
      homework: r.homework,
      notes: r.notes,
      attendance: r.attendance,
      sessionTitle: r.session.title,
      track: r.session.track,
      sessionDate: r.session.startTime,
      studentName: r.student.name,
      teacherName: r.teacher.user.name,
    })),
  })
}

/* TODO(phase-3): Add escrow balance to stats once payment flows land. */
