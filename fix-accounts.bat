@echo off
title Fix Accounts
cd /d "%~dp0"
color 0A

echo.
echo  ============================================================
echo            FIX: Add Demo Accounts
echo  ============================================================
echo.

where bun >nul 2>&1
if not errorlevel 1 (
    echo  Running with bun...
    call bun run prisma/fix-accounts.ts
) else (
    echo  Running with npx tsx...
    call npx tsx prisma/fix-accounts.ts
)

echo.
echo  ============================================================
echo  DONE! Now you can login with:
echo  ============================================================
echo.
echo    Admin:    01000000001
echo    Teacher:  01000000010
echo    Parent:   01012345678
echo.
echo  NOTE: OTP code shows in yellow box on login page
echo.
pause
