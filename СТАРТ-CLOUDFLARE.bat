@echo off
chcp 65001 >nul
cd /d "%~dp0"
"%~dp0tools\node.exe" "%~dp0launch.mjs" --internet --cloudflare
pause
