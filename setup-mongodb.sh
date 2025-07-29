#!/bin/bash

echo "========================================"
echo " Apostolic Church MongoDB Setup"
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

# Check if MongoDB is installed
if ! command -v mongod &> /dev/null; then
    echo "⚠️ WARNING: MongoDB is not installed or not in PATH"
    echo "Please install MongoDB Community Server:"
    echo
    echo "📋 MongoDB Installation:"
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "   macOS (Homebrew):"
        echo "   brew tap mongodb/brew"
        echo "   brew install mongodb-community"
        echo "   brew services start mongodb-community"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "   Ubuntu/Debian:"
        echo "   wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -"
        echo "   echo 'deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse' | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list"
        echo "   sudo apt-get update"
        echo "   sudo apt-get install -y mongodb-org"
        echo "   sudo systemctl start mongod"
        echo "   sudo systemctl enable mongod"
    fi
    echo
    echo "After installation, run this script again."
    exit 1
else
    echo "✅ MongoDB is installed"
    mongod --version | head -1
fi

# Check MongoDB service status and start if needed
echo
echo "🔍 Checking MongoDB service status..."

if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    if brew services list | grep mongodb-community | grep started > /dev/null; then
        echo "✅ MongoDB service is running"
    else
        echo "🚀 Starting MongoDB service..."
        brew services start mongodb-community
        sleep 3
    fi
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    if systemctl is-active --quiet mongod; then
        echo "✅ MongoDB service is running"
    else
        echo "🚀 Starting MongoDB service..."
        sudo systemctl start mongod
        sleep 3
    fi
else
    # Other Unix-like systems
    echo "⚠️ Please ensure MongoDB is running manually"
    echo "Try: mongod --dbpath /usr/local/var/mongodb --logpath /usr/local/var/log/mongodb/mongo.log --fork"
fi

# Wait for MongoDB to be ready
echo
echo "⏳ Waiting for MongoDB to be ready..."
sleep 5

# Navigate to server directory
cd server

# Setup MongoDB environment
echo
echo "📝 Setting up MongoDB environment..."
if [ ! -f ".env" ]; then
    cp ".env-mongodb" ".env"
    echo "✅ Created .env file from MongoDB template"
else
    echo "ℹ️ .env file already exists"
fi

# Install MongoDB dependencies
echo
echo "📦 Installing MongoDB dependencies..."
if [ -f "package-mongodb.json" ]; then
    cp "package-mongodb.json" "package.json"
    echo "✅ Using MongoDB package configuration"
else
    echo "❌ MongoDB package configuration not found"
    echo "Please ensure package-mongodb.json exists"
    exit 1
fi

if ! npm install; then
    echo "❌ ERROR: Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Test MongoDB connection
echo
echo "🧪 Testing MongoDB connection..."
if ! node scripts/test-mongodb-connection.js; then
    echo
    echo "❌ MongoDB connection test failed"
    echo "💡 Troubleshooting steps:"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "   1. Start MongoDB: brew services start mongodb-community"
        echo "   2. Check status: brew services list | grep mongodb"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "   1. Start MongoDB: sudo systemctl start mongod"
        echo "   2. Check status: sudo systemctl status mongod"
    fi
    echo "   3. Check if port 27017 is available: netstat -an | grep 27017"
    echo "   4. Verify MongoDB installation"
    echo "   5. Check firewall settings"
    exit 1
fi

# Setup database schema
echo
echo "🗄️ Setting up database schema..."
if ! node scripts/setup-database-mongodb.js; then
    echo "❌ ERROR: Database setup failed"
    exit 1
fi

echo
echo "🎉 MongoDB setup completed successfully!"
echo
echo "📋 Next steps:"
echo "   1. Start the server: npm run dev"
echo "   2. Open http://localhost:3001/api/health to verify"
echo "   3. Access dashboard: http://localhost:3001/dashboard"
echo "   4. Migrate localStorage data: npm run migrate"
echo
echo "🔧 Useful commands:"
echo "   - Test connection: node scripts/test-mongodb-connection.js"
echo "   - Start server: npm run dev"
echo "   - Create sample data: npm run migrate --sample"
echo "   - Backup database: node scripts/backup-mongodb.js backup"
echo

# Make the script executable
chmod +x setup-mongodb.sh
