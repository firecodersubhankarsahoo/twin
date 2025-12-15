@echo off
echo Starting Second Brain Application...

:: Kill existing node processes to free ports (Optional, remove if unwanted)
taskkill /F /IM node.exe >nul 2>&1

:: Start Backend
echo Starting Backend Server...
cd backend
if not exist node_modules (
    echo Installing Backend Dependencies...
    call npm install
)
start "Second Brain Backend" cmd /k "node src/index.js"
cd ..

:: Start Frontend
echo Starting Frontend Client...
cd frontend
if not exist node_modules (
    echo Installing Frontend Dependencies...
    call npm install
)
start "Second Brain Frontend" cmd /k "npm run dev"
cd ..

:: Wait a moment for servers to initialize
timeout /t 5 >nul

:: Open Application in Default Browser
echo Opening Application...
start http://localhost:5173

echo Application is running!
echo If you see 'Rate Limit' errors, the system will automatically retry.
pause
