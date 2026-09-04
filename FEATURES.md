# مزايا النظام الكاملة — منصة درس | Dars Academy

<div dir="rtl">

منصة تعليمية متكاملة للأطفال في مصر والعالم العربي (البرمجة، الروبوتيكس، الحساب الذهني) — حصص مباشرة، فصل افتراضي، مدفوعات، مكافآت، وحماية محتوى.

</div>

---

## 1. الواجهة العامة (الموقع)

| الميزة | التفاصيل |
|--------|----------|
| **نظام تصميم مصري** | ذهب فرعوني + أزور نيلي + عاجي + خطوط عربية (Tajawal + Cairo) |
| **RTL كامل** | وضع ليلي/نهاري + Neumorphism + Glassmorphism + لمسات هيروغليفية |
| **صفحة هبوط مدفوعة بالبيانات (DB)** | إحصائيات حية، نخبة المعلمين، آراء أولياء الأمور، معرض الحصص، سلايدر إعلاني يُدار من الإدارة |
| **Animations** | Framer Motion: عدّادات متحركة (Count-up) وشبكات متتالية (Staggered grids) |
| **متجاوب بالكامل** | موبايل + تابلت + PWA manifest |
| **Post/مقالات** | مدونة/محتوى تديره الإدارة |

- واجهات عامة: `GET /api/site/home` (طلب واحد مجمّع)، `/stats`، `/teachers`، `/testimonials`، `/slider`، `/gallery`، `/settings`.

---

## 2. المصادقة والحسابات

- تسجيل ودخول عبر **OTP** (واتساب/SMS/بريد — Twilio/Resend) + كلمة مرور.
- جلسات JWT مشفّرة في Cookies.
- **5 أدوار**: ولي أمر، طالب، معلم، مشرف تخصص، إدارة.
- شاشات: `/auth/login`، `/auth/register` (طالب + معلم)، و`/api/auth/*` (send-otp, verify-otp, login, logout, me, register).
- إشعارات منبثقة (Popup) + تفضيلات إشعارات لكل مستخدم.

---

## 3. لوحة الإدارة (`/admin/*`)

| القسم | المسار | الوظيفة |
|-------|--------|---------|
| نظرة عامة | `admin` / `overview` | إحصائيات ومؤشرات حية |
| المستخدمون | `admin/users` | إدارة المستخدمين + تفعيل حسابات المعلمين (`admin/approvals`) |
| المراجعات | `admin/reviews` | اعتماد/إدارة تقييمات أولياء الأمور |
| الحصص | `admin/sessions` | كل الحصص + سجل الجلسات (`SessionLog`) + وسائط الجلسات (`admin/session-media`) |
| التقارير | `admin/reports` | تقارير الأداء عبر الطلاب |
| المالية | `admin/financials` | سجل مالي كامل |
| المعاملات | `admin/transactions` | كل عمليات الدفع والتحويل |
| الحجز المالي | `admin/escrow` | أموال محجوزة حتى اكتمال الحصة |
| السحوبات | `admin/payouts` | اعتماد/رفض/صرف سحوبات المعلمين |
| التسعير والعمولة | `admin/teacher-pricing`، `admin/commission` | تسعير المعلمين ونسب العمولات |
| المشرفون | `admin/supervisors` + `supervisor-payouts` | إدارة المشرفين التخصصيين وسحوباتهم |
| المسارات | `admin/tracks` | إدارة المسارات التعليمية (برمجة/روبوتيكس/حساب ذهني) |
| الإعدادات | `admin/settings` | إعدادات الموقع (SiteSetting) |
| السلايدر | `admin/slider` | إدارة بنرات الصفحة الرئيسية |
| المقالات | `admin/posts` | نشر/إدارة المقالات (بدعم AI) |
| التجريبية | `admin/trials` | متابعة حجوزات الحصص التجريبية + رابط واتساب سريع |
| التنبيهات | `admin/alerts` | تنبيهات سلوكية للطلاب |
| تقارير واتساب | `admin/whatsapp-reports` | معاينة واختبار وإرسال التقارير الأسبوعية بضغطة زر |

### أدوات البيانات (`admin/data-tools`)
- **نسخ احتياطي**: تحميل ملف SQLite لقاعدة البيانات.
- **تصدير Excel (xlsx)**: لأي جدول (طلاب، حصص، حجوزات، معاملات، مراجعات، سحوبات، تقارير، مستخدمين، مشرفين).
- **تصفير البيانات**: بيانات العمل أو كامل البيانات مع تأكيد نصي — دون المساس بالإعدادات والمسارات.

---

## 4. لوحة المعلم (`/teacher/*`)

- **الجدول** (`schedule`): جدول حصصه مع شارة "حصة تجريبية".
- **الطلاب** (`students`): طلابه المحجوزون.
- **الدورات** (`courses`): إدارة المحتوى والدروس (محرر محتوى المعلم).
- **الواجبات** (`homework`): إنشاء وتصحيح الواجبات التفاعلية.
- **المراجعات** (`reviews`): تقييم الطلاب له.
- **السحوبات** (`payouts`): طلبات سحب الأرباح.
- **المحافظ** (`wallets`): الرصيد المالي لحظياً.
- **الملف** (`profile`): بياناته وسعره.
- **إكمال الحصة** (`complete-session`): إنهاء حصة + توليد تقرير.

