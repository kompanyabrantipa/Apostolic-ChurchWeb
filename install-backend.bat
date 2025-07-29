@echo off
echo ========================================
echo  Apostolic Church Backend Installation
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

:: Check if PostgreSQL is installed
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: PostgreSQL is not installed or not in PATH
    echo Please install PostgreSQL 12+ from https://www.postgresql.org/download/
    echo You can continue and install PostgreSQL later
    echo.
) else (
    echo ✅ PostgreSQL is installed
    psql --version
)

echo.
echo 📦 Installing backend dependencies...
cd server
call npm install

if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed successfully
echo.

:: Check if .env file exists
if not exist ".env" (
    echo 📝 Creating .env file from template...
    copy ".env.example" ".env"
    echo ✅ .env file created
    echo.
    echo ⚠️  IMPORTANT: Please edit server\.env file with your database credentials
    echo    - Update DB_PASSWORD with a secure password
    echo    - Update ADMIN_PASSWORD with your desired admin password
    echo    - Update JWT_SECRET with a secure random string (32+ characters)
    echo.
) else (
    echo ✅ .env file already exists
)

echo.
echo 🎯 Installation completed successfully!
echo.
echo 📋 Next steps:
echo    1. Install and start PostgreSQL if not already done
echo    2. Edit server\.env file with your database credentials
echo    3. Create the database:
echo       CREATE DATABASE apostolic_church;
echo       CREATE USER apostolic_user WITH PASSWORD 'your_password';
echo       GRANT ALL PRIVILEGES ON DATABASE apostolic_church TO apostolic_user;
echo    4. Run: cd server && npm run setup-db
echo    5. Run: cd server && npm run dev
echo.
echo 📖 For detailed instructions, see server\README.md
echo.
pause
