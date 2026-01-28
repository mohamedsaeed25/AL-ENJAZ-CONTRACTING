@echo off
cd /d "%~dp0backend"
echo Installing backend dependencies (first time only)...
npm install
echo Starting backend server...
npm run dev
pause