---

## 5. لوحة المشرف التخصصي (`/supervisor/*`)

- **المالية** (`finances`): أتعاب ثابتة لكل تقرير تُسجَّل تلقائياً، رصيد محسوب لحظياً، سجل أرباح.
- **التقارير** (`reports`): تقارير بأمر واحد (One-click Reports).
- **الحصص** (`sessions`): حضور حصص/انضمام كزائر أو مشرف.
- **السحوبات** (`payout`): طلب سحب أرباحه (اعتماد/رفض/صرف من الإدارة).
- **الكراد** (Krad): منح/خصم بونص أو كراد مع سجل Earning لكل عملية.

---

## 6. لوحة ولي الأمر (`/parent/*`)

| القسم | المسار | الوظيفة |
|-------|--------|---------|
| نظرة عامة | `parent` / `overview` | مؤشرات أبنائه |
| الطلاب | `parent/students` | إضافة/إدارة أبنائه |
| الحصص | `parent/sessions` | حجوزات الحصص + **مشاهدة فيديوهات الشرح المحمية** |
| التقويم | `parent/calendar` | جدول الحصص القادمة |
| التقارير | `parent/reports` | تقارير أداء الأبناء |
| الواجبات | `parent/homework` | متابعة وتقييم الواجبات |
| المدفوعات | `parent/payments` | الدفع + سجل المعاملات |
| الاسترداد | `parent/refunds` | طلبات استرداد الأموال |
| التلعيب | `parent/gamification` | نقاط وشارات الأبناء |
| المتصدرون | `parent/leaderboard` | لوحة المتصدرين |
| التوصيات | `parent/recommendations` | حصص/مسارات مقترحة |
| التجريبية | `parent/trials` (available-slots + book) | حجز حصة تجريبية مجانية في جدول المعلم المتاح |
| التنبيهات | `parent/alerts` | تنبيهات سلوكية |

---

## 7. الفصل الافتراضي ولوحة الطالب (`/classroom/*`)

- **فيديو مباشر**: Daily.co (انضمام مشرف/زائر).
- **محرر الأكواد التفاعلي المشترك (Live Code Sandbox)** — تبويب "💻 الكود":
  - Python عبر Pyodide (WebAssembly) + JavaScript + HTML، تنفيذ في المتصفح بدون سيرفر.
  - مزامنة Real-time عبر Socket.io + زر "قفل الكتابة" للمعلم + نسخ/مشاركة رابط الكود + Ctrl+Enter.
- **السبورة البيضاء** (Excalidraw): غنية بالأدوات، دعم الصور والشارات، حفظ الحالة (`whiteboard`).
- **المحادثة**: Chat فوري عبر WebSocket (`chat`).
- **ألعاب صفية**: نقاط ألعاب فورية (`game-points`).
- **تتبع الانتباه بالذكاء الاصطناعي** (`focus`): TensorFlow.js في المتصفح — تنبيهات لحظية للمعلم + نسبة انتباه إجمالية تصل لأولياء الأمور.
- **الدرس** (`lesson`): محتوى الدرس داخل الغرفة.
- **التسجيل** (`recording`): تسجيل الحصص.
- **سجل الجلسات** (`log`): تسجيل أحداث الغرفة + حل مشكلة ترميز العربية/الإيموجي.
- **الواجبات التفاعلية**: محرر (`interactive-homework-editor`) + مشغّل للطالب (`homework-player`) + تقييم من المعلم وولي الأمر.

---

## 8. نظام المدفوعات

| الميزة | التفاصيل |
|--------|----------|
| **بوابات الدفع** | PayMob (مصر) + Stripe (خليج) عبر `/checkout` |
| **Webhooks** | معالجة تلقائية لعمليات الدفع من البوابتين |
| **Escrow (الحجز المالي)** | حفظ الأموال حتى اكتمال الحصة ثم تحريرها للمعلم |
| **كوبونات الخصم** | `Coupon` — أكواد خصم قابلة للإدارة |
| **الاسترداد** | طلبات `RefundRequest` |
| **أسعار العملات** | `CurrencyRate` للتحويل بين العملات |
| **تدقيق مالي** | `FinancialAudit` — سجل كل عملية مالية |
| **محافظ المعلمين** | `WalletAccount` + `Payout` (سحب الأرباح) |
| **سلة الحجز** | تجميع حصص + دفع دفعة واحدة |

> ملاحظة: تكامل الكود (PayMob/Stripe/Webhooks/Escrow) مكتمل؛ **اشتراك/باقة التخفيض السنوي** غير مربوطة بعد كواجهة دفع.

---

## 9. حماية المحتوى (فيديوهات الشرح)

