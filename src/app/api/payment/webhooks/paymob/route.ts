import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPayMobHmac, parsePayMobWebhook } from '@/lib/payment/paymob'
import { createEscrowForTransaction } from '@/lib/payment/escrow'

/**
 * POST /api/payment/webhooks/paymob
 *
 * PayMob sends transaction callbacks here. We verify the HMAC signature,
 * then update the transaction status + create escrow if PAID.
 *
 * Configure this URL in PayMob dashboard → Settings → Webhooks.
 */
export async function POST(req: NextRequest) {
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  // Verify HMAC signature if configured
  const hmacHeader = req.headers.get('x-paymob-hmac') ?? undefined
  const hmacSecret = process.env.PAYMOB_HMAC_SECRET
  if (hmacSecret && hmacHeader) {
    if (!verifyPayMobHmac(body, hmacHeader)) {
      console.error('[paymob-webhook] HMAC verification failed')
      return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
    }
  }

  const event = parsePayMobWebhook(body)
  if (!event) {
    return NextResponse.json({ ok: true, ignored: true })
  }

  // Find our transaction by merchant order id
  const transaction = await db.transaction.findUnique({
    where: { id: event.merchantOrderId },
  })
  if (!transaction) {
    console.error(`[paymob-webhook] Transaction not found: ${event.merchantOrderId}`)
    return NextResponse.json({ ok: true, ignored: true })
  }

  if (event.type === 'PAID') {
    if (transaction.status !== 'PAID') {
      await db.transaction.update({
        where: { id: transaction.id },
        data: { status: 'PAID', providerRef: event.paymobTransactionId },
      })
      // Update booking to CONFIRMED
      if (transaction.bookingId) {
        await db.booking.update({
          where: { id: transaction.bookingId },
          data: { status: 'CONFIRMED' },
        })
      }
      // Create escrow
      await createEscrowForTransaction(transaction.id)
      // Notify parent
      await db.notification.create({
        data: {
          userId: transaction.userId ?? '',
          type: 'PAYMENT_RECEIVED',
          title: 'تم استلام الدفع ✅',
          body: `تم تأكيد دفع ${event.amountCents / 100} ج.م`,
          link: '/parent/payments',
        },
      })
    }
  } else if (event.type === 'REFUNDED') {
    await db.transaction.update({
      where: { id: transaction.id },
      data: { status: 'REFUNDED' },
    })
  } else if (event.type === 'FAILED') {
    await db.transaction.update({
      where: { id: transaction.id },
      data: { status: 'FAILED' },
    })
  }

  return NextResponse.json({ ok: true })
}

/* TODO(phase-3): Add idempotency check (PayMob may send the same event multiple times). */
