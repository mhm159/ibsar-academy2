import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

/** GET /api/dashboard/admin/reviews — all reviews (with flag filter) */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const flagged = new URL(req.url).searchParams.get('flagged') === 'true'

  const reviews = await db.review.findMany({
    where: flagged ? { isFlagged: true } : {},
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  const summary = {
    total: reviews.length,
    flagged: reviews.filter((r) => r.isFlagged).length,
    avgRating: reviews.length > 0 ? +(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : 0,
  }

  return NextResponse.json({ reviews, summary })
}

/** PATCH /api/dashboard/admin/reviews — approve/flag/unflag a review */
export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const body = await req.json()
  const { reviewId, action, reason } = body as {
    reviewId: string
    action: 'APPROVE' | 'FLAG' | 'UNFLAG' | 'DELETE'
    reason?: string
  }

  if (!reviewId || !action) {
    return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 422 })
  }

  if (action === 'DELETE') {
    await db.review.delete({ where: { id: reviewId } })
    return NextResponse.json({ ok: true, message: 'تم حذف التقييم' })
  }

  const updates: any = {}
  if (action === 'APPROVE') {
    updates.isApproved = true
    updates.isFlagged = false
    updates.flagReason = null
  } else if (action === 'FLAG') {
    updates.isFlagged = true
    updates.isApproved = false
    updates.flagReason = reason ?? 'مخالف لسياسة المنصة'
  } else if (action === 'UNFLAG') {
    updates.isFlagged = false
    updates.flagReason = null
    updates.isApproved = true
  }

  await db.review.update({ where: { id: reviewId }, data: updates })
  return NextResponse.json({ ok: true })
}
