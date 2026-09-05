'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Star, Users, Clock, ArrowLeft } from 'lucide-react'
import { useTracks } from '@/lib/tracks-store'
import { useHomeData } from '@/hooks/use-home-data'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SectionHeading } from '@/features/landing/tracks-section'
import { Stagger, StaggerItem } from '@/features/shared/motion-reveal'

export function TeachersSection() {
  const tracks = useTracks()
  const { teachers } = useHomeData()
  return (
    <section id="teachers" className="py-20 lg:py-28 bg-pharaonic relative overflow-hidden">
      <div className="absolute inset-0 bg-hieroglyphs opacity-40 pointer-events-none" aria-hidden />
      <div className="container relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-14">
          <SectionHeading
            align="start"
            eyebrow="نخبة المعلمين"
            title="معلمون يُحبّون ما يفعلون"
            description="نخبة مختارة من المعلمين المعتمدين في كل تخصص، بخبرة طويلة في تعليم الأطفال."
          />
          <Link href="/auth/register/teacher" className="shrink-0">
            <Button variant="outline" className="rounded-full border-border bg-card hover:border-primary/40 gap-1.5">
              انضم كمعلم
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <Stagger className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {teachers.map((teacher) => {
            const teacherTracks = tracks.filter((t) => (teacher.tracks as readonly string[]).includes(t.id))
            return (
              <StaggerItem key={teacher.id} className="h-full">
                <Card className="group h-full p-6 border border-border bg-card rounded-3xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_20px_45px_-22px_rgba(79,70,229,0.45)] text-center">
                  {/* Avatar */}
                  <motion.div
                    className="relative mx-auto mb-4 w-24 h-24"
                    whileHover={{ scale: 1.08, y: -4 }}
                    whileTap={{ scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 16 }}
                  >
                    <div className="absolute inset-0 rounded-full bg-secondary-container/60 blur-md group-hover:blur-lg transition-all" aria-hidden />
                    <div className="relative w-24 h-24 rounded-full bg-secondary-container/60 border border-secondary-container flex items-center justify-center text-5xl">
                      {teacher.avatar}
                    </div>
                    {/* Featured badge */}
                    {teacher.rating >= 4.9 && (
                      <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white text-[0.6rem] font-extrabold px-2 py-0.5 rounded-full shadow-sm">
                        مميّز
                      </span>
                    )}
                  </motion.div>

                  <h3 className="font-display text-lg font-bold mb-0.5">{teacher.name}</h3>
                  <p className="text-xs text-muted-foreground mb-3 min-h-[2.5rem]">
                    {teacher.title}
                  </p>

                  {/* Rating */}
                  <div className="flex items-center justify-center gap-1 mb-3">
                    <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                    <span className="text-sm font-bold">{teacher.rating}</span>
                    <span className="text-xs text-muted-foreground">({teacher.reviews})</span>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 mb-4 pt-3 border-t border-border/50">
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1 text-azure">
                        <Users className="h-3.5 w-3.5" />
                        <span className="text-sm font-bold">{teacher.students}</span>
                      </div>
                      <span className="text-[0.65rem] text-muted-foreground">طالب</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1 text-emerald-egypt">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="text-sm font-bold">{teacher.experienceYears}</span>
                      </div>
                      <span className="text-[0.65rem] text-muted-foreground">سنوات خبرة</span>
                    </div>
                  </div>

                  {/* Track chips */}
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {teacherTracks.map((track) => (
                      <span
                        key={track.id}
                        className="text-[0.65rem] px-2 py-0.5 rounded-full font-bold"
                        style={{
                          color: track.color,
                          background: `color-mix(in srgb, ${track.color} 12%, transparent)`,
                        }}
                      >
                        {track.name}
                      </span>
                    ))}
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

/* TODO(phase-2): Replace FEATURED_TEACHERS with a DB-backed fetch + pagination.
 * TODO(phase-2): Add "view profile" modal with teacher video + availability calendar. */
