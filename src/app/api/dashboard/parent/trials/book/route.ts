import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'PARENT') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const body = await req.json()
  const { studentId, track, dayOfWeek } = body as { studentId: string; track: string; dayOfWeek: number }

  if (!studentId || !track || dayOfWeek === undefined) {
    return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 422 })
  }

  // Verify student
  const parent = await db.parent.findUnique({
    where: { userId: session.userId },
    include: { students: true },
  })
  
  if (!parent || !parent.students.find(s => s.id === studentId)) {
    return NextResponse.json({ error: 'الطالب غير موجود أو غير تابع لك' }, { status: 403 })
  }

  // Find a teacher available on this day who teaches this track
  const availableSlot = await db.availability.findFirst({
    where: {
      dayOfWeek: dayOfWeek,
      isActive: true,
      teacher: {
        tracks: { contains: track },
        status: 'APPROVED',
      }
    },
    include: { teacher: true }
  })

  if (!availableSlot) {
    return NextResponse.json({ error: 'لا يوجد معلم متاح في هذا اليوم لهذا المسار حالياً' }, { status: 404 })
  }

  // Calculate next occurrence of this dayOfWeek
  const now = new Date()
  const nextDate = new Date()
  nextDate.setDate(now.getDate() + ((dayOfWeek + 7 - now.getDay()) % 7))
  if (nextDate.getDate() === now.getDate()) {
    nextDate.setDate(now.getDate() + 7) // If today, book for next week
  }
  
  nextDate.setHours(availableSlot.startHour, 0, 0, 0)
  const endTime = new Date(nextDate)
  endTime.setMinutes(endTime.getMinutes() + 30) // 30 min trial

  // Auto-create Session & Booking
  const result = await db.$transaction(async (tx) => {
    const trialSession = await tx.session.create({
      data: {
        teacherId: availableSlot.teacherId,
        title: `حصة تجريبية مجانية - ${track}`,
        track: track,
        startTime: nextDate,
        endTime: endTime,
        durationMins: 30,
        status: 'SCHEDULED',
        isTrial: true,
      }
    })

    const booking = await tx.booking.create({
      data: {
        sessionId: trialSession.id,
        studentId: studentId,
        status: 'CONFIRMED',
        priceEGP: 0,
        priceUSD: 0,
        isTrial: true,
      }
    })

    // Notify Parent
    await tx.notification.create({
      data: {
        userId: session.userId,
        type: 'TRIAL_BOOKED',
        title: 'تم حجز الحصة التجريبية',
        body: `تم تحديد موعد حصتك التجريبية لمسار ${track} يوم ${nextDate.toLocaleDateString('ar-EG')} الساعة ${nextDate.toLocaleTimeString('ar-EG')}.`,
        link: '/parent/sessions',
      }
    })

    // Notify Teacher
    await tx.notification.create({
      data: {
        userId: availableSlot.teacher.userId,
        type: 'NEW_TRIAL',
        title: 'حصة تجريبية جديدة',
        body: `تم تعيين حصة تجريبية جديدة لك يوم ${nextDate.toLocaleDateString('ar-EG')} الساعة ${nextDate.toLocaleTimeString('ar-EG')}.`,
        link: '/teacher/schedule',
      }
    })

    return { trialSession, booking }
  })

  return NextResponse.json({ ok: true, session: result.trialSession }, { status: 201 })
}
