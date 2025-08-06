# Apostolic Church Backend Server

This is the Node.js/Express backend server for the Apostolic Church website, providing API endpoints for content management while preserving all existing frontend functionality.

## 🚀 Quick Start

### Prerequisites

1. **Node.js 18+** - [Download here](https://nodejs.org/)
2. **PostgreSQL 12+** - [Download here](https://www.postgresql.org/download/)
3. **Git** (optional) - For version control

### Installation Steps

1. **Navigate to server directory:**
   ```bash
   cd server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env file with your database credentials
   ```

4. **Create PostgreSQL database:**
   ```sql
   -- Connect to PostgreSQL as superuser
   CREATE DATABASE apostolic_church;
   CREATE USER apostolic_user WITH PASSWORD 'church_secure_2024';
   GRANT ALL PRIVILEGES ON DATABASE apostolic_church TO apostolic_user;
   ```

5. **Set up database schema:**
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
   - Should see: `{"success": true, "message": "Server is healthy"}`

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
node scripts/migrate-from-localstorage.js --sample

# Then migrate the sample data
npm run migrate
```

## 🔧 API Endpoints

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
- `GET /api/health` - Server health check
- `GET /api/stats` - Get content statistics

## 🔄 Frontend Integration

### Phase 1: Dual-Write System (Current)

The system currently supports both localStorage and API simultaneously:

1. **DataService Enhancement:** Use `js/data-service-api.js` instead of `js/data-service.js`
2. **Automatic Fallback:** API calls fall back to localStorage if server is unavailable
3. **Dual-Write:** Changes are written to both API and localStorage for safety

### Phase 2: Full API Migration (Next)

Once testing is complete:

1. **Update HTML files:** Replace `data-service.js` with `data-service-api.js`
2. **Configure API mode:** Set `DataService.config.useApi = true`
3. **Remove localStorage fallback:** Set `DataService.config.fallbackToLocalStorage = false`

## 🛡️ Security Features

- **JWT Authentication:** Secure token-based authentication
- **HTTP-Only Cookies:** Secure session management
- **CORS Protection:** Configurable cross-origin resource sharing
- **Rate Limiting:** Prevents API abuse
- **Input Validation:** All inputs are validated and sanitized
- **SQL Injection Protection:** Parameterized queries prevent SQL injection

## 📁 Project Structure

```
server/
├── config/
│   └── database.js          # Database connection and configuration
├── middleware/
│   └── auth.js              # Authentication middleware
├── models/
│   ├── Blog.js              # Blog data model
│   ├── Event.js             # Event data model
│   └── Sermon.js            # Sermon data model
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── blogs.js             # Blog API routes
│   ├── events.js            # Event API routes
│   └── sermons.js           # Sermon API routes
├── scripts/
│   ├── setup-database.js    # Database setup script
│   └── migrate-from-localstorage.js  # Migration script
├── .env                     # Environment variables
├── .env.example             # Environment template
├── package.json             # Dependencies and scripts
├── server.js                # Main server file
└── README.md                # This file
```

## 🔧 Configuration

### Environment Variables (.env)

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=apostolic_church
DB_USER=apostolic_user
DB_PASSWORD=your_secure_password

# JWT
JWT_SECRET=your_very_secure_jwt_secret_key_here_minimum_32_characters
JWT_EXPIRES_IN=24h

# Server
PORT=3001
NODE_ENV=development

# Admin User
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_admin_password

# CORS
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

## 🚨 Troubleshooting

### Database Connection Issues

1. **Check PostgreSQL is running:**
   ```bash
   # On Windows
   net start postgresql-x64-14
   
   # On macOS
   brew services start postgresql
   
   # On Linux
   sudo systemctl start postgresql
   ```

2. **Verify database exists:**
   ```bash
   psql -U apostolic_user -d apostolic_church -h localhost
   ```

3. **Check environment variables:**
   - Ensure `.env` file exists and has correct database credentials
   - Verify database name, username, and password match

### API Authentication Issues

1. **Clear browser cookies:**
   - Open Developer Tools → Application → Cookies
   - Delete `authToken` cookie

2. **Check admin user:**
   ```bash
   npm run setup-db  # Recreates admin user
   ```

3. **Verify JWT secret:**
   - Ensure `JWT_SECRET` in `.env` is at least 32 characters

### Migration Issues

1. **Check migration data format:**
   - Ensure JSON files are valid
   - Verify data structure matches expected format

2. **Database permissions:**
   - Ensure database user has INSERT permissions
   - Check table exists: `npm run setup-db`

## 📞 Support

For issues or questions:

1. Check the troubleshooting section above
2. Verify all prerequisites are installed
3. Check server logs for error messages
4. Ensure database is running and accessible

## 🎯 Next Steps

1. **Test the API:** Use the health endpoint to verify server is running
2. **Migrate data:** Follow the migration steps to transfer localStorage data
3. **Update frontend:** Switch to the enhanced DataService with API support
4. **Test functionality:** Verify dashboard and frontend pages work correctly
5. **Deploy:** Follow deployment guide for production setup
