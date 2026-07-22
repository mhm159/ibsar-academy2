import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

/**
 * GET /api/auth/me
 * Returns the current authenticated user (or 401).
 */
export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ user: null }, { status: 200 })
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      phone: true,
      role: true,
      name: true,
      nameAr: true,
      avatarUrl: true,
      country: true,
      city: true,
      isActive: true,
      emailVerified: true,
      phoneVerified: true,
      createdAt: true,
    },
  })

  if (!user || !user.isActive) {
    return NextResponse.json({ user: null }, { status: 200 })
  }

  return NextResponse.json({ user })
}

/* TODO(phase-2): Add /api/auth/me PATCH to update profile (name, city, avatar). */
