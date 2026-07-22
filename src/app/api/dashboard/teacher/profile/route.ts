import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

/** GET /api/dashboard/teacher/profile */
export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'TEACHER') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }
  const teacher = await db.teacher.findUnique({
    where: { userId: session.userId },
    include: { user: { select: { name: true, nameAr: true, phone: true, email: true, country: true, city: true } } },
  })
  if (!teacher) {
    return NextResponse.json({ error: 'الملف غير موجود' }, { status: 404 })
  }

  const availability = await db.availability.findMany({
    where: { teacherId: teacher.id },
    orderBy: { dayOfWeek: 'asc' },
  })

  return NextResponse.json({
    teacher: {
      id: teacher.id,
      name: teacher.user.name,
      nameAr: teacher.user.nameAr,
      phone: teacher.user.phone,
      email: teacher.user.email,
      country: teacher.user.country,
      city: teacher.user.city,
      bio: teacher.bio,
      tracks: teacher.tracks.split(',').filter(Boolean),
      experienceYears: teacher.experienceYears,
      hourlyRateEGP: teacher.hourlyRateEGP,
      hourlyRateUSD: teacher.hourlyRateUSD,
      rating: teacher.rating,
      reviewsCount: teacher.reviewsCount,
      status: teacher.status,
      isFeatured: teacher.isFeatured,
      videoUrl: teacher.videoUrl,
      diplomaUrl: teacher.diplomaUrl,
    },
    availability: availability.map((a) => ({
      id: a.id,
      dayOfWeek: a.dayOfWeek,
      startHour: a.startHour,
      endHour: a.endHour,
      isActive: a.isActive,
    })),
  })
}

/** PATCH /api/dashboard/teacher/profile — update bio, rates, availability */
export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'TEACHER') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }
  const teacher = await db.teacher.findUnique({ where: { userId: session.userId } })
  if (!teacher) {
    return NextResponse.json({ error: 'الملف غير موجود' }, { status: 404 })
  }

  const body = await req.json()
  const { bio, tracks, experienceYears, hourlyRateEGP, hourlyRateUSD, availability } = body

  // Update teacher fields
  await db.teacher.update({
    where: { id: teacher.id },
    data: {
      ...(bio !== undefined && { bio }),
      ...(tracks && { tracks: Array.isArray(tracks) ? tracks.join(',') : tracks }),
      ...(experienceYears !== undefined && { experienceYears: parseInt(experienceYears, 10) || 0 }),
      ...(hourlyRateEGP !== undefined && { hourlyRateEGP: parseInt(hourlyRateEGP, 10) || 0 }),
      ...(hourlyRateUSD !== undefined && { hourlyRateUSD: parseInt(hourlyRateUSD, 10) || 0 }),
    },
  })

  // Update availability if provided
  if (availability && Array.isArray(availability)) {
    await db.availability.deleteMany({ where: { teacherId: teacher.id } })
    for (const slot of availability) {
      if (slot.isActive !== false) {
        await db.availability.create({
          data: {
            teacherId: teacher.id,
            dayOfWeek: slot.dayOfWeek,
            startHour: slot.startHour,
            endHour: slot.endHour,
            isActive: slot.isActive ?? true,
          },
        })
      }
    }
  }

  return NextResponse.json({ ok: true, message: 'تم تحديث الملف بنجاح' })
}
