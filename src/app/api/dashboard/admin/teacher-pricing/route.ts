import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

/**
 * GET /api/dashboard/admin/teacher-pricing
 * Returns all teachers with their pricing mode + rates.
 */
export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const teachers = await db.teacher.findMany({
    include: { user: { select: { name: true, phone: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({
    teachers: teachers.map((t) => ({
      id: t.id,
      name: t.user.name,
      phone: t.user.phone,
      pricingMode: t.pricingMode,
      maxHourlyRateEGP: t.maxHourlyRateEGP,
      fixedHourlyRateEGP: t.fixedHourlyRateEGP,
      fixedHourlyRateUSD: t.fixedHourlyRateUSD,
      hourlyRateEGP: t.hourlyRateEGP,
      hourlyRateUSD: t.hourlyRateUSD,
      status: t.status,
    })),
  })
}

const Body = z.object({
  teacherId: z.string().min(1),
  pricingMode: z.enum(['FREE', 'CAPPED', 'FIXED']),
  maxHourlyRateEGP: z.number().int().min(0).optional(),
  fixedHourlyRateEGP: z.number().int().min(0).optional(),
  fixedHourlyRateUSD: z.number().int().min(0).optional(),
})

/**
 * POST /api/dashboard/admin/teacher-pricing
 * Set pricing mode for a teacher.
 *
 * Modes:
 *   FREE   — teacher sets their own price freely
 *   CAPPED — teacher sets price up to maxHourlyRateEGP
 *   FIXED  — academy sets fixedHourlyRateEGP, teacher can't change
 */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
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

  const { teacherId, pricingMode, maxHourlyRateEGP, fixedHourlyRateEGP, fixedHourlyRateUSD } = parsed.data

  const teacher = await db.teacher.findUnique({ where: { id: teacherId } })
  if (!teacher) {
    return NextResponse.json({ error: 'المعلم غير موجود' }, { status: 404 })
  }

  const updates: any = { pricingMode }

  if (pricingMode === 'CAPPED' && maxHourlyRateEGP !== undefined) {
    updates.maxHourlyRateEGP = maxHourlyRateEGP
  }

  if (pricingMode === 'FIXED') {
    if (fixedHourlyRateEGP !== undefined) {
      updates.fixedHourlyRateEGP = fixedHourlyRateEGP
      updates.hourlyRateEGP = fixedHourlyRateEGP // lock the rate
    }
    if (fixedHourlyRateUSD !== undefined) {
      updates.fixedHourlyRateUSD = fixedHourlyRateUSD
      updates.hourlyRateUSD = fixedHourlyRateUSD
    }
  }

  await db.teacher.update({
    where: { id: teacherId },
    data: updates,
  })

  const modeLabels: Record<string, string> = {
    FREE: 'حر (المعلم يحدد السعر)',
    CAPPED: 'محدد بسقف',
    FIXED: 'سعر ثابت من الأكاديمية',
  }

  return NextResponse.json({
    ok: true,
    message: `تم تحديث وضع التسعير إلى: ${modeLabels[pricingMode]}`,
  })
}
