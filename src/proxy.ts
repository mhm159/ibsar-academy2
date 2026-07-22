import { NextRequest, NextResponse } from 'next/server'
import { verifySessionTokenEdge, SESSION_COOKIE_NAME } from '@/lib/auth-edge'

/**
 * Middleware — protects dashboard routes by role.
 *
 * /parent/*   → requires PARENT
 * /teacher/*  → requires TEACHER
 * /admin/*    → requires ADMIN
 *
 * Unauthenticated → redirect to /auth/login?next=<original>
 * Wrong role      → redirect to their own dashboard
 */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value
  const session = await verifySessionTokenEdge(token)

  // Determine which dashboard this path belongs to
  const getRole = (path: string): string | null => {
    if (path.startsWith('/parent')) return 'PARENT'
    if (path.startsWith('/teacher')) return 'TEACHER'
    if (path.startsWith('/admin')) return 'ADMIN'
    return null
  }

  const requiredRole = getRole(pathname)
  if (!requiredRole) {
    return NextResponse.next()
  }

  // Not authenticated → login
  if (!session) {
    const loginUrl = req.nextUrl.clone()
    loginUrl.pathname = '/auth/login'
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Wrong role → redirect to their own dashboard
  if (session.role !== requiredRole) {
    const homeUrl = req.nextUrl.clone()
    homeUrl.pathname =
      session.role === 'ADMIN'
        ? '/admin'
        : session.role === 'TEACHER'
          ? '/teacher'
          : '/parent'
    homeUrl.search = ''
    return NextResponse.redirect(homeUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/parent/:path*', '/teacher/:path*', '/admin/:path*'],
}

/* TODO(phase-3): Add IP-based rate limiting for auth endpoints in middleware.
 * TODO(phase-4): Add classroom route protection once virtual room lands. */
