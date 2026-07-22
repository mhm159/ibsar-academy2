import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

/** GET /api/dashboard/admin/alerts — all behavior alerts across platform */
export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const alerts = await db.behaviorAlert.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const summary = {
    total: alerts.length,
    newCount: alerts.filter((a) => a.status === 'NEW').length,
    highSeverity: alerts.filter((a) => a.severity === 'HIGH' && a.status === 'NEW').length,
    byType: {
      LOW_ENGAGEMENT: alerts.filter((a) => a.type === 'LOW_ENGAGEMENT').length,
      STRUGGLING: alerts.filter((a) => a.type === 'STRUGGLING').length,
      ABSENT: alerts.filter((a) => a.type === 'ABSENT').length,
      BEHIND: alerts.filter((a) => a.type === 'BEHIND').length,
      EXCELLENT_PROGRESS: alerts.filter((a) => a.type === 'EXCELLENT_PROGRESS').length,
    },
  }

  return NextResponse.json({ alerts, summary })
}
