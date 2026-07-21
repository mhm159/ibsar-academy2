import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { getCountryConfig, type PaymentMethod } from '@/lib/payment/config'

/**
 * GET /api/payment/checkout/details?booking=<id>
 * Returns booking summary + available payment methods for the parent's country.
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'PARENT') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const bookingId = new URL(req.url).searchParams.get('booking')
  if (!bookingId) {
    return NextResponse.json({ error: 'معرف الحجز مطلوب' }, { status: 422 })
  }

  const parent = await db.parent.findUnique({
    where: { userId: session.userId },
    include: {
      user: { select: { name: true, country: true } },
      students: { select: { id: true } },
    },
  })
  if (!parent) {
    return NextResponse.json({ error: 'الملف غير موجود' }, { status: 404 })
  }

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: {
      session: { include: { teacher: { include: { user: { select: { name: true } } } } } },
      student: { select: { name: true } },
      transaction: { select: { id: true, status: true, amountEGP: true, amountUSD: true } },
    },
  })

  if (!booking) {
    return NextResponse.json({ error: 'الحجز غير موجود' }, { status: 404 })
  }

  const ownsStudent = parent.students.some((s) => s.id === booking.studentId)
  if (!ownsStudent) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const country = parent.user.country ?? 'EG'
  const countryConfig = getCountryConfig(country) ?? getCountryConfig('EG')!

  return NextResponse.json({
    booking: {
      id: booking.id,
      status: booking.status,
      priceEGP: booking.priceEGP,
      priceUSD: booking.priceUSD,
      session: {
        id: booking.session.id,
        title: booking.session.title,
        track: booking.session.track,
        startTime: booking.session.startTime,
        endTime: booking.session.endTime,
        teacherName: booking.session.teacher.user.name,
      },
      studentName: booking.student.name,
    },
    country,
    currency: countryConfig.currency,
    provider: countryConfig.provider,
    methods: countryConfig.methods as PaymentMethod[],
    existingTransaction: booking.transaction,
  })
}
