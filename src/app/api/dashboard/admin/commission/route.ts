import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { getPlatformFeePercent, PLATFORM_FEE_SETTING_KEY } from '@/lib/payment/fee'
import { SITE_SETTING_DEFS } from '@/lib/site-settings'
import { z } from 'zod'

/**
 * Admin platform-commission management.
 *
 * GET  /api/dashboard/admin/commission — returns { commissionRate } (0-100)
 * POST /api/dashboard/admin/commission — body { rate: number (0-100) }
 *
 * The value is stored in the SiteSetting table (payment.platformFeePercent),
 * the same source used by escrow settlement (src/lib/payment/fee.ts).
 */

async function requireAdmin() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') return null
  return session
}

export async function GET() {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const rate = await getPlatformFeePercent()
  return NextResponse.json({ commissionRate: rate })
}

const Body = z.object({
  rate: z.number().min(0).max(100),
})

export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) {
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

  const def = SITE_SETTING_DEFS.find((d) => d.key === PLATFORM_FEE_SETTING_KEY)

  await db.siteSetting.upsert({
    where: { key: PLATFORM_FEE_SETTING_KEY },
    update: { value: String(parsed.data.rate) },
    create: {
      key: PLATFORM_FEE_SETTING_KEY,
      value: String(parsed.data.rate),
      label: def?.label,
      group: def?.group,
    },
  })

  return NextResponse.json({
    ok: true,
    message: `تم تحديث نسبة عمولة المنصة إلى ${parsed.data.rate}%`,
    commissionRate: parsed.data.rate,
  })
}