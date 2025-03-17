@echo off
echo Starting OptiDeliver Demo...

REM Check if Python is installed
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Python is not installed. Please install Python and try again.
    exit /b 1
)

REM Navigate to the API directory
cd api

REM Check if requirements are installed
echo Checking Python dependencies...
pip list | findstr "flask" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Installing required Python packages...
    pip install -r requirements.txt
)

REM Start the Flask API server
echo Starting API server...
start /b python app.py

REM Wait for the API server to start
echo Waiting for API server to start...
timeout /t 3 /nobreak >nul

REM Open the frontend in the default browser
echo Opening frontend in browser...
start ..\frontend\index.html

echo Demo is running!
echo Press Ctrl+C in the API server window to stop the demo.
echo. 