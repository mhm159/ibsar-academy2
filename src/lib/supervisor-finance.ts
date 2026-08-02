import { db } from '@/lib/db'
import { fmtEgp } from '@/lib/money'

/** Supervision fee earned per submitted report (in EGP piasters → 50 EGP) */
export const SUPERVISOR_REPORT_FEE_EGP = 5000

/**
 * Compute a supervisor's current balance (piasters):
 * total earnings − approved/completed payouts. Best practice: derive it
 * on the fly from the ledger instead of storing a mutable balance that drifts.
 */
export async function getSupervisorBalance(supervisorId: string) {
  const [earnedAgg, paidAgg] = await Promise.all([
    db.supervisorEarning.aggregate({ where: { supervisorId }, _sum: { amountEGP: true } }),
    db.supervisorPayout.aggregate({
      where: { supervisorId, status: { in: ['APPROVED', 'PROCESSING', 'COMPLETED'] } },
      _sum: { amountEGP: true },
    }),
  ])
  const earned = earnedAgg._sum.amountEGP ?? 0
  const paid = paidAgg._sum.amountEGP ?? 0
  return { earned, paid, balanceEGP: earned - paid }
}

/** Register an earning row for a supervisor (best practice: append-only ledger). */
export async function addSupervisorEarning(opts: {
  supervisorId: string
  reportId?: string
  amountEGP: number
  type?: 'REPORT_FEE' | 'ADJUSTMENT' | 'BONUS'
  note?: string
}) {
  return db.supervisorEarning.create({
    data: {
      supervisorId: opts.supervisorId,
      reportId: opts.reportId ?? null,
      amountEGP: opts.amountEGP,
      type: opts.type ?? 'REPORT_FEE',
      note: opts.note ?? null,
    },
  })
}
