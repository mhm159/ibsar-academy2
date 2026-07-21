import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

/** GET /api/dashboard/admin/users?q=&role= */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim()
  const roleFilter = searchParams.get('role')

  const where = {
    ...(roleFilter ? { role: roleFilter } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q } },
            { phone: { contains: q } },
            { email: { contains: q } },
          ],
        }
      : {}),
  }

  const users = await db.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true,
      name: true,
      nameAr: true,
      email: true,
      phone: true,
      role: true,
      country: true,
      city: true,
      isActive: true,
      emailVerified: true,
      phoneVerified: true,
      createdAt: true,
    },
  })

  return NextResponse.json({ users })
}

/** PATCH /api/dashboard/admin/users — toggle active status or change role */
export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }
  const body = await req.json()
  const { id, isActive, role } = body
  if (!id) {
    return NextResponse.json({ error: 'معرف المستخدم مطلوب' }, { status: 422 })
  }
  if (id === session.userId) {
    return NextResponse.json({ error: 'لا يمكنك تعديل حسابك الحالي' }, { status: 400 })
  }

  const updated = await db.user.update({
    where: { id },
    data: {
      ...(isActive !== undefined && { isActive }),
      ...(role && { role }),
    },
    select: { id: true, name: true, role: true, isActive: true },
  })

  return NextResponse.json({ ok: true, user: updated })
}
