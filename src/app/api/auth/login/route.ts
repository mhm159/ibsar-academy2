import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { db } from '@/lib/db'
import {
  createSessionToken,
  isValidEmail,
  isValidPhone,
  normalizePhone,
  setSessionCookie,
} from '@/lib/auth'
import { z } from 'zod'

const Body = z.object({
  // Either password login or OTP-based login
  method: z.enum(['PASSWORD', 'OTP']),
  channel: z.enum(['SMS', 'EMAIL', 'WHATSAPP']).optional(),
  target: z.string().min(4).max(120),
  password: z.string().min(1).max(128).optional(),
  verificationToken: z.string().min(10).optional(),
})

/**
 * POST /api/auth/login
 *
 * Two modes:
 * - PASSWORD: target + password (email or phone)
 * - OTP: target + verificationToken (obtained from /api/auth/verify-otp with purpose=LOGIN)
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

  const body = parsed.data

  // Resolve user by target (phone or email)
  const isPhone = isValidPhone(body.target)
  const isEmail = isValidEmail(body.target)
  if (!isPhone && !isEmail) {
    return NextResponse.json({ error: 'البيان غير صحيح' }, { status: 422 })
  }

  const normalized = isPhone ? normalizePhone(body.target) : body.target.trim().toLowerCase()

  const user = isPhone
    ? await db.user.findFirst({ where: { phone: normalized } })
    : await db.user.findFirst({ where: { email: normalized } })

  if (!user) {
    // Don't leak whether the account exists — return a generic error
    return NextResponse.json({ error: 'البيانات غير صحيحة' }, { status: 401 })
  }

  if (!user.isActive) {
    return NextResponse.json(
      { error: 'الحساب موقوف. تواصل مع الدعم' },
      { status: 403 },
    )
  }

  if (body.method === 'PASSWORD') {
    if (!body.password || !user.passwordHash) {
      return NextResponse.json(
        { error: 'استخدم تسجيل الدخول بالرمز (OTP)' },
        { status: 400 },
      )
    }
    if (!verifyPassword(body.password, user.passwordHash)) {
      return NextResponse.json({ error: 'البيانات غير صحيحة' }, { status: 401 })
    }
  } else {
    // OTP method
    if (!body.verificationToken || !body.channel) {
      return NextResponse.json(
        { error: 'رمز التحقق مطلوب' },
        { status: 422 },
      )
    }
    const verified = verifyVerificationToken(body.verificationToken)
    if (
      !verified ||
      verified.target !== normalized ||
      verified.channel !== body.channel ||
      verified.purpose !== 'LOGIN'
    ) {
      return NextResponse.json(
        { error: 'رمز التحقق غير صالح أو منتهي' },
        { status: 401 },
      )
    }
    if (verified.userId && verified.userId !== user.id) {
      return NextResponse.json({ error: 'رمز التحقق غير صالح' }, { status: 401 })
    }
  }

  // Success — create session
  const token = createSessionToken({ userId: user.id, role: user.role })
  await setSessionCookie(token)

  return NextResponse.json({
    ok: true,
    message: 'تم تسجيل الدخول بنجاح',
    user: {
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      phone: user.phone,
    },
  })
}

/** Verify password against scrypt hash */
function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split('$')
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false
  const [_, salt, hash] = parts
  const computed = crypto.scryptSync(password, salt, 64).toString('hex')
  return (
    computed.length === hash.length &&
    crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hash))
  )
}

function verifyVerificationToken(token: string): {
  target: string
  channel: string
  purpose: string
  userId?: string
} | null {
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [body, sig] = parts
  const expected = crypto
    .createHmac('sha256', process.env.OTP_SECRET || 'dev-otp-secret')
    .update(body)
    .digest('base64url')
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return null
  }
  try {
    const decoded = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'))
    if (decoded.exp && Date.now() > decoded.exp) return null
    return decoded
  } catch {
    return null
  }
}

/* TODO(phase-2): Add login-attempt rate limiting per IP + per account.
 * TODO(phase-2): Redirect to role-specific dashboard (/admin, /teacher, /parent) after login. */
