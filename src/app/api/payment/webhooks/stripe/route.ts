import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyStripeSignature, parseStripeWebhook } from '@/lib/payment/stripe'
import { createEscrowForTransaction } from '@/lib/payment/escrow'

/**
 * POST /api/payment/webhooks/stripe
 *
 * Stripe sends events here. Verify signature, then process.
 * Configure this URL in Stripe dashboard → Developers → Webhooks.
 */
export async function POST(req: NextRequest) {
  const payload = await req.text()
  const signature = req.headers.get('stripe-signature') ?? ''
  const secret = process.env.STRIPE_WEBHOOK_SECRET ?? ''

  // Verify signature
  if (secret && !verifyStripeSignature(payload, signature, secret)) {
    console.error('[stripe-webhook] Signature verification failed')
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
  }

  let body: any
  try {
    body = JSON.parse(payload)
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  const event = parseStripeWebhook(body)
  if (!event) {
    return NextResponse.json({ ok: true, ignored: true })
  }

  const transaction = await db.transaction.findUnique({
    where: { id: event.merchantOrderId },
  })
  if (!transaction) {
    console.error(`[stripe-webhook] Transaction not found: ${event.merchantOrderId}`)
    return NextResponse.json({ ok: true, ignored: true })
  }

  if (event.type === 'PAID') {
    if (transaction.status !== 'PAID') {
      await db.transaction.update({
        where: { id: transaction.id },
        data: { status: 'PAID', providerRef: event.stripePaymentIntentId },
      })
      if (transaction.bookingId) {
        await db.booking.update({
          where: { id: transaction.bookingId },
          data: { status: 'CONFIRMED' },
        })
      }
      await createEscrowForTransaction(transaction.id)
      await db.notification.create({
        data: {
          userId: transaction.userId ?? '',
          type: 'PAYMENT_RECEIVED',
          title: 'تم استلام الدفع ✅',
          body: `تم تأكيد دفع ${event.amountCents / 100} ${event.currency}`,
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
