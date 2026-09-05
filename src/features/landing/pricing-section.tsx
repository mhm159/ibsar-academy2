'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Check, Star, Sparkles } from 'lucide-react'
import { PRICING_PLANS, COUNTRIES } from '@/lib/constants'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { SectionHeading } from '@/features/landing/tracks-section'
import { EASE, Stagger, StaggerItem } from '@/features/shared/motion-reveal'
import { useSiteSettings } from '@/hooks/use-site-settings'

export function PricingSection() {
  const [currency, setCurrency] = useState<'EGP' | 'USD'>('EGP')
  const { settings } = useSiteSettings()

  return (
    <section id="pricing" className="py-20 lg:py-28 bg-pharaonic relative overflow-hidden">
      <div className="absolute inset-0 bg-hieroglyphs opacity-40 pointer-events-none" aria-hidden />
      <div className="container relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow={settings['pricing.eyebrow']}
          title={settings['pricing.title']}
          description={settings['pricing.description']}
        />

        {/* Currency toggle */}
        <div className="mt-8 flex justify-center">
          <div className="inline-flex p-1 rounded-full border border-border bg-muted/60">
            <button
              onClick={() => setCurrency('EGP')}
              className={cn(
                'px-5 py-2 rounded-full text-sm font-bold transition-all',
                currency === 'EGP'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              جنيه مصري (EGP)
            </button>
            <button
              onClick={() => setCurrency('USD')}
              className={cn(
                'px-5 py-2 rounded-full text-sm font-bold transition-all',
                currency === 'USD'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              دولار (USD)
            </button>
          </div>
        </div>

        {/* Plans */}
        <Stagger className="mt-12 grid md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {PRICING_PLANS.map((plan) => {
            const price = currency === 'EGP' ? plan.priceEGP : plan.priceUSD
            const period = currency === 'EGP' ? 'شهر' : 'month'
            return (
              <StaggerItem
                key={plan.id}
                className={cn('relative', plan.highlight && 'lg:-mt-4 lg:mb-4')}
              >
                <Card
                  className={cn(
                    'h-full p-7 relative overflow-hidden rounded-3xl transition-all duration-300',
                    plan.highlight
                      ? 'border-2 border-primary bg-card shadow-[0_24px_60px_-24px_rgba(79,70,229,0.45)] lg:scale-[1.02]'
                      : 'border border-border bg-card shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.05)] hover:border-primary/40 hover:-translate-y-1',
                  )}
                >
                  {plan.highlight && (
                    <>
                      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-l from-primary via-[#818CF8] to-primary" />
                      <div className="absolute top-4 left-4 inline-flex items-center gap-1 bg-primary text-white text-[0.65rem] font-extrabold px-2.5 py-1 rounded-full shadow-sm">
                        <Sparkles className="h-3 w-3" />
                        الأكثر اختياراً
                      </div>
                    </>
                  )}

                  <div className="text-center mb-6">
                    <h3 className="font-display text-2xl font-bold mb-1">{plan.name}</h3>
                    <p className="text-xs text-muted-foreground">{plan.sessionsPerMonth} حصص × {plan.sessionDuration} دقيقة</p>
                  </div>

                  {/* Price */}
                  <div className="text-center mb-6">
                    <div className="flex items-end justify-center gap-1">
                      <motion.span
                        key={currency}
                        className="text-5xl font-extrabold font-display text-primary"
                        initial={{ opacity: 0, y: 10, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.4, ease: EASE }}
                      >
                        {price}
                      </motion.span>
                      <span className="text-sm font-bold text-muted-foreground mb-2">
                        {currency} / {period}
                      </span>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-7 min-h-[14rem]">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm">
                        <span
                          className={cn(
                            'inline-flex items-center justify-center h-5 w-5 rounded-full shrink-0 mt-0.5',
                            plan.highlight ? 'bg-primary text-white' : 'bg-emerald-egypt/15 text-emerald-egypt',
                          )}
                        >
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </span>
                        <span className="text-foreground/85 leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link href="/auth/register/student" className="block">
                    <Button
                      className={cn(
                        'w-full h-12 text-base gap-1.5 rounded-full',
                        plan.highlight
                          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90'
                          : 'border-border bg-card hover:border-primary/40',
                      )}
                      variant={plan.highlight ? 'default' : 'outline'}
                    >
                      <Star className="h-4 w-4" />
                      {plan.cta}
                    </Button>
                  </Link>
                </Card>
              </StaggerItem>
            )
          })}
        </Stagger>

        {/* Payment methods */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground mb-4">طرق دفع آمنة ومشفّرة بالكامل</p>
          <div className="flex flex-wrap justify-center items-center gap-3">
            <PaymentBadge label="Visa / Mastercard" />
            <PaymentBadge label="فوري" />
            <PaymentBadge label="فودافون كاش" />
            <PaymentBadge label="PayMob" />
            <PaymentBadge label="Stripe" />
            <PaymentBadge label="مدى" />
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            متاح في: {COUNTRIES.map((c) => c.flag).join(' ')}
          </p>
        </div>
      </div>
    </section>
  )
}

function PaymentBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-4 py-2 rounded-xl border border-border bg-card text-xs font-bold text-foreground/80 shadow-sm">
      {label}
    </span>
  )
}

/* TODO(phase-3): Replace PRICING_PLANS with DB-backed + add dynamic discount/coupon support. */
