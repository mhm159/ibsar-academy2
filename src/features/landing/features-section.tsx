'use client'

import { motion } from 'framer-motion'
import {
  Video,
  ShieldCheck,
  Languages,
  GraduationCap,
  Wallet,
  HeartHandshake,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { SectionHeading } from '@/features/landing/tracks-section'
import { Stagger, StaggerItem } from '@/features/shared/motion-reveal'
import { useSiteSettings } from '@/hooks/use-site-settings'

const FEATURES = [
  {
    icon: Video,
    title: 'معلم مناسب لا مجرد نتيجة بحث',
    description: 'صفحات مهنية واضحة وتصنيف حسب المادة والصف والمنهج والخبرة والتقييم لمقارنة أفضل.',
    color: 'var(--azure)',
  },
  {
    icon: ShieldCheck,
    title: 'حجز ودفع يحفظ الحقوق',
    description: 'مواعيد منظمة ومدفوعات موثقة وسياسات واضحة تحمي الطالب والمعلم طوال الرحلة.',
    color: 'var(--emerald-egypt)',
  },
  {
    icon: GraduationCap,
    title: 'جميع المراحل والمواد',
    description: 'من التأسيس إلى الثانوية، ومن المواد المدرسية واللغات إلى المهارات والاختبارات.',
    color: 'var(--gold)',
  },
  {
    icon: Wallet,
    title: 'سعر مناسب لبلدك',
    description: 'خطط مرنة وعملة محلية وخيارات دفع متعددة، مع عرض التكلفة بوضوح قبل الحجز.',
    color: 'var(--kids-red)',
  },
  {
    icon: Languages,
    title: 'وطن عربي بلا حدود',
    description: 'تعلّم مع معلم من أي دولة عربية، واختر المنهج واللهجة والموعد الأنسب لك.',
    color: 'var(--kids-teal)',
  },
  {
    icon: HeartHandshake,
    title: 'متابعة تطمئن ولي الأمر',
    description: 'الحضور والواجبات والتقييم والتقارير والحجوزات في لوحة واحدة سهلة وواضحة.',
    color: 'var(--kids-yellow)',
  },
]

export function FeaturesSection() {
  const { settings } = useSiteSettings()
  return (
    <section id="features" className="py-20 lg:py-28 bg-pharaonic relative overflow-hidden">
      <div className="absolute inset-0 bg-hieroglyphs opacity-50 pointer-events-none" aria-hidden />
      <div className="container relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow={settings['features.eyebrow']}
          title={settings['features.title']}
          description={settings['features.description']}
        />

        <Stagger className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature) => (
            <StaggerItem key={feature.title} className="h-full">
              <Card className="group h-full p-6 rounded-2xl border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_20px_45px_-22px_rgba(79,70,229,0.45)]">
                <motion.div
                  className="inline-flex items-center justify-center h-12 w-12 rounded-xl mb-4"
                  style={{
                    color: feature.color,
                    background: `color-mix(in srgb, ${feature.color} 12%, transparent)`,
                  }}
                  whileHover={{ scale: 1.15, rotate: -4 }}
                  whileTap={{ scale: 0.94 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                >
                  <feature.icon className="h-6 w-6" strokeWidth={2} />
                </motion.div>
                <h3 className="font-display text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  )
}

/* TODO(phase-2): Add "compare us vs others" table for clearer differentiation. */
