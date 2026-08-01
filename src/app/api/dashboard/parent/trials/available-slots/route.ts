import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const track = searchParams.get('track')

  if (!track) {
    return NextResponse.json({ error: 'يرجى تحديد المسار' }, { status: 400 })
  }

  // Find all available slots for approved teachers teaching this track
  const slots = await db.availability.findMany({
    where: {
      isActive: true,
      teacher: {
        tracks: { contains: track },
        status: 'APPROVED',
      }
    },
    select: {
      dayOfWeek: true,
      startHour: true,
      endHour: true,
    }
  })

  // Group by day of week
  const availableDays = Array.from(new Set(slots.map(s => s.dayOfWeek))).sort()

  return NextResponse.json({ 
    availableDays,
    totalSlots: slots.length,
  })
}
