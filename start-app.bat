@echo off
echo ═══════════════════════════════════════════
echo   JamiiAI — Tanzania AI Platform v3.0
echo ═══════════════════════════════════════════

echo [1/4] Starting JamiiAI Community Backend (Port 4000)...
start cmd /k "cd community/backend && npm start"

echo [2/4] Starting JamiiAI Community Frontend (Port 3000)...
start cmd /k "cd community/frontend && npm run dev -- --port 3000"

echo [3/4] Starting JamiiAI Admin Dashboard (Port 3001)...
start cmd /k "cd admin && npm run dev -- --port 3001"

echo [4/4] Starting JamiiAI AI Agents (Orchestrator)...
:: Adding a short delay to ensure backend is ready
timeout /t 5 /nobreak >nul
start cmd /k "cd community/backend && node index.js"

echo.
echo 🚀 App zote na AI Agents zinazinduliwa!
echo.
echo  - Community Backend:  http://localhost:4000
echo  - Community Frontend: http://localhost:3000
echo  - Admin Dashboard:    http://localhost:3001
echo  - AI Agents (Bots):   Running in Background
echo.
echo Kubonyeza kitufe chochote kitafunga dirisha hili (lakini app zitaendelea kufanya kazi).
pause
