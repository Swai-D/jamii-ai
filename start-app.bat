@echo off
echo Starting JamiiAI Backend...
start cmd /k "cd jamii-files && npm start"

echo Starting JamiiAI Frontend...
start cmd /k "cd jamii-frontend && npm run dev"

echo App is starting! 
echo Backend: http://localhost:4000
echo Frontend: http://localhost:5173
pause
