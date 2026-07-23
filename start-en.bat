@echo off
title Ibsar Academy Server
cd /d "%~dp0"

echo.
echo  ============================================================
echo            IBRAR ACADEMY - Server Launcher
echo  ============================================================
echo.

:: Check Node
where node >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Node.js not found. Install from https://nodejs.org
    pause
    exit
)

:: Check Bun
set "CMD=npm"
where bun >nul 2>&1
if not errorlevel 1 set "CMD=bun"

echo  [OK] Using: %CMD%
echo.

:: Create .env if missing
if not exist ".env" (
    echo DATABASE_URL="file:./db/custom.db" > .env
    echo NEXTAUTH_SECRET="dev-secret-change-me-1234567890" >> .env
    echo OTP_SECRET="dev-otp-secret-change-me-1234567890" >> .env
    echo  [OK] .env created
)

echo  [1/5] Installing dependencies...
%CMD% install
echo  [OK]
echo.

echo  [2/5] Generating Prisma...
%CMD% run db:generate
echo  [OK]
echo.

echo  [3/5] Creating database...
%CMD% run db:push
echo  [OK]
echo.

echo  [4/5] Seeding data...
%CMD% run prisma/seed.ts
%CMD% run prisma/seed-payments.ts
%CMD% run prisma/seed-gamification.ts
%CMD% run prisma/ensure-admin.ts
echo  [OK]
echo.

echo  [5/5] Starting servers...
echo  Starting classroom service (port 3003)...
start "Ibsar Classroom (3003)" /min cmd /c "cd /d "%~dp0mini-services\classroom-service" && %CMD% install && %CMD% run dev"

timeout /t 4 /nobreak >nul

echo.
echo  ============================================================
echo            SUCCESS! Platform is running!
echo  ============================================================
echo.
echo  Open in browser: http://localhost:3000
echo.
echo  Demo accounts:
echo    Admin:    01000000001
echo    Teacher:  01000000010
echo    Parent:   01012345678
echo.
echo  OTP shows in yellow box on login page
echo  Press Ctrl+C to stop
echo  ============================================================
echo.
echo  Starting main server (port 3000)...
echo.

%CMD% run dev

echo.
echo  Server stopped. Press any key to close.
pause >nul
