import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { rowsToXlsx } from '@/lib/export-xlsx'

/**
 * GET /api/admin/export?type=students|sessions|bookings|transactions|reviews|payouts|reports|users|supervisors
 * Downloads an .xlsx workbook of the requested dataset (admin only).
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const type = (req.nextUrl.searchParams.get('type') ?? '').toLowerCase()
  const date = new Date().toISOString().slice(0, 10)

  const build = async (): Promise<{ rows: Record<string, unknown>[]; name: string; file: string }> => {
    switch (type) {
      case 'students': {
        const rows = await db.student.findMany({
          include: { parent: { include: { user: { select: { name: true, phone: true } } } } },
          orderBy: { createdAt: 'desc' },
        })
        return {
          name: 'الطلاب',
          file: `students-${date}.xlsx`,
          rows: rows.map((s) => ({
            'المعرف': s.id,
            'اسم الطالب': s.name,
            'الجنس': s.gender ?? '',
            'المرحلة': s.grade ?? '',
            'تاريخ الميلاد': s.birthDate?.toISOString() ?? '',
            'المستويات': s.levelsJson,
            'نقاط': s.pointsBalance,
            'ولي الأمر': s.parent?.user.name ?? '',
            'هاتف ولي الأمر': s.parent?.user.phone ?? '',
            'تاريخ التسجيل': s.createdAt.toISOString(),
          })),
        }
      }
      case 'sessions': {
        const rows = await db.session.findMany({
          include: {
            teacher: { include: { user: { select: { name: true } } } },
            bookings: { select: { id: true } },
          },
          orderBy: { startTime: 'desc' },
        })
        return {
          name: 'الحصص',
          file: `sessions-${date}.xlsx`,
          rows: rows.map((s) => ({
            'المعرف': s.id,
            'عنوان الحصة': s.title,
            'المسار': s.track,
            'المعلم': s.teacher?.user.name ?? '',
            'البداية': s.startTime.toISOString(),
            'الحالة': s.status,
            'المدة (دقيقة)': s.durationMins ?? '',
            'تجريبية': s.isTrial,
            'المحجوزات': s.bookings.length,
          })),
        }
      }
      case 'bookings': {
        const rows = await db.booking.findMany({
          include: {
            session: { select: { title: true } },
            student: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
        })
        return {
          name: 'الحجوزات',
          file: `bookings-${date}.xlsx`,
          rows: rows.map((b) => ({
            'المعرف': b.id,
            'الحصة': b.session?.title ?? '',
            'الطالب': b.student?.name ?? '',
            'الحالة': b.status,
            'السعر ج.م': b.priceEGP ?? '',
            'السعر دولار': b.priceUSD ?? '',
            'تاريخ الحجز': b.createdAt.toISOString(),
          })),
        }
      }
      case 'transactions': {
        const rows = await db.transaction.findMany({
          include: { parent: { include: { user: { select: { name: true } } } } },
          orderBy: { createdAt: 'desc' },
        })
        return {
          name: 'المعاملات',
          file: `transactions-${date}.xlsx`,
          rows: rows.map((t) => ({
            'المعرف': t.id,
            'ولي الأمر': t.parent?.user.name ?? '',
            'المبلغ ج.م': t.amountEGP ?? '',
            'المبلغ دولار': t.amountUSD ?? '',
            'الحالة': t.status,
            'الوسيط': t.provider,
            'الوصف': t.description ?? '',
            'التاريخ': t.createdAt.toISOString(),
          })),
        }
      }
      case 'reviews': {
        const rows = await db.review.findMany({ orderBy: { createdAt: 'desc' } })
        return {
          name: 'التقييمات',
          file: `reviews-${date}.xlsx`,
          rows: rows.map((r) => ({
            'المعرف': r.id,
            'الحصة': r.sessionId,
            'المقيَّم (المعرف)': r.reviewedId,
            'دور المقيَّم': r.reviewedRole,
            'المقيّم': r.reviewerName,
            'التقييم': r.rating,
            'التعليق': r.comment ?? '',
            'الوسوم': r.tags,
            'معتمد': r.isApproved,
            'مُبلّغ عنه': r.isFlagged,
            'التاريخ': r.createdAt.toISOString(),
          })),
        }
      }
      case 'payouts': {
        const rows = await db.payout.findMany({
          include: { teacher: { include: { user: { select: { name: true } } } } },
          orderBy: { createdAt: 'desc' },
        })
        return {
          name: 'طلبات السحب',
          file: `payouts-${date}.xlsx`,
          rows: rows.map((p) => ({
            'المعرف': p.id,
            'المعلم': p.teacher?.user.name ?? '',
            'المبلغ ج.م': p.amountEGP ?? '',
            'الحالة': p.status,
            'التاريخ': p.createdAt.toISOString(),
          })),
        }
      }
      case 'reports': {
        const rows = await db.supervisorReport.findMany({
          include: {
            session: { select: { title: true } },
            supervisor: { include: { user: { select: { name: true } } } },
          },
          orderBy: { createdAt: 'desc' },
        })
        return {
          name: 'تقارير المشرفين',
          file: `supervisor-reports-${date}.xlsx`,
          rows: rows.map((r) => ({
            'المعرف': r.id,
            'الحصة': r.session?.title ?? '',
            'المشرف': r.supervisor?.user.name ?? '',
            'التقييم': r.rating,
            'عدد الرسائل': r.chatCount,
            'عدد الطلاب': r.studentCount,
            'متوسط التركيز': r.avgFocusScore,
            'المدة (دقيقة)': r.durationMins,
            'الأتعاب ج.م': r.feeEGP ?? '',
            'التاريخ': r.createdAt.toISOString(),
          })),
        }
      }
      case 'users': {
        const rows = await db.user.findMany({ orderBy: { createdAt: 'desc' } })
        return {
          name: 'المستخدمون',
          file: `users-${date}.xlsx`,
          rows: rows.map((u) => ({
            'المعرف': u.id,
            'الاسم': u.name ?? '',
            'الهاتف': u.phone,
            'الدور': u.role,
            'نشط': u.isActive,
            'تاريخ التسجيل': u.createdAt.toISOString(),
          })),
        }
      }
      case 'supervisors': {
        const rows = await db.supervisor.findMany({
          include: { user: { select: { name: true, phone: true } } },
          orderBy: { createdAt: 'desc' },
        })
        return {
          name: 'المشرفون',
          file: `supervisors-${date}.xlsx`,
          rows: rows.map((s) => ({
            'المعرف': s.id,
            'الاسم': s.user.name ?? '',
            'الهاتف': s.user.phone,
            'المسمى': s.title ?? '',
            'الكراد': s.creditBalance,
            'تاريخ التسجيل': s.createdAt.toISOString(),
          })),
        }
      }
      default:
        return {
          name: 'unknown',
          file: `export-${date}.xlsx`,
          rows: [{ 'خطأ': 'نوع تصدير غير معروف. استخدم type=students|sessions|bookings|transactions|reviews|payouts|reports|users|supervisors' }],
        }
    }
  }

  const { rows, name, file } = await build()
  const buffer = rowsToXlsx(name, rows)

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${file}"`,
    },
  })
}
