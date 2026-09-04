/**
 * Dars — Brand constants & app-wide config
 * Single source of truth for branding, tracks, currencies, etc.
 */

export const APP = {
  name: "منصة درس",
  nameEn: "Dars Academy",
  tagline: "تجربة تعليمية ملهمة ومبتكرة",
  taglineEn: "Inspiring Educational Experience",
  description:
    "منصة تعليمية رائدة تقدم فصولاً افتراضية تفاعلية، وبرامج تعليمية متطورة تلبي احتياجات الطلاب بمعايير جودة عالية وأساليب مبتكرة.",
  url: "https://dars-academy.com",
  supportEmail: "support@manhal-academy.com",
  supportPhone: "+20 100 000 0000",
  whatsapp: "+20 100 000 0000",
} as const;

/** Educational tracks offered by the academy */
export const TRACKS = [
  {
    id: "PROGRAMMING",
    name: "البرمجة",
    nameEn: "Programming",
    icon: "Code2",
    color: "var(--azure)",
    colorVar: "kids-teal",
    description: "Python، Scratch، HTML/CSS، JavaScript وتطوير الألعاب",
    descriptionEn: "Python, Scratch, HTML/CSS, JavaScript & game dev",
    ageRange: "7-16",
    emoji: "💻",
  },
  {
    id: "ROBOTICS",
    name: "الروبوتيكس",
    nameEn: "Robotics",
    icon: "Bot",
    color: "var(--emerald-egypt)",
    colorVar: "kids-red",
    description: "Arduino، Raspberry Pi، وروبوتات تعليمية تفاعلية",
    descriptionEn: "Arduino, Raspberry Pi & interactive educational robots",
    ageRange: "8-16",
    emoji: "🤖",
  },
  {
    id: "MENTAL_MATH",
    name: "الحساب الذهني",
    nameEn: "Mental Math",
    icon: "Calculator",
    color: "var(--gold)",
    colorVar: "kids-yellow",
    description: "الجمع والطرح السريع، الضرب، والمهارات الذهنية المتقدمة",
    descriptionEn: "Fast arithmetic, multiplication & advanced mental skills",
    ageRange: "6-13",
    emoji: "🧮",
  },
] as const;

export type TrackId = (typeof TRACKS)[number]["id"];

