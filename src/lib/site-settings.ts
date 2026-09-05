/**
 * Dars Academy — editable front-page site settings
 *
 * Defaults mirror the branding in constants.ts. Admins can override any of
 * these from the dashboard (Settings page) and the public pages pick them up
 * via GET /api/site/settings (falling back to these defaults when empty).
 */

export interface SiteSettingDef {
  key: string
  label: string
  group: 'HERO' | 'JOURNEY' | 'SECTIONS' | 'FOOTER' | 'CTA' | 'GENERAL' | 'PAYMENT'
  type?: 'text' | 'textarea'
  defaultValue: string
}

export const SITE_SETTING_DEFS: SiteSettingDef[] = [
  // Hero
  { key: 'hero.badge', label: 'شارة أعلى العنوان', group: 'HERO', defaultValue: 'تعليم موثوق بلا حدود لكل طالب عربي' },
  { key: 'hero.title.line1', label: 'السطر الأول من العنوان', group: 'HERO', defaultValue: 'المعلم المناسب لطفلك' },
  { key: 'hero.title.line2', label: 'السطر الثاني الملوّن', group: 'HERO', defaultValue: 'أقرب مما تتخيل' },
  { key: 'hero.title.line3', label: 'السطر الثالث (ملوّن)', group: 'HERO', defaultValue: 'والحساب الذهني' },
  { key: 'hero.subtitle', label: 'الوصف تحت العنوان', group: 'HERO', type: 'textarea', defaultValue: 'منصة عربية تجمع الطلاب وذويهم بمعلمين موثوقين في جميع الصفوف والمواد. قارن، اختر، احجز وتابع التقدم من مكان واحد، أينما كنت في الوطن العربي.' },
  { key: 'hero.cta.primary', label: 'زر الدعوة الرئيسي', group: 'HERO', defaultValue: 'ابحث عن معلم الآن' },
  { key: 'hero.cta.secondary', label: 'زر الدعوة الثانوي', group: 'HERO', defaultValue: 'كيف تعمل المنصة؟' },
  { key: 'hero.trust', label: 'سطر الثقة', group: 'HERO', defaultValue: 'ضمان استرجاع المبلغ خلال أول حصتين' },

  // Student journey cards
  { key: 'journey.eyebrow', label: 'شارة قسم رحلة الطالب', group: 'JOURNEY', defaultValue: 'رحلة تعليمية تبدأ باختيار صحيح' },
  { key: 'journey.title', label: 'عنوان قسم رحلة الطالب', group: 'JOURNEY', defaultValue: 'من الاحتياج… إلى معلم يفهم طالبك' },
  { key: 'journey.description', label: 'وصف قسم رحلة الطالب', group: 'JOURNEY', type: 'textarea', defaultValue: 'لا مزيد من البحث العشوائي. نساعدك على الوصول إلى معلم يناسب الصف والمادة والمستوى والميزانية، ثم نبقى معك حتى تظهر النتيجة.' },
  { key: 'journey.1.title', label: 'الكارت الأول — العنوان', group: 'JOURNEY', defaultValue: 'حدّد احتياج الطالب' },
  { key: 'journey.1.text', label: 'الكارت الأول — الوصف', group: 'JOURNEY', type: 'textarea', defaultValue: 'اختر الصف والمادة والهدف، وأخبرنا بالمستوى والوقت الأنسب.' },
  { key: 'journey.2.title', label: 'الكارت الثاني — العنوان', group: 'JOURNEY', defaultValue: 'قارن المعلمين بثقة' },
  { key: 'journey.2.text', label: 'الكارت الثاني — الوصف', group: 'JOURNEY', type: 'textarea', defaultValue: 'ملفات واضحة، خبرات موثقة، تقييمات حقيقية وأسعار تناسب بلدك.' },
  { key: 'journey.3.title', label: 'الكارت الثالث — العنوان', group: 'JOURNEY', defaultValue: 'جرّب ثم احجز' },
  { key: 'journey.3.text', label: 'الكارت الثالث — الوصف', group: 'JOURNEY', type: 'textarea', defaultValue: 'ابدأ بحصة تجريبية، ثم اختر الموعد والخطة المناسبة دون تعقيد.' },
  { key: 'journey.4.title', label: 'الكارت الرابع — العنوان', group: 'JOURNEY', defaultValue: 'تابع التقدم والنتائج' },
  { key: 'journey.4.text', label: 'الكارت الرابع — الوصف', group: 'JOURNEY', type: 'textarea', defaultValue: 'تقارير وحضور وواجبات ومدفوعات في لوحة واحدة لولي الأمر.' },
  { key: 'journey.button', label: 'زر قسم رحلة الطالب', group: 'JOURNEY', defaultValue: 'ابدأ رحلة طالبك' },

  // Main landing sections
  { key: 'tracks.eyebrow', label: 'شارة قسم المواد', group: 'SECTIONS', defaultValue: 'كل الصفوف، كل المواد' },
  { key: 'tracks.title', label: 'عنوان قسم المواد', group: 'SECTIONS', defaultValue: 'دعم دراسي يناسب هدف كل طالب' },
  { key: 'tracks.description', label: 'وصف قسم المواد', group: 'SECTIONS', type: 'textarea', defaultValue: 'من التأسيس والمتابعة المدرسية إلى التفوق والاستعداد للاختبارات؛ اختر المادة والمرحلة ودعنا نقرّب لك المعلم الأنسب.' },
  { key: 'features.eyebrow', label: 'شارة قسم المزايا', group: 'SECTIONS', defaultValue: 'راحة لولي الأمر، فرصة للمعلم' },
  { key: 'features.title', label: 'عنوان قسم المزايا', group: 'SECTIONS', defaultValue: 'وسيط تعليمي يحمي وقتك وقرارك' },
  { key: 'features.description', label: 'وصف قسم المزايا', group: 'SECTIONS', type: 'textarea', defaultValue: 'نبسّط الوصول إلى تعليم خاص موثوق، ونمنح المعلم المحترف أدوات للحجز والتدريس والتحصيل وبناء سمعته.' },
  { key: 'how.eyebrow', label: 'شارة آلية العمل', group: 'SECTIONS', defaultValue: 'ببساطة وشفافية' },
  { key: 'how.title', label: 'عنوان آلية العمل', group: 'SECTIONS', defaultValue: 'أربع خطوات تفصلك عن الحصة المناسبة' },
  { key: 'how.description', label: 'وصف آلية العمل', group: 'SECTIONS', type: 'textarea', defaultValue: 'رحلة واضحة من البحث والمقارنة إلى الحجز والمتابعة، مع دعم يحفظ حق الطالب والمعلم.' },
  { key: 'teachers.eyebrow', label: 'شارة قسم المعلمين', group: 'SECTIONS', defaultValue: 'خبرات من أنحاء الوطن العربي' },
  { key: 'teachers.title', label: 'عنوان قسم المعلمين', group: 'SECTIONS', defaultValue: 'اختر معلماً يناسب شخصية طالبك وهدفه' },
  { key: 'teachers.description', label: 'وصف قسم المعلمين', group: 'SECTIONS', type: 'textarea', defaultValue: 'معلمون لمختلف المناهج والصفوف والمواد، بملفات مهنية وتقييمات تساعدك على اتخاذ قرار مطمئن.' },
  { key: 'testimonials.eyebrow', label: 'شارة آراء المستخدمين', group: 'SECTIONS', defaultValue: 'ثقة تُبنى حصة بعد حصة' },
  { key: 'testimonials.title', label: 'عنوان آراء المستخدمين', group: 'SECTIONS', defaultValue: 'تجارب أولياء أمور وطلاب حقيقية' },
  { key: 'testimonials.description', label: 'وصف آراء المستخدمين', group: 'SECTIONS', type: 'textarea', defaultValue: 'لأن أفضل قرار تعليمي يبدأ بتجربة واضحة وتواصل مستمر ونتيجة يمكن ملاحظتها.' },

  // CTA band
  { key: 'cta.title', label: 'عنوان شريط الدعوة', group: 'CTA', defaultValue: 'لكل طالب معلم مناسب… ولكل معلم فرصة أكبر' },
  { key: 'cta.subtitle', label: 'وصف شريط الدعوة', group: 'CTA', type: 'textarea', defaultValue: 'سواء كنت ولي أمر يبحث عن دعم موثوق، طالباً يريد التقدم، أو معلماً يريد الوصول إلى طلاب جادين؛ مكانك هنا.' },
  { key: 'cta.button', label: 'زر شريط الدعوة', group: 'CTA', defaultValue: 'ابحث عن معلم' },

  // Footer
  { key: 'footer.about', label: 'نبذة عن المنصة (الفوتر)', group: 'FOOTER', type: 'textarea', defaultValue: 'منصة عربية وسيطة تربط الطلاب وأولياء الأمور بمعلمين موثوقين لمختلف الصفوف والمواد، وتدير الحجز والحصص والمتابعة والمدفوعات بأمان.' },
  { key: 'footer.phone', label: 'رقم الدعم (واتساب)', group: 'FOOTER', defaultValue: '+20 100 000 0000' },
  { key: 'footer.email', label: 'بريد الدعم', group: 'FOOTER', defaultValue: 'support@dars-academy.com' },
  { key: 'footer.slogan', label: 'الشعار الترويجي', group: 'FOOTER', defaultValue: 'نُبدِعُ مستقبلَ طفلِك' },

  // Payment / financial info shown to parents at checkout
  { key: 'payment.bankName', label: 'اسم البنك (تحويل بنكي)', group: 'PAYMENT', defaultValue: 'البنك الأهلي المصري' },
  { key: 'payment.bankAccount', label: 'رقم الحساب البنكي', group: 'PAYMENT', defaultValue: '0000 0000 0000 0000' },
  { key: 'payment.bankIban', label: 'الآيبان (IBAN)', group: 'PAYMENT', defaultValue: 'EG00 0000 0000 0000 0000 0000 0' },
  { key: 'payment.walletType', label: 'نوع المحفظة الإلكترونية', group: 'PAYMENT', defaultValue: 'فودافون كاش' },
  { key: 'payment.walletNumber', label: 'رقم المحفظة الإلكترونية', group: 'PAYMENT', defaultValue: '+20 100 000 0000' },
  { key: 'payment.instructions', label: 'رسالة/إرشادات الدفع للعملاء', group: 'PAYMENT', type: 'textarea', defaultValue: 'بعد إتمام الطلب سيصلك تأكيد عبر الواتساب. يمكنك سداد الرسوم عبر التحويل البنكي أو المحافظ الإلكترونية أو البطاقات، وسيتم تفعيل الحصص فور تأكيد الدفع.' },
  { key: 'payment.platformFeePercent', label: 'نسبة عمولة المنصة (٪) — تُخصم من نصيب المعلم', group: 'PAYMENT', defaultValue: '15' },
]

