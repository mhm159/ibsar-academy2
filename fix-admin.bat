@echo off
title Fix Users - Add Admin Account
cd /d "%~dp0"
color 0A

echo.
echo  ============================================================
echo            FIX: Add Admin + Demo Accounts
echo  ============================================================
echo.

echo  Adding admin and demo accounts to database...
echo.

where bun >nul 2>&1
if not errorlevel 1 (
    bun run prisma/ensure-admin.ts
) else (
    npx tsx prisma/ensure-admin.ts
)

echo.
echo  ============================================================
echo  DONE! Now you can login with these accounts:
echo  ============================================================
echo.
echo    Admin:    01000000001   (للإدارة الكاملة)
echo    Teacher:  01000000010   (معلم تجريبي)
echo    Parent:   01012345678   (ولي أمر تجريبي)
echo.
echo  NOTE: OTP code appears in yellow box on login page
echo.
pause
