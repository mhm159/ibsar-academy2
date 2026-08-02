import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

/**
 * POST /api/classroom/log
 * Body: { sessionId, event, detail? }
 *
 * Records a session activity event (JOIN, LEAVE, FOCUS_ALERT, RECORDING, WHITEBOARD, CODE...)
 * used to build per-session reports. Role-gated but open to all classroom participants.
 */
export async function POST(req: NextRequest) {
  const sessionUser = await getSession()
  if (!sessionUser) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const allowedEvents = ['JOIN', 'LEAVE', 'FOCUS_ALERT', 'RECORDING', 'WHITEBOARD', 'CODE', 'PLATFORM', 'CHAT']

  let body: { sessionId?: string; event?: string; detail?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'صيغة غير صحيحة' }, { status: 400 })
  }

  const { sessionId, event, detail } = body
  if (!sessionId || !event) {
    return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 422 })
  }
  if (!allowedEvents.includes(event)) {
    return NextResponse.json({ error: 'حدث غير مدعوم' }, { status: 422 })
  }

  const sess = await db.session.findUnique({ where: { id: sessionId } })
  if (!sess) {
    return NextResponse.json({ error: 'الحصة غير موجودة' }, { status: 404 })
  }

  const user = await db.user.findUnique({
    where: { id: sessionUser.userId },
    select: { name: true, role: true },
  })

  const log = await db.sessionLog.create({
    data: {
      sessionId,
      userId: sessionUser.userId,
      userName: user?.name ?? null,
      userRole: user?.role ?? sessionUser.role,
      event,
      detail: detail || null,
    },
  })

  return NextResponse.json({ ok: true, log })
}

/** GET /api/classroom/log?session=<id> — recent logs for a session (role-gated, any participant) */
export async function GET(req: NextRequest) {
  const sessionUser = await getSession()
  if (!sessionUser) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get('session')
  if (!sessionId) return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 422 })

  const logs = await db.sessionLog.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
    take: 500,
  })

  return NextResponse.json({ logs })
}
