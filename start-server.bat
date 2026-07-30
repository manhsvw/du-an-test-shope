@echo off
cd /d "%~dp0"
echo Dang khoi dong server tai http://localhost:3000 ...
start "" http://localhost:3000
npm start
pause
