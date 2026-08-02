@echo off
chcp 65001 >nul
title منصة منهل - تشغيل المنصة
color 0E

echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║                                                          ║
echo  ║          🎓 منصة منهل | Manhal Academy               ║
echo  ║          تشغيل المنصة الكاملة من ملف واحد                ║
echo  ║                                                          ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.

:: التحقق من تثبيت Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo  ❌ Node.js غير مثبت. حمل من: https://nodejs.org
    echo.
    pause
    exit /b 1
)

:: التحقق من تثبيت Bun (اختياري)
where bun >nul 2>&1
if %errorlevel% neq 0 (
    echo  ⚠️  Bun غير مثبت - سيتم استخدام npm
    set USE_BUN=0
) else (
    echo  ✅ Bun مثبت - سيتم استخدامه للأداء الأسرع
    set USE_BUN=1
)
echo.

:: التحقق من وجود ملف .env
if not exist ".env" (
    echo  📝 إنشاء ملف .env من القالب...
    copy .env.example .env >nul
    echo  ✅ تم إنشاء .env - عدّل القيم قبل الإنتاج
    echo.
)

:: الخطوة 1: تثبيت الحزم
echo  ══════════════════════════════════════════════════════════
echo  📦 الخطوة 1/5: تثبيت الحزم...
echo  ══════════════════════════════════════════════════════════
if %USE_BUN% equ 1 (
    bun install
) else (
    npm install
)
if %errorlevel% neq 0 (
    echo  ❌ فشل تثبيت الحزم
    pause
    exit /b 1
)
echo  ✅ تم تثبيت الحزم
echo.

:: الخطوة 2: توليد Prisma Client
echo  ══════════════════════════════════════════════════════════
echo  🗄️  الخطوة 2/5: توليد Prisma Client...
echo  ══════════════════════════════════════════════════════════
if %USE_BUN% equ 1 (
    bun run db:generate
) else (
    npx prisma generate
)
if %errorlevel% neq 0 (
    echo  ❌ فشل توليد Prisma
    pause
    exit /b 1
)
echo  ✅ تم توليد Prisma Client
echo.

:: الخطوة 3: دفع قاعدة البيانات
echo  ══════════════════════════════════════════════════════════
echo  💾 الخطوة 3/5: إنشاء قاعدة البيانات...
echo  ══════════════════════════════════════════════════════════
if %USE_BUN% equ 1 (
    bun run db:push
) else (
    npx prisma db push
)
if %errorlevel% neq 0 (
    echo  ❌ فشل إنشاء قاعدة البيانات
    pause
    exit /b 1
)
echo  ✅ تم إنشاء قاعدة البيانات
echo.

:: الخطوة 4: بذر البيانات الأولية
echo  ══════════════════════════════════════════════════════════
echo  🌱 الخطوة 4/5: بذر البيانات الأولية (معلمين + طلاب + حصص)...
echo  ══════════════════════════════════════════════════════════
if exist "prisma\db\custom.db" (
    echo  ✅ قاعدة البيانات موجودة مسبقاً، سيتم الحفاظ على بياناتك وتخطي عملية بذر البيانات.
    echo.
) else (
    echo  🌱 نقوم بزرع البيانات لأول مرة...
    if %USE_BUN% equ 1 (
        bun run prisma/seed.ts
    ) else (
        npx tsx prisma/seed.ts
    )
    echo  ✅ تم بذر البيانات الأولية
    echo.


:: بذر بيانات الدفع والعملات
echo  🌱 بذر بيانات الدفع والعملات...
if not exist "prisma\db\custom.db" (
    if %USE_BUN% equ 1 (
        bun run prisma/seed-payments.ts 2>nul
    ) else (
        npx tsx prisma/seed-payments.ts 2>nul
    )
    echo  ✅ تم بذر بيانات الدفع
)
echo.

:: بذر بيانات الـ Gamification
echo  🌱 بذر النقاط والأوسمة...
if not exist "prisma\db\custom.db" (
    if %USE_BUN% equ 1 (
        bun run prisma/seed-gamification.ts 2>nul
    ) else (
        npx tsx prisma/seed-gamification.ts 2>nul
    )
    echo  ✅ تم بذر النقاط والأوسمة
)
echo.

:: الخطوة 5: تشغيل الخوادم
echo  ══════════════════════════════════════════════════════════
echo  🚀 الخطوة 5/5: تشغيل الخوادم...
echo  ══════════════════════════════════════════════════════════
echo.
echo  📡 تشغيل خدمة الغرفة الافتراضية (Port 3003)...
start "Manhal Classroom Service (3003)" /min cmd /c "cd /d %CD%\mini-services\classroom-service && bun run dev"

echo  ⏳ انتظار 3 ثوانٍ...
timeout /t 3 /nobreak >nul

echo  🌐 تشغيل المنصة الرئيسية (Port 3000)...
echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║                                                          ║
echo  ║  ✅ المنصة جاهزة!                                        ║
echo  ║                                                          ║
echo  ║  🌐 افتح المتصفح على:  http://localhost:3000             ║
echo  ║                                                          ║
echo  ║  📋 حسابات تجريبية:                                     ║
echo  ║                                                          ║
echo  ║  👑 إدارة:      01000000001                              ║
echo  ║  👩‍🏫 معلم:       01000000010                              ║
echo  ║  👨‍👩‍👧 ولي أمر:   01012345678                              ║
echo  ║                                                          ║
echo  ║  💡 رمز OTP سيظهر في صندوق أصفر بالواجهة                 ║
echo  ║                                                          ║
echo  ║  🛑 لإيقاف المنصة: اضغط Ctrl+C                          ║
echo  ║                                                          ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.

if %USE_BUN% equ 1 (
    bun run dev
) else (
    npm run dev
)

:: عند الإيقاف
echo.
echo  🛑 تم إيقاف المنصة
echo  💡 لإيقاف خدمة الغرفة الافتراضية، أغلق نافذة "Manhal Classroom Service"
echo.
pause
