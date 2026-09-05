'use client'

import { motion } from 'framer-motion'
import { Code2, Bot, Calculator, ArrowLeft } from 'lucide-react'
import { useTracks } from '@/lib/tracks-store'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Stagger, StaggerItem } from '@/features/shared/motion-reveal'
import { useSiteSettings } from '@/hooks/use-site-settings'

const ICONS = { Code2, Bot, Calculator }

export function TracksSection() {
  const tracks = useTracks()
  const { settings } = useSiteSettings()
  return (
    <section id="tracks" className="py-20 lg:py-28 relative">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow={settings['tracks.eyebrow']}
          title={settings['tracks.title']}
          description={settings['tracks.description']}
        />

        <Stagger className="mt-14 grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {tracks.map((track) => {
            const Icon = ICONS[track.icon as keyof typeof ICONS] ?? Code2
            return (
              <StaggerItem key={track.id}>
                <Card
                  className={cn(
                    'group relative overflow-hidden h-full p-7 rounded-3xl border-border bg-card',
                    'shadow-[0_1px_2px_rgba(15,23,42,0.05),0_8px_24px_rgba(15,23,42,0.06)] transition-all duration-300',
                    'hover:-translate-y-1 hover:shadow-[0_20px_45px_-20px_rgba(79,70,229,0.45)] hover:border-primary/30',
                  )}
                  style={{
                    // @ts-expect-error CSS custom prop
                    '--track-color': track.color,
                  }}
                >
                  {/* Top gradient accent */}
                  <div
                    className="absolute inset-x-0 top-0 h-1.5 rounded-t-3xl"
                    style={{ background: `linear-gradient(90deg, ${track.color}, transparent)` }}
                    aria-hidden
                  />

                  {/* Background watermark emoji */}
                  <div className="absolute -bottom-6 -left-6 text-[8rem] opacity-[0.05] pointer-events-none select-none" aria-hidden>
                    {track.emoji}
                  </div>

                  {/* Icon — M3 tonal container */}
                  <div
                    className="relative inline-flex items-center justify-center h-14 w-14 rounded-2xl mb-5"
                    style={{ color: track.color, background: `color-mix(in srgb, ${track.color} 15%, transparent)` }}
                  >
                    <Icon className="h-7 w-7" strokeWidth={2} />
                  </div>

                  <div className="relative">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-display text-2xl font-bold">{track.name}</h3>
                      <span className="text-[0.65rem] px-2 py-0.5 rounded-full bg-surface-variant text-on-surface-variant font-bold">
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
              </StaggerItem>
            )
          })}
        </Stagger>
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
          className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wide mb-3"
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
