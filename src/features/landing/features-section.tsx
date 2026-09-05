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

const FEATURES = [
  {
    icon: Video,
    title: 'غرفة افتراضية متكاملة',
    description: 'فيديو + صوت + سبورة تفاعلية + تسجيل تلقائي لكل حصة لمراجعتها لاحقاً.',
    color: 'var(--azure)',
  },
  {
    icon: ShieldCheck,
    title: 'بيئة آمنة للطفل',
    description: 'فلتر للحظر التلقائي للروابط الخارجية، ومراقبة من ولي الأمر لكل جلسة.',
    color: 'var(--emerald-egypt)',
  },
  {
    icon: GraduationCap,
    title: 'معلمون مختصون',
    description: 'نخبة من المعلمين المعتمدين في كل مادة، بخبرة تزيد عن 5 سنوات مع الأطفال.',
    color: 'var(--gold)',
  },
  {
    icon: Wallet,
    title: 'دفع مرن وآمن',
    description: 'PayMob في مصر (بطاقات + فوري + محافظ) و Stripe للخليج. ضمان استرجاع كامل.',
    color: 'var(--kids-red)',
  },
  {
    icon: Languages,
    title: 'عربي أولاً',
    description: 'منصة عربية بالكامل، بمنهج عربي يناسب طبيعة الطفل المصري والعربي.',
    color: 'var(--kids-teal)',
  },
  {
    icon: HeartHandshake,
    title: 'متابعة فردية',
    description: 'تقييم أسبوعي، تقرير شهري، وخطة تعلّم مخصّصة لكل طفل حسب مستواه.',
    color: 'var(--kids-yellow)',
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 lg:py-28 bg-pharaonic relative overflow-hidden">
      <div className="absolute inset-0 bg-hieroglyphs opacity-50 pointer-events-none" aria-hidden />
      <div className="container relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="لماذا إبداع؟"
          title="كل ما يحتاجه طفلك في مكان واحد"
          description="بُنيت المنصة بمعايير عالمية وتصميم عربي يُلامس احتياجات أولياء الأمور في مصر والعالم العربي."
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
