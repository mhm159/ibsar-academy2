import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createEscrowForTransaction } from '@/lib/payment/escrow'
import { z } from 'zod'

const Body = z.object({
  order: z.string().min(1), // transactionId (passed as merchantOrderId)
  success: z.boolean(),
})

/**
 * POST /api/payment/sandbox-confirm
 *
 * Sandbox-only endpoint. Simulates a payment provider webhook callback.
 * When success=true: marks transaction PAID + creates escrow.
 * When success=false: marks transaction FAILED.
 */
export async function POST(req: NextRequest) {
  // Only allow in sandbox mode (no real provider keys)
  const paymobConfigured = !!process.env.PAYMOB_API_KEY
  const stripeConfigured = !!process.env.STRIPE_SECRET_KEY
  if (paymobConfigured || stripeConfigured) {
    return NextResponse.json(
      { error: 'هذا الendpoint متاح فقط في وضع Sandbox (بدون مفاتيح فعلية)' },
      { status: 403 },
    )
  }

  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: 'صيغة غير صحيحة' }, { status: 400 })
  }

  const parsed = Body.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'بيانات غير صحيحة' }, { status: 422 })
  }

  const { order, success } = parsed.data

  // Extract transactionId from order (sandbox format: sandbox-{txId}-{timestamp})
  // OR direct transaction id
  let transactionId = order
  if (order.startsWith('sandbox-')) {
    const parts = order.split('-')
    if (parts.length >= 3) {
      // Could be the merchantOrderId we set in transaction.id
      // Try to find by merchantOrderId
      const tx = await db.transaction.findFirst({
        where: {
          OR: [
            { id: parts.slice(1, -1).join('-') },
            { providerRef: order },
          ],
        },
      })
      if (tx) transactionId = tx.id
    }
  }

  const transaction = await db.transaction.findUnique({
    where: { id: transactionId },
    include: { booking: { include: { session: { select: { teacherId: true, title: true } } } } },
  })

  if (!transaction) {
    return NextResponse.json({ error: 'المعاملة غير موجودة' }, { status: 404 })
  }

  if (transaction.status === 'PAID') {
    return NextResponse.json({ ok: true, transactionId: transaction.id, alreadyPaid: true })
  }

  if (success) {
    // Mark PAID + create escrow
    await db.transaction.update({
      where: { id: transaction.id },
      data: {
        status: 'PAID',
        providerRef: transaction.providerRef ?? `sandbox-ref-${Date.now()}`,
      },
    })

    // Update booking status to CONFIRMED
    if (transaction.bookingId) {
      await db.booking.update({
        where: { id: transaction.bookingId },
        data: { status: 'CONFIRMED' },
      })
    }

    // Create escrow
    await createEscrowForTransaction(transaction.id, )

    // Notify parent
    await db.notification.create({
      data: {
        userId: transaction.userId ?? '',
        type: 'PAYMENT_RECEIVED',
        title: 'تم استلام الدفع ✅',
        body: `تم تأكيد دفع ${(transaction.amountEGP / 100).toFixed(0)} ج.م لحصة "${transaction.booking?.session.title ?? ''}"`,
        link: '/parent/payments',
      },
    })

    return NextResponse.json({
      ok: true,
      transactionId: transaction.id,
      status: 'PAID',
    })
  } else {
    await db.transaction.update({
      where: { id: transaction.id },
      data: { status: 'FAILED' },
    })
    return NextResponse.json({
      ok: true,
      transactionId: transaction.id,
      status: 'FAILED',
    })
  }
}
