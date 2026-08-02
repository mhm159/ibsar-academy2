import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

/**
 * POST /api/admin/reset
 * Body: { scope: 'business' | 'full', confirm: string }
 *
 * Wipes platform data. Requires typing an exact confirmation phrase:
 *   'تصفير'        → business: all activity/content (sessions, bookings, payments,
 *                     reports, reviews, notifications…) — accounts & settings stay.
 *   'حذف الكل'     → full: additionally deletes all non-admin accounts.
 *
 * Settings (SiteSetting), tracks, banners, rates and admin users are always kept.
 */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  let body: { scope?: string; confirm?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'صيغة غير صحيحة' }, { status: 400 })
  }

  const { scope, confirm } = body
  if (scope !== 'business' && scope !== 'full') {
    return NextResponse.json({ error: 'نطاق غير صالح' }, { status: 422 })
  }
  const phrase = String(confirm ?? '').trim()
  const required = scope === 'full' ? 'حذف الكل' : 'تصفير'
  if (phrase !== required) {
    return NextResponse.json(
      { error: `تأكيد غير صحيح — اكتب «${required}» بالضبط للمتابعة` },
      { status: 422 }
    )
  }

  // Children first so foreign keys never block the delete.
  const businessDeletes = [
    db.sessionMedia.deleteMany({}),
    db.whiteboardState.deleteMany({}),
    db.chatMessage.deleteMany({}),
    db.sessionLog.deleteMany({}),
    db.progressReport.deleteMany({}),
    db.studentReward.deleteMany({}),
    db.studentBadge.deleteMany({}),
    db.pointsLog.deleteMany({}),
    db.streak.deleteMany({}),
    db.booking.deleteMany({}),
    db.homework.deleteMany({}),
    db.session.deleteMany({}),
    db.review.deleteMany({}),
    db.recommendationLog.deleteMany({}),
    db.linkFilterLog.deleteMany({}),
    db.behaviorAlert.deleteMany({}),
    db.refundRequest.deleteMany({}),
    db.financialAudit.deleteMany({}),
    db.escrow.deleteMany({}),
    db.payout.deleteMany({}),
    db.walletAccount.deleteMany({}),
    db.transaction.deleteMany({}),
    db.notification.deleteMany({}),
    db.notificationLog.deleteMany({}),
    db.availability.deleteMany({}),
    db.supervisorEarning.deleteMany({}),
    db.supervisorPayout.deleteMany({}),
    db.supervisorReport.deleteMany({}),
    db.courseLesson.deleteMany({}),
    db.course.deleteMany({}),
    db.post.deleteMany({}),
  ]

  const fullDeletes = [
    db.otpCode.deleteMany({}),
    db.notificationPreference.deleteMany({}),
    db.rewardItem.deleteMany({}),
    db.coupon.deleteMany({}),
    db.user.deleteMany({ where: { role: { not: 'ADMIN' } } }),
  ]

  try {
    await db.$transaction([
      ...businessDeletes,
      ...(scope === 'full' ? fullDeletes : []),
    ])
  } catch (e) {
    return NextResponse.json(
      { error: 'فشل التصفير: ' + (e as Error).message },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    message:
      scope === 'full'
        ? 'تمت إعادة تعيين المنصة بالكامل (باستثناء حساب الأدمن والإعدادات)'
        : 'تم مسح جميع بيانات الأنشطة والمدفوعات والتقارير (تم الحفاظ على الحسابات والإعدادات)',
  })
}
