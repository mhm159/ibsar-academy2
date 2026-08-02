import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

/**
 * GET /api/dashboard/admin/sessions?status=&track=&q=&from=&to=
 * Lists sessions with per-session aggregates (chat count, participants,
 * focus score, activity count, media count) for the admin session report.
 */
export async function GET(req: NextRequest) {
  const sessionUser = await getSession()
  if (!sessionUser || (sessionUser.role !== 'ADMIN' && sessionUser.role !== 'SUPERVISOR')) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const track = searchParams.get('track')
  const q = searchParams.get('q')
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const where: Prisma.SessionWhereInput = {}
  if (status) where.status = status
  if (track) where.track = track
  if (q) where.OR = [{ title: { contains: q } }, { teacher: { user: { name: { contains: q } } } }]
  if (from || to) {
    where.startTime = {}
    if (from) where.startTime.gte = new Date(from)
    if (to) where.startTime.lte = new Date(to)
  }

  const sessions = await db.session.findMany({
    where,
    orderBy: { startTime: 'desc' },
    take: 200,
    include: {
      teacher: { include: { user: { select: { name: true } } } },
      bookings: {
        select: { status: true },
      },
      progressReports: { select: { focusScore: true, attendance: true } },
      chatMessages: { select: { id: true } },
      sessionLogs: { select: { id: true } },
      media: { select: { id: true } },
      supervisorReports: { select: { id: true, rating: true } },
    },
  })

  const data = sessions.map((s) => {
    const focusScores = s.progressReports.filter((r) => r.focusScore != null).map((r) => r.focusScore as number)
    const avgFocus = focusScores.length ? Math.round(focusScores.reduce((a, b) => a + b, 0) / focusScores.length) : null
    return {
      id: s.id,
      title: s.title,
      track: s.track,
      status: s.status,
      startTime: s.startTime.toISOString(),
      endTime: s.endTime.toISOString(),
      durationMins: s.durationMins,
      isTrial: s.isTrial,
      teacherName: s.teacher.user.name,
      studentsCount: s.bookings.filter((b) => b.status !== 'CANCELLED').length,
      chatCount: s.chatMessages.length,
      activityCount: s.sessionLogs.length,
      mediaCount: s.media.length,
      avgFocusScore: avgFocus,
      reportsCount: s.supervisorReports.length,
      avgSupervisorRating: s.supervisorReports.length
        ? Math.round(s.supervisorReports.reduce((a, r) => a + r.rating, 0) / s.supervisorReports.length)
        : null,
    }
  })

  const summary = {
    total: data.length,
    completed: data.filter((d) => d.status === 'COMPLETED').length,
    scheduled: data.filter((d) => d.status === 'SCHEDULED').length,
    inProgress: data.filter((d) => d.status === 'IN_PROGRESS').length,
    cancelled: data.filter((d) => d.status === 'CANCELLED').length,
    totalChatMessages: data.reduce((a, d) => a + d.chatCount, 0),
    totalStudents: data.reduce((a, d) => a + d.studentsCount, 0),
  }

  return NextResponse.json({ sessions: data, summary })
}
