@echo off
echo =========================================================
echo CST Autonomous Host Agent - 1-Click Windows EXE Builder
echo =========================================================
echo.

python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in system PATH!
    echo Please download Python 3.11+ from https://www.python.org/
    echo Ensure you check 'Add python.exe to PATH' during install.
    pause
    exit /b 1
)

echo [1/3] Setting up Python virtual environment...
if not exist "venv" (
    python -m venv venv
)
call venv\Scripts\activate

echo [2/3] Installing dependencies and PyInstaller...
python -m pip install --upgrade pip
pip install -r requirements.txt

echo [3/3] Compiling standalone CST_HostAgent.exe...
pyinstaller --clean build_agent.spec

if exist "dist\CST_HostAgent.exe" (
    echo.
    echo =========================================================
    echo [SUCCESS] Standalone Executable Created!
    echo Location: %cd%\dist\CST_HostAgent.exe
    echo.
    echo Double-click CST_HostAgent.exe to start the silent background
    echo daemon with System Tray and ZeroConf mDNS discovery.
    echo =========================================================
) else (
    echo.
    echo [ERROR] Build failed. Review log above.
)
pause
