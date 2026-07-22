import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

/**
 * GET /api/dashboard/admin/payouts
 * Query: ?status=PENDING|APPROVED|COMPLETED
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const status = new URL(req.url).searchParams.get('status')

  const payouts = await db.payout.findMany({
    where: status ? { status } : {},
    include: {
      teacher: {
        include: { user: { select: { name: true, phone: true, country: true } } },
      },
      walletAccount: { select: { type: true, identifier: true, label: true, holderName: true, currency: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  const summary = {
    pendingCount: payouts.filter((p) => p.status === 'PENDING').length,
    pendingAmountEGP: payouts
      .filter((p) => p.status === 'PENDING')
      .reduce((s, p) => s + p.amountEGP, 0),
    completedCount: payouts.filter((p) => p.status === 'COMPLETED').length,
    completedAmountEGP: payouts
      .filter((p) => p.status === 'COMPLETED')
      .reduce((s, p) => s + p.amountEGP, 0),
    totalThisMonthEGP: payouts
      .filter((p) => {
        const d = new Date(p.createdAt)
        const now = new Date()
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && p.status === 'COMPLETED'
      })
      .reduce((s, p) => s + p.amountEGP, 0),
  }

  return NextResponse.json({
    summary,
    payouts: payouts.map((p) => ({
      id: p.id,
      amountEGP: p.amountEGP,
      amountUSD: p.amountUSD,
      currency: p.currency,
      status: p.status,
      teacherName: p.teacher.user.name,
      teacherPhone: p.teacher.user.phone,
      teacherCountry: p.teacher.user.country,
      wallet: p.walletAccount
        ? {
            type: p.walletAccount.type,
            identifier: p.walletAccount.identifier,
            label: p.walletAccount.label,
            holderName: p.walletAccount.holderName,
            currency: p.walletAccount.currency,
          }
        : null,
      providerRef: p.providerRef,
      notes: p.notes,
      createdAt: p.createdAt,
      processedAt: p.processedAt,
    })),
  })
}

/** POST /api/dashboard/admin/payouts — approve/reject/process a payout */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const body = await req.json()
  const { payoutId, action, providerRef, notes } = body as {
    payoutId: string
    action: 'APPROVE' | 'REJECT' | 'COMPLETE'
    providerRef?: string
    notes?: string
  }

  if (!payoutId || !action) {
    return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 422 })
  }

  const payout = await db.payout.findUnique({
    where: { id: payoutId },
    include: { teacher: { include: { user: true } } },
  })
  if (!payout) {
    return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 })
  }

  let newStatus = payout.status
  if (action === 'APPROVE') {
    if (payout.status !== 'PENDING') {
      return NextResponse.json({ error: 'لا يمكن اعتماد طلب غير معلّق' }, { status: 400 })
    }
    newStatus = 'APPROVED'
  } else if (action === 'REJECT') {
    if (payout.status !== 'PENDING' && payout.status !== 'APPROVED') {
      return NextResponse.json({ error: 'لا يمكن رفض طلب مكتمل' }, { status: 400 })
    }
    newStatus = 'REJECTED'
  } else if (action === 'COMPLETE') {
    if (payout.status !== 'APPROVED' && payout.status !== 'PENDING') {
      return NextResponse.json({ error: 'لا يمكن إكمال طلب غير معتمد' }, { status: 400 })
    }
    newStatus = 'COMPLETED'
  }

  await db.payout.update({
    where: { id: payoutId },
    data: {
      status: newStatus,
      processedById: session.userId,
      processedAt: new Date(),
      providerRef: providerRef ?? payout.providerRef,
      notes: notes ?? payout.notes,
    },
  })

  // Notify teacher
  await db.notification.create({
    data: {
      userId: payout.teacher.userId,
      type: newStatus === 'COMPLETED' ? 'PAYOUT_COMPLETED' : newStatus === 'REJECTED' ? 'PAYOUT_REJECTED' : 'PAYOUT_APPROVED',
      title:
        newStatus === 'COMPLETED'
          ? 'تم تحويل السحب ✅'
          : newStatus === 'REJECTED'
            ? 'تم رفض طلب السحب'
            : 'تم اعتماد طلب السحب',
      body:
        newStatus === 'COMPLETED'
          ? `تم تحويل ${payout.amountEGP / 100} ج.م إلى محفظتك. رقم المرجع: ${providerRef ?? 'N/A'}`
          : newStatus === 'REJECTED'
            ? `تم رفض طلب السحب. ${notes ?? ''}`
            : `تم اعتماد طلب السحب بقيمة ${payout.amountEGP / 100} ج.م. سيتم التحويل قريباً.`,
      link: '/teacher/payouts',
    },
  })

  return NextResponse.json({
    ok: true,
    message:
      newStatus === 'COMPLETED'
        ? 'تم تحويل المبلغ وتسجيل المرجع'
        : newStatus === 'REJECTED'
          ? 'تم رفض الطلب'
          : 'تم اعتماد الطلب',
    newStatus,
  })
}
