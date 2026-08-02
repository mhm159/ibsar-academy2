import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { TRACKS } from '@/lib/constants'

/**
 * Admin track management.
 *
 * GET    /api/admin/tracks — all tracks (active + archived)
 * POST   /api/admin/tracks — create { id, name, nameAr, ... }
 * PATCH  /api/admin/tracks — update { id, ...fields }
 * DELETE /api/admin/tracks — delete or archive ?id=&archive=true
 */

async function requireAdmin() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') return null
  return session
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

  const rows = await db.track.findMany({ orderBy: [{ orderIndex: 'asc' }, { createdAt: 'asc' }] })
  const fallback = rows.length === 0 ? TRACKS : []

  return NextResponse.json({
    tracks: [
      ...fallback.map((t, i) => ({
        id: t.id,
        name: t.name,
        nameAr: t.name,
        nameEn: t.nameEn,
        icon: t.icon,
        colorVar: t.colorVar,
        color: t.color,
        description: t.description,
        descriptionAr: t.description,
        ageRange: t.ageRange,
        emoji: t.emoji,
        isActive: true,
        orderIndex: i,
      })),
      ...rows.map((t) => ({
        id: t.id,
        name: t.name,
        nameAr: t.nameAr,
        nameEn: t.name,
        icon: t.icon,
        colorVar: t.colorVar,
        color: t.color,
        description: t.description,
        descriptionAr: t.descriptionAr,
        ageRange: t.ageRange,
        emoji: t.emoji,
        isActive: t.isActive,
        orderIndex: t.orderIndex,
      })),
    ],
  })
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

  const body = await req.json()
  const { id, nameAr, nameEn, descriptionAr, icon, colorVar, color, emoji, ageRange, orderIndex } = body as Record<string, string | number>

  const trackId = String(id || '').toUpperCase().trim()
  if (!trackId || !nameAr || !nameEn) {
    return NextResponse.json({ error: 'بيانات ناقصة (id، الاسم العربي، الاسم الإنجليزي)' }, { status: 422 })
  }
  if (!/^[A-Z_]+$/.test(trackId)) {
    return NextResponse.json({ error: 'المعرف يجب أن يكون أحرفاً إنجليزية كبيرة وشرطة سفلية (مثال: AI)' }, { status: 422 })
  }

  const exists = await db.track.findUnique({ where: { id: trackId } })
  if (exists) {
    return NextResponse.json({ error: 'يوجد مسار بنفس المعرف' }, { status: 409 })
  }

  const track = await db.track.create({
    data: {
      id: trackId,
      name: String(nameEn),
      nameAr: String(nameAr),
      icon: String(icon || 'Code2'),
      colorVar: String(colorVar || 'kids-teal'),
      color: String(color || 'var(--azure)'),
      description: String(descriptionAr || ''),
      descriptionAr: String(descriptionAr || ''),
      ageRange: String(ageRange || '7-16'),
      emoji: String(emoji || '💡'),
      isActive: true,
      orderIndex: Number(orderIndex ?? 0),
    },
  })

  return NextResponse.json({ ok: true, track }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

  const body = await req.json()
  const { id, nameAr, nameEn, descriptionAr, icon, colorVar, color, emoji, ageRange, orderIndex, isActive } = body as Record<string, string | number | boolean>

  if (!id) return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 422 })

  const existing = await db.track.findUnique({ where: { id: String(id) } })
  if (!existing) {
    return NextResponse.json({ error: 'المسار غير موجود' }, { status: 404 })
  }

  const track = await db.track.update({
    where: { id: String(id) },
    data: {
      name: nameEn !== undefined ? String(nameEn) : undefined,
      nameAr: nameAr !== undefined ? String(nameAr) : undefined,
      icon: icon !== undefined ? String(icon) : undefined,
      colorVar: colorVar !== undefined ? String(colorVar) : undefined,
      color: color !== undefined ? String(color) : undefined,
      description: descriptionAr !== undefined ? String(descriptionAr) : undefined,
      descriptionAr: descriptionAr !== undefined ? String(descriptionAr) : undefined,
      ageRange: ageRange !== undefined ? String(ageRange) : undefined,
      emoji: emoji !== undefined ? String(emoji) : undefined,
      orderIndex: orderIndex !== undefined ? Number(orderIndex) : undefined,
      isActive: isActive !== undefined ? Boolean(isActive) : undefined,
    },
  })

  return NextResponse.json({ ok: true, track })
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const archiveOnly = searchParams.get('archive') === 'true'

  if (!id) return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 422 })
  const existing = await db.track.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'المسار غير موجود' }, { status: 404 })

  if (archiveOnly) {
    await db.track.update({ where: { id }, data: { isActive: false } })
    return NextResponse.json({ ok: true, message: 'تمت أرشفة المسار' })
  }

  // Only hard-delete tracks that aren't referenced anywhere
  const [courses, teachers, sessions] = await Promise.all([
    db.course.count({ where: { track: id } }),
    db.teacher.count({ where: { tracks: { contains: id } } }),
    db.session.count({ where: { track: id } }),
  ])
  if (courses > 0 || teachers > 0 || sessions > 0) {
    await db.track.update({ where: { id }, data: { isActive: false } })
    return NextResponse.json({ ok: true, message: 'المسار مستخدم في بيانات أخرى — تمت أرشفته بدلاً من الحذف' })
  }

  await db.track.delete({ where: { id } })
  return NextResponse.json({ ok: true, message: 'تم حذف المسار' })
}
