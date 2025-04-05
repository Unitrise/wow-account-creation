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

:: Install dependencies including PM2 locally
echo Installing dependencies...
call npm install
call npm install pm2 --save-dev
if %errorLevel% neq 0 (
    echo Failed to install dependencies.
    pause
    exit /b 1
)
echo Dependencies installed successfully.
echo.

:: Build client and server
echo Building client and server...
call npm run build
if %errorLevel% neq 0 (
    echo Failed to build application.
    pause
    exit /b 1
)
echo Build completed successfully.
echo.

:: Configure Windows Firewall with proper error handling
echo Configuring Windows Firewall...
netsh advfirewall firewall show rule name="WoW Client" >nul 2>&1
if %errorLevel% neq 0 (
    echo Creating new firewall rule...
    netsh advfirewall firewall add rule name="WoW Client" dir=in action=allow protocol=TCP localport=3000
    if %errorLevel% neq 0 (
        echo Failed to configure Windows Firewall.
        echo Please manually open port 3000 in your firewall settings.
        echo You can do this by:
        echo 1. Opening Windows Defender Firewall with Advanced Security
        echo 2. Right-clicking on "Inbound Rules" and selecting "New Rule"
        echo 3. Select "Port" and click Next
        echo 4. Enter "3000" as the port and click Next
        echo 5. Select "Allow the connection" and click Next
        echo 6. Name the rule "WoW Client" and click Finish
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

:: Create a PM2 ecosystem file for better process management
echo Creating PM2 ecosystem file...
(
echo const fs = require('fs');
echo const config = {
echo   apps: [
echo     {
echo       name: 'wow-client',
echo       script: 'node_modules/.bin/vite',
echo       cwd: '%PROJECT_DIR%',
echo       env: {
echo         NODE_ENV: 'production'
echo       }
echo     },
echo     {
echo       name: 'wow-server',
echo       script: 'dist/server/index.js',
echo       cwd: '%PROJECT_DIR%',
echo       env: {
echo         NODE_ENV: 'production'
echo       }
echo     }
echo   ]
echo };
echo fs.writeFileSync('ecosystem.config.js', JSON.stringify(config, null, 2));
) > create-ecosystem.js

:: Run the JavaScript file to create the properly formatted config
node create-ecosystem.js
del create-ecosystem.js

:: Start the client and server in separate windows
echo Starting client and server...
start "WoW Client" cmd /k "cd /d %PROJECT_DIR% && node_modules\.bin\pm2 start ecosystem.config.js --only wow-client"
start "WoW Server" cmd /k "cd /d %PROJECT_DIR% && node_modules\.bin\pm2 start ecosystem.config.js --only wow-server"

:: Wait a moment for the processes to start
timeout /t 5 /nobreak > nul

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
echo To manage the application:
echo - View status: node_modules\.bin\pm2 list
echo - View logs: node_modules\.bin\pm2 logs
echo - Restart client: node_modules\.bin\pm2 restart wow-client
echo - Restart server: node_modules\.bin\pm2 restart wow-server
echo - Stop all: node_modules\.bin\pm2 stop all
echo.
echo If you encounter any issues, check the logs with:
echo node_modules\.bin\pm2 logs
echo.
echo Note: The client and server are running in separate console windows.
echo You can monitor their output in those windows.
echo.

pause