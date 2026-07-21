import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

/** GET /api/dashboard/teacher/schedule — all sessions (upcoming + past) */
export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'TEACHER') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }
  const teacher = await db.teacher.findUnique({ where: { userId: session.userId } })
  if (!teacher) {
    return NextResponse.json({ error: 'الملف غير موجود' }, { status: 404 })
  }

  const now = new Date()

  const [upcoming, past] = await Promise.all([
    db.session.findMany({
      where: {
        teacherId: teacher.id,
        startTime: { gte: now },
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
      },
      include: {
        bookings: {
          include: { student: { select: { id: true, name: true } } },
        },
      },
      orderBy: { startTime: 'asc' },
      take: 50,
    }),
    db.session.findMany({
      where: {
        teacherId: teacher.id,
        startTime: { lt: now },
      },
      include: {
        bookings: {
          include: { student: { select: { id: true, name: true } } },
        },
      },
      orderBy: { startTime: 'desc' },
      take: 30,
    }),
  ])

  return NextResponse.json({
    upcoming: upcoming.map((s) => ({
      id: s.id,
      title: s.title,
      track: s.track,
      startTime: s.startTime,
      endTime: s.endTime,
      durationMins: s.durationMins,
      status: s.status,
      meetingUrl: s.meetingUrl,
      students: s.bookings.map((b) => ({ id: b.student.id, name: b.student.name })),
    })),
    past: past.map((s) => ({
      id: s.id,
      title: s.title,
      track: s.track,
      startTime: s.startTime,
      endTime: s.endTime,
      durationMins: s.durationMins,
      status: s.status,
      recordingUrl: s.recordingUrl,
      students: s.bookings.map((b) => ({ id: b.student.id, name: b.student.name })),
    })),
  })
}
