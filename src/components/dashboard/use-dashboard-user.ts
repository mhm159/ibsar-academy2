'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export interface DashboardUser {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  role: string
  avatarUrl: string | null
  country: string | null
  city: string | null
}

/**
 * useDashboardUser — fetches the current authenticated user.
 * Redirects to /auth/login if not authenticated.
 * Returns { user, loading, logout }.
 */
export function useDashboardUser(expectedRole?: string) {
  const router = useRouter()
  const [user, setUser] = useState<DashboardUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return
        if (!data.user) {
          router.replace('/auth/login')
          return
        }
        if (expectedRole && data.user.role !== expectedRole) {
          // Wrong role → redirect to their dashboard
          const dest =
            data.user.role === 'ADMIN'
              ? '/admin'
              : data.user.role === 'TEACHER'
                ? '/teacher'
                : '/parent'
          router.replace(dest)
          return
        }
        setUser(data.user)
        setLoading(false)
      })
      .catch(() => {
        if (mounted) router.replace('/auth/login')
      })
    return () => {
      mounted = false
    }
  }, [expectedRole, router])

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.replace('/auth/login')
  }

  return { user, loading, logout }
}
