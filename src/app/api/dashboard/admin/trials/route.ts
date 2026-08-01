import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  // Fetch all sessions that are trials, including teacher and booking info
  const trials = await db.session.findMany({
    where: { isTrial: true },
    include: {
      teacher: { include: { user: true } },
      bookings: {
        include: {
          student: { include: { parent: { include: { user: true } } } }
        }
      }
    },
    orderBy: { startTime: 'desc' },
  })

  return NextResponse.json({
    trials: trials.map(t => {
      const booking = t.bookings[0] // Trial usually has 1 booking
      return {
        id: t.id,
        title: t.title,
        track: t.track,
        startTime: t.startTime,
        status: t.status,
        teacherName: t.teacher.user.name,
        studentName: booking?.student.name || 'غير معروف',
        parentName: booking?.student.parent.user.name || 'غير معروف',
        parentPhone: booking?.student.parent.user.phone || 'غير متاح',
      }
    })
  })
}
