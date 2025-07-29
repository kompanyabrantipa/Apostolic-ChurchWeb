@echo off
echo ========================================
echo  Apostolic Church MongoDB Setup
echo ========================================
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js is installed
node --version

:: Check if MongoDB is installed
mongod --version >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: MongoDB is not installed or not in PATH
    echo Please install MongoDB Community Server from https://www.mongodb.com/try/download/community
    echo.
    echo 📋 MongoDB Installation Steps:
    echo    1. Download MongoDB Community Server
    echo    2. Run the installer and choose "Complete" installation
    echo    3. Install as Windows Service (recommended)
    echo    4. Install MongoDB Compass (optional GUI tool)
    echo.
    echo After installation, run this script again.
    pause
    exit /b 1
) else (
    echo ✅ MongoDB is installed
    mongod --version | findstr "db version"
)

:: Check MongoDB service status
echo.
echo 🔍 Checking MongoDB service status...
sc query MongoDB >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ MongoDB service not found
    echo Trying to start MongoDB manually...
    
    :: Try to start MongoDB manually
    echo Starting MongoDB...
    start /B mongod --dbpath "C:\data\db" --logpath "C:\data\log\mongod.log"
    timeout /t 3 >nul
) else (
    echo 📊 MongoDB service found
    sc query MongoDB | findstr "STATE"
    
    :: Start MongoDB service if not running
    sc query MongoDB | findstr "RUNNING" >nul
    if %errorlevel% neq 0 (
        echo 🚀 Starting MongoDB service...
        net start MongoDB
    ) else (
        echo ✅ MongoDB service is already running
    )
)

:: Wait a moment for MongoDB to start
echo.
echo ⏳ Waiting for MongoDB to be ready...
timeout /t 5 >nul

:: Navigate to server directory
cd server

:: Setup MongoDB environment
echo.
echo 📝 Setting up MongoDB environment...
if not exist ".env" (
    copy ".env-mongodb" ".env"
    echo ✅ Created .env file from MongoDB template
) else (
    echo ℹ️ .env file already exists
)

:: Install MongoDB dependencies
echo.
echo 📦 Installing MongoDB dependencies...
if exist "package-mongodb.json" (
    copy "package-mongodb.json" "package.json"
    echo ✅ Using MongoDB package configuration
) else (
    echo ❌ MongoDB package configuration not found
    echo Please ensure package-mongodb.json exists
    pause
    exit /b 1
)

call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed successfully

:: Test MongoDB connection
echo.
echo 🧪 Testing MongoDB connection...
node scripts/test-mongodb-connection.js
if %errorlevel% neq 0 (
    echo.
    echo ❌ MongoDB connection test failed
    echo 💡 Troubleshooting steps:
    echo    1. Make sure MongoDB service is running: net start MongoDB
    echo    2. Check if port 27017 is available
    echo    3. Verify MongoDB installation
    echo    4. Check Windows Firewall settings
    pause
    exit /b 1
)

:: Setup database schema
echo.
echo 🗄️ Setting up database schema...
node scripts/setup-database-mongodb.js
if %errorlevel% neq 0 (
    echo ERROR: Database setup failed
    pause
    exit /b 1
)

echo.
echo 🎉 MongoDB setup completed successfully!
echo.
echo 📋 Next steps:
echo    1. Start the server: npm run dev
echo    2. Open http://localhost:3001/api/health to verify
echo    3. Access dashboard: http://localhost:3001/dashboard
echo    4. Migrate localStorage data: npm run migrate
echo.
echo 🔧 Useful commands:
echo    - Test connection: node scripts/test-mongodb-connection.js
echo    - Start server: npm run dev
echo    - Create sample data: npm run migrate --sample
echo    - Backup database: node scripts/backup-mongodb.js backup
echo.
pause
