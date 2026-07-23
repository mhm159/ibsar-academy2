import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

/**
 * GET /api/dashboard/admin/commission
 * Returns current platform commission rate.
 */

/**
 * POST /api/dashboard/admin/commission
 * Body: { rate: number (0-100) }
 *
 * Sets the platform commission percentage.
 * Stored in a system settings table (or env var fallback).
 * Default: 15%
 */

// We store commission in a simple key-value approach using NotificationLog or a dedicated setting
// For simplicity, we'll use an env var with a DB override in CurrencyRate table (meta field)

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  // Read from env or default
  const rate = parseFloat(process.env.PLATFORM_FEE_PERCENT || '15')
  return NextResponse.json({ commissionRate: rate })
}

const Body = z.object({
  rate: z.number().min(0).max(100),
})

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
    return NextResponse.json({ error: 'النسبة يجب أن تكون بين 0 و 100' }, { status: 422 })
  }

  // Store in env-like approach: we'll use a meta record in CurrencyRate
  // (repurposing as a settings table since we don't have a dedicated one)
  await db.currencyRate.upsert({
    where: { code: '_PLATFORM_SETTINGS' },
    update: { rateToUSD: parsed.data.rate },
    create: {
      code: '_PLATFORM_SETTINGS',
      name: 'Platform Settings',
      nameAr: 'إعدادات المنصة',
      symbol: '%',
      rateToUSD: parsed.data.rate,
      providers: '',
    },
  })

  return NextResponse.json({
    ok: true,
    message: `تم تحديث نسبة عمولة المنصة إلى ${parsed.data.rate}%`,
    commissionRate: parsed.data.rate,
  })
}
