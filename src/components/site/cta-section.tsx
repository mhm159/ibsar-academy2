'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { APP } from '@/lib/constants'

export function CtaSection() {
  return (
    <section className="py-20 lg:py-28 relative overflow-hidden">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="relative rounded-[2rem] lg:rounded-[3rem] overflow-hidden neu"
        >
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-azure via-night to-emerald-egypt" aria-hidden />
          <div className="absolute inset-0 bg-hieroglyphs opacity-30" aria-hidden />
          <div
            className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-gold/30 blur-3xl animate-float-soft"
            aria-hidden
          />
          <div
            className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-kids-teal/20 blur-3xl animate-float-soft"
            style={{ animationDelay: '3s' }}
            aria-hidden
          />

          <div className="relative px-6 py-14 lg:px-16 lg:py-20 text-center text-white">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-md px-4 py-1.5 text-sm font-medium mb-6 border border-white/20">
              <Sparkles className="h-4 w-4 text-kids-yellow" />
              <span>جرّب أول حصة مجاناً</span>
            </div>

            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight max-w-3xl mx-auto">
              مستقبل طفلك يبدأ بحصة تجريبية مجانية
            </h2>
            <p className="mt-5 text-base lg:text-lg text-white/80 max-w-2xl mx-auto leading-relaxed">
              سجّل الآن واحصل على جلسة تقييم مجانية (15 دقيقة) مع أحد معلمينا المختصين.
              بدون التزام، بدون رسوم، فقط قرار واعٍ لمستقبل طفلك.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Link href="/auth/register/student">
                <Button
                  size="lg"
                  className="w-full sm:w-auto gap-2 text-base h-12 px-8 bg-gradient-to-l from-gold to-[#E8D488] text-night hover:shadow-xl hover:shadow-gold/50 transition-all shine relative overflow-hidden"
                >
                  سجّل طفلك الآن
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/auth/register/teacher">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto gap-2 text-base h-12 px-8 bg-white/10 backdrop-blur-md border-white/30 text-white hover:bg-white/20 hover:text-white"
                >
                  انضم كمعلم
                </Button>
              </Link>
            </div>

            <p className="mt-6 text-xs text-white/60">
              {APP.supportPhone} • {APP.supportEmail}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

/* TODO(phase-3): Add dynamic promo banners (campaigns) tied to seasons (back-to-school, Ramadan). */
