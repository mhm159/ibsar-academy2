'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowLeft, PlayCircle, Sparkles, ShieldCheck, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTracks } from '@/lib/tracks-store'
import { useSiteSettings } from '@/hooks/use-site-settings'
import { useHomeData } from '@/hooks/use-home-data'
import {
  CountUp,
  EASE,
  blurRevealItem,
  fadeUpItem,
  scaleInItem,
  staggerContainer,
} from './motion-reveal'

export function HeroSection() {
  const { settings } = useSiteSettings()
  const { stats } = useHomeData()
  const sectionRef = useRef<HTMLElement>(null)

  // Gentle parallax drift on the decorative blobs while scrolling away.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })
  const blobY1 = useTransform(scrollYProgress, [0, 1], [0, 140])
  const blobY2 = useTransform(scrollYProgress, [0, 1], [0, -90])
  const blobY3 = useTransform(scrollYProgress, [0, 1], [0, 70])

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-pharaonic pt-12 pb-20 lg:pt-20 lg:pb-32"
    >
      {/* Decorative hieroglyph pattern overlay */}
      <div className="absolute inset-0 bg-hieroglyphs opacity-60 pointer-events-none" aria-hidden />

      {/* Floating decorative blobs (CSS float + scroll parallax) */}
      <motion.div
        className="absolute top-20 -left-16 w-72 h-72 pointer-events-none"
        style={{ y: blobY1 }}
        aria-hidden
      >
        <div className="w-72 h-72 rounded-full bg-gold/20 blur-3xl animate-float-soft" />
      </motion.div>
      <motion.div
        className="absolute bottom-10 -right-16 w-96 h-96 pointer-events-none"
        style={{ y: blobY2 }}
        aria-hidden
      >
        <div
          className="w-96 h-96 rounded-full bg-azure/20 blur-3xl animate-float-soft"
          style={{ animationDelay: '2s' }}
        />
      </motion.div>
      <motion.div
        className="absolute top-1/2 left-1/3 w-64 h-64 pointer-events-none"
        style={{ y: blobY3 }}
        aria-hidden
      >
        <div
          className="w-64 h-64 rounded-full bg-kids-teal/15 blur-3xl animate-float-soft"
          style={{ animationDelay: '4s' }}
        />
      </motion.div>

      <div className="container relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          {/* Text column (RTL: appears on the right) */}
          <motion.div
            className="lg:col-span-7 text-center lg:text-right"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            {/* Badge */}
            <motion.div variants={fadeUpItem}>
              <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-sm font-medium mb-6 border-glow">
                <Sparkles className="h-4 w-4 text-gold" />
                <span>{settings['hero.badge']}</span>
                <span className="hidden sm:inline-flex items-center gap-0.5 text-gold">
                  <Star className="h-3 w-3 fill-current" />
                  <Star className="h-3 w-3 fill-current" />
                  <Star className="h-3 w-3 fill-current" />
                  <Star className="h-3 w-3 fill-current" />
                  <Star className="h-3 w-3 fill-current" />
                </span>
              </div>
            </motion.div>

            {/* Title — lines blur in one after another */}
            <motion.h1
              className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-[1.15] tracking-tight"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.14, delayChildren: 0.1 } },
              }}
            >
              <motion.span variants={blurRevealItem} className="block">
                {settings['hero.title.line1']}
              </motion.span>
              <motion.span variants={blurRevealItem} className="block text-gradient-gold">
                {settings['hero.title.line2']}
              </motion.span>
              <motion.span variants={blurRevealItem} className="block text-gradient-azure-gold">
                {settings['hero.title.line3']}
              </motion.span>
            </motion.h1>

            <motion.p
              variants={fadeUpItem}
              className="mt-6 text-base sm:text-lg lg:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto lg:mx-0"
            >
              {settings['hero.subtitle']}
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={fadeUpItem}
              className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start"
            >
              <Link href="/auth/register/student">
                <Button
                  size="lg"
                  className="w-full sm:w-auto gap-2 text-base h-12 px-7 bg-gradient-to-l from-gold to-[#E8D488] text-night hover:shadow-xl hover:shadow-gold/40 transition-all shine relative overflow-hidden"
                >
                  {settings['hero.cta.primary']}
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="#tracks">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto gap-2 text-base h-12 px-7 glass border-gold/30 hover:bg-gold/10"
                >
                  <PlayCircle className="h-5 w-5 text-azure" />
                  {settings['hero.cta.secondary']}
                </Button>
              </Link>
            </motion.div>

            {/* Trust line */}
            <motion.div
              variants={fadeUpItem}
              className="mt-6 flex items-center justify-center lg:justify-start gap-2 text-sm text-muted-foreground"
            >
              <ShieldCheck className="h-4 w-4 text-emerald-egypt" />
              <span>{settings['hero.trust']}</span>
            </motion.div>

            {/* Stats — count up when they enter the viewport */}
            <motion.dl
              variants={fadeUpItem}
              className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto lg:mx-0"
            >
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 + i * 0.1, duration: 0.5, ease: EASE }}
                  className="neu-sm rounded-2xl p-4 text-center"
                >
                  <dt className="text-2xl sm:text-3xl font-extrabold text-gradient-gold font-display">
                    <CountUp key={stat.value} value={stat.value} />
                  </dt>
                  <dd className="mt-1 text-xs sm:text-sm text-muted-foreground">
                    {stat.label}
                  </dd>
                </motion.div>
              ))}
            </motion.dl>
          </motion.div>

          {/* Visual column (RTL: appears on the left) */}
          <motion.div
            className="lg:col-span-5"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.15, delayChildren: 0.3 } },
            }}
          >
            <motion.div variants={scaleInItem}>
              <HeroVisual />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

