# Apostolic Church Backend Server - MongoDB Edition

This is the MongoDB-powered Node.js/Express backend server for the Apostolic Church website, providing API endpoints for content management with flexible NoSQL document storage.

## 🚀 Quick Start

### Prerequisites

1. **Node.js 18+** - [Download here](https://nodejs.org/)
2. **MongoDB Community Server 5.0+** - [Download here](https://www.mongodb.com/try/download/community)
3. **Git** (optional) - For version control

### Installation Steps

1. **Navigate to server directory:**
   ```bash
   cd server
   ```

2. **Install MongoDB dependencies:**
   ```bash
   cp package-mongodb.json package.json
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env file with your MongoDB connection details
   ```

4. **Install and start MongoDB:**
   
   **Windows:**
   ```bash
   # Download MongoDB Community Server from mongodb.com
   # Install as Windows Service (recommended)
   net start MongoDB
   ```
   
   **macOS:**
   ```bash
   # Install via Homebrew (recommended)
   brew tap mongodb/brew
   brew install mongodb-community
   brew services start mongodb-community
   ```
   
   **Linux (Ubuntu/Debian):**
   ```bash
   # Import MongoDB public GPG key
   wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
   
   # Add MongoDB repository
   echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
   
   # Install MongoDB
   sudo apt-get update
   sudo apt-get install -y mongodb-org
   
   # Start MongoDB service
   sudo systemctl start mongod
   sudo systemctl enable mongod
   ```

5. **Set up database schema and admin user:**
   ```bash
   npm run setup-db
   ```

6. **Start the server:**
   ```bash
   npm run dev  # Development mode with auto-restart
   # OR
   npm start    # Production mode
   ```

7. **Verify installation:**
   - Open http://localhost:3001/api/health
   - Should see: `{"success": true, "message": "MongoDB server is healthy"}`

## 📊 Migration from localStorage

### Option 1: Migrate Existing Data

1. **Export your current localStorage data:**
   - Open your existing website in browser
   - Open Developer Console (F12)
   - Run these commands to export data:

   ```javascript
   // Export blogs
   console.log('BLOGS:', JSON.stringify(JSON.parse(localStorage.getItem('blogs') || '[]'), null, 2));
   
   // Export events  
   console.log('EVENTS:', JSON.stringify(JSON.parse(localStorage.getItem('events') || '[]'), null, 2));
   
   // Export sermons
   console.log('SERMONS:', JSON.stringify(JSON.parse(localStorage.getItem('sermons') || '[]'), null, 2));
   ```

2. **Save the output to migration files:**
   - Create `server/migration-data/blogs.json` with the blogs output
   - Create `server/migration-data/events.json` with the events output  
   - Create `server/migration-data/sermons.json` with the sermons output

3. **Run migration:**
   ```bash
   npm run migrate
   ```

### Option 2: Use Sample Data

```bash
# Generate sample data for testing
node scripts/migrate-localstorage-to-mongodb.js --sample

# Then migrate the sample data
npm run migrate
```

## 🔧 API Endpoints

All endpoints are identical to the PostgreSQL version, ensuring complete compatibility:

### Authentication
- `POST /api/auth/login` - Login with username/password
- `POST /api/auth/logout` - Logout and clear session
- `GET /api/auth/verify` - Verify authentication token
- `GET /api/auth/me` - Get current user info

### Blogs
- `GET /api/blogs` - Get all blogs (auth required) or published blogs (public)
- `GET /api/blogs/:id` - Get single blog
- `POST /api/blogs` - Create new blog (auth required)
- `PUT /api/blogs/:id` - Update blog (auth required)
- `DELETE /api/blogs/:id` - Delete blog (auth required)

### Events
- `GET /api/events` - Get all events (auth required) or published events (public)
- `GET /api/events/:id` - Get single event
- `POST /api/events` - Create new event (auth required)
- `PUT /api/events/:id` - Update event (auth required)
- `DELETE /api/events/:id` - Delete event (auth required)

### Sermons
- `GET /api/sermons` - Get all sermons (auth required) or published sermons (public)
- `GET /api/sermons/:id` - Get single sermon
- `POST /api/sermons` - Create new sermon (auth required)
- `PUT /api/sermons/:id` - Update sermon (auth required)
- `DELETE /api/sermons/:id` - Delete sermon (auth required)

### Utilities
- `GET /api/health` - Server health check with MongoDB status
- `GET /api/stats` - Get content statistics
- `GET /api/database/info` - MongoDB-specific database information

## 🍃 Why MongoDB for Your Church?

### **Perfect Data Match**
- **JSON-Native:** Your localStorage data maps directly to MongoDB documents
- **Flexible Schema:** Easy to add new fields without database migrations
- **Rich Content:** Handles HTML content, images, and media URLs naturally

### **Performance Benefits**
- **Read-Heavy Optimized:** Perfect for church websites (more reading than writing)
- **Indexing:** Fast queries on status, dates, categories, and full-text search
- **Aggregation:** Powerful analytics for content insights

### **Scalability & Growth**
- **Horizontal Scaling:** Grows with your church community
- **Replication:** Built-in backup and high availability
- **Sharding:** Distribute data across multiple servers when needed

### **Developer-Friendly**
- **No SQL Complexity:** Work with familiar JavaScript objects
- **Rich Ecosystem:** Extensive tools and community support
- **Cloud Options:** Easy migration to MongoDB Atlas when ready

## 📁 Project Structure

```
server/
├── config/
│   └── database-mongodb.js      # MongoDB connection with Mongoose
├── middleware/
│   └── auth.js                  # Authentication middleware (unchanged)
├── models-mongodb/
│   ├── User.js                  # User Mongoose schema
│   ├── Blog.js                  # Blog Mongoose schema
│   ├── Event.js                 # Event Mongoose schema
│   └── Sermon.js                # Sermon Mongoose schema
├── routes-mongodb/
│   ├── auth.js                  # Authentication routes
│   ├── blogs.js                 # Blog API routes
│   ├── events.js                # Event API routes
│   └── sermons.js               # Sermon API routes
├── scripts/
│   ├── setup-database-mongodb.js           # MongoDB setup script
│   └── migrate-localstorage-to-mongodb.js  # Migration script
├── .env                         # Environment variables
├── package-mongodb.json         # MongoDB-specific dependencies
├── server-mongodb.js            # Main MongoDB server file
└── README-mongodb.md            # This file
```

## 🔧 Configuration

### Environment Variables (.env)

```bash
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/apostolic_church
MONGODB_USERNAME=  # Optional: if authentication required
MONGODB_PASSWORD=  # Optional: if authentication required

# JWT (same as PostgreSQL version)
JWT_SECRET=your_very_secure_jwt_secret_key_here_minimum_32_characters
JWT_EXPIRES_IN=24h

# Server (same as PostgreSQL version)
PORT=3001
NODE_ENV=development

# Admin User (same as PostgreSQL version)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_admin_password

# CORS (same as PostgreSQL version)
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### MongoDB Connection Options

**Local Development:**
```bash
MONGODB_URI=mongodb://localhost:27017/apostolic_church
```

**With Authentication:**
```bash
MONGODB_URI=mongodb://username:password@localhost:27017/apostolic_church
```

**MongoDB Atlas (Cloud):**
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/apostolic_church
```

## 🚨 Troubleshooting

### MongoDB Connection Issues

1. **Check MongoDB is running:**
   ```bash
   # Windows
   net start MongoDB
   
   # macOS
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   sudo systemctl status mongod
   ```

2. **Verify MongoDB is accessible:**
   ```bash
   # Connect using MongoDB shell
   mongosh
   # OR (older versions)
   mongo
   ```

3. **Check port availability:**
   ```bash
   # Check if MongoDB is listening on port 27017
   netstat -an | grep 27017
   ```

### Common Error Solutions

**Error: "ECONNREFUSED"**
- MongoDB service is not running
- Check firewall settings
- Verify connection string in .env

**Error: "Authentication failed"**
- Check username/password in MONGODB_URI
- Ensure user has proper permissions
- Try connecting without authentication first

**Error: "Database not found"**
- MongoDB creates databases automatically
- Check database name in connection string
- Run `npm run setup-db` to initialize

### Performance Optimization

1. **Indexes:** Automatically created during setup
2. **Connection Pooling:** Configured in database-mongodb.js
3. **Query Optimization:** Use MongoDB Compass to analyze queries

## 📞 Support

For MongoDB-specific issues:

1. Check the troubleshooting section above
2. Verify MongoDB installation and service status
3. Check server logs for detailed error messages
4. Ensure .env configuration is correct
5. Test connection with MongoDB shell/Compass

## 🎯 Next Steps

1. **Test the API:** Use the health endpoint to verify server is running
2. **Migrate data:** Follow the migration steps to transfer localStorage data
3. **Update frontend:** The existing DataService works unchanged with MongoDB
4. **Test functionality:** Verify dashboard and frontend pages work correctly
5. **Consider MongoDB Atlas:** For production deployment with managed hosting

## 🌟 MongoDB vs PostgreSQL Comparison

| Feature | MongoDB | PostgreSQL |
|---------|---------|------------|
| **Data Model** | Document (JSON-like) | Relational (Tables) |
| **Schema** | Flexible, dynamic | Fixed, requires migrations |
| **Query Language** | MongoDB Query Language | SQL |
| **Scaling** | Horizontal (sharding) | Vertical (more powerful server) |
| **Best For** | JSON data, rapid development | Complex relationships, ACID transactions |
| **Church Use Case** | ✅ Perfect for content management | ✅ Good for structured data |

Both databases work identically with your existing frontend - choose based on your team's preferences and future needs!
