'use client'

import Link from 'next/link'
import { Logo } from '@/components/site/logo'
import { ThemeToggle } from '@/components/site/theme-toggle'
import { APP, STATS } from '@/lib/constants'
import { ShieldCheck, Sparkles, HeartHandshake } from 'lucide-react'

const TRUST_POINTS = [
  {
    icon: ShieldCheck,
    title: 'بيئة آمنة للطفل',
    text: 'فلتر للروابط، مراقبة ولي الأمر، ومعلمون معتمدون.',
  },
  {
    icon: Sparkles,
    title: 'تجربة عربية أصيلة',
    text: 'منصة عربية بالكامل بتصميم يُلامس احتياجات طفلك.',
  },
  {
    icon: HeartHandshake,
    title: 'متابعة فردية',
    text: 'تقييم أسبوعي وتقرير شهري عن تقدّم طفلك.',
  },
]

/**
 * AuthShell — split-screen layout for all auth pages.
 * Right (RTL): brand panel with logo, tagline, trust points, stats.
 * Left: the form card (passed as children).
 */
export function AuthShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode
  title: string
  subtitle: string
}) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-pharaonic">
      {/* Brand panel (hidden on mobile) */}
      <aside className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-night via-azure to-emerald-egypt">
        <div className="absolute inset-0 bg-hieroglyphs opacity-30" aria-hidden />
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-gold/30 blur-3xl animate-float-soft" aria-hidden />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-kids-teal/20 blur-3xl animate-float-soft" style={{ animationDelay: '3s' }} aria-hidden />

        <div className="relative flex flex-col justify-between p-12 xl:p-16 text-white w-full">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-3 w-fit">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2 border border-white/20">
              <Logo size={36} showText={false} />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display font-extrabold text-xl">{APP.name}</span>
              <span className="text-xs text-white/60">{APP.nameEn}</span>
            </div>
          </Link>

          {/* Hero text */}
          <div className="my-12">
            <h1 className="font-display text-4xl xl:text-5xl font-extrabold leading-tight">
              نُبصرُ مستقبلَ طفلِك
              <br />
              <span className="text-gradient-gold">بمهارات القرن 21</span>
            </h1>
            <p className="mt-5 text-white/70 text-lg leading-relaxed max-w-md">
              انضم لأكثر من 5000 عائلة عربية تثق بأكاديمية إبصار لتعلّم أبنائها
              البرمجة، الروبوتيكس، والحساب الذهني.
            </p>

            <ul className="mt-8 space-y-4">
              {TRUST_POINTS.map((point) => (
                <li key={point.title} className="flex items-start gap-3">
                  <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shrink-0">
                    <point.icon className="h-5 w-5 text-gold" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{point.title}</p>
                    <p className="text-xs text-white/60">{point.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Stats */}
          <dl className="grid grid-cols-4 gap-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <dt className="text-2xl xl:text-3xl font-extrabold text-gradient-gold font-display">
                  {stat.value}
                </dt>
                <dd className="text-[0.65rem] text-white/60 mt-1">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </aside>

      {/* Form panel */}
      <main className="flex-1 flex flex-col">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between p-4">
          <Link href="/" className="inline-flex items-center gap-2">
            <Logo size={36} showText={false} />
            <span className="font-display font-extrabold">{APP.name}</span>
          </Link>
          <ThemeToggle />
        </div>

        {/* Desktop top-right theme toggle */}
        <div className="hidden lg:flex justify-end p-6">
          <ThemeToggle />
        </div>

        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center">
              <h2 className="font-display text-3xl font-extrabold tracking-tight">
                {title}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
            </div>
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}

/* TODO(phase-2): Add social login (Google) buttons once OAuth providers are configured. */
