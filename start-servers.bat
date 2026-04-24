@echo off
echo Starting SiteScout servers...
echo.

echo Starting backend server on port 3001...
cd backend
start "Backend Server" cmd /k "npm run dev"

echo.
echo Waiting 3 seconds for backend to start...
timeout /t 3 /nobreak > nul

echo.
echo Starting frontend server on port 3000...
cd ..\frontend
start "Frontend Server" cmd /k "npm run dev"

echo.
echo Both servers are starting...
echo Backend: http://localhost:3001
echo Frontend: http://localhost:3000
echo.
echo Press any key to exit this script...
pause > nul
