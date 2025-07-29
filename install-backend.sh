#!/bin/bash

echo "========================================"
echo " Apostolic Church Backend Installation"
echo "========================================"
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ ERROR: Node.js is not installed"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js is installed"
node --version

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "⚠️  WARNING: PostgreSQL is not installed or not in PATH"
    echo "Please install PostgreSQL 12+ from https://www.postgresql.org/download/"
    echo "You can continue and install PostgreSQL later"
    echo
else
    echo "✅ PostgreSQL is installed"
    psql --version
fi

echo
echo "📦 Installing backend dependencies..."
cd server

if ! npm install; then
    echo "❌ ERROR: Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"
echo

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp ".env.example" ".env"
    echo "✅ .env file created"
    echo
    echo "⚠️  IMPORTANT: Please edit server/.env file with your database credentials"
    echo "   - Update DB_PASSWORD with a secure password"
    echo "   - Update ADMIN_PASSWORD with your desired admin password"
    echo "   - Update JWT_SECRET with a secure random string (32+ characters)"
    echo
else
    echo "✅ .env file already exists"
fi

echo
echo "🎯 Installation completed successfully!"
echo
echo "📋 Next steps:"
echo "   1. Install and start PostgreSQL if not already done"
echo "   2. Edit server/.env file with your database credentials"
echo "   3. Create the database:"
echo "      CREATE DATABASE apostolic_church;"
echo "      CREATE USER apostolic_user WITH PASSWORD 'your_password';"
echo "      GRANT ALL PRIVILEGES ON DATABASE apostolic_church TO apostolic_user;"
echo "   4. Run: cd server && npm run setup-db"
echo "   5. Run: cd server && npm run dev"
echo
echo "📖 For detailed instructions, see server/README.md"
echo

# Make the script executable
chmod +x install-backend.sh
