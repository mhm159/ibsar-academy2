import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { SITE_SETTING_DEFS, DEFAULT_SITE_SETTINGS, mergeSiteSettings } from '@/lib/site-settings'

/**
 * Admin site-settings management.
 *
 * GET  /api/admin/settings — list all settings grouped with labels
 * PUT  /api/admin/settings — bulk update { values: Record<string,string> }
 */

async function requireAdmin() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') return null
  return session
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const rows = await db.siteSetting.findMany()
  const values: Record<string, string> = {}
  for (const r of rows) values[r.key] = r.value

  const settings = mergeSiteSettings(values)

  // Ensure every known key has a row (so the editor is complete)
  const keysInDb = new Set(rows.map((r) => r.key))
  const missing = SITE_SETTING_DEFS.filter((d) => !keysInDb.has(d.key))
  if (missing.length > 0) {
    await db.siteSetting.createMany({
      data: missing.map((d) => ({ key: d.key, value: d.defaultValue, label: d.label, group: d.group })),
    })
    for (const d of missing) settings[d.key] = d.defaultValue
  }

  return NextResponse.json({
    settings,
    groups: ['HERO', 'JOURNEY', 'SECTIONS', 'CTA', 'FOOTER', 'PAYMENT', 'GENERAL'],
    definitions: SITE_SETTING_DEFS,
  })
}

export async function PUT(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const body = await req.json()
  const { values } = body as { values?: Record<string, string> }
  if (!values || typeof values !== 'object') {
    return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 422 })
  }

  const allowedKeys = new Set(SITE_SETTING_DEFS.map((d) => d.key))
  for (const [key, value] of Object.entries(values)) {
    if (!allowedKeys.has(key)) continue
    if (typeof value !== 'string') continue
    await db.siteSetting.upsert({
      where: { key },
      update: { value },
      create: {
        key,
        value,
        label: SITE_SETTING_DEFS.find((d) => d.key === key)?.label,
        group: SITE_SETTING_DEFS.find((d) => d.key === key)?.group,
      },
    })
  }

  return NextResponse.json({ ok: true, message: 'تم حفظ الإعدادات' })
}
