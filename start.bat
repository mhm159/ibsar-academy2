@echo off
setlocal EnableExtensions

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

netstat -ano 2>nul | findstr /R /C:":3001 .*LISTENING" >nul
if not errorlevel 1 (
    echo.
    echo [ERROR] Port 3001 is already in use.
    echo Close the previous server window, then run start.bat again.
    echo To inspect it, run: netstat -ano ^| findstr :3001
    goto :failed
)

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
echo [READY] Starting the website at http://127.0.0.1:3001
echo [STOP]  Press Ctrl+C to stop the server.
echo ============================================================
echo.

call npm.cmd run dev
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
