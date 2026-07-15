@echo off
setlocal
cd /d "%~dp0"
node scripts\refactor-styles.mjs split
if errorlevel 1 exit /b %errorlevel%
call npm run verify:lock
if errorlevel 1 exit /b %errorlevel%
call npm run typecheck
if errorlevel 1 exit /b %errorlevel%
call npm run test
if errorlevel 1 exit /b %errorlevel%
call npm run build
if errorlevel 1 exit /b %errorlevel%
echo.
echo LifeSim styles split completed successfully.
