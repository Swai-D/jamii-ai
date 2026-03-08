@echo off
echo ═══════════════════════════════════════════════════════════════
echo   JamiiAI — Database Reset ^& Seeding Utility
echo ═══════════════════════════════════════════════════════════════

echo [1/2] Kusafisha Database (Dropping all tables)...
cd community/backend
node reset-db.js

if %errorlevel% neq 0 (
    echo.
    echo ❌ Hitilafu imetokea wakati wa kusafisha database!
    pause
    exit /b %errorlevel%
)

echo.
echo [2/2] Kuingiza Data Mpya (Seeding fake data)...
node seed.js

if %errorlevel% neq 0 (
    echo.
    echo ❌ Hitilafu imetokea wakati wa seeding!
    pause
    exit /b %errorlevel%
)

echo.
echo ═══════════════════════════════════════════════════════════════
echo   ✅ DATABASE IMESAFISHWA NA KUINGIZWA DATA MPYA VIZURI!
echo ═══════════════════════════════════════════════════════════════
echo.
pause
