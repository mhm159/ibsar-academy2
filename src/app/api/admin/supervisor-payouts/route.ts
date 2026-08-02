import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

/**
 * GET /api/admin/supervisor-payouts?status=PENDING
 * Lists supervisor payout requests (with supervisor + user names).
 *
 * PATCH /api/admin/supervisor-payouts
 * Body: { id, status, notes? } — APPROVED | REJECTED | COMPLETED | FAILED
 */
export async function GET(req: NextRequest) {
  const sessionUser = await getSession()
  if (!sessionUser || sessionUser.role !== 'ADMIN') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const where: { status?: string } = {}
  if (status) where.status = status

  const payouts = await db.supervisorPayout.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: {
      supervisor: { include: { user: { select: { name: true } } } },
    },
  })

  return NextResponse.json({
    payouts: payouts.map((p) => ({
      id: p.id,
      amountEGP: p.amountEGP,
      status: p.status,
      notes: p.notes,
      processedById: p.processedById,
      processedAt: p.processedAt?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
      supervisorName: p.supervisor.user.name,
    })),
  })
}

export async function PATCH(req: NextRequest) {
  const sessionUser = await getSession()
  if (!sessionUser || sessionUser.role !== 'ADMIN') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  let body: { id?: string; status?: string; notes?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'صيغة غير صحيحة' }, { status: 400 })
  }

  const { id, status, notes } = body
  if (!id || !status) {
    return NextResponse.json({ error: 'المعرّف والحالة مطلوبان' }, { status: 422 })
  }
  const valid = ['PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED', 'FAILED']
  if (!valid.includes(status)) {
    return NextResponse.json({ error: 'حالة غير صالحة' }, { status: 422 })
  }

  const payout = await db.supervisorPayout.update({
    where: { id },
    data: {
      status,
      notes: notes !== undefined ? String(notes) : undefined,
      processedById: sessionUser.userId,
      processedAt: new Date(),
    },
  })

  return NextResponse.json({ ok: true, payout })
}
