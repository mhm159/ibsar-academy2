/**
 * Dars Academy — variable platform commission (read from SiteSetting).
 *
 * The percentage lives in the `payment.platformFeePercent` site setting
 * (editable in the admin dashboard). Falls back to the built-in default
 * (PLATFORM_FEE_PERCENT = 15%) when the DB is unavailable or unset.
 *
 * Server-only module (imports `db`).
 */

import { db } from '@/lib/db'
import { PLATFORM_FEE_PERCENT } from './config'

export const PLATFORM_FEE_SETTING_KEY = 'payment.platformFeePercent'
export const PLATFORM_FEE_DEFAULT_PERCENT = Math.round(PLATFORM_FEE_PERCENT * 100)

function clampPercent(value: number): number {
  if (Number.isNaN(value)) return PLATFORM_FEE_DEFAULT_PERCENT
  return Math.min(100, Math.max(0, value))
}

/** Platform commission as a percentage (0–100). */
export async function getPlatformFeePercent(): Promise<number> {
  try {
    const row = await db.siteSetting.findUnique({ where: { key: PLATFORM_FEE_SETTING_KEY } })
    if (!row?.value) return PLATFORM_FEE_DEFAULT_PERCENT
    return clampPercent(Number.parseFloat(row.value))
  } catch {
    return PLATFORM_FEE_DEFAULT_PERCENT
  }
}

/** Platform commission as a fraction (0–1), ready for fee math. */
export async function getPlatformFeeFraction(): Promise<number> {
  return (await getPlatformFeePercent()) / 100
}