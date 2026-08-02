import { NextResponse } from 'next/server'
import { getTestimonials } from '@/lib/site-data'

/**
 * GET /api/site/testimonials
 * Public testimonials — real approved reviews from the DB.
 * Falls back to the curated constant only when there are no reviews.
 */
export async function GET() {
  return NextResponse.json(await getTestimonials())
}
