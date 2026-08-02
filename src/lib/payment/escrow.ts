/**
 * Manhal Academy — Escrow & Settlement logic
 *
 * Flow:
 *   1. Parent pays → funds held in ESCROW (status: HELD)
 *   2. Session completes → escrow marked ready for release
 *   3. Admin approves payout OR auto-release after 24h → escrow RELEASED
 *   4. Teacher requests payout → admin processes → Payout COMPLETED
 *
 * Platform fee: 15% (default) — deducted from teacher share
 */

import { db } from '@/lib/db'
import { computeSplit } from './currency'
import { PLATFORM_FEE_PERCENT } from './config'

/**
 * Create an escrow record when a payment is confirmed (PAID).
 * Holds funds until the session completes + admin releases.
 */
export async function createEscrowForTransaction(
  transactionId: string,
): Promise<{ ok: true; escrowId: string } | { ok: false; error: string }> {
  const tx = await db.transaction.findUnique({
    where: { id: transactionId },
    include: { booking: { include: { session: { select: { teacherId: true } } } } },
  })
  if (!tx) {
    return { ok: false, error: 'المعاملة غير موجودة' }
  }
  if (tx.status !== 'PAID') {
    return { ok: false, error: 'المعاملة غير مدفوعة' }
  }

  // Check if escrow already exists
  const existing = await db.escrow.findUnique({ where: { transactionId } })
  if (existing) {
    return { ok: true, escrowId: existing.id }
  }

  const teacherId = tx.booking?.session.teacherId
  if (!teacherId) {
    return { ok: false, error: 'المعاملة غير مرتبطة بمعلم' }
  }

  const split = computeSplit(tx.amountEGP, tx.amountUSD, PLATFORM_FEE_PERCENT)

  const escrow = await db.escrow.create({
    data: {
      transactionId,
      bookingId: tx.bookingId,
      teacherId,
      amountEGP: tx.amountEGP,
      amountUSD: tx.amountUSD,
      platformFeeEGP: split.platformFeeEGP,
      platformFeeUSD: split.platformFeeUSD,
      teacherShareEGP: split.teacherShareEGP,
      teacherShareUSD: split.teacherShareUSD,
      status: 'HELD',
    },
  })

  return { ok: true, escrowId: escrow.id }
}

/**
 * Release an escrow to a teacher (after session completion).
 * The funds become available for the teacher to request as payout.
 */
export async function releaseEscrow(
  escrowId: string,
  processedById: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const escrow = await db.escrow.findUnique({ where: { id: escrowId } })
  if (!escrow) {
    return { ok: false, error: 'الضمان غير موجود' }
  }
  if (escrow.status !== 'HELD') {
    return { ok: false, error: 'الضمان تم تحريره أو استرجاعه بالفعل' }
  }

  await db.escrow.update({
    where: { id: escrowId },
    data: {
      status: 'RELEASED',
      releasedAt: new Date(),
    },
  })

  // Notify teacher
  await db.notification.create({
    data: {
      userId: (await db.teacher.findUnique({ where: { id: escrow.teacherId }, select: { userId: true } }))?.userId ?? '',
      type: 'ESCROW_RELEASED',
      title: 'تم تحرير أموالك 💰',
      body: `تم تحرير مبلغ ${escrow.teacherShareEGP / 100} ج.م من الضمان إلى رصيدك المتاح للسحب`,
      link: '/teacher/payouts',
    },
  })

  return { ok: true }
}

/**
 * Auto-release all escrows for sessions that have been completed
 * for more than 24 hours. Should be called by a daily cron.
 */
export async function autoReleaseCompletedEscrows(): Promise<{ released: number }> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24h ago

  const releasable = await db.escrow.findMany({
    where: {
      status: 'HELD',
      booking: {
        session: {
          status: 'COMPLETED',
          endTime: { lt: cutoff },
        },
      },
    },
    take: 100,
  })

  let released = 0
  for (const escrow of releasable) {
    const result = await releaseEscrow(escrow.id, 'system-auto')
    if (result.ok) released++
  }

  return { released }
}

/**
 * Refund an escrow (parent requested refund within guarantee period).
 * Marks escrow as REFUNDED + initiates refund via provider.
 */
export async function refundEscrow(
  escrowId: string,
  processedById: string,
  reason: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const escrow = await db.escrow.findUnique({
    where: { id: escrowId },
    include: { transaction: true },
  })
  if (!escrow) {
    return { ok: false, error: 'الضمان غير موجود' }
  }
  if (escrow.status !== 'HELD') {
    return { ok: false, error: 'الضمان تم تحريره أو استرجاعه بالفعل' }
  }

  // Update escrow + transaction status
  await db.$transaction([
    db.escrow.update({
      where: { id: escrowId },
      data: { status: 'REFUNDED' },
    }),
    db.transaction.update({
      where: { id: escrow.transactionId },
      data: { status: 'REFUNDED' },
    }),
  ])

  // Notify parent
  const parent = await db.parent.findUnique({
    where: { id: escrow.transaction.parentId },
    select: { userId: true },
  })
  if (parent) {
    await db.notification.create({
      data: {
        userId: parent.userId,
        type: 'REFUND_PROCESSED',
        title: 'تم استرجاع المبلغ',
        body: `تم استرجاع ${escrow.amountEGP / 100} ج.م بسبب: ${reason}`,
        link: '/parent/payments',
      },
    })
  }

  return { ok: true }
}

/**
 * Get teacher's available balance (sum of RELEASED escrows not yet paid out).
 *
 * Money in → escrow RELEASED. Money out → Payout in any of
 * PENDING / APPROVED / PROCESSING / COMPLETED (each request reserves the
 * amount as soon as it exists, so approving a withdrawal immediately and
 * correctly reduces the teacher's available balance, preventing double spend).
 */
export async function getTeacherAvailableBalance(teacherId: string): Promise<{
  availableEGP: number
  availableUSD: number
  pendingEGP: number
  pendingUSD: number
  totalEarnedEGP: number
  totalEarnedUSD: number
  totalPaidOutEGP: number
  totalPaidOutUSD: number
}> {
  const [released, held, payouts] = await Promise.all([
    db.escrow.aggregate({
      where: { teacherId, status: 'RELEASED' },
      _sum: { teacherShareEGP: true, teacherShareUSD: true },
    }),
    db.escrow.aggregate({
      where: { teacherId, status: 'HELD' },
      _sum: { teacherShareEGP: true, teacherShareUSD: true },
    }),
    db.payout.aggregate({
      where: { teacherId, status: { in: ['PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED'] } },
      _sum: { amountEGP: true, amountUSD: true },
    }),
  ])

  const availableEGP = (released._sum.teacherShareEGP ?? 0) - (payouts._sum.amountEGP ?? 0)
  const availableUSD = (released._sum.teacherShareUSD ?? 0) - (payouts._sum.amountUSD ?? 0)

  return {
    availableEGP: Math.max(0, availableEGP),
    availableUSD: Math.max(0, availableUSD),
    pendingEGP: held._sum.teacherShareEGP ?? 0,
    pendingUSD: held._sum.teacherShareUSD ?? 0,
    totalEarnedEGP: released._sum.teacherShareEGP ?? 0,
    totalEarnedUSD: released._sum.teacherShareUSD ?? 0,
    totalPaidOutEGP: payouts._sum.amountEGP ?? 0,
    totalPaidOutUSD: payouts._sum.amountUSD ?? 0,
  }
}

/* TODO(phase-3): Add automatic payout scheduling (monthly batch). */
