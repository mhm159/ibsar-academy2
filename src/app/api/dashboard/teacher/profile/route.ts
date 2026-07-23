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
    include: { user: { select: { name: true, nameAr: true, phone: true, email: true, country: true, city: true, avatarUrl: true } } },
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
      avatarUrl: teacher.user.avatarUrl,
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
      // Pricing controls
      pricingMode: teacher.pricingMode,
      maxHourlyRateEGP: teacher.maxHourlyRateEGP,
      fixedHourlyRateEGP: teacher.fixedHourlyRateEGP,
      fixedHourlyRateUSD: teacher.fixedHourlyRateUSD,
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
  const { bio, tracks, experienceYears, hourlyRateEGP, hourlyRateUSD, availability, avatarUrl, videoUrl, diplomaUrl, name, nameAr, city } = body

  // Update user fields (name, avatar)
  await db.user.update({
    where: { id: session.userId },
    data: {
      ...(name !== undefined && { name }),
      ...(nameAr !== undefined && { nameAr }),
      ...(city !== undefined && { city }),
      ...(avatarUrl !== undefined && { avatarUrl }),
    },
  })

  // Update teacher fields
  const teacherUpdate: any = {
    ...(bio !== undefined && { bio }),
    ...(tracks && { tracks: Array.isArray(tracks) ? tracks.join(',') : tracks }),
    ...(experienceYears !== undefined && { experienceYears: parseInt(experienceYears, 10) || 0 }),
    ...(videoUrl !== undefined && { videoUrl }),
    ...(diplomaUrl !== undefined && { diplomaUrl }),
  }

  // Pricing enforcement
  if (hourlyRateEGP !== undefined || hourlyRateUSD !== undefined) {
    const fullTeacher = await db.teacher.findUnique({ where: { id: teacher.id } })
    if (fullTeacher) {
      if (fullTeacher.pricingMode === 'FIXED') {
        // Teacher can't change price
        return NextResponse.json(
          { error: 'لا يمكنك تغيير السعر — الأكاديمية حددت سعراً ثابتاً لك' },
          { status: 403 },
        )
      }

      if (fullTeacher.pricingMode === 'CAPPED' && hourlyRateEGP !== undefined) {
        const requested = parseInt(hourlyRateEGP, 10) || 0
        const max = fullTeacher.maxHourlyRateEGP ?? Infinity
        if (requested > max) {
          return NextResponse.json(
            { error: `السعر يتجاوز الحد المسموح (${max / 100} ج.م). الحد الأقصى لك: ${max / 100} ج.م` },
            { status: 422 },
          )
        }
      }

      // FREE mode: teacher sets whatever they want
      if (hourlyRateEGP !== undefined) {
        teacherUpdate.hourlyRateEGP = parseInt(hourlyRateEGP, 10) || 0
      }
      if (hourlyRateUSD !== undefined) {
        teacherUpdate.hourlyRateUSD = parseInt(hourlyRateUSD, 10) || 0
      }
    }
  }

  await db.teacher.update({
    where: { id: teacher.id },
    data: teacherUpdate,
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
