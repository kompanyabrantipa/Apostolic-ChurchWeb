# Backend Directory

This directory contains all server-side code for the Apostolic Church International website.

## Structure

```
backend/
├── server.js           # Main server file (simple implementation)
├── seedAdmin.js        # Admin user seeding script
├── data/               # JSON data storage
├── middleware/         # Express middleware
├── models/             # Data models
├── routes/             # API routes
├── uploads/            # Backend uploaded files
└── advanced-server/    # Advanced server implementation
    ├── server.js       # Advanced server with database
    ├── server-mongodb.js # MongoDB implementation
    ├── config/         # Database configuration
    ├── models/         # Database models
    ├── routes/         # Advanced API routes
    └── scripts/        # Utility scripts
```

## Server Implementations

### Simple Server (`server.js`)
- Uses JSON file storage
- Basic authentication
- Simple API endpoints
- Default implementation

### Advanced Server (`advanced-server/`)
- Database integration (SQLite/MongoDB)
- Advanced authentication
- Production-ready features
- Logging and monitoring

## Running the Server

```bash
# Simple server (default)
npm start
# or
npm run dev

# Advanced server
npm run start-advanced

# MongoDB server
npm run start-mongodb

# Seed admin user
npm run seed-admin
```

## API Endpoints

- `/api/auth` - Authentication
- `/api/blog` - Blog management
- `/api/events` - Events management
- `/api/sermons` - Sermons management
- `/api/upload` - File uploads
- `/api/admin` - Admin operations

## Configuration

The server serves the frontend files from the `../frontend` directory and provides API endpoints for dynamic content management.
