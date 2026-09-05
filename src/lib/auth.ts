/**
 * Dars Academy — Auth helpers (Phase 1)
 *
 * Password authentication helpers and signed httpOnly session cookies.
 */

import { cookies } from 'next/headers'
import crypto from 'crypto'
import { db } from '@/lib/db'

const SESSION_COOKIE = 'dars_session'
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 days

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
