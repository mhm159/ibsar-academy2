import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

/** GET /api/dashboard/parent/reports — progress reports for all children */
export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'PARENT') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }
  const parent = await db.parent.findUnique({
    where: { userId: session.userId },
    include: { students: { select: { id: true, name: true } } },
  })
  if (!parent) {
    return NextResponse.json({ error: 'الملف غير موجود' }, { status: 404 })
  }

  const studentIds = parent.students.map((s) => s.id)

  const reports = await db.progressReport.findMany({
    where: { studentId: { in: studentIds } },
    include: {
      session: { select: { title: true, track: true, startTime: true } },
      student: { select: { id: true, name: true } },
      teacher: { include: { user: { select: { name: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Per-student summary
  const perStudent = parent.students.map((student) => {
    const studentReports = reports.filter((r) => r.studentId === student.id)
    const avgScore =
      studentReports.length > 0
        ? Math.round(studentReports.reduce((s, r) => s + r.score, 0) / studentReports.length)
        : 0
    const avgEngagement =
      studentReports.length > 0
        ? (studentReports.reduce((s, r) => s + r.engagement, 0) / studentReports.length).toFixed(1)
        : '0'
    const avgUnderstanding =
      studentReports.length > 0
        ? (studentReports.reduce((s, r) => s + r.understanding, 0) / studentReports.length).toFixed(1)
        : '0'
    const attendance = studentReports.filter((r) => r.attendance === 'PRESENT').length

    return {
      studentId: student.id,
      studentName: student.name,
      totalSessions: studentReports.length,
      avgScore,
      avgEngagement: parseFloat(avgEngagement),
      avgUnderstanding: parseFloat(avgUnderstanding),
      attendanceRate: studentReports.length > 0 ? Math.round((attendance / studentReports.length) * 100) : 0,
    }
  })

  return NextResponse.json({
    perStudent,
    reports: reports.map((r) => ({
      id: r.id,
      score: r.score,
      engagement: r.engagement,
      understanding: r.understanding,
      homework: r.homework,
      attendance: r.attendance,
      notes: r.notes,
      createdAt: r.createdAt,
      sessionTitle: r.session.title,
      track: r.session.track,
      sessionDate: r.session.startTime,
      studentName: r.student.name,
      teacherName: r.teacher.user.name,
    })),
  })
}
