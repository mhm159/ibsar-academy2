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
              <figure className="kider-testimonial-card group relative p-6 rounded-[2rem] border border-border bg-card shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_20px_45px_-22px_rgba(16,55,65,.45)] flex flex-col h-full">
                <Quote className="absolute top-4 left-4 h-8 w-8 text-primary/15 group-hover:text-primary/30 transition-colors" aria-hidden />

                {/* Rating */}
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star
                      key={idx}
                      className={`h-4 w-4 ${idx < tm.rating ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground/30'}`}
                    />
                  ))}
                </div>

                <blockquote className="text-sm leading-relaxed text-foreground/90 flex-1">
                  "{tm.text}"
                </blockquote>

                <figcaption className="mt-4 pt-4 border-t border-border/60 flex items-center gap-3">
                  <img src={`/kider/testimonial-${(i % 3) + 1}.jpg`} alt={tm.name} className="size-12 shrink-0 rounded-full border-2 border-primary/20 object-cover" loading="lazy" />
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
