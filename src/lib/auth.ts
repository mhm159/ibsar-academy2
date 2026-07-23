/**
 * Ibdaa Academy — Auth helpers (Phase 1)
 *
 * Strategy:
 * - OTP-based auth for phone (SMS via Twilio/Vonage — placeholder) and email.
 * - Password fallback for email login (bcrypt).
 * - Session token stored in httpOnly cookie (JWT signed with NEXTAUTH_SECRET).
 *
 * NOTE: Real SMS/email providers are abstracted behind `sendOtp()`.
 *       In development we log the OTP and persist it for inspection.
 */

import { cookies } from 'next/headers'
import crypto from 'crypto'
import { db } from '@/lib/db'
import { sendWhatsAppOtp } from '@/lib/whatsapp'

const SESSION_COOKIE = 'ibdaa_session'
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 days

/** Generate a 6-digit OTP code */
export function generateOtpCode(): string {
  // cryptographically secure 6-digit code
  const n = crypto.randomInt(0, 1_000_000)
  return n.toString().padStart(6, '0')
}

/** Hash an OTP code before storing (so a DB leak doesn't expose codes) */
export function hashOtp(code: string): string {
  return crypto
    .createHmac('sha256', process.env.OTP_SECRET || 'dev-otp-secret')
    .update(code)
    .digest('hex')
}

/** Verify an OTP code against its hash */
export function verifyOtpHash(code: string, hash: string): boolean {
  const computed = hashOtp(code)
  // constant-time compare
  return (
    computed.length === hash.length &&
    crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hash))
  )
}

/** Normalize a phone number to E.164-ish (best-effort, EG default) */
export function normalizePhone(input: string): string {
  const trimmed = input.replace(/[\s\-()]/g, '')
  if (trimmed.startsWith('+')) return trimmed
  if (trimmed.startsWith('00')) return '+' + trimmed.slice(2)
  // Egyptian local number starts with 0 — strip it, prepend +20
  if (trimmed.startsWith('0')) return '+20' + trimmed.slice(1)
  return '+20' + trimmed
}

/** Validate Egyptian / international phone (loose) */
export function isValidPhone(input: string): boolean {
  const phone = normalizePhone(input)
  return /^\+\d{8,15}$/.test(phone)
}

/** Loose email validation */
export function isValidEmail(input: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.trim())
}

/**
 * Create + persist an OTP, then dispatch it via the appropriate channel.
 * Returns the OTP code in DEVELOPMENT only (for display / testing).
 *
 * Channels:
 *   - SMS:       Twilio/Vonage (or console log in sandbox)
 *   - EMAIL:     Resend/SendGrid (or console log in sandbox)
 *   - WHATSAPP:  Twilio WhatsApp Business API (or console log in sandbox)
 */
export async function issueOtp(params: {
  target: string // phone or email
  channel: 'SMS' | 'EMAIL' | 'WHATSAPP'
  purpose: 'REGISTER' | 'LOGIN' | 'RESET'
  userId?: string
}): Promise<{ devCode?: string; expiresAt: Date }> {
  const code = generateOtpCode()
  const codeHash = hashOtp(code)
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 min

  await db.otpCode.create({
    data: {
      userId: params.userId,
      target: params.target,
      channel: params.channel,
      codeHash,
      purpose: params.purpose,
      expiresAt,
    },
  })

  // Dispatch via provider (placeholder)
  await sendOtp({
    target: params.target,
    channel: params.channel,
    code,
    purpose: params.purpose,
  })

  return {
    // Only expose the code in non-production for dev/testing convenience.
    devCode: process.env.NODE_ENV === 'production' ? undefined : code,
    expiresAt,
  }
}

/**
 * Send OTP via configured provider.
 * - SMS:       Twilio/Vonage (or console log in sandbox)
 * - EMAIL:     Resend/SendGrid (or console log in sandbox)
 * - WHATSAPP:  Twilio WhatsApp Business API (or console log in sandbox)
 */
