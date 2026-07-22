import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

/** GET /api/dashboard/parent/alerts — behavior alerts for parent's children */
export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'PARENT') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }
  const parent = await db.parent.findUnique({ where: { userId: session.userId } })
  if (!parent) {
    return NextResponse.json({ error: 'الملف غير موجود' }, { status: 404 })
  }

  const alerts = await db.behaviorAlert.findMany({
    where: { parentId: parent.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  const summary = {
    newCount: alerts.filter((a) => a.status === 'NEW').length,
    highSeverity: alerts.filter((a) => a.severity === 'HIGH' && a.status === 'NEW').length,
    totalCount: alerts.length,
  }

  return NextResponse.json({ alerts, summary })
}

/** PATCH /api/dashboard/parent/alerts — acknowledge an alert */
export async function PATCH(req: Request) {
  const session = await getSession()
  if (!session || session.role !== 'PARENT') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }
  const body = await req.json()
  const { alertId } = body as { alertId: string }
  if (!alertId) {
    return NextResponse.json({ error: 'معرف التنبيه مطلوب' }, { status: 422 })
  }

  const parent = await db.parent.findUnique({ where: { userId: session.userId } })
  if (!parent) {
    return NextResponse.json({ error: 'الملف غير موجود' }, { status: 404 })
  }

  const alert = await db.behaviorAlert.findUnique({ where: { id: alertId } })
  if (!alert || alert.parentId !== parent.id) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  await db.behaviorAlert.update({
    where: { id: alertId },
    data: { status: 'ACKNOWLEDGED', acknowledgedAt: new Date() },
  })

  return NextResponse.json({ ok: true })
}
