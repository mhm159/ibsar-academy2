'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { FAQS } from '@/lib/constants'
import { SectionHeading } from '@/features/landing/tracks-section'
import { Stagger, StaggerItem } from '@/features/shared/motion-reveal'
import { useSiteSettings } from '@/hooks/use-site-settings'

export function FaqSection() {
  const { settings } = useSiteSettings()
  const faqs = FAQS.map((faq, index) => ({
    q: settings[`faq.${index + 1}.q`] || faq.q,
    a: settings[`faq.${index + 1}.a`] || faq.a,
  }))
  return (
    <section id="faq" className="py-20 lg:py-28">
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow={settings['faq.eyebrow']}
          title={settings['faq.title']}
          description={settings['faq.description']}
        />

        <Stagger className="mt-12" gap={0.07}>
          <Accordion type="single" collapsible defaultValue="faq-0" className="space-y-3">
            {faqs.map((faq, i) => (
              <StaggerItem key={i}>
                <AccordionItem
                  value={`faq-${i}`}
                  className="border border-border bg-card rounded-2xl px-5 mb-3 data-[state=open]:border-primary/40 transition-colors overflow-hidden"
                >
                  <AccordionTrigger className="text-right hover:no-underline py-5 text-base font-bold font-display">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              </StaggerItem>
            ))}
          </Accordion>
        </Stagger>

        {/* Contact prompt */}
        <div className="mt-10 text-center">
          <p className="text-sm text-muted-foreground">
            لسه عندك أسئلة؟{' '}
            <a
              href="https://wa.me/201000000000"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-bold hover:underline"
            >
              راسلنا على واتساب
            </a>
          </p>
        </div>
      </div>
    </section>
  )
}

/* TODO(phase-2): Add an admin-managed FAQ CRUD once dashboard lands. */
