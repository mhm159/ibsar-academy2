import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { releaseEscrow, refundEscrow } from '@/lib/payment/escrow'

/**
 * GET /api/dashboard/admin/escrow
 * Query: ?status=HELD|RELEASED|REFUNDED
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const status = new URL(req.url).searchParams.get('status')

  const escrows = await db.escrow.findMany({
    where: status ? { status } : {},
    include: {
      transaction: { select: { description: true, paymentMethod: true, provider: true, createdAt: true } },
      booking: {
        include: {
          session: { select: { title: true, track: true, endTime: true, status: true } },
          student: { select: { name: true } },
        },
      },
      teacher: { include: { user: { select: { name: true } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  const summary = {
    heldCount: 0,
    heldEGP: 0,
    heldUSD: 0,
    releasedCount: 0,
    releasedEGP: 0,
    releasedUSD: 0,
    refundedCount: 0,
    refundedEGP: 0,
    platformFeeEGP: 0,
    platformFeeUSD: 0,
  }
  for (const e of escrows) {
    if (e.status === 'HELD') {
      summary.heldCount++
      summary.heldEGP += e.amountEGP
      summary.heldUSD += e.amountUSD
    } else if (e.status === 'RELEASED') {
      summary.releasedCount++
      summary.releasedEGP += e.teacherShareEGP
      summary.releasedUSD += e.teacherShareUSD
    } else if (e.status === 'REFUNDED') {
      summary.refundedCount++
      summary.refundedEGP += e.amountEGP
      summary.refundedUSD += e.amountUSD
    }
    if (e.status !== 'REFUNDED') {
      summary.platformFeeEGP += e.platformFeeEGP
      summary.platformFeeUSD += e.platformFeeUSD
    }
  }

  return NextResponse.json({
    summary,
    escrows: escrows.map((e) => ({
      id: e.id,
      status: e.status,
      amountEGP: e.amountEGP,
      amountUSD: e.amountUSD,
      platformFeeEGP: e.platformFeeEGP,
      platformFeeUSD: e.platformFeeUSD,
      teacherShareEGP: e.teacherShareEGP,
      teacherShareUSD: e.teacherShareUSD,
      createdAt: e.createdAt,
      releasedAt: e.releasedAt,
      teacherName: e.teacher.user.name,
      sessionTitle: e.booking?.session.title,
      sessionEndTime: e.booking?.session.endTime,
      sessionStatus: e.booking?.session.status,
      studentName: e.booking?.student.name,
      transaction: {
        description: e.transaction.description,
        paymentMethod: e.transaction.paymentMethod,
        provider: e.transaction.provider,
        createdAt: e.transaction.createdAt,
      },
    })),
  })
}

/** POST /api/dashboard/admin/escrow — release or refund */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const body = await req.json()
  const { escrowId, action, reason } = body as {
    escrowId: string
    action: 'RELEASE' | 'REFUND'
    reason?: string
  }

  if (!escrowId || !action) {
    return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 422 })
  }

  if (action === 'RELEASE') {
    const result = await releaseEscrow(escrowId, session.userId)
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    return NextResponse.json({ ok: true, message: 'تم تحرير الأموال للمعلم' })
  } else if (action === 'REFUND') {
    const result = await refundEscrow(escrowId, session.userId, reason ?? 'قرار إداري')
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    return NextResponse.json({ ok: true, message: 'تم استرجاع الأموال لولي الأمر' })
  }

  return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 422 })
}
