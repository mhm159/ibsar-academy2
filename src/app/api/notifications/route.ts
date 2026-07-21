import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

/** GET /api/notifications — current user's notifications (newest first) */
export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ notifications: [] }, { status: 200 })
  }
  const notifications = await db.notification.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })
  return NextResponse.json({ notifications })
}

/* TODO(phase-4): Add POST /api/notifications/mark-read + SSE push for real-time. */
