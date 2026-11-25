@echo off
rem One command: start the effects gallery on http://127.0.0.1:4198/
cd /d "%~dp0gallery"
if not exist node_modules call npm install
call npm run start
