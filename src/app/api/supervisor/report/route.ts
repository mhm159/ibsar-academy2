import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

/**
 * POST /api/supervisor/report
 * Body: { sessionId, notes?, rating? }
 *
 * One-click session report: snapshots a session's activity (chat count,
 * participants, focus score, duration, events) into a SupervisorReport.
 * Allowed for ADMIN and SUPERVISOR users.
 *
 * GET /api/supervisor/report?supervisor=<userId or 'me'>
 * Lists reports (own or all when admin).
 */
export async function POST(req: NextRequest) {
  const sessionUser = await getSession()
  if (!sessionUser || (sessionUser.role !== 'ADMIN' && sessionUser.role !== 'SUPERVISOR')) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  let body: { sessionId?: string; notes?: string; rating?: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'صيغة غير صحيحة' }, { status: 400 })
  }

  const { sessionId, notes, rating } = body
  if (!sessionId) {
    return NextResponse.json({ error: 'معرف الحصة مطلوب' }, { status: 422 })
  }

  const sess = await db.session.findUnique({
    where: { id: sessionId },
    include: {
      chatMessages: { select: { id: true } },
      sessionLogs: { select: { id: true } },
      bookings: { select: { status: true } },
      progressReports: { select: { focusScore: true } },
    },
  })
  if (!sess) {
    return NextResponse.json({ error: 'الحصة غير موجودة' }, { status: 404 })
  }

  const focusScores = sess.progressReports.filter((r) => r.focusScore != null).map((r) => r.focusScore as number)

  let supervisorId: string
  const existing = await db.supervisor.findUnique({ where: { userId: sessionUser.userId } })
  if (existing) {
    supervisorId = existing.id
  } else if (sessionUser.role === 'ADMIN') {
    // Admins may also generate reports — back them with an auto supervisor profile
    const created = await db.supervisor.create({ data: { userId: sessionUser.userId, title: 'إدارة' } })
    supervisorId = created.id
  } else {
    return NextResponse.json({ error: 'الملف غير موجود' }, { status: 404 })
  }

  const report = await db.supervisorReport.create({
    data: {
      sessionId: sess.id,
      supervisorId,
      chatCount: sess.chatMessages.length,
      studentCount: sess.bookings.filter((b) => b.status !== 'CANCELLED').length,
      avgFocusScore: focusScores.length
        ? Math.round(focusScores.reduce((a, b) => a + b, 0) / focusScores.length)
        : 0,
      durationMins: sess.durationMins,
      eventsCount: sess.sessionLogs.length,
      rating: typeof rating === 'number' && rating >= 1 && rating <= 5 ? Math.round(rating) : 0,
      notes: notes ? String(notes) : null,
    },
  })

  return NextResponse.json({ ok: true, report }, { status: 201 })
}

export async function GET(req: NextRequest) {
  const sessionUser = await getSession()
  if (!sessionUser || (sessionUser.role !== 'ADMIN' && sessionUser.role !== 'SUPERVISOR')) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const supervisorFilter = searchParams.get('supervisor')

  let where: Record<string, unknown> = {}
  if (supervisorFilter === 'me' || sessionUser.role === 'SUPERVISOR') {
    const sup = await db.supervisor.findUnique({ where: { userId: sessionUser.userId } })
    where = sup ? { supervisorId: sup.id } : { id: 'none' }
  } else if (supervisorFilter) {
    where = { supervisorId: supervisorFilter }
  }

  const reports = await db.supervisorReport.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      session: { select: { id: true, title: true, track: true, startTime: true } },
      supervisor: { include: { user: { select: { name: true } } } },
    },
  })

  return NextResponse.json({
    reports: reports.map((r) => ({
      id: r.id,
      sessionId: r.sessionId,
      sessionTitle: r.session.title,
      track: r.session.track,
      sessionStart: r.session.startTime.toISOString(),
      supervisorName: r.supervisor.user.name,
      rating: r.rating,
      notes: r.notes,
      chatCount: r.chatCount,
      studentCount: r.studentCount,
      avgFocusScore: r.avgFocusScore,
      durationMins: r.durationMins,
      eventsCount: r.eventsCount,
      createdAt: r.createdAt.toISOString(),
    })),
  })
}
