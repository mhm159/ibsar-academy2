# الواجهة الأمامية — نظام التصميم "Material Design 3"

> توثيق إعادة تصميم الواجهة الرئيسية (Landing) اعتماداً على نظام **Material Design 3** من جوجل
> مع لوحة ألوان عصرية مناسبة للمنصات التعليمية (Indigo × Teal × Amber)، مع **الحفاظ على كل
> الأقسام والوظائف** — التغيير بصري فقط في الواجهات.
> (هذه الوثيقة تحل محل وثيقة "مطابقة Educate" السابقة.)

## المرجع

- نظام التصميم: **Material Design 3** (Color roles / Elevation / State layers / Shapes)
  `https://m3.material.io/`
- الخطوط: Cairo (عناوين) + Tajawal (نصوص) — عربية حديثة تنسجم مع Roboto/Material.

## الألوان (M3 Color Roles)

التوكنات في `src/app/globals.css` (`:root` ثم `.dark`)، تُقرأ عبر `@theme inline`:

| الدور | فاتح | داكن | الاستخدام |
|---|---|---|---|
| `--primary` | `#4F46E5` | `#818CF8` | الأزرار الرئيسية، الروابط، العناوين المميزة |
| `--primary-container` | `#E0E7FF` | `#3730A3` | حاويات/شرائح بنفسجية ناعمة (chips, icons) |
| `--secondary-container` | `#CCFBF1` | `#134E4A` | لمسات Teal (صور المعلمين، توهج) |
| `--tertiary` / `--tertiary-container` | `#D97706` / `#FEF3C7` | `#FBBF24` / `#78350F` | لمسات كهرمانية (المستوى الدراسي، شارات) |
| `--background` / `--card` | `#F7F8FC` / `#FFFFFF` | `#0F172A` / `#1E293B` | أسطح M3 |
| `--border` / `--ring` | `#E5E8F0` / `#4F46E5` | `#2E3750` / `#818CF8` | حدود وإشارات التركيز |
| `--gold` (legacy) | `#F59E0B` | `#FBBF24` | كهرماني دافئ للنجوم/التقييم (اسم قديم للتسامح) |
| `--azure` (legacy) | `#3B82F6` | `#93C5FD` | أزرق ثانوي |
| `--night` (legacy) | `#0F172A` | `#0F172A` | الحبر للفوتر/النصوص فوق المتدرجات |

## الطبقات (M3 Elevation / Surfaces)

- `.neu` / `.neu-sm` → ظلال مرفوعة بناعمة + حد + `var(--card)` (بدل الـ Neumorphism القديم).
- `.neu-inset` → `var(--surface-variant)` مع ظل داخلي خفيف.
- `.glass` / `.glass-strong` → زجاج M3 بحد `--border` (بدل حدود ذهبية).
- `.bg-pharaonic` (اسم قديم) → تدرج ناعم `primary × secondary-container` فوق الخلفية.
- `.bg-hieroglyphs` (اسم قديم) → نقاط dot-grid بنفسجية خفيفة (M3).
- جديد `.text-gradient-primary` → قراءات بنفسجي→كهرماني لعناوين الهيرو.

## الأقسام المطابقة (كل الأقسام محفوظة)

| القسم | أسلوب M3 |
|---|---|
| الهيدر | Top app bar: سطح `bg-background/80` + blur، روابط بحالة `hover:bg-primary/10`، زر رئيسي كبسولي `bg-primary` |
| الهيرو | خلفية `primary/10 → background` + بلوبات containers، شارة tonal، العنوان بنفسجي→كهرماني، زر Primary صلب، إحصاءات بطاقات مرفوعة |
| المواد | بطاقات `bg-card` + حد + ظل مرتفع، أيقونة tonal حسب لون المسار، شريط علوي ملون |
| المميزات | بطاقات مرفوعة بحالة hover بنفسجية، أيقونات color-mix |
| كيف نعمل | دوائر tonal بألوان الخطوات + خط `via-primary/25` |
| المعلمون | بطاقات `bg-card`، صورة خلف `secondary-container`، شارة "مميّز" كهرمانية، نجوم كهرمانية |
| المعرض | بطاقات بحد + ظل، شارة عنوان بنفسجية، Lightbox حبري |
| التقييمات | بطاقات مرفوعة، أيقونة اقتباس بنفسجية، نجوم كهرمانية، صورة رمز `primary-container` |
| الأسعار | بطاقات مرفوعة؛ المميّز: `border-2 border-primary` + ظل بنفسجي + سعر `text-primary` + زر Primary |
| الأسئلة | أكورديون `bg-card` بحد + `data-[state=open]:border-primary/40` |
| CTA | بانر متدرج Indigo→Violet، زر أبيض بنص بنفسجي |
| الفوتر | حبري غامق (Slate-900) بنصوص بيضاء وروابط/Rواصر كهرمانية |

## ملاحظات التنفيذ

- رموز الألوان القديمة (`gold/azure/night/emerald-egypt/kids-*`) بقيت بأسماءها حتى لا تكسر
  بقية المنتج (لوحات، غرفة الصف، وضع الأطفال)، قيمها أصبحت عصرية.
- وضع الأطفال (`data-mode="kids"`) لم يُمَس — تدرّجاتها ورموزها كاملة.
- `Button` و`Card` (components/ui) عُدّلت حالاتها لتصبح M3 (طبقات تفاعل بنفسجية، ظلال ناعمة).
- تحقق: `tsc --noEmit` و`eslint src` نظيفان بعد كل التعديلات.

## الملفات المعنية
- `src/app/globals.css` — رموز الألوان والطبقات والمساعدات (M3)
- `src/components/ui/button.tsx` — حالات الزر
- `src/features/landing/*` — إعادة تصميم الأقسام
- `src/features/shared/kids-mode-toggle.tsx` — توافق مبدّل الوضع
- `src/app/page.tsx` — التركيب (بدون تغيير)

_آخر تحديث: 2026-09-05 — إعادة تصميم كاملة بواجهة Material Design 3 (البحث عن "الفرونت اند سيئ" → نظام ألوان Indigo×Teal×Amber + أسطح M3)._