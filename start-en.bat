@echo off
title Ibsar Academy Server
color 0A
cd /d "%~dp0"

echo.
echo  ============================================================
echo            IBRAR ACADEMY - Server Launcher
echo  ============================================================
echo.

:: Check Node.js
where node >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Node.js is not installed.
    echo  Download from: https://nodejs.org
    echo.
    pause
    goto :eof
)
echo  [OK] Node.js found

:: Check Bun
set "CMD=npm"
where bun >nul 2>&1
if not errorlevel 1 (
    echo  [OK] Bun found - using bun
    set "CMD=bun"
) else (
    echo  [INFO] Bun not found - using npm
)

:: Check .env
if not exist ".env" (
    echo  [INFO] Creating .env from template...
    if exist ".env.example" (
        copy .env.example .env >nul
    ) else (
        echo DATABASE_URL="file:./db/custom.db" > .env
        echo NEXTAUTH_SECRET="dev-secret-change-me" >> .env
        echo OTP_SECRET="dev-otp-secret-change-me" >> .env
    )
    echo  [OK] .env created
)
echo.

:: Step 1: Install
echo  [1/5] Installing dependencies (this may take a few minutes)...
%CMD% install
if errorlevel 1 (
    echo  [ERROR] Install failed. Trying with npm...
    npm install
    if errorlevel 1 (
        echo  [ERROR] npm install also failed
        pause
        goto :eof
    )
    set "CMD=npm"
)
echo  [OK] Done
echo.

:: Step 2: Prisma generate
echo  [2/5] Generating Prisma Client...
if "%CMD%"=="bun" (
    bun run db:generate
) else (
    npx prisma generate
)
if errorlevel 1 (
    echo  [ERROR] Prisma generate failed
    pause
    goto :eof
)
echo  [OK] Done
echo.

:: Step 3: Database
echo  [3/5] Creating database...
if "%CMD%"=="bun" (
    bun run db:push
) else (
    npx prisma db push --accept-data-loss
)
if errorlevel 1 (
    echo  [ERROR] Database creation failed
    pause
    goto :eof
)
echo  [OK] Done
echo.

:: Step 4: Seed data
echo  [4/5] Seeding initial data...
if "%CMD%"=="bun" (
    bun run prisma/seed.ts 2>nul
    bun run prisma/seed-payments.ts 2>nul
    bun run prisma/seed-gamification.ts 2>nul
) else (
    npx tsx prisma/seed.ts 2>nul
    npx tsx prisma/seed-payments.ts 2>nul
    npx tsx prisma/seed-gamification.ts 2>nul
)
echo  [OK] Done
echo.

:: Step 5: Start classroom service in background
echo  [5/5] Starting servers...
echo.
echo  Starting classroom service on port 3003...
start "Ibsar Classroom (3003)" /min cmd /c "cd /d "%~dp0mini-services\classroom-service" && %CMD% install && %CMD% run dev"

echo  Waiting 4 seconds for classroom service...
timeout /t 4 /nobreak >nul

echo.
echo  ============================================================
echo            SUCCESS! Platform is running!
echo  ============================================================
echo.
echo  Open this URL in your browser:
echo     http://localhost:3000
echo.
echo  Demo accounts (phone numbers):
echo     Admin:    01000000001
echo     Teacher:  01000000010
echo     Parent:   01012345678
echo.
echo  NOTE: OTP code appears in a yellow box on the login page
echo.
echo  Press Ctrl+C in this window to stop the server
echo  ============================================================
echo.
echo  Starting main server on port 3000...
echo.

if "%CMD%"=="bun" (
    bun run dev
) else (
    npm run dev
)

:: If we reach here, server stopped or failed
echo.
echo  [INFO] Server stopped.
echo  To stop classroom service, close the "Ibsar Classroom (3003)" window.
echo.
pause
