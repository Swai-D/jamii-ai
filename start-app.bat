@echo off
echo ═══════════════════════════════════════════
echo   JamiiAI — Tanzania AI Platform
echo ═══════════════════════════════════════════

echo [1/3] Starting JamiiAI Community Backend (Port 4000)...
start cmd /k "cd community/backend && npm start"

echo [2/3] Starting JamiiAI Community Frontend (Port 5173)...
start cmd /k "cd community/frontend && npm run dev"

echo [3/3] Starting JamiiAI Admin Dashboard (Port 5174)...
start cmd /k "cd admin && npm run dev -- --port 5174"

echo.
echo 🚀 App zote zinazinduliwa!
echo.
echo  - Community Backend:  http://localhost:4000
echo  - Community Frontend: http://localhost:5173
echo  - Admin Dashboard:    http://localhost:5174
echo.
echo Kubonyeza kitufe chochote kitafunga dirisha hili (lakini app zitaendelea kufanya kazi).
pause
