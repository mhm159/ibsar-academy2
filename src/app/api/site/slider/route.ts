import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/** GET /api/site/slider — public active homepage banners */
export async function GET() {
  const banners = await db.siteBanner.findMany({
    where: { isActive: true },
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    take: 8,
  })
  return NextResponse.json({ banners })
}