/** Floating cards visual — mock classroom + track previews */
function HeroVisual() {
  const tracks = useTracks()
  return (
    <div className="relative aspect-square max-w-md mx-auto">
      {/* Main glass card — classroom mock */}
      <div className="absolute inset-0 glass-strong rounded-[2rem] p-6 neu shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-kids-red" />
            <span className="h-3 w-3 rounded-full bg-kids-yellow" />
            <span className="h-3 w-3 rounded-full bg-emerald-egypt" />
          </div>
          <span className="text-xs text-muted-foreground font-medium">غرفة افتراضية</span>
        </div>

        {/* Video tile */}
        <div className="rounded-2xl bg-gradient-to-br from-azure/20 to-gold/20 p-5 mb-3 neu-inset">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-azure to-emerald-egypt flex items-center justify-center text-2xl shrink-0">
              👩‍🏫
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">أ. سارة فؤاد</p>
              <p className="text-xs text-muted-foreground truncate">الحساب الذهني • المستوى 2</p>
            </div>
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-egypt">
              <span className="h-2 w-2 rounded-full bg-emerald-egypt animate-pulse" />
              مباشر
            </span>
          </div>
        </div>

        {/* Whiteboard mock */}
        <div className="rounded-2xl bg-card p-4 mb-3 neu-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-muted-foreground">السبورة التفاعلية</span>
            <span className="text-[0.65rem] px-2 py-0.5 rounded-full bg-gold/20 text-gold font-bold">5 + 3 = ?</span>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square rounded-md bg-gradient-to-br from-gold/30 to-azure/30 flex items-center justify-center text-lg"
              >
                {i < 5 ? '🟡' : i < 8 ? '🔵' : ''}
              </div>
            ))}
          </div>
        </div>

        {/* Progress bar */}
        <div className="rounded-2xl bg-card p-3 neu-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-muted-foreground">تقدّم الطالب</span>
            <span className="text-xs font-bold text-emerald-egypt">78%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-l from-gold via-emerald-egypt to-azure rounded-full"
              initial={{ width: 0 }}
              animate={{ width: '78%' }}
              transition={{ duration: 1.5, delay: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* Floating track chips */}
      {tracks.map((track, i) => {
        const positions = [
          'top-0 -right-4 sm:-right-8',
          'bottom-16 -left-4 sm:-left-8',
          'bottom-0 right-8',
        ]
        return (
          <motion.div
            key={track.id}
            className={`absolute ${positions[i]} z-10`}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 + i * 0.2, duration: 0.5, type: 'spring' }}
          >
            <div
              className="glass-strong rounded-2xl px-4 py-2.5 flex items-center gap-2 neu-sm hover-bounce cursor-default"
              style={{ borderColor: `color-mix(in srgb, ${track.color} 40%, transparent)` }}
            >
              <span className="text-2xl">{track.emoji}</span>
              <div className="flex flex-col leading-none">
                <span className="text-xs font-bold">{track.name}</span>
                <span className="text-[0.6rem] text-muted-foreground">{track.ageRange} سنة</span>
              </div>
            </div>
          </motion.div>
        )
      })}

      {/* Floating badge */}
      <motion.div
        className="absolute -top-6 left-4 z-20"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        <div className="glass-strong rounded-full px-3 py-1.5 flex items-center gap-1.5 neu-sm">
          <Star className="h-3.5 w-3.5 fill-gold text-gold" />
          <span className="text-xs font-bold">4.9/5 تقييم</span>
        </div>
      </motion.div>
    </div>
  )
}

/* TODO(phase-2): Replace HeroVisual with real Daily.co iframe preview once classroom lands.
 * TODO(phase-3): Add "live spots remaining" dynamic counter tied to availability. */
