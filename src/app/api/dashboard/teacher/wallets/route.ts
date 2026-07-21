import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { getTeacherAvailableBalance } from '@/lib/payment/escrow'
import { z } from 'zod'

const WALLETS: Record<string, { label: string; icon: string; needsHolder: boolean; currency: string }> = {
  VODAFONE_CASH: { label: 'فودافون كاش', icon: '📱', needsHolder: true, currency: 'EGP' },
  ETISALAT_CASH: { label: 'اتصالات كاش', icon: '📱', needsHolder: true, currency: 'EGP' },
  ORANGE_CASH: { label: 'أورانج كاش', icon: '📱', needsHolder: true, currency: 'EGP' },
  WE_PAY: { label: 'وي باي', icon: '📱', needsHolder: true, currency: 'EGP' },
  FAWRY: { label: 'فوري', icon: '🏪', needsHolder: true, currency: 'EGP' },
  BANK_TRANSFER: { label: 'تحويل بنكي', icon: '🏦', needsHolder: true, currency: 'EGP' },
  PAYPAL: { label: 'PayPal', icon: '🌍', needsHolder: false, currency: 'USD' },
  WISE: { label: 'Wise', icon: '🌍', needsHolder: true, currency: 'USD' },
}

/** GET /api/dashboard/teacher/wallets — list wallets + balance */
export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'TEACHER') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }
  const teacher = await db.teacher.findUnique({ where: { userId: session.userId } })
  if (!teacher) {
    return NextResponse.json({ error: 'الملف غير موجود' }, { status: 404 })
  }

  const [wallets, balance] = await Promise.all([
    db.walletAccount.findMany({
      where: { teacherId: teacher.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    }),
    getTeacherAvailableBalance(teacher.id),
  ])

  return NextResponse.json({
    balance: {
      availableEGP: balance.availableEGP,
      availableUSD: balance.availableUSD,
      pendingEGP: balance.pendingEGP,
      pendingUSD: balance.pendingUSD,
      totalEarnedEGP: balance.totalEarnedEGP,
      totalEarnedUSD: balance.totalEarnedUSD,
      totalPaidOutEGP: balance.totalPaidOutEGP,
      totalPaidOutUSD: balance.totalPaidOutUSD,
    },
    wallets: wallets.map((w) => ({
      ...w,
      meta: WALLETS[w.type],
    })),
    walletTypes: Object.entries(WALLETS).map(([type, meta]) => ({ type, ...meta })),
  })
}

const CreateWallet = z.object({
  type: z.enum(['VODAFONE_CASH', 'ETISALAT_CASH', 'ORANGE_CASH', 'WE_PAY', 'FAWRY', 'BANK_TRANSFER', 'PAYPAL', 'WISE']),
  identifier: z.string().min(4).max(120),
  label: z.string().max(80).optional(),
  holderName: z.string().max(120).optional(),
  detailsJson: z.string().optional(),
  isDefault: z.boolean().default(false),
})

/** POST /api/dashboard/teacher/wallets — add a new wallet/payout method */
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
  const parsed = CreateWallet.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'البيانات غير صحيحة', details: parsed.error.flatten() },
      { status: 422 },
    )
  }

  const meta = WALLETS[parsed.data.type]
  const wallet = await db.walletAccount.create({
    data: {
      teacherId: teacher.id,
      type: parsed.data.type,
      identifier: parsed.data.identifier,
      label: parsed.data.label,
      holderName: parsed.data.holderName,
      detailsJson: parsed.data.detailsJson,
      currency: meta.currency,
      isDefault: parsed.data.isDefault,
    },
  })

  // If set as default, unset others
  if (parsed.data.isDefault) {
    await db.walletAccount.updateMany({
      where: { teacherId: teacher.id, id: { not: wallet.id } },
      data: { isDefault: false },
    })
  }

  return NextResponse.json({ ok: true, wallet }, { status: 201 })
}

/** DELETE /api/dashboard/teacher/wallets?id=<id> */
export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'TEACHER') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }
  const teacher = await db.teacher.findUnique({ where: { userId: session.userId } })
  if (!teacher) {
    return NextResponse.json({ error: 'الملف غير موجود' }, { status: 404 })
  }

  const id = new URL(req.url).searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'معرف المحفظة مطلوب' }, { status: 422 })
  }

  const wallet = await db.walletAccount.findUnique({ where: { id } })
  if (!wallet || wallet.teacherId !== teacher.id) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  await db.walletAccount.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
