/**
 * Ibdaa Academy — editable front-page site settings
 *
 * Defaults mirror the branding in constants.ts. Admins can override any of
 * these from the dashboard (Settings page) and the public pages pick them up
 * via GET /api/site/settings (falling back to these defaults when empty).
 */

export interface SiteSettingDef {
  key: string
  label: string
  group: 'HERO' | 'FOOTER' | 'CTA' | 'GENERAL'
  type?: 'text' | 'textarea'
  defaultValue: string
}

export const SITE_SETTING_DEFS: SiteSettingDef[] = [
  // Hero
  { key: 'hero.badge', label: 'شارة أعلى العنوان', group: 'HERO', defaultValue: 'منصة تعليمية معتمدة لكل طفل عربي' },
  { key: 'hero.title.line1', label: 'السطر الأول من العنوان', group: 'HERO', defaultValue: 'نُبدِعُ مستقبلَ طفلِك' },
  { key: 'hero.title.line2', label: 'السطر الثاني (ملوّن ذهبي)', group: 'HERO', defaultValue: 'بالبرمجة والروبوتيكس' },
  { key: 'hero.title.line3', label: 'السطر الثالث (ملوّن)', group: 'HERO', defaultValue: 'والحساب الذهني' },
  { key: 'hero.subtitle', label: 'الوصف تحت العنوان', group: 'HERO', type: 'textarea', defaultValue: 'منصة عربية متكاملة تُعلّم الأطفال من 6 إلى 16 سنة مهارات المستقبل عبر معلمين مختصين، حصص مباشرة، غرفة افتراضية متكاملة، ونظام دفع آمن محلي ودولي.' },
  { key: 'hero.cta.primary', label: 'زر الدعوة الرئيسي', group: 'HERO', defaultValue: 'ابدأ التعلّم مجاناً' },
  { key: 'hero.cta.secondary', label: 'زر الدعوة الثانوي', group: 'HERO', defaultValue: 'شاهد كيف نعمل' },
  { key: 'hero.trust', label: 'سطر الثقة', group: 'HERO', defaultValue: 'ضمان استرجاع المبلغ خلال أول حصتين' },

  // CTA band
  { key: 'cta.title', label: 'عنوان شريط الدعوة', group: 'CTA', defaultValue: 'جاهز لتأمين مستقبل طفلك؟' },
  { key: 'cta.subtitle', label: 'وصف شريط الدعوة', group: 'CTA', type: 'textarea', defaultValue: 'انضم الآن إلى آلاف العائلات التي تثق بأكاديمية إبداع لتعليم أطفالها مهارات القرن الحادي والعشرين.' },
  { key: 'cta.button', label: 'زر شريط الدعوة', group: 'CTA', defaultValue: 'سجّل طفلك الآن' },

  // Footer
  { key: 'footer.about', label: 'نبذة عن الأكاديمية (الفوتر)', group: 'FOOTER', type: 'textarea', defaultValue: 'منصة تعليمية متكاملة للأطفال في مصر والعالم العربي لتعلّم البرمجة، الروبوتيكس، والحساب الذهني أونلاين.' },
  { key: 'footer.phone', label: 'رقم الدعم (واتساب)', group: 'FOOTER', defaultValue: '+20 100 000 0000' },
  { key: 'footer.email', label: 'بريد الدعم', group: 'FOOTER', defaultValue: 'support@ibdaa-academy.com' },
  { key: 'footer.slogan', label: 'الشعار الترويجي', group: 'FOOTER', defaultValue: 'نُبدِعُ مستقبلَ طفلِك' },
]

export const DEFAULT_SITE_SETTINGS: Record<string, string> = Object.fromEntries(
  SITE_SETTING_DEFS.map((d) => [d.key, d.defaultValue]),
)

/** Merge DB values over defaults (DB wins; unknown keys ignored) */
export function mergeSiteSettings(dbValues: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = { ...DEFAULT_SITE_SETTINGS }
  for (const [k, v] of Object.entries(dbValues)) {
    if (k in out && typeof v === 'string') out[k] = v
  }
  return out
}
