#!/usr/bin/env bash
# ============================================================
# منصة منهل — سكربت النشر التلقائي على السيرفر (Oracle Cloud)
#
# شغّل الأمر التالي على السيرفر (Ubuntu) وكل شيء يتم تلقائياً:
#   bash <(curl -fsSL https://raw.githubusercontent.com/mhm159/ibsar-academy2/main/deploy/install.sh)
# أو حمّل السكربت ثم نفّذه:
#   bash install.sh
# ============================================================

set -e

echo ""
echo "======================================================"
echo "   منصة منهل | Manhal Academy — التثبيت التلقائي"
echo "======================================================"

# ---- 1) تثبيت Docker ----
if ! command -v docker >/dev/null 2>&1; then
  echo ""
  echo "[1/4] تثبيت Docker (قد يستغرق دقيقة أو دقيقتين)..."
  sudo apt-get update -y
  sudo apt-get install -y docker.io docker-compose-v2 git curl openssl
  sudo systemctl enable --now docker
  sudo usermod -aG docker "$USER"
else
  echo "[1/4] Docker موجود مسبقاً"
fi

# ---- 2) جلب الكود من GitHub ----
REPO="https://github.com/mhm159/ibsar-academy2.git"
DIR="manhal"
if [ ! -d "$DIR/.git" ]; then
  echo "[2/4] جلب الكود من GitHub..."
  git clone "$REPO" "$DIR"
else
  echo "[2/4] الكود موجود، جلب التحديثات إن وجدت..."
  cd "$DIR"
  git pull --ff-only || echo "  (لا يوجد تحديث جديد)"
  cd ..
fi
cd "$DIR"

# ---- 3) إعداد ملف .env ----
if [ ! -f .env ]; then
  echo "[3/4] إنشاء ملف الإعدادات (أسرار عشوائية + OTP_DEBUG)..."
  cp .env.example .env
  SECRET=$(openssl rand -hex 32)
  OTP=$(openssl rand -hex 32)
  MEDIA=$(openssl rand -hex 32)
  sed -i "s|NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=\"$SECRET\"|" .env
  sed -i "s|OTP_SECRET=.*|OTP_SECRET=\"$OTP\"|" .env
  sed -i "s|MEDIA_SECRET=.*|MEDIA_SECRET=\"$MEDIA\"|" .env
  printf '\n# إظهار رمز الدخول في الصندوق الأصفر أثناء التجربة (امسحه بعد ربط Twilio)\nOTP_DEBUG=1\n' >> .env
else
  echo "[3/4] ملف .env موجود مسبقاً (لم نغيّره)"
fi

# ---- 4) البناء والتشغيل ----
echo "[4/4] البناء والتشغيل — أول مرة قد يستغرق 5-10 دقائق..."
sudo docker compose up -d --build

echo ""
echo "======================================================"
echo "   ✅ تم! المنصة تعمل الآن"
echo "======================================================"
IP=$(curl -s --max-time 5 ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
echo "   افتح في المتصفح:  http://$IP"
echo ""
echo "   الدخول التجريبي:  01000000001   (إدارة)"
echo "   رمز الدخول يظهر في الصندوق الأصفر بالواجهة"
echo ""
echo "   أوامر مفيدة:"
echo "   sudo docker compose logs -f app      # سجلات التطبيق"
echo "   sudo docker compose ps               # حالة الخدمات"
echo "   sudo docker compose down             # إيقاف"
echo "======================================================"
