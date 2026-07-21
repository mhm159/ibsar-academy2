import { NextResponse } from 'next/server'
import { clearSessionCookie } from '@/lib/auth'

/**
 * POST /api/auth/logout
 * Clears the session cookie.
 */
export async function POST() {
  await clearSessionCookie()
  return NextResponse.json({ ok: true, message: 'تم تسجيل الخروج' })
}

/* TODO(phase-2): Add server-side session revocation list (for "log out everywhere"). */
