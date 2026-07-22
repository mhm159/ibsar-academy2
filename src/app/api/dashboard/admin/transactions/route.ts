import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

/** GET /api/dashboard/admin/transactions — all platform transactions */
export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const transactions = await db.transaction.findMany({
    include: {
      parent: { include: { user: { select: { name: true, phone: true, country: true } } } },
      booking: {
        include: {
          session: { select: { title: true, track: true } },
          student: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  const summary = {
    totalRevenueEGP: transactions.filter((t) => t.status === 'PAID').reduce((s, t) => s + t.amountEGP, 0),
    totalRevenueUSD: transactions.filter((t) => t.status === 'PAID').reduce((s, t) => s + t.amountUSD, 0),
    pendingCount: transactions.filter((t) => t.status === 'PENDING').length,
    paidCount: transactions.filter((t) => t.status === 'PAID').length,
    refundedCount: transactions.filter((t) => t.status === 'REFUNDED').length,
    failedCount: transactions.filter((t) => t.status === 'FAILED').length,
  }

  return NextResponse.json({
    summary,
    transactions: transactions.map((t) => ({
      id: t.id,
      type: t.type,
      amountEGP: t.amountEGP,
      amountUSD: t.amountUSD,
      currency: t.currency,
      status: t.status,
      provider: t.provider,
      providerRef: t.providerRef,
      description: t.description,
      createdAt: t.createdAt,
      parentName: t.parent.user.name,
      parentPhone: t.parent.user.phone,
      parentCountry: t.parent.user.country,
      booking: t.booking
        ? {
            sessionTitle: t.booking.session.title,
            track: t.booking.session.track,
            studentName: t.booking.student.name,
          }
        : null,
    })),
  })
}
