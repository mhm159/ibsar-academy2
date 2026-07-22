'use client'

import { motion } from 'framer-motion'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { FAQS } from '@/lib/constants'
import { SectionHeading } from './tracks-section'

export function FaqSection() {
  return (
    <section id="faq" className="py-20 lg:py-28">
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="الأسئلة الشائعة"
          title="عندك سؤال؟ احنا هنا"
          description="جمعنا لك أكثر الأسئلة شيوعاً من أولياء الأمور. لو ما لقيتش إجابتك، تواصل معنا."
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="mt-12"
        >
          <Accordion type="single" collapsible defaultValue="faq-0" className="space-y-3">
            {FAQS.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="glass border border-gold/15 rounded-2xl px-5 mb-3 data-[state=open]:border-gold/40 transition-colors overflow-hidden"
              >
                <AccordionTrigger className="text-right hover:no-underline py-5 text-base font-bold font-display">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>

        {/* Contact prompt */}
        <div className="mt-10 text-center">
          <p className="text-sm text-muted-foreground">
            لسه عندك أسئلة؟{' '}
            <a
              href="https://wa.me/201000000000"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold font-bold hover:underline"
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
