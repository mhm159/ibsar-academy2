import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

/** GET /api/dashboard/teacher/overview */
export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'TEACHER') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }
  const teacher = await db.teacher.findUnique({
    where: { userId: session.userId },
    include: { user: { select: { name: true } } },
  })
  if (!teacher) {
    return NextResponse.json({ error: 'الملف غير موجود' }, { status: 404 })
  }

  const now = new Date()

  // Upcoming sessions
  const upcomingSessions = await db.session.findMany({
    where: {
      teacherId: teacher.id,
      status: 'SCHEDULED',
      startTime: { gt: now },
    },
    include: {
      bookings: {
        include: { student: { select: { id: true, name: true } } },
      },
    },
    orderBy: { startTime: 'asc' },
    take: 5,
  })

  // Total unique students (via bookings)
  const allBookings = await db.booking.findMany({
    where: { session: { teacherId: teacher.id } },
    select: { studentId: true },
    distinct: ['studentId'],
  })
  const totalStudents = allBookings.length

  // Sessions this week
  const weekStart = new Date(now)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  weekStart.setHours(0, 0, 0, 0)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 7)
  const sessionsThisWeek = await db.session.count({
    where: {
      teacherId: teacher.id,
      startTime: { gte: weekStart, lt: weekEnd },
    },
  })

  // Completed sessions
  const completedSessions = await db.session.count({
    where: { teacherId: teacher.id, status: 'COMPLETED' },
  })

  // Earnings (sum of PAID transactions linked to this teacher's bookings)
  const paidBookings = await db.booking.findMany({
    where: {
      session: { teacherId: teacher.id },
      transaction: { status: 'PAID' },
    },
    select: { priceEGP: true, priceUSD: true },
  })
  const totalEarningsEGP = paidBookings.reduce((s, b) => s + b.priceEGP, 0)
  const totalEarningsUSD = paidBookings.reduce((s, b) => s + b.priceUSD, 0)

  // Pending earnings (PENDING transactions)
  const pendingBookings = await db.booking.findMany({
    where: {
      session: { teacherId: teacher.id },
      transaction: { status: 'PENDING' },
    },
    select: { priceEGP: true, priceUSD: true },
  })
  const pendingEarningsEGP = pendingBookings.reduce((s, b) => s + b.priceEGP, 0)

  // Availability
  const availability = await db.availability.findMany({
    where: { teacherId: teacher.id, isActive: true },
    orderBy: { dayOfWeek: 'asc' },
  })

  return NextResponse.json({
    teacher: {
      id: teacher.id,
      name: teacher.user.name,
      bio: teacher.bio,
      tracks: teacher.tracks.split(',').filter(Boolean),
      status: teacher.status,
      rating: teacher.rating,
      reviewsCount: teacher.reviewsCount,
      experienceYears: teacher.experienceYears,
      hourlyRateEGP: teacher.hourlyRateEGP,
      hourlyRateUSD: teacher.hourlyRateUSD,
      isFeatured: teacher.isFeatured,
    },
    stats: {
      totalStudents,
      sessionsThisWeek,
      completedSessions,
      upcomingSessions: upcomingSessions.length,
      totalEarningsEGP,
      totalEarningsUSD,
      pendingEarningsEGP,
    },
    upcomingSessions: upcomingSessions.map((s) => ({
      id: s.id,
      title: s.title,
      track: s.track,
      startTime: s.startTime,
      endTime: s.endTime,
      durationMins: s.durationMins,
      status: s.status,
      meetingUrl: s.meetingUrl,
      students: s.bookings.map((b) => b.student.name),
      bookedCount: s.bookings.length,
    })),
    availability: availability.map((a) => ({
      id: a.id,
      dayOfWeek: a.dayOfWeek,
      startHour: a.startHour,
      endHour: a.endHour,
    })),
  })
}