export const DEFAULT_SITE_SETTINGS: Record<string, string> = Object.fromEntries(
  SITE_SETTING_DEFS.map((d) => [d.key, d.defaultValue]),
)

// Values shipped by the old programming-only landing page. Treat only these
// exact values as defaults so existing administrator customizations are kept.
const LEGACY_DEFAULTS: Record<string, string> = {
  'hero.badge': 'منصة تعليمية معتمدة لكل طفل عربي',
  'hero.title.line1': 'نُبدِعُ مستقبلَ طفلِك',
  'hero.title.line2': 'بالبرمجة والروبوتيكس',
  'hero.subtitle': 'منصة عربية متكاملة تُعلّم الأطفال من 6 إلى 16 سنة مهارات المستقبل عبر معلمين مختصين، حصص مباشرة، غرفة افتراضية متكاملة، ونظام دفع آمن محلي ودولي.',
  'hero.cta.primary': 'ابدأ التعلّم مجاناً',
  'hero.cta.secondary': 'شاهد كيف نعمل',
  'cta.title': 'جاهز لتأمين مستقبل طفلك؟',
  'cta.subtitle': 'انضم الآن إلى آلاف العائلات التي تثق بمنصة درس لتعليم أطفالها مهارات القرن الحادي والعشرين.',
  'cta.button': 'سجّل طفلك الآن',
  'footer.about': 'منصة تعليمية متكاملة للأطفال في مصر والعالم العربي لتعلّم البرمجة، الروبوتيكس، والحساب الذهني أونلاين.',
}

/** Merge DB values over defaults (DB wins; unknown keys ignored) */
export function mergeSiteSettings(dbValues: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = { ...DEFAULT_SITE_SETTINGS }
  for (const [k, v] of Object.entries(dbValues)) {
    if (k in out && typeof v === 'string' && LEGACY_DEFAULTS[k] !== v) out[k] = v
  }
  return out
}
