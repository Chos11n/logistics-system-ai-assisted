@echo off
cd /d %~dp0
echo Starting development server...
call npm run dev
pause