/** User roles */
export const ROLES = {
  ADMIN: "ADMIN",
  TEACHER: "TEACHER",
  PARENT: "PARENT",
  STUDENT: "STUDENT",
  SUPERVISOR: "SUPERVISOR",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/** Countries served */
export const COUNTRIES = [
  { code: "EG", name: "مصر", nameEn: "Egypt", currency: "EGP", flag: "🇪🇬", payment: "paymob" },
  { code: "SA", name: "السعودية", nameEn: "Saudi Arabia", currency: "SAR", flag: "🇸🇦", payment: "stripe" },
  { code: "AE", name: "الإمارات", nameEn: "UAE", currency: "AED", flag: "🇦🇪", payment: "stripe" },
  { code: "KW", name: "الكويت", nameEn: "Kuwait", currency: "KWD", flag: "🇰🇼", payment: "stripe" },
  { code: "QA", name: "قطر", nameEn: "Qatar", currency: "QAR", flag: "🇶🇦", payment: "stripe" },
  { code: "BH", name: "البحرين", nameEn: "Bahrain", currency: "BHD", flag: "🇧🇭", payment: "stripe" },
  { code: "OM", name: "عُمان", nameEn: "Oman", currency: "OMR", flag: "🇴🇲", payment: "stripe" },
  { code: "JO", name: "الأردن", nameEn: "Jordan", currency: "JOD", flag: "🇯🇴", payment: "stripe" },
] as const;

/** Pricing plans (monthly packages) */
export const PRICING_PLANS = [
  {
    id: "starter",
    name: "الباقة الابتدائية",
    nameEn: "Starter",
    priceEGP: 499,
    priceUSD: 29,
    sessionsPerMonth: 4,
    sessionDuration: 60,
    features: [
      "4 حصص أونلاين شهرياً",
      "معلم مختص لكل مادة",
      "وصول لمواد الدورة المسجّلة",
      "تقرير شهري عن تقدم الطفل",
      "دعم فني عبر الواتساب",
    ],
    highlight: false,
    cta: "ابدأ الآن",
  },
  {
    id: "pro",
    name: "الباقة الاحترافية",
    nameEn: "Pro",
    priceEGP: 899,
    priceUSD: 49,
    sessionsPerMonth: 8,
    sessionDuration: 60,
    features: [
      "8 حصص أونلاين شهرياً",
      "اختيار المعلم المفضل",
      "غرفة افتراضية متكاملة (فيديو + سبورة)",
      "شهادة إتمام معتمدة لكل مستوى",
      "تقييم أسبوعي وتقرير مفصّل",
      "جلسات تقوية مجانية",
    ],
    highlight: true,
    cta: "الأكثر شيوعاً",
  },
  {
    id: "elite",
    name: "الباقة النخبة",
    nameEn: "Elite",
    priceEGP: 1499,
    priceUSD: 89,
    sessionsPerMonth: 12,
    sessionDuration: 90,
    features: [
      "12 حصة أونلاين شهرياً (90 دقيقة)",
      "معلم خاص مخصّص بالكامل",
      "خطة تعلم فردية (AI Recommendations)",
      "مشروع تخرّج وعرض نهائي",
      "متابعة من مدير أكاديمي",
      "أولوية الحجز والمواعيد",
      "خصم على الكورسات الصيفية",
    ],
    highlight: false,
    cta: "انضم للنخبة",
  },
] as const;

/** Featured teachers (seed data — will move to DB in phase 2) */
export const FEATURED_TEACHERS = [
  {
    id: "t1",
    name: "م. أحمد الشريف",
    nameEn: "Eng. Ahmed El-Sherif",
    title: "مدرّس البرمجة والذكاء الاصطناعي",
    tracks: ["PROGRAMMING", "ROBOTICS"],
    rating: 4.9,
    reviews: 187,
    students: 340,
    experienceYears: 8,
    avatar: "👨‍💻",
    bio: "مهندس برمجيات سابق في شركات عالمية، متخصص في تعليم الأطفال البرمجة بطريقة ممتعة وعملية.",
  },
  {
    id: "t2",
    name: "أ. منى عبد الله",
    nameEn: "Ms. Mona Abdullah",
    title: "مدرّسة الروبوتيكس والإلكترونيات",
    tracks: ["ROBOTICS"],
    rating: 4.8,
    reviews: 142,
    students: 256,
    experienceYears: 6,
    avatar: "👩‍🔬",
    bio: "حاصلة على ماجستير في الهندسة الكهربائية، شاركت بفرق روبوتيكس في مسابقات عالمية.",
  },
  {
    id: "t3",
    name: "أ. سارة فؤاد",
    nameEn: "Ms. Sara Fouad",
    title: "مدرّسة الحساب الذهني",
    tracks: ["MENTAL_MATH"],
    rating: 5.0,
    reviews: 213,
    students: 410,
    experienceYears: 10,
    avatar: "👩‍🏫",
    bio: "خبيرة في الحساب الذهني والسوروبان، درّبت أكثر من 400 طفل على مهارات الحساب السريع.",
  },
  {
    id: "t4",
    name: "م. كريم مصطفى",
    nameEn: "Eng. Karim Mostafa",
    title: "مدرّس تطوير الألعاب والبرمجة",
    tracks: ["PROGRAMMING"],
    rating: 4.7,
    reviews: 98,
    students: 175,
    experienceYears: 5,
    avatar: "👨‍🎨",
    bio: "مطوّر ألعاب مستقل، يعلّم الأطفال كيف يصنعون ألعابهم الخاصة باستخدام Unity و Godot.",
  },
] as const;

/** Testimonials */
export const TESTIMONIALS = [
  {
    id: "tm1",
    name: "أم محمد",
    location: "القاهرة، مصر",
    text: "ابني محمد (10 سنوات) كان يكره الرياضيات، وبعد 3 شهور مع منصة منهل بقى بيحب الحساب وبيقولي مسائل بنفسه! ربنا يبارك فيكم.",
    rating: 5,
    avatar: "👩",
  },
  {
    id: "tm2",
    name: "خالد العتيبي",
    location: "الرياض، السعودية",
    text: "بنتي تعلّمت أساسيات البرمجة مع Python وصمّمت لعبتها الأولى. جودة المعلمين ممتازة والدفع سهل بالبطاقة السعودية.",
    rating: 5,
    avatar: "👨",
  },
  {
    id: "tm3",
    name: "د. هبة فؤاد",
    location: "الإسكندرية، مصر",
    text: "كطبيبة وأمّ لطفلين، أقدّر الاهتمام بالتفاصيل والجدولة المرنة. ابنتي (8 سنوات) صارت تتنافس مع نفسها في الحساب الذهني.",
    rating: 5,
    avatar: "👩‍⚕️",
  },
  {
    id: "tm4",
    name: "Ahmed Al-Mansouri",
    location: "Dubai, UAE",
    text: "My son learned robotics basics and built his first Arduino project in 2 months. The teachers are patient and the platform is kid-friendly.",
    rating: 5,
    avatar: "👨‍💼",
  },
] as const;

/** Stats for the landing page */
export const STATS = [
  { value: "+5000", label: "طالب وطالبة", labelEn: "Students" },
  { value: "+50", label: "معلم مختص", labelEn: "Teachers" },
  { value: "4.9/5", label: "متوسط التقييم", labelEn: "Avg rating" },
  { value: "+15", label: "دولة عربية", labelEn: "Arab countries" },
] as const;

/** FAQ */
export const FAQS = [
  {
    q: "ما هي الفئات العمرية التي تقبلها الأكاديمية؟",
    a: "نقبل الأطفال من سن 6 إلى 16 عاماً، وتُقسَّم البرامج حسب الفئة العمرية والمستوى. يتم تقييم كل طفل في بداية التسجيل لتحديد المستوى المناسب له.",
  },
  {
    q: "كيف تتم الحصص؟ هل هي مباشرة أم مسجّلة؟",
    a: "جميع الحصص مباشرة (Live) عبر غرفة افتراضية متكاملة تحتوي على فيديو وصوت وسبورة تفاعلية. كما يتم تسجيل الحصة وإتاحتها للطالب لمراجعتها لاحقاً.",
  },
  {
    q: "ما هي طرق الدفع المتاحة؟",
    a: "في مصر: نقبل البطاقات البنكية، فوري، ومحافظ الهاتف (فودافون كاش، أورانج، إتصالات) عبر PayMob. في دول الخليج: نقبل البطاقات عبر Stripe. الدفع آمن ومشفّر بالكامل.",
  },
  {
    q: "هل يمكنني استرجاع المبلغ إذا لم يرتاح طفلي؟",
    a: "نعم، نوفر ضمان استرجاع كامل للمبلغ خلال أول حصتين دون أي أسئلة. رضاك ورضا طفلك أولويتنا.",
  },
  {
    q: "هل يحصل الطفل على شهادة في نهاية الكورس؟",
    a: "نعم، يحصل كل طالب على شهادة إتمام معتمدة من منصة منهل بعد إكمال كل مستوى بنجاح، مع تقرير مفصّل عن مهاراته وتقدّمه.",
  },
  {
    q: "ما المعدل المثالي للحصص أسبوعياً؟",
    a: "ننصح بحصتين أسبوعياً للبرمجة والروبوتيكس، و3 حصص للحساب الذهني للحفاظ على التركيز وعدم الإرهاق. لكن الجدولة مرنة بالكامل حسب احتياج طفلك.",
  },
] as const;

/* TODO(phase-3): Move PRICING_PLANS and FEATURED_TEACHERS into DB-backed models once admin dashboard lands. */
