import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { z } from 'zod'
import { db } from '@/lib/db'
import { createSessionToken, isValidEmail, isValidPhone, normalizePhone, setSessionCookie } from '@/lib/auth'
import { consumeRateLimit, requestIp } from '@/lib/rate-limit'

const Body = z.object({ target: z.string().min(4).max(120), password: z.string().min(1).max(128) })

export async function POST(req: NextRequest) {
  const ipLimit = consumeRateLimit(`login-ip:${requestIp(req)}`, 20, 15 * 60 * 1000)
  if (!ipLimit.allowed) return NextResponse.json({ error: 'محاولات كثيرة. حاول لاحقًا.' }, { status: 429, headers: { 'Retry-After': String(ipLimit.retryAfter) } })
  let input: unknown
  try { input = await req.json() } catch { return NextResponse.json({ error: 'صيغة الطلب غير صحيحة' }, { status: 400 }) }
  const parsed = Body.safeParse(input)
  if (!parsed.success) return NextResponse.json({ error: 'بيانات الدخول غير صحيحة' }, { status: 422 })
  const { target, password } = parsed.data
  const isPhone = isValidPhone(target), isEmail = isValidEmail(target)
  if (!isPhone && !isEmail) return NextResponse.json({ error: 'بيانات الدخول غير صحيحة' }, { status: 401 })
  const normalized = isPhone ? normalizePhone(target) : target.trim().toLowerCase()
  const accountLimit = consumeRateLimit(`login-account:${normalized}`, 8, 15 * 60 * 1000)
  if (!accountLimit.allowed) return NextResponse.json({ error: 'تم إيقاف المحاولات مؤقتًا. حاول لاحقًا.' }, { status: 429, headers: { 'Retry-After': String(accountLimit.retryAfter) } })
  const user = isPhone ? await db.user.findFirst({ where: { phone: normalized } }) : await db.user.findFirst({ where: { email: normalized } })
  if (!user?.passwordHash || !verifyPassword(password, user.passwordHash)) return NextResponse.json({ error: 'بيانات الدخول غير صحيحة' }, { status: 401 })
  if (!user.isActive) return NextResponse.json({ error: 'الحساب موقوف. تواصل مع الدعم.' }, { status: 403 })
  await setSessionCookie(createSessionToken({ userId: user.id, role: user.role }))
  return NextResponse.json({ ok: true, user: { id: user.id, role: user.role, name: user.name, email: user.email, phone: user.phone } })
}

function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split('$')
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false
  const computed = crypto.scryptSync(password, parts[1], 64).toString('hex')
  return computed.length === parts[2].length && crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(parts[2]))
}