- **تخزين آمن**: الفيديوهات خارج `public/` في `MEDIA_DIR` — لا تُقدَّم كملفات ثابتة أبداً.
- **روابط موقعة**: `signMediaToken` — HMAC-SHA256 بصفتها `MEDIA_SECRET` (بديل: `OTP_SECRET` ← `NEXTAUTH_SECRET`) وعمر افتراضي ساعة.
- **إصدار الروابط**: `/api/media/token?file=...` بعد تسجيل الدخول فقط.
- **البث المحمي**: `/api/media/file?p&e&s` يتحقق من (1) التوقيع + الانتهاء (2) الصلاحية ثم يبث مع دعم **HTTP Range** (بحث/تقديم) واستجابة 206.
- **فحص الصلاحية** (`canAccessMedia`): أدمن/مشرف/معلم دائماً؛ ولي الأمر فقط إذا كان له طالب بحجز **CONFIRMED**.
- **مشغّل محمي** (`ProtectedVideo`): watermark باسم المشاهد (من `/api/auth/me`، الافتراضي "منصة درس") + `controlsList=nodownload` + تعطيل Picture-in-Picture + منع زر الفأرة الأيمن/السحب.
- **عزل وسائط الحصص**: `SessionMedia` لإدارة ملفات الحصص.

---

## 10. التحفيز والمكافآت (Gamification)

- **نقاط وشارات**: `PointsLog` + `Badge` + `StudentBadge` (نقاط الشارات للطلاب).
- **Streak (سلسلة المواظبة)**: تشجيع المواظبة اليومية.
- **Mystery Box**: صندوق مفاجآت (`mystery-box`).
- **متجر الهدايا**: `RewardItem` + `StudentReward` + استلام (`equip`).
- **لوحة المتصدرين**: ترتيب الطلاب (`leaderboard`).

---

## 11. الذكاء والأمان

- **محرك التوصيات**: `RecommendationLog` — اقتراح حصص/مسارات مخصصة.
- **فلتر الروابط الآمن**: `LinkFilterLog` — حجب الروابط الخطرة في المحادثات.
- **التنبيهات السلوكية**: `BehaviorAlert` — تنبيهات للمعلم/ولي الأمر.
- **التقييم المتبادل**: تقييم متبادل بين المعلم والطالب (`Review`).

---

## 12. التقارير والتواصل

- **تقارير واتساب الأسبوعية** (`/api/reports/send-weekly`): تجميع تقييمات المعلمين (حضور، تفاعل، فهم، واجبات، ملاحظات) + تقدم النقاط + اسم المسار الحقيقي، وإرسالها لولي الأمر عبر Twilio بصورة احترافية.
- **إشعارات** (`notifications.ts` + `notify.ts`): سجل + إرسال عبر القنوات المتاحة (WhatsApp/SMS/Email).
- **`NotificationPreference`**: تحكم المستخدم في القنوات.

---

## 13. النشر والتشغيل

- **Docker**: `Dockerfile` + `docker-compose.yml` مع مجلدات دائمة للبيانات (`/data` لقاعدة البيانات + `MEDIA_DIR=/data/media` للفيديوهات).
- **تثبيت آلي بأمر واحد**: `deploy/install.sh` — يسحب الكود، يولّد أسراراً عشوائية (`NEXTAUTH_SECRET`/`OTP_SECRET`/`MEDIA_SECRET`)، ويشغّل Docker.
- **`.env.example`**: يوثّق كل متغيرات البيئة بما فيها `MEDIA_SECRET` و `MEDIA_DIR`.
- **سكربتات مساعدة**: `fix-accounts.bat`، `ensure-admin.ts`.

---

## 14. نماذج قاعدة البيانات (Prisma)

`User, Teacher, Student, Parent, OtpCode, NotificationLog, Course, CourseLesson, Track, SiteSetting, Session, Booking, Availability, Transaction, ProgressReport, Notification, PointsLog, Badge, StudentBadge, Streak, Review, RecommendationLog, LinkFilterLog, BehaviorAlert, WalletAccount, Payout, Escrow, CurrencyRate, Coupon, RefundRequest, ChatMessage, WhiteboardState, Homework, FinancialAudit, NotificationPreference, RewardItem, StudentReward, Post, Supervisor, SupervisorEarning, SupervisorPayout, SupervisorReport, SessionLog, SiteBanner, SessionMedia`

---

## 15. التقنيات

| الطبقة | التقنية |
|--------|---------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Database | Prisma ORM + SQLite |
| Auth | JWT cookies + OTP (HMAC) |
| Real-time | Socket.io (Chat + Code Sync) + Daily.co (فيديو) |
| Whiteboard | Excalidraw |
| Code Sandbox | Pyodide (Python WebAssembly) |
| State | Zustand + TanStack Query |
| Tables | TanStack Table + shadcn |
| Charts | Recharts |
| Payments | PayMob (مصر) + Stripe (خليج) + Webhooks |
| Excel | SheetJS (xlsx) |
| Focus AI | TensorFlow.js |
| Theme | next-themes |
| Animation | Framer Motion |
| Icons | Lucide React |
