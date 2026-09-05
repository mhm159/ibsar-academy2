'use client'

import * as React from 'react'
import Link from 'next/link'
import { Menu, X, GraduationCap } from 'lucide-react'
import { Logo } from '@/features/shared/logo'
import { ThemeToggle } from '@/features/shared/theme-toggle'
import { KidsModeToggle } from '@/features/shared/kids-mode-toggle'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { href: '#tracks', label: 'المواد' },
  { href: '#how', label: 'كيف نعمل' },
  { href: '#teachers', label: 'المعلمون' },
  { href: '#pricing', label: 'الأسعار' },
  { href: '#faq', label: 'الأسئلة' },
]

export function SiteHeader() {
  const [scrolled, setScrolled] = React.useState(false)
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b backdrop-blur-xl transition-all duration-300',
        scrolled
          ? 'border-border bg-background/90 shadow-[0_4px_20px_-6px_rgba(15,23,42,0.12)]'
          : 'border-transparent bg-background/60',
      )}
    >
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 lg:h-20 items-center justify-between gap-4">
          {/* Right (RTL: logo on right) */}
          <Link
            href="/"
            className="flex items-center rounded-full transition-transform hover:scale-[1.02]"
            aria-label="الصفحة الرئيسية — منصة درس"
          >
            <Logo size={42} />
          </Link>

          {/* Center: desktop nav */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="التنقل الرئيسي">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Left: actions */}
          <div className="flex items-center gap-2">
            <KidsModeToggle />
            <ThemeToggle />
            <Link href="/auth/login" className="hidden sm:block">
              <Button variant="ghost" size="sm" className="rounded-full font-medium text-primary hover:bg-primary/10">
                تسجيل الدخول
              </Button>
            </Link>
            <Link href="/auth/register/student" className="hidden sm:block">
              <Button size="sm" className="gap-1.5 rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90">
                <GraduationCap className="h-4 w-4" />
                ابدأ التعلّم
              </Button>
            </Link>
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden rounded-full hover:bg-primary/10"
              aria-label={open ? 'إغلاق القائمة' : 'فتح القائمة'}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden border-t border-border bg-background">
          <nav className="container mx-auto max-w-7xl px-4 py-4 flex flex-col gap-1" aria-label="التنقل للموبايل">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-medium text-foreground/90 transition-colors hover:bg-primary/10 hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-border">
              <Link href="/auth/login" onClick={() => setOpen(false)}>
                <Button variant="outline" size="sm" className="w-full rounded-full">
                  تسجيل الدخول
                </Button>
              </Link>
              <Link href="/auth/register/student" onClick={() => setOpen(false)}>
                <Button size="sm" className="w-full rounded-full bg-primary text-primary-foreground shadow-sm">
                  ابدأ التعلّم
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}

/* TODO(phase-2): Add active-link underline indicator when scroll-spy is wired. */
