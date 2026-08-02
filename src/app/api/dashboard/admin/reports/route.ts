import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

/**
 * GET /api/dashboard/admin/reports
 * Aggregate management reports:
 *  - sessionsByStatus / sessionsByTrack
 *  - sessionsByMonth (last 6 months)
 *  - teacherPerformance
 *  - chatVolumeByDay (last 14 days)
 *  - focusAlertsByDay (last 14 days)
 *  - topStudents (engagement)
 *  - revenueSummary
 */
export async function GET(req: NextRequest) {
  const sessionUser = await getSession()
  if (!sessionUser || sessionUser.role !== 'ADMIN') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const dateFilter: Prisma.DateTimeFilter = {}
  if (from) dateFilter.gte = new Date(from)
  if (to) dateFilter.lte = new Date(to)
  const sessionWhere: Prisma.SessionWhereInput = Object.keys(dateFilter).length
    ? { startTime: dateFilter }
    : {}
  const now = new Date()

  // 1. Sessions by status
  const sessions = await db.session.findMany({
    where: sessionWhere,
    select: { id: true, status: true, track: true, startTime: true, durationMins: true, teacherId: true },
  })
  const sessionsByStatus: Record<string, number> = {}
  const sessionsByTrack: Record<string, number> = {}
  for (const s of sessions) {
    sessionsByStatus[s.status] = (sessionsByStatus[s.status] ?? 0) + 1
    sessionsByTrack[s.track] = (sessionsByTrack[s.track] ?? 0) + 1
  }

  // 2. Sessions by month (last 6 months)
  const monthLabels: string[] = []
  const sessionsByMonth: { month: string; count: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const label = d.toLocaleDateString('ar-EG', { month: 'long' })
    monthLabels.push(label)
    sessionsByMonth.push({ month: label, count: 0 })
  }
  for (const s of sessions) {
    const idx = monthLabels.indexOf(
      new Date(s.startTime).toLocaleDateString('ar-EG', { month: 'long' }),
    )
    if (idx !== -1) sessionsByMonth[idx].count++
  }

  // 3. Teacher performance
  const teachers = await db.teacher.findMany({
    include: {
      user: { select: { name: true } },
      sessions: { where: sessionWhere, select: { id: true, status: true, startTime: true } },
      progressReports: { select: { id: true, focusScore: true, score: true } },
    },
  })
  const teacherPerformance = teachers
    .map((t) => {
      const completed = t.sessions.filter((s) => s.status === 'COMPLETED').length
      const total = t.sessions.length
      const ratings = t.progressReports.filter((r) => r.score > 0).map((r) => r.score)
      const focus = t.progressReports.filter((r) => r.focusScore != null).map((r) => r.focusScore as number)
      return {
        id: t.id,
        name: t.user.name ?? 'معلم',
        totalSessions: total,
        completedSessions: completed,
        avgRating: ratings.length ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : null,
        avgFocus: focus.length ? Math.round(focus.reduce((a, b) => a + b, 0) / focus.length) : null,
      }
    })
    .sort((a, b) => b.totalSessions - a.totalSessions)
    .slice(0, 12)

  // 4. Chat volume by day (last 14 days)
  const since14 = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
  const chatMessages = await db.chatMessage.findMany({
    where: { createdAt: { gte: since14 } },
    select: { createdAt: true },
  })
  const chatVolumeByDay: { day: string; count: number }[] = []
  const dayKeys: string[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const key = d.toISOString().slice(0, 10)
    dayKeys.push(key)
    chatVolumeByDay.push({
      day: d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' }),
      count: 0,
    })
  }
  for (const m of chatMessages) {
    const key = new Date(m.createdAt).toISOString().slice(0, 10)
    const idx = dayKeys.indexOf(key)
    if (idx !== -1) chatVolumeByDay[idx].count++
  }

  // 5. Focus alerts by day (from session logs)
  const focusLogs = await db.sessionLog.findMany({
    where: { event: 'FOCUS_ALERT', createdAt: { gte: since14 } },
    select: { createdAt: true },
  })
  const focusAlertsByDay = chatVolumeByDay.map((d) => ({ ...d, count: 0 }))
  for (const l of focusLogs) {
    const key = new Date(l.createdAt).toISOString().slice(0, 10)
    const idx = dayKeys.indexOf(key)
    if (idx !== -1) focusAlertsByDay[idx].count++
  }

  // 6. Top students (engagement)
  const reports = await db.progressReport.findMany({
    where: Object.keys(dateFilter).length ? { session: sessionWhere } : {},
    include: { student: { select: { name: true } }, session: { select: { track: true } } },
  })
  const studentMap = new Map<string, { name: string; sessions: number; focusTotal: number; focusCount: number; track: string }>()
  for (const r of reports) {
    const key = r.studentId
    const entry = studentMap.get(key) ?? {
      name: r.student.name,
      sessions: 0,
      focusTotal: 0,
      focusCount: 0,
      track: r.session.track,
    }
    entry.sessions++
    if (r.focusScore != null) {
      entry.focusTotal += r.focusScore
      entry.focusCount++
    }
    studentMap.set(key, entry)
  }
  const topStudents = Array.from(studentMap.values())
    .map((s) => ({
      name: s.name,
      sessions: s.sessions,
      avgFocus: s.focusCount ? Math.round(s.focusTotal / s.focusCount) : null,
      track: s.track,
    }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 12)

  // 7. Revenue summary
  const transactions = await db.transaction.findMany({
    where: {
      type: { not: 'REFUND' },
      status: 'PAID',
      createdAt: Object.keys(dateFilter).length ? dateFilter : undefined,
    },
    select: { amountEGP: true, amountUSD: true, currency: true, provider: true },
  })
  let revenueEGP = 0
  let revenueUSD = 0
  for (const t of transactions) {
    if (t.currency === 'USD') revenueUSD += t.amountUSD
    else revenueEGP += t.amountEGP
  }
  const providerMap: Record<string, number> = {}
  for (const t of transactions) {
    providerMap[t.provider] = (providerMap[t.provider] ?? 0) + (t.currency === 'USD' ? t.amountUSD : t.amountEGP)
  }

  return NextResponse.json({
    sessionsByStatus,
    sessionsByTrack,
    sessionsByMonth,
    teacherPerformance,
    chatVolumeByDay,
    focusAlertsByDay,
    topStudents,
    revenueSummary: {
      totalEGP: revenueEGP,
      totalUSD: revenueUSD,
      paidCount: transactions.length,
      byProvider: providerMap,
    },
  })
}
