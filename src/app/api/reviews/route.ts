import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

/**
 * GET /api/reviews?session=<id>
 * Returns reviews for a session (both directions).
 * OR /api/reviews?teacher=<id> — returns reviews about a teacher
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const url = new URL(req.url)
  const sessionId = url.searchParams.get('session')
  const teacherId = url.searchParams.get('teacher')

  if (sessionId) {
    // Verify caller participated in this session
    const sess = await db.session.findUnique({
      where: { id: sessionId },
      include: {
        teacher: { include: { user: { select: { id: true, name: true } } } },
        bookings: { include: { student: { include: { parent: { include: { user: { select: { id: true } } } } } } } },
      },
    })
    if (!sess) {
      return NextResponse.json({ error: 'الحصة غير موجودة' }, { status: 404 })
    }

    let authorized = false
    if (session.role === 'TEACHER' && sess.teacher.user.id === session.userId) authorized = true
    else if (session.role === 'PARENT') {
      const parent = await db.parent.findUnique({
        where: { userId: session.userId },
        include: { students: { select: { id: true } } },
      })
      if (parent) {
        const sIds = parent.students.map((s) => s.id)
        authorized = sess.bookings.some((b) => sIds.includes(b.studentId))
      }
    } else if (session.role === 'ADMIN') authorized = true

    if (!authorized) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    const reviews = await db.review.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      reviews,
      // whether current user can still review (hasn't yet)
      canReview: {
        teacherId: sess.teacher.user.id,
        teacherName: sess.teacher.user.name,
        // if teacher, they review the parent (any parent with booking)
        // if parent, they review the teacher
      },
    })
  }

  if (teacherId) {
    // Public reviews about a teacher (for profile page)
    const reviews = await db.review.findMany({
      where: { reviewedId: teacherId, reviewedRole: 'TEACHER', isApproved: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })
    const avgRating =
      reviews.length > 0
        ? +(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
        : 0
    return NextResponse.json({ reviews, avgRating, count: reviews.length })
  }

  return NextResponse.json({ error: 'معامل مطلوب: session أو teacher' }, { status: 422 })
}

const Body = z.object({
  sessionId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
  tags: z.array(z.string()).optional(),
})

/**
 * POST /api/reviews
 * Submit a review. Teacher reviews parent, parent reviews teacher.
 */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: 'صيغة غير صحيحة' }, { status: 400 })
  }

  const parsed = Body.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'البيانات غير صحيحة', details: parsed.error.flatten() },
      { status: 422 },
    )
  }

  const { sessionId, rating, comment, tags } = parsed.data

  // Fetch session
  const sess = await db.session.findUnique({
    where: { id: sessionId },
    include: {
      teacher: { include: { user: { select: { id: true, name: true } } } },
      bookings: {
        include: {
          student: {
            include: { parent: { include: { user: { select: { id: true, name: true } } } } },
          },
        },
      },
    },
  })
  if (!sess) {
    return NextResponse.json({ error: 'الحصة غير موجودة' }, { status: 404 })
  }

  // Only allow reviews for COMPLETED sessions
  if (sess.status !== 'COMPLETED') {
    return NextResponse.json({ error: 'يمكن التقييم فقط بعد إكمال الحصة' }, { status: 400 })
  }

  let reviewedId: string
  let reviewedRole: string
  let reviewerRole: string
  let reviewerName: string

  if (session.role === 'TEACHER') {
    // Teacher reviews the parent (first parent with booking)
    if (sess.teacher.user.id !== session.userId) {
      return NextResponse.json({ error: 'لست معلم هذه الحصة' }, { status: 403 })
    }
    const firstBooking = sess.bookings[0]
    if (!firstBooking) {
      return NextResponse.json({ error: 'لا يوجد طالب في هذه الحصة' }, { status: 400 })
    }
    reviewedId = firstBooking.student.parent.user.id
    reviewedRole = 'PARENT'
    reviewerRole = 'TEACHER'
    reviewerName = sess.teacher.user.name ?? 'المعلم'
  } else if (session.role === 'PARENT') {
    // Parent reviews the teacher
    const parent = await db.parent.findUnique({
      where: { userId: session.userId },
      include: { students: { select: { id: true } }, user: { select: { name: true } } },
    })
    if (!parent) {
      return NextResponse.json({ error: 'الملف غير موجود' }, { status: 404 })
    }
    const sIds = parent.students.map((s) => s.id)
    const hasBooking = sess.bookings.some((b) => sIds.includes(b.studentId))
    if (!hasBooking) {
      return NextResponse.json({ error: 'ليس لديك حجز في هذه الحصة' }, { status: 403 })
    }
    reviewedId = sess.teacher.user.id
    reviewedRole = 'TEACHER'
    reviewerRole = 'PARENT'
    reviewerName = parent.user.name ?? 'ولي الأمر'
  } else {
    return NextResponse.json({ error: 'دور غير مدعوم للتقييم' }, { status: 403 })
  }

  // Check for existing review
  const existing = await db.review.findUnique({
    where: {
      sessionId_reviewerId_reviewedId: {
        sessionId,
        reviewerId: session.userId,
        reviewedId,
      },
    },
  })
  if (existing) {
    return NextResponse.json({ error: 'تم التقييم من قبل' }, { status: 400 })
  }

  const review = await db.review.create({
    data: {
      sessionId,
      reviewedId,
      reviewedRole,
      reviewerId: session.userId,
      reviewerRole,
      reviewerName,
      rating,
      comment,
      tags: (tags ?? []).join(','),
    },
  })

  // If parent reviewed teacher, update teacher's aggregate rating
  if (reviewerRole === 'PARENT' && reviewedRole === 'TEACHER') {
    const allReviews = await db.review.findMany({
      where: { reviewedId, reviewedRole: 'TEACHER', isApproved: true },
      select: { rating: true },
    })
    const newAvg = +(allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length).toFixed(1)
    await db.teacher.update({
      where: { userId: reviewedId },
      data: {
        rating: newAvg,
        reviewsCount: allReviews.length,
      },
    })
  }

  return NextResponse.json({ ok: true, review }, { status: 201 })
}
