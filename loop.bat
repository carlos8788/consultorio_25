@echo off
:loop
curl -fsS https://consultorio-25.onrender.com/api/public/health >nul 2>&1
timeout /t 300 /nobreak >nul
goto loop