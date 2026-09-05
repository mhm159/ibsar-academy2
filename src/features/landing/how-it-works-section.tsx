'use client'

import { motion } from 'framer-motion'
import { UserPlus, MessageSquare, CalendarCheck, Rocket } from 'lucide-react'
import { SectionHeading } from '@/features/landing/tracks-section'
import { Stagger, StaggerItem } from '@/features/shared/motion-reveal'
import { useSiteSettings } from '@/hooks/use-site-settings'

const STEPS = [
  {
    icon: UserPlus,
    step: '01',
    title: 'أخبرنا بما تحتاجه',
    description: 'أنشئ حساباً وحدد الصف والمادة والمنهج والهدف والوقت والميزانية المناسبة.',
    color: 'var(--azure)',
  },
  {
    icon: MessageSquare,
    step: '02',
    title: 'اكتشف المعلمين',
    description: 'قارن الخبرة والتخصص والتقييمات والأسعار، واختر من تشعر أنه يفهم طالبك.',
    color: 'var(--gold)',
  },
  {
    icon: CalendarCheck,
    step: '03',
    title: 'جرّب واحجز بأمان',
    description: 'ابدأ بحصة تجريبية، ثم ثبت الموعد والخطة وادفع بالطريقة المناسبة لبلدك.',
    color: 'var(--emerald-egypt)',
  },
  {
    icon: Rocket,
    step: '04',
    title: 'تابع وتطور',
    description: 'يحضر الطالب حصصه ويتابع ولي الأمر التقارير، بينما يبني المعلم سمعته ودخله.',
    color: 'var(--kids-red)',
  },
]

export function HowItWorksSection() {
  const { settings } = useSiteSettings()
  return (
    <section id="how" className="py-20 lg:py-28">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow={settings['how.eyebrow']}
          title={settings['how.title']}
          description={settings['how.description']}
        />

        <div className="mt-14 relative">
          {/* Connecting line (desktop) */}
          <div
            className="hidden lg:block absolute top-12 right-[12.5%] left-[12.5%] h-0.5 bg-gradient-to-l from-transparent via-primary/25 to-transparent"
            aria-hidden
          />

          <Stagger className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4 relative">
            {STEPS.map((step) => (
              <StaggerItem
                key={step.step}
                className="relative text-center"
                y={32}
                duration={0.55}
              >
                {/* Icon circle — M3 tonal */}
                <motion.div
                  className="relative mx-auto mb-5 w-24 h-24"
                  whileHover={{ scale: 1.06, rotate: -2 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 16 }}
                >
                  <div
                    className="w-24 h-24 rounded-full flex items-center justify-center border-2"
                    style={{
                      borderColor: `color-mix(in srgb, ${step.color} 35%, var(--border))`,
                      background: `color-mix(in srgb, ${step.color} 10%, var(--card))`,
                    }}
                  >
                    <step.icon className="h-9 w-9" style={{ color: step.color }} strokeWidth={2} />
                  </div>
                  {/* Step number badge */}
                  <span
                    className="absolute -top-2 -right-2 h-8 w-8 rounded-full flex items-center justify-center text-xs font-extrabold text-white shadow-lg"
                    style={{ background: step.color }}
                  >
                    {step.step}
                  </span>
                </motion.div>

                <h3 className="font-display text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                  {step.description}
                </p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </div>
    </section>
  )
}

/* TODO(phase-2): Add a "watch demo" video modal that walks through the steps. */
