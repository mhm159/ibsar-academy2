import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

/** GET /api/dashboard/admin/overview — platform-wide stats */
export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const [
    totalUsers,
    totalParents,
    totalTeachers,
    totalStudents,
    pendingTeachers,
    approvedTeachers,
    totalCourses,
    totalSessions,
    upcomingSessions,
    completedSessions,
    allTransactions,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { role: 'PARENT' } }),
    db.user.count({ where: { role: 'TEACHER' } }),
    db.student.count(),
    db.teacher.count({ where: { status: 'PENDING' } }),
    db.teacher.count({ where: { status: 'APPROVED' } }),
    db.course.count({ where: { status: 'PUBLISHED' } }),
    db.session.count(),
    db.session.count({ where: { status: 'SCHEDULED', startTime: { gt: new Date() } } }),
    db.session.count({ where: { status: 'COMPLETED' } }),
    db.transaction.findMany({ select: { amountEGP: true, amountUSD: true, status: true, currency: true } }),
  ])

  const totalRevenueEGP = allTransactions
    .filter((t) => t.status === 'PAID')
    .reduce((s, t) => s + t.amountEGP, 0)
  const totalRevenueUSD = allTransactions
    .filter((t) => t.status === 'PAID')
    .reduce((s, t) => s + t.amountUSD, 0)
  const pendingPayments = allTransactions.filter((t) => t.status === 'PENDING').length

  // Recent users (last 5)
  const recentUsers = await db.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      name: true,
      role: true,
      phone: true,
      country: true,
      createdAt: true,
      isActive: true,
    },
  })

  return NextResponse.json({
    stats: {
      totalUsers,
      totalParents,
      totalTeachers,
      totalStudents,
      pendingTeachers,
      approvedTeachers,
      totalCourses,
      totalSessions,
      upcomingSessions,
      completedSessions,
      totalRevenueEGP,
      totalRevenueUSD,
      pendingPayments,
    },
    recentUsers,
  })
}
