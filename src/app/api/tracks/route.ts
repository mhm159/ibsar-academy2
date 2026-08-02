import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { TRACKS } from '@/lib/constants'

/**
 * GET /api/tracks — active tracks.
 * Serves DB rows when seeded, otherwise falls back to the built-in constant
 * so the landing pages work before any seeding happens.
 */
export async function GET() {
  const dbTracks = await db.track.findMany({
    where: { isActive: true },
    orderBy: { orderIndex: 'asc' },
  })

  const fallback =
    dbTracks.length === 0
      ? TRACKS.map((t, i) => ({
          id: t.id,
          name: t.name,
          nameEn: t.nameEn,
          icon: t.icon,
          colorVar: t.colorVar,
          color: t.color,
          description: t.description,
          descriptionEn: t.descriptionEn,
          ageRange: t.ageRange,
          emoji: t.emoji,
          isActive: true,
          orderIndex: i,
        }))
      : dbTracks.map((t) => ({
          id: t.id,
          name: t.nameAr ?? t.name,
          nameEn: t.name,
          icon: t.icon,
          colorVar: t.colorVar,
          color: t.color,
          description: t.descriptionAr ?? t.description,
          descriptionEn: t.description,
          ageRange: t.ageRange,
          emoji: t.emoji,
          isActive: t.isActive,
          orderIndex: t.orderIndex,
        }))

  return NextResponse.json({ tracks: fallback })
}
