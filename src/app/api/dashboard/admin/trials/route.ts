import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

const ALLOWED_STATUSES = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']

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
        parentUserId: booking?.student.parent.userId ?? null,
      }
    })
  })
}

/** PATCH /api/dashboard/admin/trials — update a trial booking status */
export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const body = await req.json()
  const { sessionId, status } = body as { sessionId?: string; status?: string }

  if (!sessionId || !status) {
    return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 422 })
  }
  if (!ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'حالة غير صالحة' }, { status: 422 })
  }

  const sess = await db.session.findUnique({
    where: { id: sessionId },
    include: { bookings: { include: { student: { include: { parent: true } } } } },
  })
  if (!sess) {
    return NextResponse.json({ error: 'الحصة غير موجودة' }, { status: 404 })
  }

  await db.session.update({
    where: { id: sessionId },
    data: { status },
  })

  // Notify the parent about the status change
  const booking = sess.bookings[0]
  const parentUserId = booking?.student.parent.userId
  if (parentUserId) {
    const statusTitle =
      status === 'COMPLETED'
        ? 'اكتملت حصتك التجريبية 🎉'
        : status === 'CANCELLED'
          ? 'تم إلغاء الحصة التجريبية'
          : status === 'IN_PROGRESS'
            ? 'حصتك التجريبية تبدأ الآن 🔔'
            : 'تم تأكيد الحصة التجريبية ✅'

    await db.notification.create({
      data: {
        userId: parentUserId,
        type: 'TRIAL_UPDATED',
        title: statusTitle,
        body: `تحديث على الحصة التجريبية "${sess.title}" — الحالة الآن: ${status}`,
        link: '/parent/sessions',
      },
    })
  }

  return NextResponse.json({ ok: true, status })
}
