import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { DEFAULT_SITE_SETTINGS, mergeSiteSettings } from '@/lib/site-settings'

/**
 * GET /api/site/settings — public site settings (used by landing sections).
 * Falls back to built-in defaults when the DB is empty / has no rows yet.
 */
export async function GET() {
  const rows = await db.siteSetting.findMany()
  const dbValues: Record<string, string> = {}
  for (const r of rows) dbValues[r.key] = r.value

  const settings = mergeSiteSettings(dbValues)

  // Ensure defaults are persisted so the admin editor has rows to edit.
  const keysInDb = new Set(rows.map((r) => r.key))
  const missing = Object.keys(DEFAULT_SITE_SETTINGS).filter((k) => !keysInDb.has(k))
  if (missing.length > 0) {
    const { SITE_SETTING_DEFS } = await import('@/lib/site-settings')
    await db.siteSetting.createMany({
      data: missing.map((k) => {
        const def = SITE_SETTING_DEFS.find((d) => d.key === k)!
        return { key: k, value: DEFAULT_SITE_SETTINGS[k], label: def.label, group: def.group }
      }),
    })
  }

  return NextResponse.json({ settings })
}
