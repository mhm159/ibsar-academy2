import { SiteHeader } from '@/components/site/site-header'
import { SiteFooter } from '@/components/site/site-footer'
import { HeroSlider } from '@/components/site/hero-slider'
import { HeroSection } from '@/components/site/hero-section'
import { TracksSection } from '@/components/site/tracks-section'
import { FeaturesSection } from '@/components/site/features-section'
import { HowItWorksSection } from '@/components/site/how-it-works-section'
import { TeachersSection } from '@/components/site/teachers-section'
import { SessionGallery } from '@/components/site/session-gallery'
import { TestimonialsSection } from '@/components/site/testimonials-section'
import { PricingSection } from '@/components/site/pricing-section'
import { FaqSection } from '@/components/site/faq-section'
import { CtaSection } from '@/components/site/cta-section'

/**
 * Manhal Academy — Landing Page (Phase 1)
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
