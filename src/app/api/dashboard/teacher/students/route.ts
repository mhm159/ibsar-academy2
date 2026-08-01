import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

/** GET /api/dashboard/teacher/students — all students taught by this teacher */
export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'TEACHER') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }
  const teacher = await db.teacher.findUnique({ where: { userId: session.userId } })
  if (!teacher) {
    return NextResponse.json({ error: 'الملف غير موجود' }, { status: 404 })
  }

  // Get all bookings for this teacher, grouped by student
  const bookings = await db.booking.findMany({
    where: { session: { teacherId: teacher.id } },
    include: {
      student: {
        include: {
          parent: { include: { user: { select: { name: true, phone: true, country: true } } } },
          progressReports: { select: { id: true } },
        },
      },
      session: { select: { title: true, track: true, startTime: true, status: true } },
    },
    orderBy: { session: { startTime: 'desc' } },
  })

  // Group by student
  const studentMap = new Map<string, {
    id: string
    name: string
    parentName: string
    parentPhone: string
    country: string
    totalSessions: number
    completedSessions: number
    upcomingSessions: number
    lastSessionDate: Date | null
    tracks: Set<string>
    hasReports: number
  }>()

  for (const b of bookings) {
    const s = b.student
    if (!studentMap.has(s.id)) {
      studentMap.set(s.id, {
        id: s.id,
        name: s.name,
        parentName: s.parent.user.name ?? '',
        parentPhone: s.parent.user.phone ?? '',
        country: s.parent.user.country ?? 'EG',
        totalSessions: 0,
        completedSessions: 0,
        upcomingSessions: 0,
        lastSessionDate: null,
        tracks: new Set(),
        hasReports: 0,
      })
    }
    const entry = studentMap.get(s.id)!
    entry.totalSessions++
    if (b.status === 'COMPLETED') entry.completedSessions++
    if (b.status === 'CONFIRMED' && b.session.startTime > new Date()) entry.upcomingSessions++
    if (!entry.lastSessionDate || b.session.startTime > entry.lastSessionDate) {
      entry.lastSessionDate = b.session.startTime
    }
    entry.tracks.add(b.session.track)
    entry.hasReports += s.progressReports.length
  }

  return NextResponse.json({
    students: Array.from(studentMap.values()).map((s) => ({
      ...s,
      tracks: Array.from(s.tracks),
      lastSessionDate: s.lastSessionDate?.toISOString() ?? null,
    })),
  })
}
