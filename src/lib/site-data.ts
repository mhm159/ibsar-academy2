import { db } from '@/lib/db'

/**
 * Shared public site-data queries.
 * Used by the individual /api/site/* routes and the combined /api/site/home route
 * so the homepage fetches a single payload instead of three round-trips.
 */

export interface SiteStatItem {
  value: string
  label: string
}

export interface SiteTeacherItem {
  id: string
  name: string
  title: string
  tracks: string[]
  rating: number
  reviews: number
  students: number
  experienceYears: number
  avatar: string
  bio?: string
}

export interface SiteTestimonialItem {
  name: string
  location: string
  text: string
  rating: number
  avatar: string
}

const REVIEW_AVATARS = ['👩', '👨', '👩‍⚕️', '👨‍💼', '👩‍🏫', '👨‍🎓']

export async function getSiteStats(): Promise<{ stats: SiteStatItem[]; raw: Record<string, unknown> }> {
  const [students, teachers, reviews, reviewCount, countries] = await Promise.all([
    db.student.count(),
    db.teacher.count({ where: { status: 'APPROVED' } }),
    db.review.aggregate({ where: { isApproved: true }, _avg: { rating: true } }),
    db.review.count({ where: { isApproved: true } }),
    db.user.findMany({ select: { country: true }, distinct: ['country'], where: { country: { not: null } } }),
  ])

  const avg = reviews._avg.rating ?? 0
  const countryCount = countries.filter((c) => c.country).length

  return {
    stats: [
      { value: `${students}+`, label: 'طالب وطالبة' },
      { value: `${teachers}+`, label: 'معلم مختص' },
      { value: `${avg.toFixed(1)}/5`, label: 'متوسط التقييم' },
      { value: `${countryCount}+`, label: 'دولة عربية' },
    ],
    raw: { students, teachers, reviewCount, countryCount, avgRating: avg },
  }
}

export async function getFeaturedTeachers(): Promise<{ teachers: SiteTeacherItem[]; isSeed: boolean }> {
  const teachers = await db.teacher.findMany({
    where: { status: 'APPROVED', isFeatured: true },
    include: { user: { select: { name: true } } },
    orderBy: [{ rating: 'desc' }, { reviewsCount: 'desc' }],
    take: 8,
  })

  if (teachers.length === 0) {
    const { FEATURED_TEACHERS } = await import('@/lib/constants')
    return {
      teachers: FEATURED_TEACHERS.map((t) => ({
        id: t.id,
        name: t.name,
        title: t.title,
        tracks: [...t.tracks],
        rating: t.rating,
        reviews: t.reviews,
        students: t.students,
        experienceYears: t.experienceYears,
        avatar: t.avatar,
        bio: t.bio,
        isSeed: true,
      })),
      isSeed: true,
    }
  }

  const bookings = await db.booking.groupBy({
    by: ['sessionId'],
    where: { status: { not: 'CANCELLED' } },
    _count: { _all: true },
  })
  const countBySession = new Map(bookings.map((b) => [b.sessionId, b._count._all]))
  const sessionTeacherIds = await db.session.findMany({
    where: { id: { in: [...countBySession.keys()] } },
    select: { id: true, teacherId: true },
  })
  const studentCountByTeacher = new Map<string, number>()
  sessionTeacherIds.forEach((s) => {
    const n = countBySession.get(s.id) ?? 0
    studentCountByTeacher.set(s.teacherId, (studentCountByTeacher.get(s.teacherId) ?? 0) + n)
  })

  return {
    teachers: teachers.map((t) => ({
      id: t.id,
      name: t.user.name ?? 'معلم',
      title: t.bioAr?.split('\n')[0] ?? 'مدرّس متخصص',
      tracks: t.tracks.split(',').map((x) => x.trim()).filter(Boolean),
      rating: t.rating,
      reviews: t.reviewsCount,
      students: studentCountByTeacher.get(t.id) ?? 0,
      experienceYears: t.experienceYears,
      avatar: t.user.name?.charAt(0) ?? '👨‍🏫',
      bio: t.bioAr ?? '',
    })),
    isSeed: false,
  }
}

export async function getTestimonials(): Promise<{ testimonials: SiteTestimonialItem[]; isSeed: boolean }> {
  const reviews = await db.review.findMany({
    where: { isApproved: true, comment: { not: '' } },
    select: { reviewerName: true, rating: true, comment: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 9,
  })

  if (reviews.length === 0) {
    const { TESTIMONIALS } = await import('@/lib/constants')
    return {
      testimonials: TESTIMONIALS.map((t) => ({
        name: t.name,
        location: t.location,
        text: t.text,
        rating: t.rating,
        avatar: t.avatar,
        isSeed: true,
      })),
      isSeed: true,
    }
  }

  return {
    testimonials: reviews.map((r, i) => ({
      name: r.reviewerName || 'ولي أمر',
      location: '',
      text: r.comment ?? '',
      rating: r.rating,
      avatar: REVIEW_AVATARS[i % REVIEW_AVATARS.length],
    })),
    isSeed: false,
  }
}
