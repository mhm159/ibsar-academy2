import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

/**
 * GET /api/dashboard/admin/financials — comprehensive financial reports
 *
 * Returns: revenue totals, platform fees, teacher payouts, escrow balances,
 * refunds, per-country breakdown, per-provider breakdown.
 */
export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const [transactions, escrows, payouts] = await Promise.all([
    db.transaction.findMany({
      include: {
        parent: { include: { user: { select: { country: true } } } },
        coupon: { select: { code: true } },
      },
    }),
    db.escrow.findMany(),
    db.payout.findMany(),
  ])

  // Revenue
  const paid = transactions.filter((t) => t.status === 'PAID')
  const totalRevenueEGP = paid.reduce((s, t) => s + t.amountEGP, 0)
  const totalRevenueUSD = paid.reduce((s, t) => s + t.amountUSD, 0)
  const totalDiscountsEGP = paid.reduce((s, t) => s + t.discountEGP, 0)
  const totalDiscountsUSD = paid.reduce((s, t) => s + t.discountUSD, 0)

  // Platform fees (from escrows)
  const totalPlatformFeeEGP = escrows
    .filter((e) => e.status !== 'REFUNDED')
    .reduce((s, e) => s + e.platformFeeEGP, 0)
  const totalPlatformFeeUSD = escrows
    .filter((e) => e.status !== 'REFUNDED')
    .reduce((s, e) => s + e.platformFeeUSD, 0)

  // Payouts
  const completedPayouts = payouts.filter((p) => p.status === 'COMPLETED')
  const totalPaidOutEGP = completedPayouts.reduce((s, p) => s + p.amountEGP, 0)
  const totalPaidOutUSD = completedPayouts.reduce((s, p) => s + p.amountUSD, 0)
  const pendingPayouts = payouts.filter((p) => p.status === 'PENDING')
  const pendingPayoutsEGP = pendingPayouts.reduce((s, p) => s + p.amountEGP, 0)

  // Refunds
  const refunded = transactions.filter((t) => t.status === 'REFUNDED')
  const totalRefundedEGP = refunded.reduce((s, t) => s + t.amountEGP, 0)

  // Escrow balances
  const heldEscrows = escrows.filter((e) => e.status === 'HELD')
  const heldEGP = heldEscrows.reduce((s, e) => s + e.amountEGP, 0)
  const releasedEscrows = escrows.filter((e) => e.status === 'RELEASED')
  const releasedEGP = releasedEscrows.reduce((s, e) => s + e.teacherShareEGP, 0)

  // Per-country breakdown
  const byCountry: Record<string, { count: number; egp: number; usd: number }> = {}
  for (const t of paid) {
    const c = t.parent.user.country ?? 'EG'
    if (!byCountry[c]) byCountry[c] = { count: 0, egp: 0, usd: 0 }
    byCountry[c].count++
    byCountry[c].egp += t.amountEGP
    byCountry[c].usd += t.amountUSD
  }

  // Per-provider breakdown
  const byProvider: Record<string, { count: number; egp: number; usd: number }> = {}
  for (const t of paid) {
    const p = t.provider
    if (!byProvider[p]) byProvider[p] = { count: 0, egp: 0, usd: 0 }
    byProvider[p].count++
    byProvider[p].egp += t.amountEGP
    byProvider[p].usd += t.amountUSD
  }

  // Per-method breakdown
  const byMethod: Record<string, { count: number; egp: number }> = {}
  for (const t of paid) {
    const m = t.paymentMethod ?? 'UNKNOWN'
    if (!byMethod[m]) byMethod[m] = { count: 0, egp: 0 }
    byMethod[m].count++
    byMethod[m].egp += t.amountEGP
  }

  // Net platform profit = platform fees - refunds - paid out
  const netProfitEGP = totalPlatformFeeEGP - totalRefundedEGP

  return NextResponse.json({
    summary: {
      totalRevenueEGP,
      totalRevenueUSD,
      totalDiscountsEGP,
      totalDiscountsUSD,
      totalPlatformFeeEGP,
      totalPlatformFeeUSD,
      totalPaidOutEGP,
      totalPaidOutUSD,
      pendingPayoutsEGP,
      pendingPayoutsCount: pendingPayouts.length,
      totalRefundedEGP,
      totalRefundedCount: refunded.length,
      heldEscrowEGP: heldEGP,
      heldEscrowCount: heldEscrows.length,
      releasedEscrowEGP: releasedEGP,
      releasedEscrowCount: releasedEscrows.length,
      netProfitEGP,
      transactionsCount: transactions.length,
    },
    byCountry,
    byProvider,
    byMethod,
    recentTransactions: paid
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10)
      .map((t) => ({
        id: t.id,
        amountEGP: t.amountEGP,
        amountUSD: t.amountUSD,
        currency: t.currency,
        status: t.status,
        provider: t.provider,
        paymentMethod: t.paymentMethod,
        buyerCountry: t.buyerCountry,
        description: t.description,
        createdAt: t.createdAt,
        couponCode: t.coupon?.code,
      })),
  })
}
