import { NextResponse } from 'next/server'
import { getFeaturedTeachers } from '@/lib/site-data'

/**
 * GET /api/site/teachers
 * Public featured teachers — real approved teacher profiles from the DB.
 * Falls back to the curated constant only when there are no approved teachers.
 */
export async function GET() {
  return NextResponse.json(await getFeaturedTeachers())
}
