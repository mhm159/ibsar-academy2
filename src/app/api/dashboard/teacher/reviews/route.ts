import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

/** GET /api/dashboard/teacher/reviews — reviews about me + reviews I gave */
export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'TEACHER') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const [reviewsAboutMe, reviewsIGave] = await Promise.all([
    db.review.findMany({
      where: { reviewedId: session.userId, reviewedRole: 'TEACHER', isApproved: true },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
    db.review.findMany({
      where: { reviewerId: session.userId, reviewerRole: 'TEACHER' },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
  ])

  const avgRating =
    reviewsAboutMe.length > 0
      ? +(reviewsAboutMe.reduce((s, r) => s + r.rating, 0) / reviewsAboutMe.length).toFixed(1)
      : 0

  // Rating distribution
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviewsAboutMe.filter((r) => r.rating === star).length,
  }))

  return NextResponse.json({
    avgRating,
    totalReviews: reviewsAboutMe.length,
    distribution,
    reviewsAboutMe: reviewsAboutMe.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      tags: r.tags.split(',').filter(Boolean),
      reviewerName: r.reviewerName,
      sessionId: r.sessionId,
      createdAt: r.createdAt,
    })),
    reviewsIGave: reviewsIGave.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      tags: r.tags.split(',').filter(Boolean),
      reviewedRole: r.reviewedRole,
      sessionId: r.sessionId,
      createdAt: r.createdAt,
    })),
  })
}
