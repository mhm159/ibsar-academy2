import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { getTeacherAvailableBalance } from '@/lib/payment/escrow'
import { z } from 'zod'

/** GET /api/dashboard/teacher/payouts — list teacher's payouts + balance */
export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'TEACHER') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }
  const teacher = await db.teacher.findUnique({ where: { userId: session.userId } })
  if (!teacher) {
    return NextResponse.json({ error: 'الملف غير موجود' }, { status: 404 })
  }

  const [payouts, balance, wallets] = await Promise.all([
    db.payout.findMany({
      where: { teacherId: teacher.id },
      include: {
        walletAccount: { select: { type: true, identifier: true, label: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
    getTeacherAvailableBalance(teacher.id),
    db.walletAccount.findMany({
      where: { teacherId: teacher.id, isActive: true },
      orderBy: { isDefault: 'desc' },
    }),
  ])

  return NextResponse.json({
    balance,
    wallets,
    payouts: payouts.map((p) => ({
      id: p.id,
      amountEGP: p.amountEGP,
      amountUSD: p.amountUSD,
      currency: p.currency,
      status: p.status,
      walletAccount: p.walletAccount
        ? { type: p.walletAccount.type, identifier: p.walletAccount.identifier, label: p.walletAccount.label }
        : null,
      providerRef: p.providerRef,
      notes: p.notes,
      createdAt: p.createdAt,
      processedAt: p.processedAt,
    })),
  })
}

const RequestPayout = z.object({
  walletAccountId: z.string().min(1),
  amountEGP: z.number().int().positive().optional(),
  amountUSD: z.number().int().positive().optional(),
  // if false: withdraw all available
  withdrawAll: z.boolean().default(true),
})

/** POST /api/dashboard/teacher/payouts — request a payout */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'TEACHER') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }
  const teacher = await db.teacher.findUnique({ where: { userId: session.userId } })
  if (!teacher) {
    return NextResponse.json({ error: 'الملف غير موجود' }, { status: 404 })
  }

  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: 'صيغة غير صحيحة' }, { status: 400 })
  }
  const parsed = RequestPayout.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'بيانات غير صحيحة' }, { status: 422 })
  }

  // Verify wallet belongs to teacher
  const wallet = await db.walletAccount.findUnique({
    where: { id: parsed.data.walletAccountId },
  })
  if (!wallet || wallet.teacherId !== teacher.id) {
    return NextResponse.json({ error: 'المحفظة غير موجودة' }, { status: 404 })
  }

  // Get available balance
  const balance = await getTeacherAvailableBalance(teacher.id)
  let amountEGP = parsed.data.amountEGP ?? 0
  let amountUSD = parsed.data.amountUSD ?? 0

  if (parsed.data.withdrawAll) {
    amountEGP = balance.availableEGP
    amountUSD = balance.availableUSD
  }

  if (amountEGP <= 0 && amountUSD <= 0) {
    return NextResponse.json({ error: 'لا يوجد رصيد متاح للسحب' }, { status: 400 })
  }

  if (amountEGP > balance.availableEGP || amountUSD > balance.availableUSD) {
    return NextResponse.json({ error: 'المبلغ المطلوب يتجاوز الرصيد المتاح' }, { status: 400 })
  }

  const payout = await db.payout.create({
    data: {
      teacherId: teacher.id,
      walletAccountId: wallet.id,
      amountEGP,
      amountUSD,
      currency: wallet.currency,
      status: 'PENDING',
    },
  })

  // Notify admin
  const admin = await db.user.findFirst({ where: { role: 'ADMIN' } })
  if (admin) {
    await db.notification.create({
      data: {
        userId: admin.id,
        type: 'PAYOUT_REQUESTED',
        title: 'طلب سحب جديد 💰',
        body: `طلب المعلم ${session.userId} سحب ${amountEGP / 100} ج.م عبر ${wallet.type}`,
        link: '/admin/payouts',
      },
    })
  }

  return NextResponse.json({ ok: true, payout }, { status: 201 })
}
