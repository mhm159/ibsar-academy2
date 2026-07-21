import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { REFUND_GUARANTEE_SESSIONS } from '@/lib/payment/config'
import { z } from 'zod'

/** GET /api/dashboard/parent/refunds — list parent's refund requests */
export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'PARENT') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }
  const parent = await db.parent.findUnique({ where: { userId: session.userId } })
  if (!parent) {
    return NextResponse.json({ error: 'الملف غير موجود' }, { status: 404 })
  }

  const refunds = await db.refundRequest.findMany({
    where: { parentId: parent.id },
    include: {
      transaction: {
        select: {
          amountEGP: true,
          amountUSD: true,
          currency: true,
          description: true,
          createdAt: true,
          booking: {
            include: {
              session: { select: { title: true } },
              student: { select: { name: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({
    refunds: refunds.map((r) => ({
      id: r.id,
      reason: r.reason,
      details: r.details,
      status: r.status,
      amountEGP: r.amountEGP,
      amountUSD: r.amountUSD,
      adminNotes: r.adminNotes,
      createdAt: r.createdAt,
      processedAt: r.processedAt,
      transaction: {
        description: r.transaction.description,
        amountEGP: r.transaction.amountEGP,
        currency: r.transaction.currency,
        sessionTitle: r.transaction.booking?.session.title,
        studentName: r.transaction.booking?.student.name,
      },
    })),
  })
}

const Body = z.object({
  transactionId: z.string().min(1),
  reason: z.enum(['CHILD_SICK', 'SCHEDULING_CONFLICT', 'TEACHER_ISSUE', 'NOT_SATISFIED', 'OTHER']),
  details: z.string().max(500).optional(),
})

/** POST /api/dashboard/parent/refunds — request a refund */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'PARENT') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }
  const parent = await db.parent.findUnique({ where: { userId: session.userId } })
  if (!parent) {
    return NextResponse.json({ error: 'الملف غير موجود' }, { status: 404 })
  }

  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: 'صيغة غير صحيحة' }, { status: 400 })
  }
  const parsed = Body.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'بيانات غير صحيحة' }, { status: 422 })
  }

  const tx = await db.transaction.findUnique({
    where: { id: parsed.data.transactionId },
    include: { refundRequest: true, booking: { include: { session: true } } },
  })
  if (!tx) {
    return NextResponse.json({ error: 'المعاملة غير موجودة' }, { status: 404 })
  }
  if (tx.parentId !== parent.id) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }
  if (tx.status !== 'PAID') {
    return NextResponse.json({ error: 'لا يمكن استرجاع معاملة غير مدفوعة' }, { status: 400 })
  }
  if (tx.refundRequest) {
    return NextResponse.json({ error: 'تم تقديم طلب استرجاع لهذه المعاملة' }, { status: 400 })
  }

  const refund = await db.refundRequest.create({
    data: {
      transactionId: tx.id,
      parentId: parent.id,
      reason: parsed.data.reason,
      details: parsed.data.details,
      amountEGP: tx.amountEGP,
      amountUSD: tx.amountUSD,
      status: 'PENDING',
    },
  })

  // Notify admin
  const admin = await db.user.findFirst({ where: { role: 'ADMIN' } })
  if (admin) {
    await db.notification.create({
      data: {
        userId: admin.id,
        type: 'REFUND_REQUESTED',
        title: 'طلب استرجاع جديد',
        body: `طلب استرجاع ${tx.amountEGP / 100} ج.م - السبب: ${parsed.data.reason}`,
        link: '/admin/escrow',
      },
    })
  }

  return NextResponse.json({ ok: true, refund }, { status: 201 })
}

const REASON_LABELS: Record<string, string> = {
  CHILD_SICK: 'مرض الطفل',
  SCHEDULING_CONFLICT: 'تعارض مواعيد',
  TEACHER_ISSUE: 'مشكلة مع المعلم',
  NOT_SATISFIED: 'عدم رضا عن الحصة',
  OTHER: 'سبب آخر',
}
