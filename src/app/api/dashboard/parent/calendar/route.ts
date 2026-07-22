import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

/** GET /api/dashboard/parent/calendar?month=YYYY-MM&student=<id>
 * Returns sessions for the given month grouped by day.
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'PARENT') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const monthParam = searchParams.get('month') // YYYY-MM
  const studentId = searchParams.get('student')

  if (!monthParam) {
    return NextResponse.json({ error: 'الشهر مطلوب (YYYY-MM)' }, { status: 422 })
  }

  const [year, month] = monthParam.split('-').map(Number)
  if (!year || !month) {
    return NextResponse.json({ error: 'صيغة شهر غير صحيحة' }, { status: 422 })
  }

  const parent = await db.parent.findUnique({
    where: { userId: session.userId },
    include: { students: { select: { id: true, name: true } } },
  })
  if (!parent) {
    return NextResponse.json({ error: 'الملف غير موجود' }, { status: 404 })
  }

  const studentIds = studentId
    ? parent.students.filter((s) => s.id === studentId).map((s) => s.id)
    : parent.students.map((s) => s.id)

  if (studentIds.length === 0) {
    return NextResponse.json({ days: {}, students: parent.students })
  }

  // Date range for the month
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0, 23, 59, 59)

  const bookings = await db.booking.findMany({
    where: {
      studentId: { in: studentIds },
      session: { startTime: { gte: start, lte: end } },
    },
    include: {
      session: {
        include: { teacher: { include: { user: { select: { name: true } } } } },
      },
      student: { select: { name: true } },
    },
    orderBy: { session: { startTime: 'asc' } },
  })

  // Group by day
  const days: Record<string, Array<any>> = {}
  for (const b of bookings) {
    const dayKey = new Date(b.session.startTime).getDate().toString()
    if (!days[dayKey]) days[dayKey] = []
    days[dayKey].push({
      id: b.id,
      title: b.session.title,
      track: b.session.track,
      status: b.session.status,
      bookingStatus: b.status,
      startTime: b.session.startTime,
      endTime: b.session.endTime,
      teacherName: b.session.teacher.user.name,
      studentName: b.student.name,
    })
  }

  return NextResponse.json({
    days,
    students: parent.students,
    monthInfo: { year, month, daysInMonth: new Date(year, month, 0).getDate() },
  })
}
