import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getLeaderboard } from '@/lib/gamification'

/** GET /api/dashboard/parent/leaderboard — top students leaderboard */
export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'PARENT') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const leaderboard = await getLeaderboard(20)
  return NextResponse.json({ leaderboard })
}
