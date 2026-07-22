'use client'

import { motion } from 'framer-motion'
import { Code2, Bot, Calculator, ArrowLeft } from 'lucide-react'
import { TRACKS } from '@/lib/constants'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const ICONS = { Code2, Bot, Calculator }

export function TracksSection() {
  return (
    <section id="tracks" className="py-20 lg:py-28 relative">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="موادنا التعليمية"
          title="ثلاث مسارات تصنع مستقبل طفلك"
          description="نُعلّم مهارات القرن الواحد والعشرين بأسلوب عربي ممتع ومناسب لكل فئة عمرية، مع متابعة فردية وتقييم مستمر."
        />

        <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {TRACKS.map((track, i) => {
            const Icon = ICONS[track.icon as keyof typeof ICONS]
            return (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Card
                  className={cn(
                    'group relative overflow-hidden neu hover-bounce h-full p-7 border-0',
                    'hover:shadow-2xl transition-shadow',
                  )}
                  style={{
                    // @ts-expect-error CSS custom prop
                    '--track-color': track.color,
                  }}
                >
                  {/* Top gradient accent */}
                  <div
                    className="absolute inset-x-0 top-0 h-1.5"
                    style={{ background: `linear-gradient(90deg, ${track.color}, transparent)` }}
                    aria-hidden
                  />

                  {/* Background watermark emoji */}
                  <div className="absolute -bottom-6 -left-6 text-[8rem] opacity-[0.06] pointer-events-none select-none" aria-hidden>
                    {track.emoji}
                  </div>

                  {/* Icon */}
                  <div
                    className="relative inline-flex items-center justify-center h-16 w-16 rounded-2xl mb-5 neu-inset"
                    style={{ color: track.color }}
                  >
                    <Icon className="h-8 w-8" strokeWidth={2} />
                  </div>

                  <div className="relative">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-display text-2xl font-bold">{track.name}</h3>
                      <span className="text-[0.65rem] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-bold">
                        {track.ageRange} سنة
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-5 min-h-[3rem]">
                      {track.description}
                    </p>

                    {/* Topics chips */}
                    <ul className="space-y-2 mb-6">
                      {trackTopics(track.id).map((topic) => (
                        <li key={topic} className="flex items-center gap-2 text-sm">
                          <span
                            className="h-1.5 w-1.5 rounded-full shrink-0"
                            style={{ background: track.color }}
                          />
                          <span className="text-foreground/80">{topic}</span>
                        </li>
                      ))}
                    </ul>

                    <div
                      className="inline-flex items-center gap-1.5 text-sm font-bold transition-transform group-hover:translate-x-[-4px]"
                      style={{ color: track.color }}
                    >
                      اعرف أكثر
                      <ArrowLeft className="h-4 w-4" />
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function trackTopics(id: string): string[] {
  switch (id) {
    case 'PROGRAMMING':
      return ['Python و Scratch', 'تطوير المواقع والألعاب', 'أساسيات الذكاء الاصطناعي', 'مشاريع تطبيقية']
    case 'ROBOTICS':
      return ['Arduino و Raspberry Pi', 'إلكترونيات ومستشعرات', 'برمجة الحركة', 'مسابقات روبوتيكس']
    case 'MENTAL_MATH':
      return ['السوروبان (Abacus)', 'الجمع والطرح السريع', 'الضرب والقسمة ذهنياً', 'تركيز وذاكرة']
    default:
      return []
  }
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
}: {
  eyebrow?: string
  title: string
  description?: string
  align?: 'center' | 'start'
}) {
  return (
    <div className={cn('max-w-3xl', align === 'center' ? 'mx-auto text-center' : 'text-right')}>
      {eyebrow && (
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-block px-3 py-1 rounded-full bg-gold/15 text-gold text-xs font-bold tracking-wide mb-3"
        >
          {eyebrow}
        </motion.span>
      )}
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
        className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight"
      >
        {title}
      </motion.h2>
      {description && (
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-4 text-base lg:text-lg text-muted-foreground leading-relaxed"
        >
          {description}
        </motion.p>
      )}
    </div>
  )
}

/* TODO(phase-2): Link each track card to a dedicated track page with full curriculum. */
