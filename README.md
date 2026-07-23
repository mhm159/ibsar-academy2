# أكاديمية إبداع | Ibdaa Academy

<div dir="rtl">

منصة تعليمية متكاملة للأطفال في مصر والعالم العربي لتعلّم البرمجة، الروبوتيكس، والحساب الذهني أونلاين.

## ✨ المرحلة 1 — Foundation (مكتملة)

### المميزات
- 🎨 **نظام تصميم مصري**: ذهب فرعوني + أزور نيلي + عاجي + خطوط عربية (Tajawal + Cairo)
- 🌗 **RTL كامل** + وضع ليلي/نهاري
- 🪟 **Neumorphism + Glassmorphism** + نمط هيروغليفي
- 🏠 **صفحة هبوط متكاملة**: Hero + مسارات + مميزات + معلمون + أسعار + FAQ + CTA
- 🔐 **مصادقة OTP** (هاتف/بريد) + كلمة مرور + جلسات JWT مشفّرة
- 🗄️ **Prisma ORM** (SQLite محلياً، قابل للترحيل إلى PostgreSQL)
- 📱 **متجاوب بالكامل** مع الموبايل + PWA manifest

### المسارات التعليمية
| المسار | العمر | المحتوى |
|--------|-------|---------|
| 💻 البرمجة | 7-16 | Python, Scratch, HTML/CSS, JavaScript, تطوير الألعاب |
| 🤖 الروبوتيكس | 8-16 | Arduino, Raspberry Pi, مستشعرات, مسابقات |
| 🧮 الحساب الذهني | 6-13 | السوروبان, الجمع/الطرح السريع, الضرب الذهني |

</div>

---

## 🚀 التشغيل المحلي

### المتطلبات
- **Node.js 18+** أو **Bun** (يُفضّل للأداء الأسرع)
- **Git**

### الخطوات

```bash
# 1. فك ضغط الملف
unzip ibdaa-academy-phase1.zip -d ibdaa-academy
cd ibdaa-academy

# 2. تثبيت الحزم
bun install
# أو: npm install

# 3. إعداد قاعدة البيانات (SQLite محلية)
bun run db:generate
bun run db:push

# 4. تشغيل خادم التطوير
bun run dev
# أو: npm run dev
```

ثم افتح **http://localhost:3000** في المتصفح.

### حسابات تجريبية
المنصة تدعم التسجيل المباشر. جرّب:
1. اضغط «ابدأ التعلّم» في الصفحة الرئيسية
2. املأ النموذج (اسم + رقم هاتف)
3. ستظهر شاشة OTP — **رمز التطوير يظهر في صندوق أصفر** (للتجربة فقط، في الإنتاج يُرسل عبر SMS/Email فعلًا)
4. أدخل الرمز → سيُنشأ حسابك وتُوجَّه للوحة التحكم

---

## 📤 الرفع على GitHub

بعد فك الضغط محلياً:

```bash
cd ibdaa-academy
git init
git add -A
git commit -m "feat: Phase 1 — Foundation (Ibdaa Academy)"
git branch -M main
git remote add origin https://github.com/mhm159/ibdaa-academy2.git
git push -u origin main
```

---

## 🛠️ التقنيات المستخدمة

| الطبقة | التقنية |
|--------|---------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Database | Prisma ORM + SQLite |
| Auth | JWT cookies + OTP (HMAC) |
| Theme | next-themes |
| Animation | Framer Motion |
| Icons | Lucide React |

---

## 📁 هيكل المشروع

```
src/
├── app/
│   ├── (public)/           # الصفحة الرئيسية
│   ├── auth/               # login, register/student, register/teacher
│   ├── api/auth/           # send-otp, verify-otp, register, login, logout, me
│   ├── parent/             # لوحة ولي الأمر (مرحلة 2)
│   ├── teacher/            # لوحة المعلم (مرحلة 2)
│   └── admin/              # لوحة الإدارة (مرحلة 2)
├── components/
│   ├── site/               # مكونات صفحة الهبوط
│   ├── auth/               # مكونات المصادقة
│   ├── dashboard/          # مكونات لوحات التحكم
│   └── ui/                 # shadcn/ui components
└── lib/
    ├── auth.ts             # OTP + session helpers
    ├── constants.ts        # الثوابت (المسارات، الأسعار، إلخ)
    ├── db.ts               # Prisma client
    └── utils.ts            # أدوات مساعدة
prisma/
└── schema.prisma           # نماذج قاعدة البيانات
```

---

## 🔑 متغيرات البيئة (`.env`)

```env
DATABASE_URL="file:./db/custom.db"

# لتوقيع الجلسات و OTP (غيّرها في الإنتاج!)
NEXTAUTH_SECRET="your-random-secret-here"
OTP_SECRET="your-otp-secret-here"

# اختياري — لتسجيل الدخول عبر Google (مرحلة 2)
# GOOGLE_CLIENT_ID=""
# GOOGLE_CLIENT_SECRET=""

# اختياري — لإرسال SMS حقيقي (مرحلة 1 يستخدم placeholder)
# TWILIO_ACCOUNT_SID=""
# TWILIO_AUTH_TOKEN=""
# TWILIO_PHONE_NUMBER=""

# اختياري — لإرسال البريد الحقيقي
# RESEND_API_KEY=""
```

> ⚠️ في الإنتاج، استخدم أسرار قوية عشوائية (32+ حرف) ولا ترفع ملف `.env` إلى Git.

---

## 🗺️ خريطة الطريق

| المرحلة | المحتوى | الحالة |
|---------|---------|--------|
| **1 — Foundation** | التصميم + الهبوط + المصادقة | ✅ مكتملة |
| **2 — Dashboards** | لوحات: ولي الأمر، معلم، إدارة | ⏳ التالية |
| **3 — Payments** | PayMob (مصر) + Stripe (خليج) + Escrow | 🔜 |
| **4 — Virtual Classroom** | Daily.co + Chat (WebSocket) + Excalidraw | 🔜 |
| **5 — AI & Safety** | محرك توصيات + فلتر روابط + تقييم متبادل | 🔜 |

---

## 📞 الدعم

- 📧 الإيميل: support@ibdaa-academy.com
- 📱 واتساب: +20 100 000 0000

---

<div dir="rtl">

صُنع بـ ❤️ في مصر 🇪🇬

</div>
