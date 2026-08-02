import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

/** GET /api/dashboard/admin/approvals — list pending teachers */
export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const pending = await db.teacher.findMany({
    where: { status: 'PENDING' },
    include: {
      user: {
        select: { id: true, name: true, nameAr: true, phone: true, email: true, country: true, city: true, createdAt: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  // Also include recently approved/rejected for context
  const recent = await db.teacher.findMany({
    where: { status: { in: ['APPROVED', 'REJECTED'] } },
    include: {
      user: { select: { id: true, name: true, phone: true, createdAt: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 10,
  })

  return NextResponse.json({
    pending: pending.map((t) => ({
      id: t.id,
      userId: t.user.id,
      name: t.user.name,
      phone: t.user.phone,
      email: t.user.email,
      country: t.user.country,
      city: t.user.city,
      bio: t.bio,
      tracks: t.tracks.split(',').filter(Boolean),
      experienceYears: t.experienceYears,
      hourlyRateEGP: t.hourlyRateEGP,
      createdAt: t.user.createdAt,
    })),
    recent: recent.map((t) => ({
      id: t.id,
      name: t.user.name,
      phone: t.user.phone,
      status: t.status,
      tracks: t.tracks.split(',').filter(Boolean),
      updatedAt: t.updatedAt,
    })),
  })
}

/** POST /api/dashboard/admin/approvals — approve or reject a teacher */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const body = await req.json()
  const { teacherId, action } = body as { teacherId: string; action: 'APPROVE' | 'REJECT' }
  if (!teacherId || !action) {
    return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 422 })
  }

  const teacher = await db.teacher.findUnique({
    where: { id: teacherId },
    include: { user: true },
  })
  if (!teacher) {
    return NextResponse.json({ error: 'المعلم غير موجود' }, { status: 404 })
  }
  if (teacher.status !== 'PENDING') {
    return NextResponse.json({ error: 'تمت معالجة هذا الطلب بالفعل' }, { status: 400 })
  }

  const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED'
  await db.teacher.update({
    where: { id: teacherId },
    data: { status: newStatus },
  })

  // Notify the teacher
  await db.notification.create({
    data: {
      userId: teacher.userId,
      type: action === 'APPROVE' ? 'TEACHER_APPROVED' : 'TEACHER_REJECTED',
      title: action === 'APPROVE' ? 'تم اعتماد حسابك! 🎉' : 'تم رفض طلب الانضمام',
      body:
        action === 'APPROVE'
          ? 'مرحباً بك في منصة منهل! تم اعتماد حسابك كمعلم. يمكنك الآن البدء في إنشاء كورساتك وجدولة الحصص.'
          : 'نأسف، لم يتم اعتماد طلب انضمامك في هذا الوقت. للمزيد من التفاصيل، تواصل مع الدعم.',
      link: action === 'APPROVE' ? '/teacher' : '/',
    },
  })

  return NextResponse.json({
    ok: true,
    message:
      action === 'APPROVE'
        ? 'تم اعتماد المعلم بنجاح وإشعاره'
        : 'تم رفض الطلب وإشعار المعلم',
    newStatus,
  })
}
