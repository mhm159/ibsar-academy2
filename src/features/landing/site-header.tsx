'use client'

import * as React from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, BookOpen, GraduationCap, Menu, Sparkles, X } from 'lucide-react'
import { Logo } from '@/features/shared/logo'
import { ThemeToggle } from '@/features/shared/theme-toggle'
import { KidsModeToggle } from '@/features/shared/kids-mode-toggle'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { href: '#journeys', label: 'رحلة الطالب' },
  { href: '#tracks', label: 'البرامج' },
  { href: '#teachers', label: 'المعلمون' },
  { href: '#testimonials', label: 'آراء الأهالي' },
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

  React.useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <header className={cn('sticky top-0 z-50 w-full transition-all duration-300', scrolled ? 'py-2' : 'py-3')}>
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className={cn('flex h-16 items-center justify-between gap-4 rounded-[1.4rem] border px-3 transition-all sm:px-5', scrolled ? 'border-border/80 bg-background/95 shadow-[0_12px_35px_-20px_rgba(16,55,65,.5)] backdrop-blur-xl' : 'border-white/70 bg-background/85 shadow-sm backdrop-blur-lg')}>
          <Link href="/" className="flex items-center gap-2 rounded-full" aria-label="الصفحة الرئيسية"><Logo size={42} /></Link>
          <nav className="hidden items-center rounded-full bg-muted/60 p-1 lg:flex" aria-label="التنقل الرئيسي">
            {NAV_LINKS.map((link) => <Link key={link.href} href={link.href} className="rounded-full px-4 py-2 text-sm font-bold text-muted-foreground transition hover:bg-card hover:text-primary hover:shadow-sm">{link.label}</Link>)}
          </nav>
          <div className="flex items-center gap-1.5">
            <div className="hidden sm:flex"><KidsModeToggle /></div><ThemeToggle />
            <Link href="/auth/login" className="hidden md:block"><Button variant="ghost" size="sm" className="rounded-full font-bold">دخول</Button></Link>
            <Link href="/auth/register/student" className="hidden sm:block"><Button size="sm" className="gap-1.5 rounded-full bg-primary px-5 text-white shadow-md shadow-primary/20"><GraduationCap className="size-4" /> ابدأ الآن</Button></Link>
            <button type="button" className="grid size-11 place-items-center rounded-2xl border border-primary/15 bg-primary/10 text-primary transition hover:scale-105 hover:bg-primary hover:text-white lg:hidden" aria-label={open ? 'إغلاق القائمة' : 'فتح القائمة'} aria-expanded={open} onClick={() => setOpen((value) => !value)}>{open ? <X className="size-5" /> : <Menu className="size-5" />}</button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {open && <>
          <motion.button aria-label="إغلاق القائمة" className="fixed inset-0 -z-10 bg-[#103741]/45 backdrop-blur-sm lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
          <motion.div initial={{ opacity: 0, y: -18, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -16, scale: .98 }} className="mx-3 mt-2 overflow-hidden rounded-[2rem] border border-border bg-card shadow-2xl lg:hidden">
            <div className="relative overflow-hidden bg-[#103741] px-5 py-5 text-white"><div className="absolute -left-8 -top-12 size-32 rounded-full bg-primary/30 blur-2xl" /><div className="relative flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-white/10"><BookOpen className="size-5 text-[#FE5D37]" /></span><div><p className="font-display text-lg font-black">ابدأ رحلة تعلّم ممتعة</p><p className="text-xs text-white/65">حصص مباشرة ومعلمون موثوقون</p></div></div></div>
            <nav className="grid gap-1 p-3" aria-label="قائمة الهاتف">
              {NAV_LINKS.map((link, index) => <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="group flex items-center justify-between rounded-2xl px-4 py-3 font-bold text-foreground transition hover:bg-primary/10 hover:text-primary"><span className="flex items-center gap-3"><span className="grid size-7 place-items-center rounded-full bg-muted text-xs text-muted-foreground">{index + 1}</span>{link.label}</span><ArrowLeft className="size-4 opacity-30 transition group-hover:-translate-x-1 group-hover:opacity-100" /></Link>)}
            </nav>
            <div className="grid grid-cols-2 gap-2 border-t border-border bg-muted/30 p-4"><Link href="/auth/login" onClick={() => setOpen(false)}><Button variant="outline" className="w-full rounded-full">تسجيل الدخول</Button></Link><Link href="/auth/register/student" onClick={() => setOpen(false)}><Button className="w-full gap-1 rounded-full bg-primary text-white"><Sparkles className="size-4" /> حساب جديد</Button></Link></div>
          </motion.div>
        </>}
      </AnimatePresence>
    </header>
  )
}
