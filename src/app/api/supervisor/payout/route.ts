import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { getSupervisorBalance } from '@/lib/supervisor-finance'

/**
 * GET /api/supervisor/payout
 * Returns the signed-in supervisor's balance (piasters) and payout history.
 *
 * POST /api/supervisor/payout
 * Body: { amountEGP, notes? } — requests a cash-out of the available balance.
 */
export async function GET() {
  const sessionUser = await getSession()
  if (!sessionUser || sessionUser.role !== 'SUPERVISOR') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const sup = await db.supervisor.findUnique({ where: { userId: sessionUser.userId } })
  if (!sup) {
    return NextResponse.json({ error: 'ملف المشرف غير موجود' }, { status: 404 })
  }

  const balance = await getSupervisorBalance(sup.id)
  const [earnings, payouts] = await Promise.all([
    db.supervisorEarning.findMany({
      where: { supervisorId: sup.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    db.supervisorPayout.findMany({
      where: { supervisorId: sup.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
  ])

  return NextResponse.json({
    balance,
    credits: sup.creditBalance,
    earnings: earnings.map((e) => ({
      id: e.id,
      amountEGP: e.amountEGP,
      type: e.type,
      note: e.note,
      createdAt: e.createdAt.toISOString(),
    })),
    payouts: payouts.map((p) => ({
      id: p.id,
      amountEGP: p.amountEGP,
      status: p.status,
      notes: p.notes,
      createdAt: p.createdAt.toISOString(),
    })),
  })
}

export async function POST(req: NextRequest) {
  const sessionUser = await getSession()
  if (!sessionUser || sessionUser.role !== 'SUPERVISOR') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  let body: { amountEGP?: number; notes?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'صيغة غير صحيحة' }, { status: 400 })
  }

  const amount = Math.round(Number(body.amountEGP))
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: 'المبلغ غير صالح' }, { status: 422 })
  }

  const sup = await db.supervisor.findUnique({ where: { userId: sessionUser.userId } })
  if (!sup) {
    return NextResponse.json({ error: 'ملف المشرف غير موجود' }, { status: 404 })
  }

  const balance = await getSupervisorBalance(sup.id)
  if (amount > balance.balanceEGP) {
    return NextResponse.json(
      { error: 'المبلغ يتجاوز الرصيد المتاح', available: balance.balanceEGP },
      { status: 422 }
    )
  }

  const payout = await db.supervisorPayout.create({
    data: {
      supervisorId: sup.id,
      amountEGP: amount,
      status: 'PENDING',
      notes: body.notes ? String(body.notes) : null,
    },
  })

  return NextResponse.json({ ok: true, payout }, { status: 201 })
}
