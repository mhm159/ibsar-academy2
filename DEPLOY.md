# دليل نشر منصة منهل على استضافة مجانية

هذا الدليل يشرح خطوتين:
1. **تشغيل كامل المنصة محلياً عبر Docker** (للتأكد قبل الرفع).
2. **النشر على Oracle Cloud Free Tier** (سيرفر دائم مجاني — الأنسب لهذه المنصة لأنها تحتاج SQLite + ملفات رفع + WebSocket + تشغيلاً مستمراً).

> لماذا Oracle Cloud وليس Vercel/Render؟
> المنصة تستخدم SQLite في ملف محلي، ومجلد `public/uploads` للمرفقات، وخدمة socket.io، وكلها تحتاج **قرصاً دائماً** وعملية Node طويلة الأمد. Vercel/serverless لا يناسبها، وRender المجاني قرصه مؤقت ويغفو بعد 15 دقيقة.

---

## 1) التشغيل محلياً عبر Docker (اختبار سريع)

المتطلبات: Docker Desktop مثبّت ومُفعّل على جهازك.

```powershell
# من جذر المشروع
Copy-Item .env.example .env
# افتح .env وعدّل القيم:
#   NEXTAUTH_SECRET و OTP_SECRET بقيم عشوائية قوية
#   وأضف السطر: OTP_DEBUG=1   (ليظهر رمز الدخول في الصندوق الأصفر)

docker compose up -d --build
```

بعد اكتمال البناء افتح المتصفح على **http://localhost** (Caddy يعيد التوجيه):

| المسار | ما يظهر |
| --- | --- |
| `http://localhost` | الصفحة الرئيسية (منصة منهل) |
| `http://localhost/api/site/settings` | إعدادات الموقع (JSON) |
| خدمة الغرفة الافتراضية | تعمل داخل حاوية `socket` (منفذ 3003) — فحصها عبر مصافحة socket.io ويعيد 200 |

الدخول التجريبي: `01000000001` (إدارة)، `01000000010` (معلم)، `01012345678` (ولي أمر) — رمز OTP يظهر في الصندوق الأصفر لأن `OTP_DEBUG=1`.

البيانات محفوظة في وحدات التخزين `manhal-db` و`manhal-uploads` وتبقى بعد إعادة التشغيل. لإيقاف: `docker compose down`.

---

## 2) النشر على Oracle Cloud Free Tier

### 2.1 إنشاء الحساب والسيرفر
1. سجّل في https://cloud.oracle.com (يلزم بطاقة للتوثيق فقط — **لن تُخصم منها**).
2. اختر Home Region يدعم ARM (مثلاً: UK South-London أو US East-Ashburn).
3. Compute → Instances → Create Instance:
   - Image: **Canonical Ubuntu 24.04 (aarch64 / ARM)**.
   - Shape: **VM.Standard.A1.Flex** (Ampere ARM) — خصّص **2 OCPU / 12 GB RAM** (أو 4/24 حسب التوفر).
   - Boot volume: **200 GB**.
   - أضف مفاتيح SSH (على Windows: `ssh-keygen -t rsa -b 4096` ثم ارفع المفتاح العام).
   - إن ظهرت `Out of host capacity`، غيّر Availability Domain أو قلّل إلى 1 OCPU / 6GB ثم كبّر لاحقاً.
4. بعد الإقلاع، افتح المنفذ 80 في جدار النار:
   - VCN → Security List → Add Ingress Rule: المصدر `0.0.0.0/0`، المنفذ **80** (TCP).

### 2.2 تجهيز السيرفر

#### الطريقة الأسرع — أمر واحد (موصى به)
بعد الدخول على السيرفر بـ SSH، الصق هذا الأمر واضغط Enter — يثبّت Docker ويجلب الكود ويركّب كل شيء تلقائياً:

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/mhm159/ibsar-academy2/main/deploy/install.sh)
```

> أول تشغيل يستغرق 5-10 دقائق (تثبيت + بناء). في النهاية سيطبع رابط `http://<IP>` لتفتحه في المتصفح.

#### الطريقة اليدوية (للتحكم الكامل)
```bash
# الدخول (من PowerShell في Windows)
ssh ubuntu@<PUBLIC_IP>

# تثبيت Docker + Compose
sudo apt update && sudo apt install -y docker.io docker-compose-v2
sudo systemctl enable --now docker
sudo usermod -aG docker ubuntu   # ثم سجّل الخروج والدخول مجدداً

# جلب المشروع
git clone https://github.com/mhm159/ibsar-academy2.git manhal
cd manhal

# إعداد المتغيرات
cp .env.example .env
nano .env
#   NEXTAUTH_SECRET و OTP_SECRET: قيم عشوائية قوية (openssl rand -hex 32)
#   OTP_DEBUG=1            (للتجربة — امسحه عند الربط الفعلي بـ Twilio)
#   TWILIO_* ، PAYMOB_* ، STRIPE_* : تُترك فارغة حالياً (Sandbox)

# البناء والتشغيل
docker compose up -d --build
```

### 2.3 التحقق
```bash
docker compose ps                 # الثلاث خدمات running
curl -s http://localhost/api/site/settings   # يجب أن يعيد JSON
curl -s http://localhost/ | head -20         # الصفحة الرئيسية
```

افتح في المتصفح: **http://<PUBLIC_IP>**

### 2.4 ربط دومين + HTTPS (اختياري)
- أضف سجل A باسم الدومين إلى `<PUBLIC_IP>`.
- في `deploy/Caddyfile` أزل التعليق عن كتلة `example.com` وضع دومينك.
- `docker compose up -d --build caddy` (Caddy يحصل على شهادة Let's Encrypt تلقائياً).

### 2.5 تحديث النسخة لاحقاً
```bash
git pull
docker compose up -d --build
```

---

## 3) اختبار شحن وسحب الأموال

1. **شحن رصيد**: ادخل كـ `01000000001` (إدارة) → اذهب لقسم الدفع → اختر طريقة الدفع. بدون مفاتيح PayMob/Stripe تعمل المنصة بوضع **Sandbox** (محاكاة نجاح الدفع عبر `/payment/sandbox`).
2. **سحب الأموال**: من لوحة المشرف → طلبات السحب → اعتمد/اجمع (هي عمليات داخلية على قاعدة البيانات).
3. عند الرغبة بالدفع الحقيقي: ضع مفاتيح **PayMob** (مصر) أو **Stripe** (خليج) في `.env` وأعد التشغيل، وأضف `TWILIO_*` لرسائل WhatsApp الحقيقية، وامسح `OTP_DEBUG=1`.

---

## ملاحظات أمنية للتجربة
- المنصة مفتوحة على المنفذ 80 بلا HTTPS أثناء التجربة — لا تستخدمها بأرقام حقيقية ولا بمعلومات شخصية حقيقية.
- بعد الربط الفعلي بالدفع ورسائل SMS/WhatsApp، امسح `OTP_DEBUG=1` وضع كلمات سر قوية.
- عمل نسخة احتياطية دورية: `docker compose exec app cp /data/custom.db /tmp/backup.db` ثم اسحب الملف.
