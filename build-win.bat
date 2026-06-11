@echo off
echo ========================================
echo   SparkSuite - Windows Build
echo ========================================
echo.

echo [1/3] Checking Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found. Install from https://nodejs.org
    pause
    exit /b 1
)
node -v

echo.
echo [2/3] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed
    pause
    exit /b 1
)

echo.
echo [3/3] Building Windows installer...
echo Code signing disabled for local unsigned build.
set CSC_IDENTITY_AUTO_DISCOVERY=false
set WIN_CSC_LINK=
set CSC_LINK=
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Build complete!
echo   Installer: dist\SparkSuite Setup 1.0.2.exe
echo ========================================
echo.

start "" dist
pause
