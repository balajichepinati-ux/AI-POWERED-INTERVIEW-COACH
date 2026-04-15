@echo off
echo ==========================================
echo Starting MockMate Development Servers...
echo ==========================================

echo Installing Backend Dependencies...
cd backend
call npm install
echo Starting Backend Server on port 3001...
start "MockMate Backend" cmd /k "npm run dev"

cd ..
echo.
echo Installing Frontend Dependencies...
cd frontend
call npm install
echo Starting Frontend UI on port 5173...
start "MockMate Frontend" cmd /k "npm run dev"

echo.
echo Both servers have been launched in separate windows!
echo You can safely close this orchestrator window.
exit
