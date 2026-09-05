'use client'

import Link from 'next/link'
import { ArrowLeft, CheckCircle2, PlayCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSiteSettings } from '@/hooks/use-site-settings'
import { useHomeData } from '@/hooks/use-home-data'

export function KiderHero() {
  const { settings } = useSiteSettings()
  const { stats } = useHomeData()

  return (
    <section className="kider-hero relative isolate overflow-hidden text-white">
      <img src="/kider/carousel-1.jpg" alt="طفل يتعلم في بيئة تعليمية ممتعة" className="absolute inset-0 -z-20 h-full w-full object-cover" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(16,55,65,.30),rgba(16,55,65,.90)_58%,rgba(16,55,65,.96))]" />
      <div className="kider-wave kider-wave-top" aria-hidden />
      <div className="mx-auto grid min-h-[36rem] max-w-7xl items-center px-4 py-20 sm:px-6 lg:grid-cols-12 lg:px-8">
        <div className="lg:col-span-8 xl:col-span-7">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-bold backdrop-blur">
            <CheckCircle2 className="size-4 text-[#FE5D37]" />
            {settings['hero.badge'] || 'تعليم مباشر وآمن لأبنائك'}
          </div>
          <h1 className="font-display text-4xl font-black leading-[1.25] sm:text-5xl lg:text-6xl">
            {settings['hero.title.line1'] || 'نصنع تجربة تعليمية'}{' '}
            <span className="text-[#FE5D37]">{settings['hero.title.line2'] || 'يحبها طفلك'}</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-white/85 sm:text-lg">
            {settings['hero.subtitle'] || 'حصص تفاعلية مع معلمين مختارين، ومتابعة واضحة لولي الأمر من الحجز حتى تقرير التقدم.'}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 rounded-full bg-[#FE5D37] px-7 text-base text-white shadow-xl shadow-black/15 hover:bg-[#ed4d29]">
              <Link href="/auth/register/student">{settings['hero.cta.primary'] || 'ابدأ الآن'}<ArrowLeft /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-full border-white/40 bg-white/10 px-7 text-base text-white hover:bg-white hover:text-[#103741]">
              <Link href="#tracks"><PlayCircle />{settings['hero.cta.secondary'] || 'استكشف البرامج'}</Link>
            </Button>
          </div>
          <dl className="mt-10 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.slice(0, 4).map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                <dt className="font-display text-2xl font-black text-white">{stat.value}</dt>
                <dd className="mt-1 text-sm text-white/70">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      <div className="kider-wave kider-wave-bottom" aria-hidden />
    </section>
  )
}
