import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { db } from '@/lib/db'
import { getSession, normalizePhone, isValidPhone } from '@/lib/auth'
import { getSupervisorBalance } from '@/lib/supervisor-finance'

/**
 * Admin supervisor management.
 *
 * GET    /api/admin/supervisors — list supervisors with user info + finance
 * POST   /api/admin/supervisors — create { name, phone, password, title? }
 * PATCH  /api/admin/supervisors — update { id, title?, isActive?, creditDelta? }
 * DELETE /api/admin/supervisors — delete ?id=
 */

async function requireAdmin() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') return null
  return session
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

  const supervisors = await db.supervisor.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, name: true, phone: true, email: true, isActive: true, createdAt: true } },
      reports: { select: { id: true } },
    },
  })

  const withBalances = await Promise.all(
    supervisors.map(async (s) => {
      const balance = await getSupervisorBalance(s.id)
      return { ...s, balance }
    })
  )

  return NextResponse.json({
    supervisors: withBalances.map((s) => ({
      id: s.id,
      userId: s.userId,
      name: s.user.name,
      phone: s.user.phone,
      email: s.user.email,
      isActive: s.user.isActive,
      title: s.title,
      reportsCount: s.reports.length,
      credits: s.creditBalance,
      earnedEGP: s.balance.earned,
      paidEGP: s.balance.paid,
      balanceEGP: s.balance.balanceEGP,
      createdAt: s.createdAt.toISOString(),
    })),
  })
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

  const body = await req.json()
  const { name, phone, password, title } = body as Record<string, unknown>

  if (!name || !String(name).trim()) {
    return NextResponse.json({ error: 'الاسم مطلوب' }, { status: 422 })
  }
  if (!phone || !isValidPhone(String(phone))) {
    return NextResponse.json({ error: 'رقم هاتف غير صالح' }, { status: 422 })
  }
  if (!password || String(password).length < 6) {
    return NextResponse.json({ error: 'كلمة المرور يجب أن تكون ٦ أحرف على الأقل' }, { status: 422 })
  }

  const normalized = normalizePhone(String(phone))
  const existing = await db.user.findUnique({ where: { phone: normalized } })
  if (existing) {
    return NextResponse.json({ error: 'هذا الرقم مسجّل بالفعل' }, { status: 409 })
  }

  const user = await db.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        phone: normalized,
        role: 'SUPERVISOR',
        name: String(name).trim(),
        passwordHash: hashPassword(String(password)),
        phoneVerified: new Date(),
        country: 'EG',
        preferredLang: 'ar',
      },
    })
    await tx.supervisor.create({
      data: { userId: newUser.id, title: title ? String(title) : 'مشرف تربوي' },
    })
    return newUser
  })

  return NextResponse.json({ ok: true, user }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

  const body = await req.json()
  const { id, title, isActive, creditDelta, bonusEGP, bonusNote } = body as Record<string, unknown>

  if (!id) return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 422 })

  const sup = await db.supervisor.findUnique({ where: { id: String(id) } })
  if (!sup) return NextResponse.json({ error: 'المشرف غير موجود' }, { status: 404 })

  if (typeof creditDelta === 'number') {
    if (!Number.isInteger(creditDelta) || creditDelta === 0) {
      return NextResponse.json({ error: 'قيمة الكراد غير صالحة' }, { status: 422 })
    }
    if (sup.creditBalance + creditDelta < 0) {
      return NextResponse.json({ error: 'لا يمكن أن يصبح الرصيد سالبًا' }, { status: 422 })
    }
    await db.supervisor.update({
      where: { id: sup.id },
      data: { creditBalance: { increment: creditDelta } },
    })
  }

  if (typeof bonusEGP === 'number' && bonusEGP !== 0) {
    if (!Number.isInteger(bonusEGP)) {
      return NextResponse.json({ error: 'قيمة المكافأة غير صالحة' }, { status: 422 })
    }
    await db.supervisorEarning.create({
      data: {
        supervisorId: sup.id,
        amountEGP: bonusEGP,
        type: 'BONUS',
        note: bonusNote ? String(bonusNote) : null,
      },
    })
  }

  await db.$transaction([
    db.supervisor.update({
      where: { id: sup.id },
      data: { title: title !== undefined ? (title ? String(title) : null) : undefined },
    }),
    ...(typeof isActive === 'boolean'
      ? [db.user.update({ where: { id: sup.userId }, data: { isActive } })]
      : []),
  ])

  return NextResponse.json({ ok: true, message: 'تم التحديث' })
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 422 })

  const sup = await db.supervisor.findUnique({ where: { id } })
  if (!sup) return NextResponse.json({ error: 'المشرف غير موجود' }, { status: 404 })

  await db.user.delete({ where: { id: sup.userId } })
  return NextResponse.json({ ok: true, message: 'تم حذف المشرف' })
}

/** Hash a password using scrypt (mirror of register route) */
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return `scrypt$${salt}$${hash}`
}
