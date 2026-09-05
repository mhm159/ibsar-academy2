'use client'

import type { CSSProperties } from 'react'
import Link from 'next/link'
import { ArrowLeft, Award, CalendarCheck, ChartNoAxesCombined, PlayCircle, ShieldCheck } from 'lucide-react'
import { SectionHeading } from '@/features/landing/tracks-section'
import { Stagger, StaggerItem } from '@/features/shared/motion-reveal'
import { useSiteSettings } from '@/hooks/use-site-settings'

const JOURNEYS = [
  { image: '/kider/classes-1.jpg', icon: PlayCircle, title: 'يكتشف ويجرّب', text: 'حصة تجريبية تساعدنا على فهم المستوى والميول قبل اختيار المسار.', label: 'البداية الذكية', color: '#FE5D37' },
  { image: '/kider/classes-2.jpg', icon: CalendarCheck, title: 'يتعلّم بمرونة', text: 'مواعيد مناسبة، معلم مختار بعناية، وفصل افتراضي تفاعلي وآمن.', label: 'تعلم مباشر', color: '#198754' },
  { image: '/kider/classes-3.jpg', icon: ChartNoAxesCombined, title: 'يتقدّم بوضوح', text: 'واجبات وتقارير دورية تضع ولي الأمر داخل رحلة التقدم خطوة بخطوة.', label: 'متابعة مستمرة', color: '#0DCAF0' },
  { image: '/kider/classes-4.jpg', icon: Award, title: 'ينجز ويفتخر', text: 'شارات وشهادات ومشروعات حقيقية تحول التعلم إلى إنجاز ملموس.', label: 'نتائج حقيقية', color: '#FFC107' },
]

export function JourneysSection() {
  const { settings } = useSiteSettings()
  const journeys = JOURNEYS.map((item, index) => ({
    ...item,
    title: settings[`journey.${index + 1}.title`] || item.title,
    text: settings[`journey.${index + 1}.text`] || item.text,
  }))
  return (
    <section id="journeys" className="relative overflow-hidden py-20 lg:py-28">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(254,93,55,.08),transparent_26rem)]" />
      <div className="container relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow={settings['journey.eyebrow']} title={settings['journey.title']} description={settings['journey.description']} />
        <Stagger className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {journeys.map((item, index) => (
            <StaggerItem key={item.title} className="h-full">
              <article className="kider-class-card group h-full overflow-hidden rounded-[2rem] bg-card shadow-[0_18px_50px_-32px_rgba(16,55,65,.55)]" style={{ '--journey': item.color } as CSSProperties}>
                <div className="relative mx-auto mt-5 size-44 overflow-hidden rounded-full border-[7px] border-white shadow-lg sm:size-48">
                  <img src={item.image} alt={item.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" loading="lazy" />
                  <span className="absolute inset-0 bg-gradient-to-t from-[#103741]/35 to-transparent" />
                </div>
                <div className="px-6 pb-6 pt-5 text-center">
                  <span className="mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black" style={{ color: item.color, backgroundColor: `${item.color}18` }}><item.icon className="size-3.5" /> {item.label}</span>
                  <h3 className="font-display text-xl font-black">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.text}</p>
                  <div className="mt-5 flex items-center justify-center gap-2 text-xs font-bold text-foreground/55"><ShieldCheck className="size-4" /> خطوة {index + 1} من الرحلة</div>
                </div>
              </article>
            </StaggerItem>
          ))}
        </Stagger>
        <div className="mt-10 text-center"><Link href="/auth/register/student" className="inline-flex items-center gap-2 rounded-full bg-[#103741] px-6 py-3 font-bold text-white transition hover:-translate-y-1 hover:bg-primary">{settings['journey.button']} <ArrowLeft className="size-4" /></Link></div>
      </div>
    </section>
  )
}
