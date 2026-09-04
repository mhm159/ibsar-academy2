/**
 * Dars Academy — PayMob Payment Provider (Egypt)
 *
 * PayMob flow (3 steps):
 *   1. Authenticate → get API token
 *   2. Create order → get order id
 *   3. Create payment key → get payment key → build iframe URL
 *
 * Supported methods via PayMob:
 *   - Cards (Visa/Mastercard)
 *   - Fawry (cash at Fawry kiosks)
 *   - Mobile wallets (Vodafone Cash, Etisalat Cash, Orange Cash, We Pay)
 *   - Meza
 *   - Aman
 *
 * Docs: https://docs.paymob.com/docs/
 *
 * ENV REQUIRED:
 *   PAYMOB_API_KEY       — merchant API key
 *   PAYMOB_INTEGRATION_ID_CARD       — integration ID for cards
 *   PAYMOB_INTEGRATION_ID_FAWRY      — integration ID for Fawry
 *   PAYMOB_INTEGRATION_ID_WALLET     — integration ID for mobile wallets
 *   PAYMOB_IFRAME_ID     — iframe ID for hosted checkout
 *   PAYMOB_HMAC_SECRET    — HMAC secret for webhook signature verification
 *
 * SANDBOX MODE: if PAYMOB_API_KEY is not set, all operations return a fake
 * success response with a simulated checkout URL. This lets you test the
 * full flow without a real PayMob account.
 */

import crypto from 'crypto'

const API_BASE = 'https://accept.paymob.com/api'

export interface PayMobPaymentIntent {
  /** amount in EGP piasters (1 EGP = 100) */
  amountCents: number
  currency: 'EGP'
  /** merchant order id (our transaction id) */
  merchantOrderId: string
  description: string
  /** buyer info */
  buyer: {
    name: string
    email?: string
    phone?: string
    country?: string
  }
  /** items (for PayMob order items) */
  items?: Array<{
    name: string
    amountCents: number
    quantity: number
  }>
  /** which payment method integration to use */
  method: 'CARD' | 'FAWRY' | 'WALLET' | 'MEZA'
  /** where to redirect after payment */
  successUrl: string
  cancelUrl: string
  webhookUrl: string
}

export interface PayMobCheckoutResult {
  ok: true
  checkoutUrl: string
  paymobOrderId: string
  paymobPaymentKey: string
  sandbox: boolean
}

export interface PayMobWebhookEvent {
  type: 'PAID' | 'FAILED' | 'REFUNDED'
  merchantOrderId: string
  paymobTransactionId: string
  amountCents: number
  currency: string
  method: string
  success: boolean
  pending: boolean
}

/** Whether PayMob is configured (real keys present) */
export function isPayMobConfigured(): boolean {
  return !!process.env.PAYMOB_API_KEY
}

/**
 * Create a PayMob checkout: authenticate → order → payment key → iframe URL.
 * Returns the URL the parent should be redirected to.
 */
export async function createPayMobCheckout(
  intent: PayMobPaymentIntent,
): Promise<PayMobCheckoutResult | { ok: false; error: string }> {
  // SANDBOX: no real keys → simulate success
  if (!isPayMobConfigured()) {
    return simulateCheckout(intent)
  }

  try {
    // Step 1: authenticate
    const authRes = await fetch(`${API_BASE}/auth/tokens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: process.env.PAYMOB_API_KEY }),
    })
    if (!authRes.ok) {
      return { ok: false, error: `PayMob auth failed: ${authRes.status}` }
    }
    const auth = await authRes.json()
    const token = auth.token

    // Step 2: create order
    const orderRes = await fetch(`${API_BASE}/ecommerce/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth_token: token,
        delivery_needed: 'false',
        amount_cents: intent.amountCents,
        currency: intent.currency,
        merchant_order_id: intent.merchantOrderId,
        items: intent.items ?? [],
      }),
    })
    if (!orderRes.ok) {
      return { ok: false, error: `PayMob order creation failed: ${orderRes.status}` }
    }
    const order = await orderRes.json()
    const orderId = order.id

    // Step 3: create payment key
    const integrationId = getIntegrationId(intent.method)
    if (!integrationId) {
      return { ok: false, error: `No integration ID for method ${intent.method}` }
    }

    const billingData = {
      first_name: intent.buyer.name.split(' ')[0] ?? 'Parent',
      last_name: intent.buyer.name.split(' ').slice(1).join(' ') ?? 'Dars',
      email: intent.buyer.email ?? 'parent@ibsar.eu',
      phone_number: intent.buyer.phone ?? '01000000000',
      country: intent.buyer.country ?? 'EG',
      city: 'Cairo',
      street: 'N/A',
      building: 'N/A',
      floor: 'N/A',
      apartment: 'N/A',
      state: 'Cairo',
    }

    const payKeyRes = await fetch(`${API_BASE}/acceptance/payment_keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth_token: token,
        amount_cents: intent.amountCents,
        expiration: 3600,
        order_id: orderId,
        billing_data: billingData,
        currency: intent.currency,
        integration_id: integrationId,
        lock_order_when_paid: true,
        extras: { merchant_order_id: intent.merchantOrderId },
      }),
    })
    if (!payKeyRes.ok) {
      return { ok: false, error: `PayMob payment key failed: ${payKeyRes.status}` }
    }
    const payKey = await payKeyRes.json()
    const paymentToken = payKey.token

    // Build iframe URL (hosted checkout)
    const iframeId = process.env.PAYMOB_IFRAME_ID
    if (!iframeId) {
      return { ok: false, error: 'PAYMOB_IFRAME_ID not set' }
    }
    const checkoutUrl = `https://accept.paymob.com/api/acceptance/iframes/${iframeId}?payment_token=${paymentToken}`

    return {
      ok: true,
      checkoutUrl,
      paymobOrderId: String(orderId),
      paymobPaymentKey: paymentToken,
      sandbox: false,
    }
  } catch (err) {
    return { ok: false, error: `PayMob error: ${(err as Error).message}` }
  }
}

