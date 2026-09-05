import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { db } from '@/lib/db'
import {
  createSessionToken,
  getOtpSecret,
  isValidEmail,
  isValidPhone,
  normalizePhone,
  setSessionCookie,
} from '@/lib/auth'
import { z } from 'zod'

const Body = z.object({
  // Contact (must match the verified target)
  channel: z.enum(['SMS', 'EMAIL', 'WHATSAPP']),
  target: z.string().min(4).max(120),
  verificationToken: z.string().min(10),
  // Profile
  role: z.enum(['PARENT', 'TEACHER']).default('PARENT'),
  name: z.string().min(2).max(80),
  nameAr: z.string().min(2).max(80).optional(),
  country: z.string().min(2).max(4).default('EG'),
  city: z.string().max(80).optional(),
  password: z.string().min(8).max(128).optional(),
  // Teacher-only
  tracks: z.array(z.string()).optional(),
  bio: z.string().max(2000).optional(),
  experienceYears: z.number().int().min(0).max(60).optional(),
})

/**
 * POST /api/auth/register
 *
 * Creates a new User (+ Teacher or Parent profile) after OTP verification.
 * The client must first call /api/auth/send-otp then /api/auth/verify-otp to
 * obtain a `verificationToken`, which is passed here.
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
  const normalized =
    body.channel === 'SMS' || body.channel === 'WHATSAPP' ? normalizePhone(body.target) : body.target.trim().toLowerCase()

  // Verify the verification token
  const verified = verifyVerificationToken(body.verificationToken)
  if (!verified || verified.target !== normalized || verified.channel !== body.channel) {
    return NextResponse.json(
      { error: 'رمز التحقق غير صالح أو منتهي. أعد طلب رمز جديد' },
      { status: 401 },
    )
  }

  // Ensure no duplicate
  const existing =
    body.channel === 'SMS' || body.channel === 'WHATSAPP'
      ? await db.user.findFirst({ where: { phone: normalized } })
      : await db.user.findFirst({ where: { email: normalized } })
  if (existing) {
    return NextResponse.json(
      { error: 'هذا الحساب مسجّل بالفعل. سجّل الدخول' },
      { status: 409 },
    )
  }

  // Hash password if provided (optional — OTP-only auth is allowed)
  const passwordHash = body.password ? hashPassword(body.password) : null

  // Create user + profile in a transaction
  const user = await db.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email: body.channel === 'EMAIL' ? normalized : null,
        phone: body.channel === 'SMS' || body.channel === 'WHATSAPP' ? normalized : null,
        role: body.role,
        name: body.name,
        nameAr: body.nameAr,
        passwordHash,
        country: body.country,
        city: body.city,
        preferredLang: 'ar',
        emailVerified: body.channel === 'EMAIL' ? new Date() : null,
        phoneVerified: body.channel === 'SMS' || body.channel === 'WHATSAPP' ? new Date() : null,
      },
    })

    if (body.role === 'TEACHER') {
      await tx.teacher.create({
        data: {
          userId: newUser.id,
          bio: body.bio,
          tracks: (body.tracks ?? []).join(','),
          experienceYears: body.experienceYears ?? 0,
          status: 'PENDING', // pending admin approval
        },
      })
    } else {
      await tx.parent.create({
        data: { userId: newUser.id },
      })
    }

    return newUser
  })

  // Create session
  const token = createSessionToken({ userId: user.id, role: user.role })
  await setSessionCookie(token)

  return NextResponse.json({
    ok: true,
    message:
      body.role === 'TEACHER'
        ? 'تم إنشاء حساب المعلم. سيتم مراجعته من الإدارة خلال 24 ساعة'
        : 'تم إنشاء حساب ولي الأمر بنجاح',
    user: {
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      phone: user.phone,
    },
  })
}

/** Hash a password using scrypt (Node built-in, no extra deps) */
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return `scrypt$${salt}$${hash}`
}

/** Verify a verification token (mirror of verify-otp route's signer) */
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
    .createHmac('sha256', getOtpSecret())
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

/* TODO(phase-2): Add admin notification (email) when a new teacher registers for approval.
 * TODO(phase-3): Add first-session discount coupon creation on successful registration. */
