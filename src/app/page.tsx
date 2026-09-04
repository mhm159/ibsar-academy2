import { SiteHeader } from '@/features/landing/site-header'
import { SiteFooter } from '@/features/landing/site-footer'
import { HeroSlider } from '@/features/landing/hero-slider'
import { HeroSection } from '@/features/landing/hero-section'
import { TracksSection } from '@/features/landing/tracks-section'
import { FeaturesSection } from '@/features/landing/features-section'
import { HowItWorksSection } from '@/features/landing/how-it-works-section'
import { TeachersSection } from '@/features/landing/teachers-section'
import { SessionGallery } from '@/features/landing/session-gallery'
import { TestimonialsSection } from '@/features/landing/testimonials-section'
import { PricingSection } from '@/features/landing/pricing-section'
import { FaqSection } from '@/features/landing/faq-section'
import { CtaSection } from '@/features/landing/cta-section'

/**
 * Dars Academy — Landing Page (Phase 1)
 *
 * Composes all public sections in a single scrollable page.
 * Footer is sticky-to-bottom via the `mt-auto` on the footer + min-h-screen wrapper.
 */
export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <HeroSlider />
        <HeroSection />
        <TracksSection />
        <FeaturesSection />
        <HowItWorksSection />
        <TeachersSection />
        <SessionGallery />
        <TestimonialsSection />
        <PricingSection />
        <FaqSection />
        <CtaSection />
      </main>
      <SiteFooter />
    </div>
  )
}

/* TODO(phase-2): Add server-side fetch of featured teachers from DB before rendering.
 * TODO(phase-3): Inject JSON-LD structured data (Course, Organization, FAQPage) for SEO. */
