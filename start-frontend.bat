@echo off
cd /d "%~dp0frontend"
echo Installing frontend dependencies (first time only)...
npm install
echo Starting frontend (Vite) dev server...
npm run dev
pause

