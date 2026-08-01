@echo off
title Ibdaa Academy Server
cd /d "%~dp0"
color 0A

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

echo  [1/6] Installing dependencies...
call %CMD% install --no-audit --no-fund
echo  [OK] Dependencies installed
echo.

echo  [2/6] Generating Prisma...
call %CMD% run db:generate
echo  [OK] Prisma generated
echo.

echo  [3/6] Creating database...
call %CMD% run db:push
echo  [OK] Database created
echo.

echo  [4/6] Seeding data...
if exist "prisma\db\custom.db" (
    echo  [OK] Database already exists. Skipping seed to preserve your data.
) else (
    if "%CMD%"=="bun" (
        call bun run prisma/seed.ts
        call bun run prisma/seed-comprehensive.ts
        call bun run prisma/fix-accounts.ts
    ) else (
        call npx tsx prisma/seed.ts
        call npx tsx prisma/seed-comprehensive.ts
        call npx tsx prisma/fix-accounts.ts
    )
    echo  [OK] Data seeded
)
echo.

echo  [5/6] Starting classroom service (port 3003)...
start "Ibdaa Classroom (3003)" /min cmd /c "cd /d "%~dp0mini-services\classroom-service" && call %CMD% install --no-audit --no-fund && call %CMD% run dev"

echo  Waiting 5 seconds...
timeout /t 5 /nobreak >nul

echo.
echo  [6/6] Starting main server (port 3000)...
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

call %CMD% run dev

echo.
echo  Server stopped. Press any key to close.
pause >nul