/** Get the integration ID for a given payment method */
function getIntegrationId(method: string): string | undefined {
  switch (method) {
    case 'CARD':
      return process.env.PAYMOB_INTEGRATION_ID_CARD
    case 'FAWRY':
      return process.env.PAYMOB_INTEGRATION_ID_FAWRY
    case 'WALLET':
      return process.env.PAYMOB_INTEGRATION_ID_WALLET
    case 'MEZA':
      return process.env.PAYMOB_INTEGRATION_ID_MEZA ?? process.env.PAYMOB_INTEGRATION_ID_CARD
    default:
      return process.env.PAYMOB_INTEGRATION_ID_CARD
  }
}

/**
 * Verify a PayMob webhook HMAC signature.
 * PayMob signs callbacks with HMAC-SHA512 of concatenated fields using a shared secret.
 */
export function verifyPayMobHmac(body: any, hmacHeader?: string): boolean {
  const secret = process.env.PAYMOB_HMAC_SECRET
  if (!secret) return false
  if (!hmacHeader) return false

  // Concatenate the signed fields in PayMob's specific order
  const fields = [
    body?.obj?.amount_cents,
    body?.obj?.created_at,
    body?.obj?.currency,
    body?.obj?.error_occured,
    body?.obj?.has_parent_transaction,
    body?.obj?.id,
    body?.obj?.integration_id,
    body?.obj?.is_3D_secure,
    body?.obj?.is_auth,
    body?.obj?.is_capture,
    body?.obj?.is_refunded,
    body?.obj?.is_standalone_payment,
    body?.obj?.is_voided,
    body?.obj?.order?.id,
    body?.obj?.owner,
    body?.obj?.pending,
    body?.obj?.source_data?.pan,
    body?.obj?.source_data?.sub_type,
    body?.obj?.source_data?.type,
    body?.obj?.success,
  ]
  const concatenated = fields.map((f) => (f === undefined || f === null ? '' : String(f))).join('')
  const computed = crypto.createHmac('sha512', secret).update(concatenated).digest('hex')
  return computed === hmacHeader
}

/** Parse a PayMob webhook body into our normalized event */
export function parsePayMobWebhook(body: any): PayMobWebhookEvent | null {
  const obj = body?.obj
  if (!obj) return null
  const success = obj.success === true
  const pending = obj.pending === true
  let type: PayMobWebhookEvent['type'] = 'FAILED'
  if (success && !pending) type = 'PAID'
  else if (obj.is_refunded) type = 'REFUNDED'
  else if (pending) type = 'FAILED' // still pending, treat as not-yet-paid

  return {
    type,
    merchantOrderId: obj.order?.merchant_order_id ?? obj.merchant_order_id ?? '',
    paymobTransactionId: String(obj.id ?? ''),
    amountCents: obj.amount_cents ?? 0,
    currency: obj.currency ?? 'EGP',
    method: obj.source_data?.type ?? 'CARD',
    success,
    pending,
  }
}

/** Refund a PayMob transaction (full or partial) */
export async function refundPayMobTransaction(
  paymobTransactionId: string,
  amountCents: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isPayMobConfigured()) {
    return { ok: true } // sandbox: simulate success
  }
  try {
    const authRes = await fetch(`${API_BASE}/auth/tokens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: process.env.PAYMOB_API_KEY }),
    })
    const auth = await authRes.json()

    const res = await fetch(`${API_BASE}/acceptance/void_refund/refund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth_token: auth.token,
        transaction_id: paymobTransactionId,
        amount_cents: amountCents,
      }),
    })
    if (!res.ok) {
      return { ok: false, error: `Refund failed: ${res.status}` }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: `Refund error: ${(err as Error).message}` }
  }
}

/** Sandbox simulation when no PayMob keys are configured */
function simulateCheckout(intent: PayMobPaymentIntent): PayMobCheckoutResult {
  const sandboxOrderId = `sandbox-${intent.merchantOrderId}-${Date.now()}`
  const checkoutUrl = `/payment/sandbox?order=${sandboxOrderId}&method=${intent.method}&amount=${intent.amountCents}`
  return {
    ok: true,
    checkoutUrl,
    paymobOrderId: sandboxOrderId,
    paymobPaymentKey: `sandbox-key-${Date.now()}`,
    sandbox: true,
  }
}

/* TODO(phase-3): Add PayMob tokenization (save cards) for recurring subscriptions.
 * TODO(phase-3): Add Aman integration for cash collection at kiosks. */
