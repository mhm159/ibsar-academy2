import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { getCountryConfig, PAYMENT_METHOD_LABELS, type PaymentMethod } from '@/lib/payment/config'
import { createPayMobCheckout } from '@/lib/payment/paymob'
import { createStripeCheckout } from '@/lib/payment/stripe'
import { egpToPiasters, usdToCents, convertCurrency, getDbRates } from '@/lib/payment/currency'
import { createEscrowForTransaction } from '@/lib/payment/escrow'
import { z } from 'zod'

const Body = z.object({
  bookingId: z.string().min(1),
  method: z.enum(['CARD', 'FAWRY', 'VODAFONE_CASH', 'ETISALAT_CASH', 'ORANGE_CASH', 'WE_PAY', 'MEZA', 'APPLE_PAY', 'MADA', 'STC_PAY']),
  couponCode: z.string().optional(),
})

/**
 * POST /api/payment/checkout
 *
 * Initiates a payment for a booking. Returns a checkout URL the client
 * should redirect to. Creates a Transaction (PENDING) + stores checkout details.
 *
 * Flow:
 * 1. Verify booking belongs to parent's student
 * 2. Determine provider from parent's country (PayMob EG / Stripe Gulf)
 * 3. Apply coupon if provided
 * 4. Create provider checkout → return URL
 */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'PARENT') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: 'صيغة غير صحيحة' }, { status: 400 })
  }

  const parsed = Body.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'البيانات غير صحيحة', details: parsed.error.flatten() },
      { status: 422 },
    )
  }

  const { bookingId, method, couponCode } = parsed.data

  // 1. Verify booking
  const parent = await db.parent.findUnique({
    where: { userId: session.userId },
    include: {
      user: { select: { name: true, email: true, phone: true, country: true } },
      students: { select: { id: true } },
    },
  })
  if (!parent) {
    return NextResponse.json({ error: 'الملف غير موجود' }, { status: 404 })
  }

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: {
      session: {
        include: {
          teacher: { include: { user: { select: { name: true } } } },
        },
      },
      student: { select: { name: true } },
      transaction: { select: { status: true } },
    },
  })

  if (!booking) {
    return NextResponse.json({ error: 'الحجز غير موجود' }, { status: 404 })
  }

  // Verify student belongs to parent
  const ownsStudent = parent.students.some((s) => s.id === booking.studentId)
  if (!ownsStudent) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  // Check if already paid
  if (booking.transaction?.status === 'PAID') {
    return NextResponse.json({ error: 'تم دفع هذه الحصة بالفعل' }, { status: 400 })
  }

  // 2. Determine provider from parent's country
  const country = parent.user.country ?? 'EG'
  const countryConfig = getCountryConfig(country) ?? getCountryConfig('EG')!
  const provider = countryConfig.provider
  const currency = countryConfig.currency

  // 3. Compute amounts
  const rates = await getDbRates()
  const originalEGP = booking.priceEGP
  const originalUSD = booking.priceUSD

  // Apply coupon if provided
  let discountEGP = 0
  let discountUSD = 0
  let couponId: string | null = null
  if (couponCode) {
    const coupon = await db.coupon.findFirst({
      where: {
        code: couponCode.toUpperCase(),
        isActive: true,
        usedCount: { lt: 10 }, // simplified
        OR: [{ validUntil: null }, { validUntil: { gt: new Date() } }],
      },
    })
    if (!coupon) {
      return NextResponse.json({ error: 'كوبون غير صالح' }, { status: 400 })
    }
    if (coupon.type === 'PERCENTAGE') {
      discountEGP = Math.round(originalEGP * (coupon.value / 100))
      discountUSD = Math.round(originalUSD * (coupon.value / 100))
    } else {
      // Fixed amount in coupon currency
      const fixedEGP = coupon.currency === 'EGP' ? coupon.value : convertCurrency(coupon.value, coupon.currency, 'EGP', rates) * 100
      const fixedUSD = coupon.currency === 'USD' ? coupon.value : convertCurrency(coupon.value, coupon.currency, 'USD', rates) * 100
      discountEGP = Math.min(Math.round(fixedEGP), originalEGP)
      discountUSD = Math.min(Math.round(fixedUSD), originalUSD)
    }
    couponId = coupon.id
  }

  const finalEGP = Math.max(0, originalEGP - discountEGP)
  const finalUSD = Math.max(0, originalUSD - discountUSD)

  // 4. Create/update Transaction (PENDING)
  const transaction = await db.transaction.upsert({
    where: { bookingId: booking.id },
    update: {
      amountEGP: finalEGP,
      amountUSD: finalUSD,
      currency,
      status: 'PENDING',
      provider,
      paymentMethod: method,
      buyerCountry: country,
      originalAmountEGP: originalEGP,
      originalAmountUSD: originalUSD,
      discountEGP,
      discountUSD,
      couponId,
    },
    create: {
      parentId: parent.id,
      userId: session.userId,
      type: 'SESSION_BOOKING',
      amountEGP: finalEGP,
      amountUSD: finalUSD,
      currency,
      status: 'PENDING',
      provider,
      paymentMethod: method,
      buyerCountry: country,
      bookingId: booking.id,
      description: `حجز حصة ${booking.session.title} - ${booking.student.name}`,
      originalAmountEGP: originalEGP,
      originalAmountUSD: originalUSD,
      discountEGP,
      discountUSD,
      couponId,
    },
  })

  // 5. Create provider checkout
  const origin = req.nextUrl.origin
  const successUrl = `${origin}/payment/success?tx=${transaction.id}`
  const cancelUrl = `${origin}/payment/cancel?tx=${transaction.id}`
  const webhookUrl = `${origin}/api/payment/webhooks/${provider.toLowerCase()}`

  let checkoutResult: { ok: true; checkoutUrl: string; sandbox?: boolean; providerRef?: string } | { ok: false; error: string }

  if (provider === 'PAYMOB') {
    // PayMob requires amount in EGP piasters
    const methodMap: Record<string, 'CARD' | 'FAWRY' | 'WALLET' | 'MEZA'> = {
      CARD: 'CARD',
      FAWRY: 'FAWRY',
      VODAFONE_CASH: 'WALLET',
      ETISALAT_CASH: 'WALLET',
      ORANGE_CASH: 'WALLET',
      WE_PAY: 'WALLET',
      MEZA: 'MEZA',
    }
    const pmMethod = methodMap[method] ?? 'CARD'
    const result = await createPayMobCheckout({
      amountCents: finalEGP, // already in piasters
      currency: 'EGP',
      merchantOrderId: transaction.id,
      description: transaction.description ?? 'Dars Academy booking',
      buyer: {
        name: parent.user.name ?? 'Parent',
        email: parent.user.email ?? undefined,
        phone: parent.user.phone ?? undefined,
        country,
      },
      items: [
        {
          name: booking.session.title,
          amountCents: finalEGP,
          quantity: 1,
        },
      ],
      method: pmMethod,
      successUrl,
      cancelUrl,
      webhookUrl,
    })
    checkoutResult = result.ok
      ? { ok: true, checkoutUrl: result.checkoutUrl, sandbox: result.sandbox, providerRef: result.paymobOrderId }
      : result
  } else {
    // Stripe — charge in the parent's local currency
    // Convert EGP amount to local currency in cents
    const localAmount = convertCurrency(finalUSD / 100, 'USD', currency, rates)
    const localAmountCents = Math.round(localAmount * Math.pow(10, currency === 'KWD' || currency === 'BHD' || currency === 'OMR' ? 3 : 2))
    const result = await createStripeCheckout({
      amountCents: localAmountCents,
      currency: currency as any,
      merchantOrderId: transaction.id,
      description: transaction.description ?? 'Dars Academy booking',
      buyer: {
        name: parent.user.name ?? 'Parent',
        email: parent.user.email ?? undefined,
        country,
      },
      items: [
        {
          name: booking.session.title,
          amountCents: localAmountCents,
          quantity: 1,
        },
      ],
      method: 'CARD',
      successUrl,
      cancelUrl,
    })
    checkoutResult = result.ok
      ? { ok: true, checkoutUrl: result.checkoutUrl, sandbox: result.sandbox, providerRef: result.stripeSessionId }
      : result
  }

  if (!checkoutResult.ok) {
    // Mark transaction as FAILED
    await db.transaction.update({
      where: { id: transaction.id },
      data: { status: 'FAILED' },
    })
    return NextResponse.json({ error: checkoutResult.error }, { status: 500 })
  }

  // 6. Store checkout URL + provider ref
  await db.transaction.update({
    where: { id: transaction.id },
    data: {
      checkoutUrl: checkoutResult.checkoutUrl,
      providerRef: checkoutResult.providerRef,
    },
  })

  // Increment coupon usage if applied
  if (couponId) {
    await db.coupon.update({
      where: { id: couponId },
      data: { usedCount: { increment: 1 } },
    })
  }

  return NextResponse.json({
    ok: true,
    checkoutUrl: checkoutResult.checkoutUrl,
    transactionId: transaction.id,
    sandbox: checkoutResult.sandbox,
    method: PAYMENT_METHOD_LABELS[method as PaymentMethod],
  })
}

/**
 * GET /api/payment/checkout?tx=<transactionId>
 * Returns the checkout URL for a transaction (for retry).
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }
  const tx = new URL(req.url).searchParams.get('tx')
  if (!tx) {
    return NextResponse.json({ error: 'معرف المعاملة مطلوب' }, { status: 422 })
  }
  const transaction = await db.transaction.findUnique({
    where: { id: tx },
    select: { id: true, userId: true, status: true, checkoutUrl: true, amountEGP: true, amountUSD: true, currency: true },
  })
  if (!transaction) {
    return NextResponse.json({ error: 'غير موجود' }, { status: 404 })
  }
  if (transaction.userId !== session.userId && session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }
  return NextResponse.json({ transaction })
}
