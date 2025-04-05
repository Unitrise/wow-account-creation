@echo off
setlocal enabledelayedexpansion

echo ======================================================
echo WoW Account Creation - Quick Start
echo ======================================================
echo.

:: Change to the project directory explicitly
cd /d C:\AzerothCore\wow-account-creation
set PROJECT_DIR=C:\AzerothCore\wow-account-creation
echo Project directory: %PROJECT_DIR%
echo.

:: Check for and kill any existing processes using port 3000
echo Checking for existing processes using port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    echo Found process using port 3000 with PID: %%a
    echo Attempting to terminate process...
    taskkill /F /PID %%a
    if %errorLevel% neq 0 (
        echo Failed to terminate process. Please manually close any applications using port 3000.
        echo You can use Task Manager to find and end processes using port 3000.
        pause
        exit /b 1
    ) else (
        echo Process terminated successfully.
    )
)
echo.

:: Start the server in a new command prompt
echo Starting server in a new command prompt...
start "WoW Account Creation Server" cmd /k "cd /d %PROJECT_DIR% && echo Starting server... && node dist/server/server.js"

:: Wait a moment to ensure the server starts first
timeout /t 2 /nobreak > nul

:: Start the client in a new command prompt
echo Starting client in a new command prompt...
start "WoW Account Creation Client" cmd /k "cd /d %PROJECT_DIR% && echo Starting client... && npm run dev"

:: Get server IP address
for /f "tokens=*" %%a in ('powershell -Command "(Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias Ethernet*,Wi-Fi*,vEthernet* | Where-Object {$_.IPAddress -notmatch '127.0.0.1'}).IPAddress"') do set SERVER_IP=%%a

echo ======================================================
echo Services Started!
echo ======================================================
echo.
echo Your WoW Account Creation service is now running.
echo.
echo Access the web interface at:
echo http://localhost:3000
if defined SERVER_IP (
    echo or http://%SERVER_IP%:3000
)
echo.
echo To stop the application:
echo - Close the command prompt windows
echo - Or press Ctrl+C in each command prompt
echo.

pause 