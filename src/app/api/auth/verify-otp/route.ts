import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { consumeOtp, isValidEmail, isValidPhone, normalizePhone } from '@/lib/auth'
import { z } from 'zod'

const Body = z.object({
  target: z.string().min(4).max(120),
  code: z.string().regex(/^\d{6}$/, 'الرمز يجب أن يكون 6 أرقام'),
  channel: z.enum(['SMS', 'EMAIL', 'WHATSAPP']),
  purpose: z.enum(['REGISTER', 'LOGIN', 'RESET']).default('REGISTER'),
})

/**
 * POST /api/auth/verify-otp
 * Body: { target, code, channel, purpose }
 *
 * Verifies an OTP code WITHOUT creating a session. Returns a short-lived
 * `verificationToken` that the client must include in the subsequent
 * /api/auth/register or /api/auth/login call.
 *
 * The verification token is HMAC-signed so it cannot be forged.
 */
export async function POST(req: NextRequest) {
  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: 'صيغة الطلب غير صحيحة' }, { status: 400 })
  }

  const parsed = Body.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'البيانات غير صحيحة', details: parsed.error.flatten() },
      { status: 422 },
    )
  }

  const { target, code, channel, purpose } = parsed.data
  const normalized =
    channel === 'SMS' ? normalizePhone(target) : target.trim().toLowerCase()

  // sanity-check format before consuming
  if (channel === 'SMS' && !isValidPhone(target)) {
    return NextResponse.json({ error: 'رقم الهاتف غير صحيح' }, { status: 422 })
  }
  if (channel === 'EMAIL' && !isValidEmail(target)) {
    return NextResponse.json({ error: 'البريد الإلكتروني غير صحيح' }, { status: 422 })
  }

  const result = await consumeOtp({ target: normalized, code, channel, purpose })
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 400 })
  }

  // Issue a short-lived verification token (10 min) that the next step uses.
  const verificationToken = signVerificationToken({
    target: normalized,
    channel,
    purpose,
    userId: result.userId,
  })

  return NextResponse.json({
    ok: true,
    message: 'تم التحقق بنجاح',
    verificationToken,
    verifiedTarget: normalized,
    channel,
  })
}

/** Sign a short-lived verification token (10 min) */
function signVerificationToken(payload: {
  target: string
  channel: string
  purpose: string
  userId?: string
}): string {
  // Reuse the OTP secret; in production set a dedicated VERIFICATION_SECRET.
  const secret = process.env.OTP_SECRET || 'dev-otp-secret'
  const body = Buffer.from(
    JSON.stringify({
      ...payload,
      iat: Date.now(),
      exp: Date.now() + 10 * 60 * 1000, // 10 min
    }),
  ).toString('base64url')
  const sig = crypto.createHmac('sha256', secret).update(body).digest('base64url')
  return `${body}.${sig}`
}

/* TODO(phase-2): Migrate verification token to a DB-backed `VerifiedTarget` table for revocation. */
