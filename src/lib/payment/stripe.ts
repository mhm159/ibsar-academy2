/**
 * Dars Academy — Stripe Payment Provider (Gulf countries)
 *
 * Stripe flow (Checkout Sessions):
 *   1. Create a Checkout Session with line items
 *   2. Redirect parent to Stripe-hosted checkout
 *   3. Stripe redirects back to success/cancel URL
 *   4. Webhook receives payment_intent.succeeded → mark transaction PAID
 *
 * Supported methods via Stripe:
 *   - Cards (Visa/Mastercard)
 *   - Mada (Saudi)
 *   - Apple Pay
 *   - STC Pay
 *
 * Docs: https://stripe.com/docs/api
 *
 * ENV REQUIRED:
 *   STRIPE_SECRET_KEY          — sk_test_... or sk_live_...
 *   STRIPE_WEBHOOK_SECRET      — whsec_... for signature verification
 *   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY — pk_test_... (for client-side)
 *
 * SANDBOX MODE: if STRIPE_SECRET_KEY is not set, returns a simulated checkout URL.
 */

import crypto from 'crypto'

const API_BASE = 'https://api.stripe.com/v1'

export interface StripePaymentIntent {
  /** amount in USD cents (1 USD = 100) — we charge in USD for Gulf */
  amountCents: number
  currency: 'USD' | 'SAR' | 'AED' | 'KWD' | 'QAR' | 'BHD' | 'OMR' | 'JOD'
  /** merchant order id (our transaction id) */
  merchantOrderId: string
  description: string
  buyer: {
    name: string
    email?: string
    country?: string
  }
  items?: Array<{
    name: string
    amountCents: number
    quantity: number
  }>
  method: 'CARD' | 'MADA' | 'APPLE_PAY' | 'STC_PAY'
  successUrl: string
  cancelUrl: string
}

export interface StripeCheckoutResult {
  ok: true
  checkoutUrl: string
  stripeSessionId: string
  sandbox: boolean
}

export interface StripeWebhookEvent {
  type: 'PAID' | 'FAILED' | 'REFUNDED'
  merchantOrderId: string
  stripePaymentIntentId: string
  amountCents: number
  currency: string
  method: string
}

/** Whether Stripe is configured */
export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY
}

/** Create a Stripe Checkout Session */
export async function createStripeCheckout(
  intent: StripePaymentIntent,
): Promise<StripeCheckoutResult | { ok: false; error: string }> {
  if (!isStripeConfigured()) {
    return simulateCheckout(intent)
  }

  try {
    const auth = 'Bearer ' + process.env.STRIPE_SECRET_KEY

    // Build line items (Stripe requires amounts in the smallest currency unit)
    const lineItems = (intent.items ?? [
      { name: intent.description, amountCents: intent.amountCents, quantity: 1 },
    ]).map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: intent.currency.toLowerCase(),
        unit_amount: item.amountCents,
        product_data: {
          name: item.name,
          description: intent.description,
        },
      },
    }))

    const params = new URLSearchParams()
    params.append('mode', 'payment')
    params.append('success_url', intent.successUrl)
    params.append('cancel_url', intent.cancelUrl)
    params.append('client_reference_id', intent.merchantOrderId)
    params.append('customer_email', intent.buyer.email ?? '')
    for (const item of lineItems) {
      params.append('line_items[0][quantity]', String(item.quantity))
      params.append('line_items[0][price_data][currency]', item.price_data.currency)
      params.append('line_items[0][price_data][unit_amount]', String(item.price_data.unit_amount))
      params.append('line_items[0][price_data][product_data][name]', item.price_data.product_data.name)
      params.append('line_items[0][price_data][product_data][description]', item.price_data.product_data.description ?? '')
    }
    // Only allow card by default; Mada/Apple Pay are auto-enabled in Stripe dashboard
    params.append('payment_method_types[0]', 'card')

    const res = await fetch(`${API_BASE}/checkout/sessions`, {
      method: 'POST',
      headers: {
        'Authorization': auth,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    if (!res.ok) {
      const errText = await res.text()
      return { ok: false, error: `Stripe checkout failed: ${res.status} ${errText}` }
    }

    const session = await res.json()
    return {
      ok: true,
      checkoutUrl: session.url,
      stripeSessionId: session.id,
      sandbox: false,
    }
  } catch (err) {
    return { ok: false, error: `Stripe error: ${(err as Error).message}` }
  }
}

/** Verify Stripe webhook signature (HMAC-SHA256) */
export function verifyStripeSignature(
  payload: string,
  signatureHeader: string,
  secret: string,
): boolean {
  if (!secret) return false
  // Stripe signature: t=timestamp,v1=signature
  const parts = signatureHeader.split(',')
  const tPart = parts.find((p) => p.startsWith('t='))
  const v1Part = parts.find((p) => p.startsWith('v1='))
  if (!tPart || !v1Part) return false

  const timestamp = tPart.split('=')[1]
  const signature = v1Part.split('=')[1]
  const signedPayload = `${timestamp}.${payload}`
  const expected = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex')
  // constant-time compare
  if (expected.length !== signature.length) return false
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}

/** Parse Stripe webhook event */
export function parseStripeWebhook(body: any): StripeWebhookEvent | null {
  const eventType = body?.type
  const obj = body?.data?.object
  if (!obj) return null

  let type: StripeWebhookEvent['type'] = 'FAILED'
  if (eventType === 'checkout.session.completed' || eventType === 'payment_intent.succeeded') {
    type = 'PAID'
  } else if (eventType === 'charge.refunded') {
    type = 'REFUNDED'
  } else if (eventType === 'payment_intent.payment_failed') {
    type = 'FAILED'
  } else {
    return null
  }

  return {
    type,
    merchantOrderId: obj.client_reference_id ?? obj.metadata?.merchantOrderId ?? '',
    stripePaymentIntentId: obj.payment_intent ?? obj.id ?? '',
    amountCents: obj.amount_total ?? obj.amount ?? 0,
    currency: (obj.currency ?? 'usd').toUpperCase(),
    method: obj.payment_method_types?.[0] ?? 'card',
  }
}

/** Refund a Stripe payment intent */
export async function refundStripePayment(
  paymentIntentId: string,
  amountCents?: number, // undefined = full refund
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isStripeConfigured()) {
    return { ok: true } // sandbox: simulate
  }
  try {
    const auth = 'Bearer ' + process.env.STRIPE_SECRET_KEY
    const params = new URLSearchParams()
    params.append('payment_intent', paymentIntentId)
    if (amountCents) params.append('amount', String(amountCents))

    const res = await fetch(`${API_BASE}/refunds`, {
      method: 'POST',
      headers: {
        'Authorization': auth,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })
    if (!res.ok) {
      return { ok: false, error: `Stripe refund failed: ${res.status}` }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: `Stripe refund error: ${(err as Error).message}` }
  }
}

/** Sandbox simulation when no Stripe keys are configured */
function simulateCheckout(intent: StripePaymentIntent): StripeCheckoutResult {
  const sandboxSessionId = `sandbox-${intent.merchantOrderId}-${Date.now()}`
  const checkoutUrl = `/payment/sandbox?order=${sandboxSessionId}&method=${intent.method}&amount=${intent.amountCents}&currency=${intent.currency}`
  return {
    ok: true,
    checkoutUrl,
    stripeSessionId: sandboxSessionId,
    sandbox: true,
  }
}

/* TODO(phase-3): Add Stripe Connect for direct teacher payouts (instead of manual). */
