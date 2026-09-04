'use client'

import Link from 'next/link'
import { Mail, Phone, MapPin, Facebook, Instagram, Youtube, Send } from 'lucide-react'
import { Logo } from '@/features/shared/logo'
import { APP } from '@/lib/constants'
import { useSiteSettings } from '@/hooks/use-site-settings'

const FOOTER_LINKS = [
  {
    title: 'الأكاديمية',
    links: [
      { label: 'المواد', href: '#tracks' },
      { label: 'المعلمون', href: '#teachers' },
      { label: 'الأسعار', href: '#pricing' },
      { label: 'كيف نعمل', href: '#how' },
    ],
  },
  {
    title: 'الحساب',
    links: [
      { label: 'تسجيل طالب', href: '/auth/register/student' },
      { label: 'تسجيل معلم', href: '/auth/register/teacher' },
      { label: 'تسجيل الدخول', href: '/auth/login' },
    ],
  },
  {
    title: 'الدعم',
    links: [
      { label: 'الأسئلة الشائعة', href: '#faq' },
      { label: 'واتساب', href: 'https://wa.me/201000000000' },
      { label: 'الدعم الفني', href: `mailto:${APP.supportEmail}` },
    ],
  },
]

const SOCIAL = [
  { icon: Facebook, href: 'https://facebook.com', label: 'فيسبوك' },
  { icon: Instagram, href: 'https://instagram.com', label: 'انستجرام' },
  { icon: Youtube, href: 'https://youtube.com', label: 'يوتيوب' },
  { icon: Send, href: 'https://t.me', label: 'تيليجرام' },
]

export function SiteFooter() {
  const { settings } = useSiteSettings()
  const about = settings['footer.about'] || APP.description
  const phone = settings['footer.phone'] || APP.supportPhone
  const email = settings['footer.email'] || APP.supportEmail
  const slogan = settings['footer.slogan'] || APP.tagline

  return (
    <footer className="mt-auto relative border-t border-white/10 bg-gradient-to-b from-night to-[#101A45] text-white">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid gap-10 lg:gap-8 lg:grid-cols-12">
          {/* Brand column */}
          <div className="lg:col-span-4">
            <Logo size={44} variant="light" />
            <p className="mt-4 text-sm text-white/70 leading-relaxed max-w-sm">
              {about}
            </p>

            {/* Contact */}
            <ul className="mt-5 space-y-2 text-sm">
              <li className="flex items-center gap-2 text-white/70">
                <Phone className="h-4 w-4 text-gold shrink-0" />
                <span dir="ltr">{phone}</span>
              </li>
              <li className="flex items-center gap-2 text-white/70">
                <Mail className="h-4 w-4 text-gold shrink-0" />
                <span dir="ltr">{email}</span>
              </li>
              <li className="flex items-center gap-2 text-white/70">
                <MapPin className="h-4 w-4 text-gold shrink-0" />
                <span>القاهرة، مصر</span>
              </li>
            </ul>
            <p className="mt-3 text-sm font-semibold text-gold">{slogan}</p>
          </div>

          {/* Links columns */}
          <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {FOOTER_LINKS.map((col) => (
              <div key={col.title}>
                <h3 className="font-display font-bold text-sm mb-4 text-white">
                  {col.title}
                </h3>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-white/70 hover:text-gold transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Newsletter + social */}
          <div className="lg:col-span-2">
            <h3 className="font-display font-bold text-sm mb-4 text-white">تابعنا</h3>
            <div className="flex flex-wrap gap-2">
              {SOCIAL.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="inline-flex items-center justify-center h-10 w-10 rounded-xl border border-white/15 bg-white/10 backdrop-blur-md hover:border-gold/40 hover:bg-gold/15 transition-colors"
                >
                  <s.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/60">
          <p>
            © {new Date().getFullYear()} {APP.name}. جميع الحقوق محفوظة.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-gold transition-colors">
              سياسة الخصوصية
            </Link>
            <Link href="/terms" className="hover:text-gold transition-colors">
              الشروط والأحكام
            </Link>
            <span className="hidden sm:inline">صُنع بـ ❤️ في مصر</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

/* TODO(phase-2): Add newsletter subscription form with email capture + welcome flow. */
