'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Construction, ArrowRight, LogOut, Sparkles } from 'lucide-react'
import { Logo } from '@/features/shared/logo'
import { ThemeToggle } from '@/features/shared/theme-toggle'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface MeUser {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  role: string
}

const ROLE_INFO: Record<
  string,
  { label: string; emoji: string; title: string; description: string }
> = {
  PARENT: {
    label: 'ولي الأمر',
    emoji: '👨‍👩‍👧',
    title: 'لوحة ولي الأمر',
    description: 'إدارة أبنائك، حجوزات الحصص، المدفوعات، ومتابعة التقدّم.',
  },
  TEACHER: {
    label: 'المعلم',
    emoji: '👩‍🏫',
    title: 'لوحة المعلم',
    description: 'إدارة الحصص، الطلاب، الأجور، والتقويم.',
  },
  ADMIN: {
    label: 'الإدارة',
    emoji: '⚙️',
    title: 'لوحة الإدارة',
    description: 'إدارة المستخدمين، المعلمين، المعاملات، والمحتوى.',
  },
}

/**
 * DashboardPlaceholder — shown for Phase 2 routes (parent/teacher/admin).
 * Confirms the user is logged in and shows what's coming next.
 */
export function DashboardPlaceholder({ role }: { role: 'PARENT' | 'TEACHER' | 'ADMIN' }) {
  const router = useRouter()
  const [user, setUser] = useState<MeUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (!data.user || data.user.role !== role) {
          // Not authorized → redirect to login
          router.replace('/auth/login')
          return
        }
        setUser(data.user)
        setLoading(false)
      })
      .catch(() => {
        router.replace('/auth/login')
      })
  }, [role, router])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.replace('/auth/login')
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pharaonic">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    )
  }

  const info = ROLE_INFO[role]

  return (
    <div className="min-h-screen flex flex-col bg-pharaonic">
      {/* Top bar */}
      <header className="glass-strong border-b border-border/50 sticky top-0 z-40">
        <div className="container mx-auto max-w-7xl px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Logo size={36} />
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <span className="text-lg">{info.emoji}</span>
              {user.name}
            </span>
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              aria-label="تسجيل الخروج"
              className="hover:bg-destructive/10 hover:text-destructive rounded-full"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full p-8 sm:p-12 glass border-gold/20 text-center">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-gradient-to-br from-gold/20 to-azure/20 mb-6 text-5xl neu-inset">
            {info.emoji}
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-3 py-1 text-xs font-bold text-gold mb-3">
            <Sparkles className="h-3 w-3" />
            مرحلة 2 — قيد التطوير
          </span>

          <h1 className="font-display text-3xl sm:text-4xl font-extrabold mb-3">
            {info.title}
          </h1>
          <p className="text-muted-foreground leading-relaxed max-w-md mx-auto mb-2">
            أهلاً <span className="font-bold text-foreground">{user.name}</span>!
          </p>
          <p className="text-muted-foreground leading-relaxed max-w-md mx-auto mb-8">
            {info.description}
          </p>

          <div className="rounded-2xl bg-muted/50 border border-border/50 p-4 mb-8 text-right">
            <p className="text-sm font-bold mb-2 flex items-center gap-2">
              <Construction className="h-4 w-4 text-gold" />
              ما الذي سيأتي في المرحلة 2؟
            </p>
            <ul className="text-xs text-muted-foreground space-y-1.5">
              {phase2Features(role).map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <span className="text-gold mt-0.5">•</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/">
              <Button variant="outline" className="gap-2 glass border-gold/30 hover:bg-gold/10">
                <ArrowRight className="h-4 w-4" />
                العودة للرئيسية
              </Button>
            </Link>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="gap-2 border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              تسجيل الخروج
            </Button>
          </div>
        </Card>
      </main>
    </div>
  )
}

function phase2Features(role: string): string[] {
  switch (role) {
    case 'PARENT':
      return [
        'إضافة وإدارة بيانات أبنائك',
        'حجز الحصص وجدولتها أسبوعياً',
        'استعراض المعلمين وتقييماتهم',
        'تتبع المدفوعات والفواتير',
        'تقارير تقدّم الأبناء الأسبوعية',
        'إشعارات قبل كل حصة',
      ]
    case 'TEACHER':
      return [
        'إدارة جدول الحصص القادمة',
        'قائمة الطلاب والمستويات',
        'تسجيل الحضور والغياب',
        'تتبع الأجور والمدفوعات',
        'رفع المواد والتسجيلات',
        'تحديث الملف الشخصي والتوفر',
      ]
    case 'ADMIN':
      return [
        'إدارة المستخدمين والمعلمين',
        'مراجعة طلبات انضمام المعلمين',
        'إدارة المعاملات والأمان (Escrow)',
        'إنشاء الكوبونات والحملات',
        'تقارير المنصة والإحصائيات',
        'إدارة المحتوى والصفحات',
      ]
    default:
      return []
  }
}

/* TODO(phase-2): Replace this placeholder with the real dashboard layouts (parent/teacher/admin). */
