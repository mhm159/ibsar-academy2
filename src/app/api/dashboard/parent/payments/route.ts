import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

/** GET /api/dashboard/parent/payments — transaction history */
export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'PARENT') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }
  const parent = await db.parent.findUnique({ where: { userId: session.userId } })
  if (!parent) {
    return NextResponse.json({ error: 'الملف غير موجود' }, { status: 404 })
  }

  const transactions = await db.transaction.findMany({
    where: { parentId: parent.id },
    include: {
      booking: {
        include: {
          session: { select: { title: true, track: true, startTime: true } },
          student: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const summary = {
    totalPaidEGP: transactions.filter((t) => t.status === 'PAID').reduce((s, t) => s + t.amountEGP, 0),
    totalPaidUSD: transactions.filter((t) => t.status === 'PAID').reduce((s, t) => s + t.amountUSD, 0),
    pendingCount: transactions.filter((t) => t.status === 'PENDING').length,
    refundedCount: transactions.filter((t) => t.status === 'REFUNDED').length,
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
      description: t.description,
      createdAt: t.createdAt,
      booking: t.booking
        ? {
            bookingId: t.booking.id,
            sessionTitle: t.booking.session.title,
            track: t.booking.session.track,
            sessionDate: t.booking.session.startTime,
            studentName: t.booking.student.name,
          }
        : null,
    })),
  })
}
