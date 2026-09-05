'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { APP } from '@/lib/constants'
import { useSiteSettings } from '@/hooks/use-site-settings'
import { EASE, fadeUpItem } from '@/features/shared/motion-reveal'

export function CtaSection() {
  const { settings } = useSiteSettings()
  const title = settings['cta.title'] || 'مستقبل طفلك يبدأ بحصة تجريبية مجانية'
  const subtitle = settings['cta.subtitle'] || ''
  const buttonLabel = settings['cta.button'] || 'سجّل طفلك الآن'

  return (
    <section className="py-20 lg:py-28 relative overflow-hidden">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={{
            hidden: { opacity: 0, scale: 0.97 },
            visible: {
              opacity: 1,
              scale: 1,
              transition: { duration: 0.6, ease: EASE, staggerChildren: 0.12, delayChildren: 0.15 },
            },
          }}
          className="relative rounded-[2rem] lg:rounded-[3rem] overflow-hidden shadow-[0_40px_80px_-40px_rgba(79,70,229,0.55)]"
        >
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-[#4338CA] to-[#7C3AED]" aria-hidden />
          <div className="absolute inset-0 bg-hieroglyphs opacity-20" aria-hidden />
          <div
            className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/10 blur-3xl animate-float-soft"
            aria-hidden
          />
          <div
            className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-tertiary-container/40 blur-3xl animate-float-soft"
            style={{ animationDelay: '3s' }}
            aria-hidden
          />

          <div className="relative px-6 py-14 lg:px-16 lg:py-20 text-center text-white">
            <motion.div
              variants={fadeUpItem}
              className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-md px-4 py-1.5 text-sm font-medium mb-6 border border-white/20"
            >
              <Sparkles className="h-4 w-4 text-amber-300" />
              <span>جرّب أول حصة مجاناً</span>
            </motion.div>

            <motion.h2
              variants={fadeUpItem}
              className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight max-w-3xl mx-auto"
            >
              {title}
            </motion.h2>
            {subtitle && (
              <motion.p
                variants={fadeUpItem}
                className="mt-5 text-base lg:text-lg text-white/80 max-w-2xl mx-auto leading-relaxed"
              >
                {subtitle}
              </motion.p>
            )}

            <motion.div
              variants={fadeUpItem}
              className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center"
            >
              <Link href="/auth/register/student">
                <Button
                  size="lg"
                  className="w-full sm:w-auto gap-2 text-base h-12 px-8 rounded-full bg-white text-primary shadow-xl shadow-black/20 hover:bg-white/90 transition-all"
                >
                  {buttonLabel}
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/auth/register/teacher">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto gap-2 text-base h-12 px-8 rounded-full bg-white/10 backdrop-blur-md border-white/30 text-white hover:bg-white/20 hover:text-white"
                >
                  انضم كمعلم
                </Button>
              </Link>
            </motion.div>

            <motion.p variants={fadeUpItem} className="mt-6 text-xs text-white/60">
              {APP.supportPhone} • {APP.supportEmail}
            </motion.p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

/* TODO(phase-3): Add dynamic promo banners (campaigns) tied to seasons (back-to-school, Ramadan). */
