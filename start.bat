@echo off
setlocal EnableExtensions EnableDelayedExpansion

rem Dars Academy local launcher - ASCII only for maximum CMD compatibility.
cd /d "%~dp0"
title Dars Academy - Local Server
color 0E

echo.
echo ============================================================
echo                 DARS ACADEMY LOCAL SERVER
echo ============================================================
echo.

where node.exe >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or is not available in PATH.
    echo Download the LTS version from: https://nodejs.org/
    goto :failed
)

where npm.cmd >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm.cmd is not available in PATH.
    echo Reinstall the Node.js LTS version and try again.
    goto :failed
)

if not exist "package.json" (
    echo [ERROR] package.json was not found.
    echo Run this file from the project root directory.
    goto :failed
)

set "APP_PORT=3001"
:find_port
netstat -ano 2>nul | findstr /R /C:":!APP_PORT! .*LISTENING" >nul
if not errorlevel 1 (
    echo [NOTICE] Port !APP_PORT! is already in use.
    set /a APP_PORT+=1
    if !APP_PORT! GTR 3010 (
        echo [ERROR] No free port was found between 3001 and 3010.
        goto :failed
    )
    goto :find_port
)
echo [OK] Port !APP_PORT! is available.

if not exist ".env" (
    if not exist ".env.example" (
        echo [ERROR] Both .env and .env.example are missing.
        goto :failed
    )
    echo [SETUP] Creating .env from .env.example...
    copy /Y ".env.example" ".env" >nul
    if errorlevel 1 (
        echo [ERROR] Could not create .env.
        goto :failed
    )
    echo [NOTICE] Review the values in .env before production use.
)

if not exist "node_modules\.bin\next.cmd" (
    echo [SETUP] Installing project dependencies...
    call npm.cmd install
    if errorlevel 1 (
        echo [ERROR] Dependency installation failed.
        goto :failed
    )
) else (
    echo [OK] Project dependencies are available.
)

if not exist "node_modules\.prisma\client\default.js" (
    echo [SETUP] Generating Prisma Client for the first run...
    call node_modules\.bin\prisma.cmd generate
    if errorlevel 1 (
        echo [ERROR] Prisma Client generation failed.
        goto :failed
    )
)

echo.
echo ============================================================
echo [READY] Starting the website at http://127.0.0.1:!APP_PORT!
echo [STOP]  Press Ctrl+C to stop the server.
echo ============================================================
echo.

set "NEXT_DIST_DIR=.next-dev-!APP_PORT!"

rem Open the browser after Next.js has had a few seconds to start.
start "" /b powershell.exe -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 5; Start-Process 'http://127.0.0.1:!APP_PORT!/'"

call node_modules\.bin\next.cmd dev -p !APP_PORT! --webpack
set "APP_EXIT=%ERRORLEVEL%"

if not "%APP_EXIT%"=="0" (
    echo.
    echo [ERROR] The development server stopped with code %APP_EXIT%.
    goto :failed
)

echo.
echo [DONE] The server has stopped.
pause
exit /b 0

:failed
echo.
echo Startup did not complete. Review the message above.
pause
exit /b 1
