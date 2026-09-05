import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  issueOtp,
  isValidEmail,
  isValidPhone,
  normalizePhone,
} from '@/lib/auth'
import { z } from 'zod'

const Body = z.object({
  target: z.string().min(4).max(120),
  channel: z.enum(['SMS', 'EMAIL', 'WHATSAPP']),
  purpose: z.enum(['REGISTER', 'LOGIN', 'RESET']).default('REGISTER'),
})

/**
 * POST /api/auth/send-otp
 * Body: { target: string; channel: 'SMS'|'EMAIL'; purpose?: 'REGISTER'|'LOGIN'|'RESET' }
 *
 * Issues a 6-digit OTP and dispatches it via SMS (Twilio/Vonage placeholder)
 * or EMAIL (Resend/SendGrid placeholder). In development, the code is also
 * returned in the response under `devCode` for testing convenience.
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

  const { target, channel, purpose } = parsed.data

  // Validate target format
  if (channel === 'SMS' || channel === 'WHATSAPP') {
    if (!isValidPhone(target)) {
      return NextResponse.json(
        { error: 'رقم الهاتف غير صحيح. مثال: 01012345678 أو +201012345678' },
        { status: 422 },
      )
    }
  } else {
    if (!isValidEmail(target)) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني غير صحيح' },
        { status: 422 },
      )
    }
  }

  const normalized = channel === 'SMS' || channel === 'WHATSAPP' ? normalizePhone(target) : target.trim().toLowerCase()

  // Rate-limit: max 3 OTPs per target per 5 minutes
  const recent = await db.otpCode.count({
    where: {
      target: normalized,
      createdAt: { gt: new Date(Date.now() - 5 * 60 * 1000) },
    },
  })
  if (recent >= 3) {
    return NextResponse.json(
      { error: 'تم إرسال رموز كثيرة. حاول مرة أخرى بعد 5 دقائق' },
      { status: 429 },
    )
  }

  // For LOGIN/RESET, ensure an account exists for this target
  if (purpose === 'LOGIN' || purpose === 'RESET') {
    const user =
      channel === 'SMS' || channel === 'WHATSAPP'
        ? await db.user.findFirst({ where: { phone: normalized } })
        : await db.user.findFirst({ where: { email: normalized } })
    if (!user) {
      return NextResponse.json(
        { error: 'لا يوجد حساب بهذا البيان. سجّل أولاً' },
        { status: 404 },
      )
    }
    // Issue OTP linked to the user
    const result = await issueOtp({ target: normalized, channel, purpose, userId: user.id })
    return NextResponse.json({
      ok: true,
      message: 'تم إرسال الرمز بنجاح',
      devCode: result.devCode,
      expiresAt: result.expiresAt,
    })
  }

  // REGISTER: ensure target isn't already taken
  const existing =
    channel === 'SMS' || channel === 'WHATSAPP'
      ? await db.user.findFirst({ where: { phone: normalized } })
      : await db.user.findFirst({ where: { email: normalized } })
  if (existing) {
    return NextResponse.json(
      { error: 'هذا البيان مسجّل بالفعل. سجّل الدخول بدلاً من ذلك' },
      { status: 409 },
    )
  }

  const result = await issueOtp({ target: normalized, channel, purpose })
  return NextResponse.json({
    ok: true,
    message: 'تم إرسال الرمز بنجاح',
    devCode: result.devCode,
    expiresAt: result.expiresAt,
  })
}

/* TODO(phase-3): Add CAPTCHA (hCaptcha/Turnstile) for unauthenticated OTP requests to prevent abuse.
 * TODO(phase-1): Wire real Twilio/Vonage SMS + Resend email providers in sendOtp() once keys are set. */
