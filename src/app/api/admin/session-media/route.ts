import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

/**
 * Admin session-media (processed session images) management.
 *
 * GET    /api/admin/session-media?session=<id> — list media (optionally by session)
 * POST   /api/admin/session-media — create { sessionId, url, caption, type, order, isPublished }
 * PATCH  /api/admin/session-media — update { id, caption, order, isPublished, type }
 * DELETE /api/admin/session-media — delete ?id=
 */

async function requireAdmin() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') return null
  return session
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get('session')

  const media = await db.sessionMedia.findMany({
    where: sessionId ? { sessionId } : undefined,
    orderBy: [{ createdAt: 'desc' }],
    include: { session: { select: { id: true, title: true, track: true, startTime: true } } },
    take: 200,
  })

  return NextResponse.json({ media })
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

  const body = await req.json()
  const { sessionId, url, caption, type, order, isPublished } = body as Record<string, unknown>

  if (!sessionId || !url || !String(url).trim()) {
    return NextResponse.json({ error: 'الحصة ورابط الصورة مطلوبان' }, { status: 422 })
  }

  const session = await db.session.findUnique({ where: { id: String(sessionId) } })
  if (!session) return NextResponse.json({ error: 'الحصة غير موجودة' }, { status: 404 })

  const media = await db.sessionMedia.create({
    data: {
      sessionId: String(sessionId),
      url: String(url).trim(),
      caption: caption != null ? String(caption) : null,
      type: type === 'VIDEO' ? 'VIDEO' : 'IMAGE',
      order: typeof order === 'number' ? order : 0,
      isPublished: isPublished === false ? false : true,
    },
  })

  return NextResponse.json({ ok: true, media }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

  const body = await req.json()
  const { id, caption, type, order, isPublished } = body as Record<string, unknown>

  if (!id) return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 422 })
  const existing = await db.sessionMedia.findUnique({ where: { id: String(id) } })
  if (!existing) return NextResponse.json({ error: 'الصورة غير موجودة' }, { status: 404 })

  const media = await db.sessionMedia.update({
    where: { id: String(id) },
    data: {
      caption: caption !== undefined ? (caption ? String(caption) : null) : undefined,
      type: type === 'VIDEO' ? 'VIDEO' : type === 'IMAGE' ? 'IMAGE' : undefined,
      order: typeof order === 'number' ? order : undefined,
      isPublished: typeof isPublished === 'boolean' ? isPublished : undefined,
    },
  })

  return NextResponse.json({ ok: true, media })
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 422 })

  const existing = await db.sessionMedia.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'الصورة غير موجودة' }, { status: 404 })

  await db.sessionMedia.delete({ where: { id } })
  return NextResponse.json({ ok: true, message: 'تم الحذف' })
}
