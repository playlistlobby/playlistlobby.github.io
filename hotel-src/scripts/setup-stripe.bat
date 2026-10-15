@echo off
rem Runs setup-stripe.ps1 once, without changing the computer's PowerShell settings (that is what "Bypass" means here: only for this one run).
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup-stripe.ps1"
echo.
pause
