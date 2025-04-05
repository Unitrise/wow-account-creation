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

:: Set the project directory to the current directory
set PROJECT_DIR=%CD%
echo Project directory: %PROJECT_DIR%
echo.

:: Install dependencies
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

:: Install PM2 globally
echo Installing PM2 globally...
call npm install -g pm2
if %errorLevel% neq 0 (
    echo Failed to install PM2 globally.
    pause
    exit /b 1
)
echo PM2 installed successfully.
echo.

:: Add npm global bin to PATH if not already there
for /f "tokens=*" %%i in ('npm config get prefix') do set NPM_PREFIX=%%i
set NPM_BIN=%NPM_PREFIX%\node_modules\npm\bin
set PATH_TO_ADD=%NPM_PREFIX%;%NPM_BIN%

echo Adding PM2 to PATH...
setx PATH "%PATH%;%PATH_TO_ADD%" /M
echo PATH updated.
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

:: Start the application with PM2
echo Starting application with PM2...
call pm2 delete wow-client >nul 2>&1
call pm2 start dist/server/server.js --name wow-client
if %errorLevel% neq 0 (
    echo Failed to start application with PM2.
    pause
    exit /b 1
)
echo Application started successfully with PM2.
echo.

:: Save PM2 configuration
echo Saving PM2 configuration...
call pm2 save
if %errorLevel% neq 0 (
    echo Failed to save PM2 configuration.
    pause
    exit /b 1
)
echo PM2 configuration saved.
echo.

:: Setup PM2 as a Windows service
echo Setting up PM2 as a Windows service...
call npm install -g pm2-windows-service
if %errorLevel% neq 0 (
    echo Failed to install PM2 Windows Service.
    echo Your application is running, but won't automatically start when Windows boots.
) else (
    call pm2-service-install -n PM2
    if %errorLevel% neq 0 (
        echo Failed to install PM2 as a Windows service.
        echo Your application is running, but won't automatically start when Windows boots.
    ) else (
        echo PM2 Windows service installed successfully.
    )
)
echo.

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
echo - View status: pm2 list
echo - View logs: pm2 logs wow-client
echo - Restart: pm2 restart wow-client
echo - Stop: pm2 stop wow-client
echo.
echo If you encounter any issues, check the logs with:
echo pm2 logs wow-client
echo.

pause