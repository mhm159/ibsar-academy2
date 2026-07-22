@echo off
title Ibsar Academy - Server Launcher
color 0A

echo.
echo  ============================================================
echo                                                           
echo            IBRAR ACADEMY - Full Platform Launcher          
echo            One-click setup ^& run                         
echo                                                           
echo  ============================================================
echo.

:: Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js is not installed.
    echo  Download from: https://nodejs.org
    echo.
    pause
    exit /b 1
)

:: Check Bun
where bun >nul 2>&1
if %errorlevel% neq 0 (
    echo  [WARN] Bun is not installed - will use npm instead
    set USE_BUN=0
) else (
    echo  [OK] Bun detected - will use it for faster performance
    set USE_BUN=1
)
echo.

:: Check .env
if not exist ".env" (
    echo  [INFO] Creating .env from template...
    copy .env.example .env >nul
    echo  [OK] .env created - edit values before production
    echo.
)

:: Step 1: Install dependencies
echo  ============================================================
echo  [1/5] Installing dependencies...
echo  ============================================================
if %USE_BUN% equ 1 (
    bun install
) else (
    npm install
)
if %errorlevel% neq 0 (
    echo  [ERROR] Failed to install dependencies
    pause
    exit /b 1
)
echo  [OK] Dependencies installed
echo.

:: Step 2: Generate Prisma Client
echo  ============================================================
echo  [2/5] Generating Prisma Client...
echo  ============================================================
if %USE_BUN% equ 1 (
    bun run db:generate
) else (
    npx prisma generate
)
if %errorlevel% neq 0 (
    echo  [ERROR] Failed to generate Prisma
    pause
    exit /b 1
)
echo  [OK] Prisma Client generated
echo.

:: Step 3: Push database schema
echo  ============================================================
echo  [3/5] Creating database...
echo  ============================================================
if %USE_BUN% equ 1 (
    bun run db:push
) else (
    npx prisma db push --accept-data-loss
)
if %errorlevel% neq 0 (
    echo  [ERROR] Failed to create database
    pause
    exit /b 1
)
echo  [OK] Database created
echo.

:: Step 4: Seed data
echo  ============================================================
echo  [4/5] Seeding initial data...
echo  ============================================================
if %USE_BUN% equ 1 (
    bun run prisma/seed.ts
    bun run prisma/seed-payments.ts
    bun run prisma/seed-gamification.ts
) else (
    npx tsx prisma/seed.ts
    npx tsx prisma/seed-payments.ts
    npx tsx prisma/seed-gamification.ts
)
echo  [OK] Data seeded
echo.

:: Step 5: Start servers
echo  ============================================================
echo  [5/5] Starting servers...
echo  ============================================================
echo.
echo  Starting classroom service (port 3003)...
start "Ibsar Classroom Service (3003)" /min cmd /c "cd /d %CD%\mini-services\classroom-service && bun run dev"

echo  Waiting 3 seconds...
timeout /t 3 /nobreak >nul

echo  Starting main platform (port 3000)...
echo.
echo  ============================================================
echo                                                           
echo  SUCCESS! Platform is running!                            
echo                                                           
echo  Open browser: http://localhost:3000                       
echo                                                           
echo  Demo accounts:                                            
echo    Admin:    01000000001                                   
echo    Teacher:  01000000010                                   
echo    Parent:   01012345678                                   
echo                                                           
echo  OTP code will show in yellow box on the page              
echo                                                           
echo  Press Ctrl+C to stop                                      
echo                                                           
echo  ============================================================
echo.

if %USE_BUN% equ 1 (
    bun run dev
) else (
    npm run dev
)

echo.
echo  Server stopped.
echo  Close the "Ibsar Classroom Service" window to stop port 3003.
echo.
pause
