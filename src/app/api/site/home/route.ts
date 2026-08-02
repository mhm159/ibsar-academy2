import { NextResponse } from 'next/server'
import { getSiteStats, getFeaturedTeachers, getTestimonials } from '@/lib/site-data'

export const dynamic = 'force-dynamic'

/**
 * GET /api/site/home
 * Single combined payload for the landing page (stats + teachers + testimonials)
 * so the homepage issues one request instead of three.
 */
export async function GET() {
  const [stats, teachers, testimonials] = await Promise.all([
    getSiteStats(),
    getFeaturedTeachers(),
    getTestimonials(),
  ])
  return NextResponse.json({
    stats: stats.stats,
    teachers: teachers.teachers,
    testimonials: testimonials.testimonials,
  })
}
