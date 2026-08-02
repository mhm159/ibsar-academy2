import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

/**
 * Admin AI-posts management.
 *
 * GET    /api/admin/posts — list all posts (with summary)
 * POST   /api/admin/posts — create { title, content, type, emoji, category, status, source }
 * PATCH  /api/admin/posts — update { id, ...fields }
 * DELETE /api/admin/posts — delete ?id=
 */

async function requireAdmin() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') return null
  return session
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

  const posts = await db.post.findMany({
    orderBy: [{ createdAt: 'desc' }],
    take: 200,
  })

  const summary = {
    total: posts.length,
    published: posts.filter((p) => p.status === 'PUBLISHED').length,
    drafts: posts.filter((p) => p.status === 'DRAFT').length,
    stories: posts.filter((p) => p.type === 'STORY').length,
    cards: posts.filter((p) => p.type === 'CARD').length,
  }

  return NextResponse.json({ posts, summary })
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

  const body = await req.json()
  const { title, content, type, emoji, category, status, source } = body as Record<string, string | undefined>

  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: 'العنوان والمحتوى مطلوبان' }, { status: 422 })
  }

  const postType = type === 'STORY' ? 'STORY' : type === 'TIPS' ? 'TIPS' : 'CARD'
  const postStatus = status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT'

  const post = await db.post.create({
    data: {
      title: String(title).trim(),
      content: String(content).trim(),
      type: postType,
      emoji: String(emoji || '✨'),
      category: category || null,
      status: postStatus,
      source: source === 'AI_SUGGESTED' ? 'AI_SUGGESTED' : 'MANUAL',
      publishedAt: postStatus === 'PUBLISHED' ? new Date() : null,
    },
  })

  return NextResponse.json({ ok: true, post }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

  const body = await req.json()
  const { id, title, content, type, emoji, category, status } = body as Record<string, string | undefined>

  if (!id) return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 422 })
  const existing = await db.post.findUnique({ where: { id: String(id) } })
  if (!existing) return NextResponse.json({ error: 'المنشور غير موجود' }, { status: 404 })

  const nextStatus = status === 'PUBLISHED' ? 'PUBLISHED' : status === 'DRAFT' ? 'DRAFT' : existing.status
  const wasPublished = existing.status === 'PUBLISHED'
  const isNowPublished = nextStatus === 'PUBLISHED'

  const post = await db.post.update({
    where: { id: String(id) },
    data: {
      title: title !== undefined ? String(title).trim() : undefined,
      content: content !== undefined ? String(content).trim() : undefined,
      type: type === 'STORY' || type === 'TIPS' || type === 'CARD' ? type : undefined,
      emoji: emoji !== undefined ? String(emoji) : undefined,
      category: category !== undefined ? (category || null) : undefined,
      status: nextStatus,
      publishedAt: isNowPublished && !wasPublished ? new Date() : undefined,
    },
  })

  return NextResponse.json({ ok: true, post })
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 422 })

  const existing = await db.post.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'المنشور غير موجود' }, { status: 404 })

  await db.post.delete({ where: { id } })
  return NextResponse.json({ ok: true, message: 'تم حذف المنشور' })
}
