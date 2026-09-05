import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { z } from 'zod'
import { db } from '@/lib/db'
import { createSessionToken, isValidEmail, isValidPhone, normalizePhone, setSessionCookie } from '@/lib/auth'
import { consumeRateLimit, requestIp } from '@/lib/rate-limit'

const Body = z.object({
  channel: z.enum(['SMS', 'EMAIL']), target: z.string().min(4).max(120),
  role: z.enum(['PARENT', 'TEACHER']).default('PARENT'), name: z.string().trim().min(2).max(80),
  country: z.string().min(2).max(4).default('EG'), city: z.string().trim().max(80).optional(),
  password: z.string().min(10).max(128), tracks: z.array(z.string().min(1).max(80)).max(10).optional(),
  bio: z.string().trim().max(2000).optional(), experienceYears: z.number().int().min(0).max(60).optional(),
})

export async function POST(req: NextRequest) {
  const throttle = consumeRateLimit(`register:${requestIp(req)}`, 5, 15 * 60 * 1000)
  if (!throttle.allowed) return NextResponse.json({ error: 'محاولات كثيرة. حاول لاحقًا.' }, { status: 429, headers: { 'Retry-After': String(throttle.retryAfter) } })
  let input: unknown
  try { input = await req.json() } catch { return NextResponse.json({ error: 'صيغة الطلب غير صحيحة' }, { status: 400 }) }
  const parsed = Body.safeParse(input)
  if (!parsed.success) return NextResponse.json({ error: 'راجع البيانات وكلمة المرور', details: parsed.error.flatten() }, { status: 422 })
  const body = parsed.data
  const isPhone = body.channel === 'SMS'
  if ((isPhone && !isValidPhone(body.target)) || (!isPhone && !isValidEmail(body.target))) return NextResponse.json({ error: isPhone ? 'رقم الهاتف غير صحيح' : 'البريد الإلكتروني غير صحيح' }, { status: 422 })
  const target = isPhone ? normalizePhone(body.target) : body.target.trim().toLowerCase()
  const existing = isPhone ? await db.user.findFirst({ where: { phone: target } }) : await db.user.findFirst({ where: { email: target } })
  if (existing) return NextResponse.json({ error: 'هذا الحساب مسجل بالفعل' }, { status: 409 })
  if (body.role === 'TEACHER' && (!body.tracks || body.tracks.length === 0)) return NextResponse.json({ error: 'اختر تخصصًا واحدًا على الأقل' }, { status: 422 })

  const passwordHash = hashPassword(body.password)
  const user = await db.$transaction(async (tx) => {
    const created = await tx.user.create({ data: { email: isPhone ? null : target, phone: isPhone ? target : null, role: body.role, name: body.name, passwordHash, country: body.country, city: body.city || null, preferredLang: 'ar' } })
    if (body.role === 'TEACHER') await tx.teacher.create({ data: { userId: created.id, bio: body.bio, tracks: (body.tracks ?? []).join(','), experienceYears: body.experienceYears ?? 0, status: 'PENDING' } })
    else await tx.parent.create({ data: { userId: created.id } })
    return created
  })
  await setSessionCookie(createSessionToken({ userId: user.id, role: user.role }))
  return NextResponse.json({ ok: true, user: { id: user.id, role: user.role, name: user.name, email: user.email, phone: user.phone } }, { status: 201 })
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  return `scrypt$${salt}$${crypto.scryptSync(password, salt, 64).toString('hex')}`
}
