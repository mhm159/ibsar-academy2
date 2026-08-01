import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

/**
 * GET /api/dashboard/parent/sessions
 * Query params: ?track=PROGRAMMING | ?available=true
 *
 * Returns:
 * - courses: published courses from approved teachers (browseable)
 * - myBookings: parent's children bookings (upcoming + past)
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'PARENT') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const trackFilter = searchParams.get('track')

  const parent = await db.parent.findUnique({
    where: { userId: session.userId },
    include: { students: { select: { id: true, name: true } } },
  })
  if (!parent) {
    return NextResponse.json({ error: 'الملف غير موجود' }, { status: 404 })
  }

  // Browseable courses
  const courses = await db.course.findMany({
    where: {
      status: 'PUBLISHED',
      ...(trackFilter ? { track: trackFilter } : {}),
      teacher: { status: 'APPROVED' },
    },
    include: {
      teacher: {
        include: {
          user: { select: { name: true, nameAr: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  // Available upcoming sessions (from approved teachers, not yet started)
  const now = new Date()
  const availableSessions = await db.session.findMany({
    where: {
      status: 'SCHEDULED',
      startTime: { gt: now },
      teacher: { status: 'APPROVED' },
      ...(trackFilter ? { track: trackFilter } : {}),
    },
    include: {
      teacher: {
        include: { user: { select: { name: true } } },
      },
      bookings: { select: { id: true, studentId: true } },
    },
    orderBy: { startTime: 'asc' },
    take: 20,
  })

  // My children's bookings
  const studentIds = parent.students.map((s) => s.id)
  const myBookings = await db.booking.findMany({
    where: { studentId: { in: studentIds } },
    include: {
      session: {
        include: { teacher: { include: { user: { select: { name: true } } } } },
      },
      student: { select: { id: true, name: true } },
      transaction: { select: { id: true, status: true, amountEGP: true, amountUSD: true } },
    },
    orderBy: { session: { startTime: 'desc' } },
    take: 30,
  })

  return NextResponse.json({
    courses: courses.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      track: c.track,
      level: c.level,
      ageMin: c.ageMin,
      ageMax: c.ageMax,
      totalSessions: c.totalSessions,
      sessionDurationMins: c.sessionDurationMins,
      priceEGP: c.priceEGP,
      priceUSD: c.priceUSD,
      teacherName: c.teacher.user.name,
      teacherRating: c.teacher.rating,
      teacherReviews: c.teacher.reviewsCount,
    })),
    availableSessions: availableSessions.map((s) => ({
      id: s.id,
      title: s.title,
      track: s.track,
      startTime: s.startTime,
      endTime: s.endTime,
      durationMins: s.durationMins,
      teacherName: s.teacher.user.name,
      teacherRating: s.teacher.rating,
      bookedCount: s.bookings.length,
      priceEGP: s.teacher.hourlyRateEGP,
      priceUSD: s.teacher.hourlyRateUSD,
    })),
    myBookings: myBookings.map((b) => ({
      id: b.id,
      status: b.status,
      priceEGP: b.priceEGP,
      priceUSD: b.priceUSD,
      session: {
        id: b.session.id,
        title: b.session.title,
        track: b.session.track,
        startTime: b.session.startTime,
        endTime: b.session.endTime,
        status: b.session.status,
        meetingUrl: b.session.meetingUrl,
        teacherName: b.session.teacher.user.name,
      },
      studentName: b.student.name,
      paymentStatus: b.transaction?.status ?? 'PENDING',
    })),
    myStudents: parent.students,
  })
}

/** POST /api/dashboard/parent/sessions — book a session for a student */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'PARENT') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const body = await req.json()
  const { sessionId, studentId } = body as { sessionId: string; studentId: string }
  if (!sessionId || !studentId) {
    return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 422 })
  }

  const parent = await db.parent.findUnique({
    where: { userId: session.userId },
    include: { students: { select: { id: true } }, user: { select: { country: true } } },
  })
  if (!parent) {
    return NextResponse.json({ error: 'الملف غير موجود' }, { status: 404 })
  }

  // Verify student belongs to this parent
  const ownsStudent = parent.students.some((s) => s.id === studentId)
  if (!ownsStudent) {
    return NextResponse.json({ error: 'الطفل غير تابع لك' }, { status: 403 })
  }

  // Verify session exists + is bookable
  const sess = await db.session.findUnique({
    where: { id: sessionId },
    include: { teacher: true, bookings: true },
  })
  if (!sess) {
    return NextResponse.json({ error: 'الحصة غير موجودة' }, { status: 404 })
  }
  if (sess.status !== 'SCHEDULED' || sess.startTime <= new Date()) {
    return NextResponse.json({ error: 'الحصة غير متاحة للحجز' }, { status: 400 })
  }

  // Check if student already booked this session
  const existing = await db.booking.findFirst({
    where: { sessionId, studentId },
  })
  if (existing) {
    return NextResponse.json({ error: 'تم حجز هذه الحصة لهذا الطفل من قبل' }, { status: 409 })
  }

  // Create booking + transaction (PENDING — will be PAID via Phase 3 payment flow)
  const result = await db.$transaction(async (tx) => {
    const booking = await tx.booking.create({
      data: {
        sessionId,
        studentId,
        status: 'CONFIRMED',
        priceEGP: sess.teacher.hourlyRateEGP,
        priceUSD: sess.teacher.hourlyRateUSD,
      },
    })
    const transaction = await tx.transaction.create({
      data: {
        parentId: parent.id,
        userId: session.userId,
        type: 'SESSION_BOOKING',
        amountEGP: sess.teacher.hourlyRateEGP,
        amountUSD: sess.teacher.hourlyRateUSD,
        currency: parent.user.country === 'SA' || parent.user.country === 'AE' ? 'USD' : 'EGP',
        status: 'PAID', // For Phase 2 demo — Phase 3 will integrate real payment
        provider: 'MANUAL',
        description: `حجز حصة ${sess.title}`,
        bookingId: booking.id,
      },
    })
    await tx.booking.update({
      where: { id: booking.id },
      data: { transactionId: transaction.id },
    })
    // Send notification
    await tx.notification.create({
      data: {
        userId: session.userId,
        type: 'BOOKING_CONFIRMED',
        title: 'تم تأكيد الحجز',
        body: `تم حجز حصة "${sess.title}" بنجاح. موعد الحصة: ${sess.startTime.toLocaleString('ar-EG')}`,
        link: '/parent/sessions',
      },
    })
    return { booking, transaction }
  })

  return NextResponse.json({
    ok: true,
    message: 'تم حجز الحصة بنجاح',
    bookingId: result.booking.id,
    transactionId: result.transaction.id,
  }, { status: 201 })
}

/* TODO(phase-3): Replace manual PAID status with real PayMob/Stripe payment flow. */
