@echo off
setlocal EnableDelayedExpansion
title Late Night Combat Robotics — EmDash CMS Runner (EMDASHCMS)

echo ============================================================================
echo    Late Night Combat Robotics — EmDash CMS Platform Runner
echo ============================================================================
echo.

where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not found in your PATH. Please install Node.js 20+.
    pause
    exit /b 1
)

set "LOCAL_SITE=%USERPROFILE%\emdash-site"
set "SOURCE_DIR=%~dp0lncr-site"
if not exist "%SOURCE_DIR%" set "SOURCE_DIR=%~dp0"

echo [1/4] Syncing LNCR EmDash files to fast local SSD: %LOCAL_SITE%
if not exist "%LOCAL_SITE%" mkdir "%LOCAL_SITE%"
robocopy "%SOURCE_DIR%\src" "%LOCAL_SITE%\src" /MIR /NP /NDL /NFL >nul 2>nul
robocopy "%SOURCE_DIR%\public" "%LOCAL_SITE%\public" /MIR /NP /NDL /NFL >nul 2>nul
robocopy "%SOURCE_DIR%\seed" "%LOCAL_SITE%\seed" /MIR /NP /NDL /NFL >nul 2>nul
copy /y "%SOURCE_DIR%\astro.config.mjs" "%LOCAL_SITE%\astro.config.mjs" >nul 2>nul
copy /y "%SOURCE_DIR%\package.json" "%LOCAL_SITE%\package.json" >nul 2>nul
copy /y "%SOURCE_DIR%\tsconfig.json" "%LOCAL_SITE%\tsconfig.json" >nul 2>nul
if exist "%SOURCE_DIR%\.env" copy /y "%SOURCE_DIR%\.env" "%LOCAL_SITE%\.env" >nul 2>nul

cd /d "%LOCAL_SITE%"

if not exist node_modules\emdash (
    echo [2/4] Installing Astro, React, and EmDash CMS dependencies...
    call npm.cmd install --no-audit --no-fund
)

if not exist data.db (
    echo [3/4] Seeding SQLite database from seed/seed.json...
    call npx.cmd emdash seed seed/seed.json
)

echo.
echo [4/4] Starting EmDash CMS server at http://127.0.0.1:4321 ...
echo       * Public Store, Wiki & Calculator: http://127.0.0.1:4321/
echo       * EmDash Admin UI: http://127.0.0.1:4321/_emdash/admin
echo       * Instant Admin Dev Bypass: http://127.0.0.1:4321/_emdash/api/setup/dev-bypass?redirect=/_emdash/admin
echo.

start "" cmd /c "ping 127.0.0.1 -n 4 >nul && start http://127.0.0.1:4321"
call npm.cmd run dev -- --host 127.0.0.1 --port 4321
pause
endlocal
