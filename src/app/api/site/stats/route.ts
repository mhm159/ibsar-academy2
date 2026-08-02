import { NextResponse } from 'next/server'
import { getSiteStats } from '@/lib/site-data'

/**
 * GET /api/site/stats
 * Public stats computed live from the database (no hardcoded numbers).
 */
export async function GET() {
  return NextResponse.json(await getSiteStats())
}
