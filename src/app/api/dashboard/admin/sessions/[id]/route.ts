import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

/**
 * GET /api/dashboard/admin/sessions/[id]
 * Full session report: session info, chat transcript, activity log,
 * student progress (focus scores), media, and supervisor reports.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessionUser = await getSession()
  if (!sessionUser || (sessionUser.role !== 'ADMIN' && sessionUser.role !== 'SUPERVISOR')) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const { id } = await params

  const session = await db.session.findUnique({
    where: { id },
    include: {
      teacher: { include: { user: { select: { name: true } } } },
      bookings: {
        include: { student: { include: { parent: { include: { user: { select: { name: true } } } } } } },
      },
      progressReports: {
        include: { student: { select: { id: true, name: true } } },
        orderBy: { updatedAt: 'desc' },
      },
      chatMessages: { orderBy: { createdAt: 'asc' }, take: 1000 },
      sessionLogs: { orderBy: { createdAt: 'asc' }, take: 1000 },
      media: { orderBy: { createdAt: 'desc' } },
      supervisorReports: {
        include: { supervisor: { include: { user: { select: { name: true } } } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!session) {
    return NextResponse.json({ error: 'الحصة غير موجودة' }, { status: 404 })
  }

  const focusScores = session.progressReports.filter((r) => r.focusScore != null).map((r) => r.focusScore as number)

  return NextResponse.json({
    session: {
      id: session.id,
      title: session.title,
      track: session.track,
      status: session.status,
      startTime: session.startTime.toISOString(),
      endTime: session.endTime.toISOString(),
      durationMins: session.durationMins,
      isTrial: session.isTrial,
      notes: session.notes,
      teacherName: session.teacher.user.name,
      students: session.bookings
        .filter((b) => b.status !== 'CANCELLED')
        .map((b) => ({
          id: b.student.id,
          name: b.student.name,
          parentName: b.student.parent?.user?.name ?? null,
          bookingStatus: b.status,
        })),
      chatCount: session.chatMessages.length,
      activityCount: session.sessionLogs.length,
      avgFocusScore: focusScores.length
        ? Math.round(focusScores.reduce((a, b) => a + b, 0) / focusScores.length)
        : null,
      attendance: session.progressReports.map((r) => ({ studentName: r.student.name, attendance: r.attendance })),
    },
    chatMessages: session.chatMessages.map((m) => ({
      id: m.id,
      userId: m.userId,
      senderName: m.senderName,
      senderRole: m.senderRole,
      text: m.text,
      createdAt: m.createdAt.toISOString(),
    })),
    logs: session.sessionLogs.map((l) => ({
      id: l.id,
      userName: l.userName,
      userRole: l.userRole,
      event: l.event,
      detail: l.detail,
      createdAt: l.createdAt.toISOString(),
    })),
    progressReports: session.progressReports.map((r) => ({
      id: r.id,
      studentName: r.student.name,
      focusScore: r.focusScore,
      attendance: r.attendance,
      score: r.score,
      notes: r.notes,
      updatedAt: r.updatedAt.toISOString(),
    })),
    media: session.media.map((m) => ({
      id: m.id,
      url: m.url,
      type: m.type,
      caption: m.caption,
      order: m.order,
      isPublished: m.isPublished,
    })),
    supervisorReports: session.supervisorReports.map((r) => ({
      id: r.id,
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