async function sendOtp(params: {
  target: string
  channel: 'SMS' | 'EMAIL' | 'WHATSAPP'
  code: string
  purpose: string
}): Promise<void> {
  const subject =
    params.channel === 'EMAIL'
      ? `رمز التحقق — أكاديمية إبداع`
      : undefined
  const body = `رمز التحقق الخاص بك في أكاديمية إبداع هو: ${params.code}
صالح لمدة 5 دقائق فقط.
إذا لم تطلب هذا الرمز، تجاهل هذه الرسالة.`

  // Persist log
  await db.notificationLog.create({
    data: {
      channel: params.channel,
      to: params.target,
      subject,
      body,
      status: 'SENT',
    },
  })

  if (params.channel === 'WHATSAPP') {
    // Send via WhatsApp Business API (Twilio)
    const result = await sendWhatsAppOtp({
      phone: params.target,
      code: params.code,
      purpose: params.purpose,
    })
    if (!result.ok) {
      console.error(`[OTP][WhatsApp] Failed to send to ${params.target}: ${result.error}`)
    }
  } else if (params.channel === 'SMS') {
    // TODO: integrate Twilio/Vonage SMS here when keys are available.
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      // call provider...
    }
    console.info(`[OTP][SMS] -> ${params.target}: ${params.code}`)
  } else {
    // TODO: integrate Resend/SendGrid here when keys are available.
    console.info(`[OTP][EMAIL] -> ${params.target}: ${params.code}`)
  }
}

/** Consume an OTP (verify + mark consumed). Returns userId if linked. */
export async function consumeOtp(params: {
  target: string
  code: string
  channel: 'SMS' | 'EMAIL' | 'WHATSAPP'
  purpose: 'REGISTER' | 'LOGIN' | 'RESET'
}): Promise<{ ok: true; userId?: string } | { ok: false; reason: string }> {
  const records = await db.otpCode.findMany({
    where: {
      target: params.target,
      purpose: params.purpose,
      consumed: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
    take: 1,
  })

  const record = records[0]
  if (!record) {
    return { ok: false, reason: 'انتهت صلاحية الرمز أو لم يُطلَب بعد' }
  }

  if (record.attempts >= 5) {
    return { ok: false, reason: 'تجاوزت عدد المحاولات المسموح' }
  }

  if (!verifyOtpHash(params.code, record.codeHash)) {
    await db.otpCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    })
    return { ok: false, reason: 'رمز غير صحيح' }
  }

  await db.otpCode.update({
    where: { id: record.id },
    data: { consumed: true },
  })

  return { ok: true, userId: record.userId ?? undefined }
}

/* ---------------- Session (JWT cookie) ---------------- */

function getSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('NEXTAUTH_SECRET must be set in production')
    }
    return 'dev-secret-change-me'
  }
  return secret
}

/** Create a signed session token (HMAC JWT-like) */
export function createSessionToken(payload: {
  userId: string
  role: string
}): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const body = Buffer.from(
    JSON.stringify({ ...payload, iat: Date.now(), exp: Date.now() + SESSION_TTL_SECONDS * 1000 }),
  ).toString('base64url')
  const data = `${header}.${body}`
  const sig = crypto.createHmac('sha256', getSecret()).update(data).digest('base64url')
  return `${data}.${sig}`
}

/** Verify + decode a session token */
export function verifySessionToken(token: string | undefined): {
  userId: string
  role: string
  iat: number
  exp: number
} | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [header, body, sig] = parts
  const data = `${header}.${body}`
  const expectedSig = crypto.createHmac('sha256', getSecret()).update(data).digest('base64url')
  if (
    sig.length !== expectedSig.length ||
    !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))
  ) {
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

/** Set the session cookie */
export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies()
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  })
}

/** Clear the session cookie */
export async function clearSessionCookie(): Promise<void> {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}

/** Get the current session from cookies (server-side) */
export async function getSession(): Promise<{
  userId: string
  role: string
} | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  return verifySessionToken(token)
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE

/* TODO(phase-2): Migrate to NextAuth.js v5 credentials provider once dashboard guards land.
 * TODO(phase-3): Add role-based middleware to protect /admin, /teacher, /parent routes.
 */
