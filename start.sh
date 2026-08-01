#!/bin/bash
# أكاديمية إبداع - تشغيل المنصة الكاملة من ملف واحد (Linux/Mac)

set -e

# ألوان
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo ""
echo "  ╔══════════════════════════════════════════════════════════╗"
echo "  ║                                                          ║"
echo "  ║          🎓 أكاديمية إبداع | Ibdaa Academy               ║"
echo "  ║          تشغيل المنصة الكاملة من ملف واحد                ║"
echo "  ║                                                          ║"
echo "  ╚══════════════════════════════════════════════════════════╝"
echo ""

# التحقق من Node.js
if ! command -v node &> /dev/null; then
    echo -e "  ${RED}❌ Node.js غير مثبت. حمل من: https://nodejs.org${NC}"
    echo ""
    exit 1
fi

# التحقق من Bun
USE_BUN=0
if command -v bun &> /dev/null; then
    echo -e "  ${GREEN}✅ Bun مثبت - سيتم استخدامه للأداء الأسرع${NC}"
    USE_BUN=1
    PKG_MGR="bun"
else
    echo -e "  ${YELLOW}⚠️  Bun غير مثبت - سيتم استخدام npm${NC}"
    PKG_MGR="npm"
fi

# التحقق من npx
if [ "$USE_BUN" -eq 0 ] && ! command -v npx &> /dev/null; then
    echo -e "  ${RED}❌ npx غير متاح. تأكد من تثبيت Node.js بشكل صحيح${NC}"
    exit 1
fi

echo ""

# التحقق من .env
if [ ! -f ".env" ]; then
    echo -e "  ${CYAN}📝 إنشاء ملف .env من القالب...${NC}"
    cp .env.example .env
    echo -e "  ${GREEN}✅ تم إنشاء .env - عدّل القيم قبل الإنتاج${NC}"
    echo ""
fi

# الخطوة 1: تثبيت الحزم
echo -e "  ${BLUE}══════════════════════════════════════════════════════════${NC}"
echo -e "  ${YELLOW}📦 الخطوة 1/5: تثبيت الحزم...${NC}"
echo -e "  ${BLUE}══════════════════════════════════════════════════════════${NC}"
if [ "$USE_BUN" -eq 1 ]; then
    bun install
else
    npm install
fi
echo -e "  ${GREEN}✅ تم تثبيت الحزم${NC}"
echo ""

# الخطوة 2: توليد Prisma
echo -e "  ${BLUE}══════════════════════════════════════════════════════════${NC}"
echo -e "  ${YELLOW}🗄️  الخطوة 2/5: توليد Prisma Client...${NC}"
echo -e "  ${BLUE}══════════════════════════════════════════════════════════${NC}"
if [ "$USE_BUN" -eq 1 ]; then
    bun run db:generate
else
    npx prisma generate
fi
echo -e "  ${GREEN}✅ تم توليد Prisma Client${NC}"
echo ""

# الخطوة 3: قاعدة البيانات
echo -e "  ${BLUE}══════════════════════════════════════════════════════════${NC}"
echo -e "  ${YELLOW}💾 الخطوة 3/5: إنشاء قاعدة البيانات...${NC}"
echo -e "  ${BLUE}══════════════════════════════════════════════════════════${NC}"
if [ "$USE_BUN" -eq 1 ]; then
    bun run db:push
else
    npx prisma db push --accept-data-loss
fi
echo -e "  ${GREEN}✅ تم إنشاء قاعدة البيانات${NC}"
echo ""

# الخطوة 4: بذر البيانات
echo -e "  ${BLUE}══════════════════════════════════════════════════════════${NC}"
echo -e "  ${YELLOW}🌱 الخطوة 4/5: بذر البيانات الأولية...${NC}"
echo -e "  ${BLUE}══════════════════════════════════════════════════════════${NC}"
if [ "$USE_BUN" -eq 1 ]; then
    bun run prisma/seed.ts
