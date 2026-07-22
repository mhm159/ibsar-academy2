import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

/**
 * GET /api/classroom/chat?session=<id>
 * Returns chat message history for a session.
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const sessionId = new URL(req.url).searchParams.get('session')
  if (!sessionId) {
    return NextResponse.json({ error: 'معرف الحصة مطلوب' }, { status: 422 })
  }

  // Verify authorization (teacher of session, or parent with booking, or admin)
  const sess = await db.session.findUnique({
    where: { id: sessionId },
    include: {
      teacher: { include: { user: { select: { id: true } } } },
      bookings: { include: { student: { include: { parent: { include: { user: { select: { id: true } } } } } } } },
    },
  })
  if (!sess) {
    return NextResponse.json({ error: 'الحصة غير موجودة' }, { status: 404 })
  }

  let authorized = false
  if (session.role === 'TEACHER' && sess.teacher.user.id === session.userId) authorized = true
  else if (session.role === 'PARENT') {
    const parent = await db.parent.findUnique({
      where: { userId: session.userId },
      include: { students: { select: { id: true } } },
    })
    if (parent) {
      const studentIds = parent.students.map((s) => s.id)
      authorized = sess.bookings.some((b) => studentIds.includes(b.studentId))
    }
  } else if (session.role === 'ADMIN') authorized = true

  if (!authorized) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const messages = await db.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
    take: 200,
  })

  return NextResponse.json({ messages })
}

/**
 * POST /api/classroom/chat
 * Body: { sessionId, text, attachmentUrl?, attachmentType? }
 *
 * Persists a chat message. The sender also broadcasts it via socket.io
 * (the client emits chat:send after persisting, or we do it here).
 *
 * Returns the saved message.
 */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const body = await req.json()
  const { sessionId, text, attachmentUrl, attachmentType } = body as {
    sessionId: string
    text: string
    attachmentUrl?: string
    attachmentType?: string
  }

  if (!sessionId || !text || !text.trim()) {
    return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 422 })
  }

  // Get user info
  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { name: true, role: true },
  })
  if (!user) {
    return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })
  }

  // Verify authorization (must be participant of the session)
  const sess = await db.session.findUnique({
    where: { id: sessionId },
    include: {
      teacher: { include: { user: { select: { id: true } } } },
      bookings: { include: { student: { include: { parent: { include: { user: { select: { id: true } } } } } } } },
    },
  })
  if (!sess) {
    return NextResponse.json({ error: 'الحصة غير موجودة' }, { status: 404 })
  }

  let authorized = false
  if (session.role === 'TEACHER' && sess.teacher.user.id === session.userId) authorized = true
  else if (session.role === 'PARENT') {
    const parent = await db.parent.findUnique({
      where: { userId: session.userId },
      include: { students: { select: { id: true } } },
    })
    if (parent) {
      const studentIds = parent.students.map((s) => s.id)
      authorized = sess.bookings.some((b) => studentIds.includes(b.studentId))
    }
  } else if (session.role === 'ADMIN') authorized = true

  if (!authorized) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  // Basic link filter (Phase 5 will add AI-based content moderation)
  const filteredText = filterExternalLinks(text)

  const message = await db.chatMessage.create({
    data: {
      sessionId,
      userId: session.userId,
      senderName: user.name ?? 'مشارك',
      senderRole: user.role,
      text: filteredText,
      attachmentUrl,
      attachmentType,
    },
  })

  return NextResponse.json({ ok: true, message }, { status: 201 })
}

/**
 * Phase 5 preview: filter external links from chat messages.
 * Replaces http/https URLs with a placeholder (kids safety).
 */
function filterExternalLinks(text: string): string {
  // Block URLs that aren't ibsar-academy.com
  return text.replace(/https?:\/\/(?!ibsar-academy\.com)[^\s]+/gi, '[رابط محظور]')
}

/* TODO(phase-5): Add AI-powered content moderation (profanity + inappropriate content filter). */
