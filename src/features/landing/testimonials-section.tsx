'use client'

import { Quote, Star } from 'lucide-react'
import { useHomeData } from '@/hooks/use-home-data'
import { SectionHeading } from '@/features/landing/tracks-section'
import { Stagger, StaggerItem } from '@/features/shared/motion-reveal'

export function TestimonialsSection() {
  const { testimonials } = useHomeData()
  return (
    <section id="testimonials" className="py-20 lg:py-28">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="قصص نجاح"
          title="ماذا يقول أولياء الأمور؟"
          description="آلاف العائلات وثقت بمنصة درس لتعلّم أبنائها. هذه بعض قصصهم."
        />

        <Stagger className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.slice(0, 8).map((tm, i) => (
            <StaggerItem key={tm.id ?? `${tm.name}-${i}`} className="h-full">
              <figure className="group relative p-6 rounded-3xl glass border-gold/15 hover:border-gold/40 hover-bounce transition-colors flex flex-col h-full">
                <Quote className="absolute top-4 left-4 h-8 w-8 text-gold/20 group-hover:text-gold/40 transition-colors" aria-hidden />

                {/* Rating */}
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star
                      key={idx}
                      className={`h-4 w-4 ${idx < tm.rating ? 'fill-gold text-gold' : 'text-muted-foreground/30'}`}
                    />
                  ))}
                </div>

                <blockquote className="text-sm leading-relaxed text-foreground/90 flex-1">
                  "{tm.text}"
                </blockquote>

                <figcaption className="mt-4 pt-4 border-t border-border/50 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gold/30 to-azure/30 flex items-center justify-center text-xl shrink-0">
                    {tm.avatar}
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="text-sm font-bold">{tm.name}</span>
                    <span className="text-xs text-muted-foreground">{tm.location}</span>
                  </div>
                </figcaption>
              </figure>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  )
}

/* TODO(phase-2): Pull testimonials from DB (with photo upload) once admin dashboard lands. */
