import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

/**
 * Admin site-slider management.
 *
 * GET    /api/admin/slider — list all banners
 * POST   /api/admin/slider — create { title, subtitle, imageUrl, linkUrl, emoji, badge, order, isActive }
 * PATCH  /api/admin/slider — update { id, ...fields }
 * DELETE /api/admin/slider — delete ?id=
 */

async function requireAdmin() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') return null
  return session
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

  const banners = await db.siteBanner.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  })

  return NextResponse.json({ banners })
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

  const body = await req.json()
  const { title, subtitle, imageUrl, linkUrl, emoji, badge, order, isActive } = body as Record<string, unknown>

  if (!title || !String(title).trim()) {
    return NextResponse.json({ error: 'عنوان الشريحة مطلوب' }, { status: 422 })
  }

  const banner = await db.siteBanner.create({
    data: {
      title: String(title).trim(),
      subtitle: subtitle != null ? String(subtitle) : null,
      imageUrl: imageUrl != null ? String(imageUrl) : null,
      linkUrl: linkUrl != null ? String(linkUrl) : null,
      emoji: emoji != null ? String(emoji) : '🏆',
      badge: badge != null ? String(badge) : null,
      order: typeof order === 'number' ? order : 0,
      isActive: isActive === false ? false : true,
    },
  })

  return NextResponse.json({ ok: true, banner }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

  const body = await req.json()
  const { id, title, subtitle, imageUrl, linkUrl, emoji, badge, order, isActive } = body as Record<string, unknown>

  if (!id) return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 422 })
  const existing = await db.siteBanner.findUnique({ where: { id: String(id) } })
  if (!existing) return NextResponse.json({ error: 'الشريحة غير موجودة' }, { status: 404 })

  const banner = await db.siteBanner.update({
    where: { id: String(id) },
    data: {
      title: title != null ? String(title).trim() : undefined,
      subtitle: subtitle !== undefined ? (subtitle ? String(subtitle) : null) : undefined,
      imageUrl: imageUrl !== undefined ? (imageUrl ? String(imageUrl) : null) : undefined,
      linkUrl: linkUrl !== undefined ? (linkUrl ? String(linkUrl) : null) : undefined,
      emoji: emoji != null ? String(emoji) : undefined,
      badge: badge !== undefined ? (badge ? String(badge) : null) : undefined,
      order: typeof order === 'number' ? order : undefined,
      isActive: typeof isActive === 'boolean' ? isActive : undefined,
    },
  })

  return NextResponse.json({ ok: true, banner })
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 422 })

  const existing = await db.siteBanner.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'الشريحة غير موجودة' }, { status: 404 })

  await db.siteBanner.delete({ where: { id } })
  return NextResponse.json({ ok: true, message: 'تم حذف الشريحة' })
}
