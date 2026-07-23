'use client'

import * as React from 'react'
import Link from 'next/link'
import { Menu, X, GraduationCap } from 'lucide-react'
import { Logo } from './logo'
import { ThemeToggle } from './theme-toggle'
import { KidsModeToggle } from '@/components/site/kids-mode-toggle'
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
        'sticky top-0 z-50 w-full transition-all duration-300',
        scrolled
          ? 'glass-strong shadow-[0_8px_30px_rgba(15,25,35,0.08)]'
          : 'bg-transparent',
      )}
    >
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 lg:h-20 items-center justify-between gap-4">
          {/* Right (RTL: logo on right) */}
          <Link
            href="/"
            className="flex items-center transition-transform hover:scale-[1.02]"
            aria-label="الصفحة الرئيسية — أكاديمية إبداع"
          >
            <Logo size={42} />
          </Link>

          {/* Center: desktop nav */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="التنقل الرئيسي">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative px-4 py-2 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors rounded-lg hover:bg-gold/10"
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
              <Button variant="ghost" size="sm" className="font-medium">
                تسجيل الدخول
              </Button>
            </Link>
            <Link href="/auth/register/student" className="hidden sm:block">
              <Button size="sm" className="gap-1.5 shine relative overflow-hidden bg-gradient-to-l from-gold to-[#E8D488] text-night hover:shadow-lg hover:shadow-gold/30">
                <GraduationCap className="h-4 w-4" />
                ابدأ التعلّم
              </Button>
            </Link>
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden rounded-full"
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
        <div className="lg:hidden glass-strong border-t border-border/50">
          <nav className="container mx-auto max-w-7xl px-4 py-4 flex flex-col gap-1" aria-label="التنقل للموبايل">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="px-4 py-3 text-sm font-medium text-foreground/90 hover:text-foreground rounded-lg hover:bg-gold/10 transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-border/50">
              <Link href="/auth/login" onClick={() => setOpen(false)}>
                <Button variant="outline" size="sm" className="w-full">
                  تسجيل الدخول
                </Button>
              </Link>
              <Link href="/auth/register/student" onClick={() => setOpen(false)}>
                <Button size="sm" className="w-full bg-gradient-to-l from-gold to-[#E8D488] text-night">
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
