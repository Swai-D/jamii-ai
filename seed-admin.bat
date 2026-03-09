@echo off
echo ═══════════════════════════════════════════════════════════════
echo   JamiiAI — Admin Account Seeder
echo ═══════════════════════════════════════════════════════════════

echo [1/1] Inatengeneza Admin Account (Davy Swai)...
cd community/backend
node seed-admin.js

if %errorlevel% neq 0 (
    echo.
    echo ❌ Hitilafu imetokea wakati wa kutengeneza admin!
    pause
    exit /b %errorlevel%
)

echo.
echo ═══════════════════════════════════════════════════════════════
echo   ✅ ADMIN ACCOUNT IMETENGENEZWA VIZURI!
echo   Handle:   davyswai
echo   Password: davyswai1995
echo ═══════════════════════════════════════════════════════════════
echo.
pause
