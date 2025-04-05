@echo off
setlocal enabledelayedexpansion

echo ======================================================
echo WoW Account Creation - Setup and Deployment
echo ======================================================
echo.

:: Check if running as administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo This script requires administrator privileges.
    echo Please right-click and select "Run as administrator".
    pause
    exit /b 1
)

:: Change to the project directory explicitly
cd /d C:\AzerothCore\wow-account-creation
set PROJECT_DIR=C:\AzerothCore\wow-account-creation
echo Project directory: %PROJECT_DIR%
echo.

:: Verify we're in the correct directory
if not exist package.json (
    echo ERROR: package.json not found in %CD%
    echo Make sure you're running this script from the project directory.
    echo This script is expecting to be in: C:\AzerothCore\wow-account-creation
    pause
    exit /b 1
)

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

:: Install dependencies (including PM2 locally)
echo Installing dependencies...
call npm install
if %errorLevel% neq 0 (
    echo Failed to install dependencies.
    pause
    exit /b 1
)
echo Dependencies installed successfully.
echo.

:: Build client
echo Building client...
call npm run build
if %errorLevel% neq 0 (
    echo Failed to build client.
    pause
    exit /b 1
)
echo Client built successfully.
echo.

:: Build server
echo Building server...
call npm run server:build
if %errorLevel% neq 0 (
    echo Failed to build server.
    pause
    exit /b 1
)
echo Server built successfully.
echo.

:: Configure Windows Firewall
echo Configuring Windows Firewall...
netsh advfirewall firewall show rule name="WoW Client" >nul 2>&1
if %errorLevel% neq 0 (
    netsh advfirewall firewall add rule name="WoW Client" dir=in action=allow protocol=TCP localport=3000
    if %errorLevel% neq 0 (
        echo Failed to configure Windows Firewall.
        echo Please manually open port 3000 in your firewall settings.
    ) else (
        echo Windows Firewall configured successfully.
    )
) else (
    echo Windows Firewall rule already exists.
)
echo.

:: Check config.cfg exists
if not exist config.cfg (
    echo WARNING: config.cfg file not found!
    echo Creating a basic config file...
    
    echo # WoW Israel Server Configuration > config.cfg
    echo SERVER_NAME = WoW Israel >> config.cfg
    echo SERVER_REALM = WoW-Israel >> config.cfg
    echo SERVER_EXPANSION = 2 >> config.cfg
    echo DB_HOST = localhost >> config.cfg
    echo DB_PORT = 3306 >> config.cfg
    echo DB_USER = acore >> config.cfg
    echo DB_PASSWORD = password >> config.cfg
    echo DB_NAME = acore_auth >> config.cfg
    echo PORT = 3000 >> config.cfg
    echo FEATURE_ACCOUNT_CREATION = true >> config.cfg
    
    echo Basic config.cfg created. Please edit with your correct database details.
    echo.
)

:: Copy config.cfg to dist folder
echo Copying config.cfg to dist folder...
if exist config.cfg (
    copy config.cfg dist\config.cfg >nul
    if %errorLevel% neq 0 (
        echo Failed to copy config.cfg to dist folder.
    ) else (
        echo Config file copied to dist folder.
    )
) else (
    echo WARNING: config.cfg not found, cannot copy to dist folder.
)
echo.

:: Ask user if they want to use PM2 or separate command prompts
echo How would you like to start the application?
echo 1. Use PM2 (recommended for production)
echo 2. Start in separate command prompts (better for debugging)
set /p START_METHOD="Enter your choice (1 or 2): "

if "%START_METHOD%"=="1" (
    :: Start the application with local PM2
    echo Starting application with PM2...
    call npx pm2 delete wow-client-server >nul 2>&1
    call npx pm2 start ecosystem.config.js
    if %errorLevel% neq 0 (
        echo Failed to start application with PM2.
        echo Trying to run directly...
        node dist/server/server.js
        pause
        exit /b 1
    )
    echo Application started successfully with PM2.
    echo.

    :: Save PM2 configuration
    echo Saving PM2 configuration...
    call npx pm2 save
    if %errorLevel% neq 0 (
        echo Failed to save PM2 configuration.
        pause
        exit /b 1
    )
    echo PM2 configuration saved.
    echo.
) else (
    :: Start the server in a new command prompt
    echo Starting server in a new command prompt...
    start "WoW Account Creation Server" cmd /k "cd /d %PROJECT_DIR% && node dist/server/server.js"
    
    :: Start the client in a new command prompt (only for development)
    echo Starting client in a new command prompt...
    start "WoW Account Creation Client" cmd /k "cd /d %PROJECT_DIR% && npm run dev"
    
    echo.
    echo Server and client started in separate command prompts.
    echo You can now see the logs from both processes.
    echo.
)

:: Get server IP address
for /f "tokens=*" %%a in ('powershell -Command "(Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias Ethernet*,Wi-Fi*,vEthernet* | Where-Object {$_.IPAddress -notmatch '127.0.0.1'}).IPAddress"') do set SERVER_IP=%%a

echo ======================================================
echo Setup Complete!
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
if "%START_METHOD%"=="1" (
    echo To manage the application:
    echo - View status: npx pm2 list
    echo - View logs: npx pm2 logs wow-client-server
    echo - Restart: npx pm2 restart wow-client-server
    echo - Stop: npx pm2 stop wow-client-server
    echo.
    echo If you encounter any issues, check the logs with:
    echo npx pm2 logs wow-client-server
) else (
    echo To stop the application:
    echo - Close the command prompt windows
    echo - Or press Ctrl+C in each command prompt
)
echo.

pause