echo -e "${YELLOW}🌱 الخطوة 4/5: بذر البيانات الأولية...${NC}"
if [ -f "prisma/db/custom.db" ]; then
    echo -e "${GREEN}✅ قاعدة البيانات موجودة مسبقاً، سيتم الحفاظ على بياناتك وتخطي عملية بذر البيانات.${NC}\n"
else
    echo -e "${YELLOW}🌱 نقوم بزرع البيانات لأول مرة...${NC}"
    if [ "$USE_BUN" -eq 1 ]; then
        bun run prisma/seed.ts
        bun run prisma/seed-payments.ts 2>/dev/null
        bun run prisma/seed-gamification.ts 2>/dev/null
    else
        npx tsx prisma/seed.ts
        npx tsx prisma/seed-payments.ts 2>/dev/null
        npx tsx prisma/seed-gamification.ts 2>/dev/null
    fi
    echo -e "${GREEN}✅ تم بذر البيانات${NC}\n"
fi
echo ""

# الخطوة 5: تشغيل الخوادم
echo -e "  ${BLUE}══════════════════════════════════════════════════════════${NC}"
echo -e "  ${YELLOW}🚀 الخطوة 5/5: تشغيل الخوادم...${NC}"
echo -e "  ${BLUE}══════════════════════════════════════════════════════════${NC}"
echo ""

# تشغيل خدمة الغرفة الافتراضية في الخلفية
echo -e "  ${PURPLE}📡 تشغيل خدمة الغرفة الافتراضية (Port 3003)...${NC}"
cd mini-services/classroom-service
if [ "$USE_BUN" -eq 1 ]; then
    bun install 2>/dev/null || true
    bun run dev &
    CLASSROOM_PID=$!
else
    npm install 2>/dev/null || true
    npm run dev &
    CLASSROOM_PID=$!
fi
cd ../..

echo -e "  ${CYAN}⏳ انتظار 3 ثوانٍ...${NC}"
sleep 3

# تشغيل المنصة الرئيسية
echo ""
echo -e "  ${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "  ${GREEN}║                                                          ║${NC}"
echo -e "  ${GREEN}║  ✅ المنصة جاهزة!                                        ║${NC}"
echo -e "  ${GREEN}║                                                          ║${NC}"
echo -e "  ${GREEN}║  🌐 افتح المتصفح على:  http://localhost:3000             ║${NC}"
echo -e "  ${GREEN}║                                                          ║${NC}"
echo -e "  ${GREEN}║  📋 حسابات تجريبية:                                     ║${NC}"
echo -e "  ${GREEN}║                                                          ║${NC}"
echo -e "  ${GREEN}║  👑 إدارة:      01000000001                              ║${NC}"
echo -e "  ${GREEN}║  👩‍🏫 معلم:       01000000010                              ║${NC}"
echo -e "  ${GREEN}║  👨‍👩‍👧 ولي أمر:   01012345678                              ║${NC}"
echo -e "  ${GREEN}║                                                          ║${NC}"
echo -e "  ${GREEN}║  💡 رمز OTP سيظهر في صندوق أصفر بالواجهة                 ║${NC}"
echo -e "  ${GREEN}║                                                          ║${NC}"
echo -e "  ${GREEN}║  🛑 لإيقاف المنصة: اضغط Ctrl+C                          ║${NC}"
echo -e "  ${GREEN}║                                                          ║${NC}"
echo -e "  ${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# التقاط Ctrl+C لقتل العمليتين
cleanup() {
    echo ""
    echo -e "  ${RED}🛑 إيقاف المنصة...${NC}"
    kill $CLASSROOM_PID 2>/dev/null || true
    echo -e "  ${GREEN}✅ تم الإيقاف${NC}"
    exit 0
}
trap cleanup INT TERM

# تشغيل المنصة الرئيسية في المقدمة
if [ "$USE_BUN" -eq 1 ]; then
    bun run dev
else
    npm run dev
fi
