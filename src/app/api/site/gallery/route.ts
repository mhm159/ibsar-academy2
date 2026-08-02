import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/** GET /api/site/gallery — public published session media (processed session images) */
export async function GET() {
  const media = await db.sessionMedia.findMany({
    where: { isPublished: true },
    orderBy: [{ createdAt: 'desc' }],
    include: {
      session: { select: { id: true, title: true, track: true, teacher: { select: { user: { select: { name: true } } } } } },
    },
    take: 24,
  })
  return NextResponse.json({ media })
}
