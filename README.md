# Apostolic Church International - Admin Dashboard

A complete full-stack admin dashboard system for managing church website content including blog posts, events, and sermons.

## 🚀 Features

### Admin Dashboard
- **Secure Authentication**: JWT-based login system with password hashing
- **Content Management**: Full CRUD operations for blog posts, events, and sermons
- **Image Upload**: Built-in image upload functionality with file validation
- **Real-time Updates**: Changes reflect immediately on the frontend
- **Responsive Design**: Mobile-friendly admin interface
- **Dashboard Analytics**: Overview statistics and recent activity tracking

### Frontend Integration
- **RESTful API**: Clean API endpoints for frontend consumption
- **Dynamic Content**: Frontend pages automatically load content from the admin system
- **Status Management**: Draft and published content states
- **Search & Filter**: Easy content discovery and management

### Security Features
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Comprehensive data validation and sanitization
- **File Upload Security**: Image type and size restrictions
- **CORS Protection**: Secure cross-origin resource sharing
- **Security Headers**: Helmet.js for additional security

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js framework
- **JSON File Storage** (easily migrable to MySQL)
- **JWT Authentication** with bcryptjs password hashing
- **Multer** for file uploads
- **Express Validator** for input validation
- **Helmet.js** for security headers

### Frontend
- **HTML5, CSS3, JavaScript** (Vanilla JS)
- **Responsive Design** with mobile-first approach
- **Font Awesome** icons
- **Google Fonts** (Inter font family)

### Admin Dashboard
- **Modern UI/UX** with clean, professional design
- **Modal-based Forms** for content creation/editing
- **Real-time Feedback** with loading states and success messages
- **Table-based Content Management** with action buttons

## 📁 Project Structure

```
Apostolic-2/
├── backend/
│   ├── admin/                 # Admin dashboard assets
│   │   ├── css/
│   │   │   └── admin.css     # Admin dashboard styles
│   │   └── js/
│   │       └── admin.js      # Admin dashboard functionality
│   ├── data/                 # JSON data storage
│   │   ├── admins.json       # Admin users
│   │   ├── blog-posts.json   # Blog posts data
│   │   ├── events.json       # Events data
│   │   └── sermons.json      # Sermons data
│   ├── middleware/           # Express middleware
│   │   ├── auth.js          # JWT authentication
│   │   └── validation.js    # Input validation & rate limiting
│   ├── models/              # Data models
│   │   └── DataStore.js     # JSON file data operations
│   ├── routes/              # API routes
│   │   ├── admin.js         # Admin dashboard API
│   │   ├── auth.js          # Authentication routes
│   │   ├── blog.js          # Blog posts API
│   │   ├── events.js        # Events API
│   │   ├── sermons.js       # Sermons API
│   │   └── upload.js        # File upload API
│   ├── uploads/             # Uploaded images storage
│   ├── seedAdmin.js         # Admin user creation script
│   └── server.js            # Main server file
├── css/                     # Frontend styles
├── js/                      # Frontend JavaScript
├── images/                  # Static images
├── *.html                   # Frontend pages
├── package.json
└── README.md
```

## 🚀 Quick Start

### 1. Installation

```bash
# Clone the repository
git clone <repository-url>
cd Apostolic-2

# Install dependencies
npm install
```

### 2. Create Admin User

```bash
# Create the default admin user
npm run seed-admin
```

**Default Login Credentials:**
- Username: `admin`
- Password: `admin123`

⚠️ **Important**: Change the default password after first login!

### 3. Start the Server

```bash
# Start the application
npm start
```

The application will be available at:
- **Main Website**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3000/dashboard.html

## 📖 Usage Guide

### Admin Dashboard Access

1. Navigate to http://localhost:3000/admin
2. Login with your admin credentials
3. Use the sidebar navigation to manage different content types

### Managing Content

#### Blog Posts
- **Create**: Click "Add New Post" button
- **Edit**: Click the edit icon in the actions column
- **Delete**: Click the delete icon (with confirmation)
- **Status**: Toggle between Draft and Published

#### Events
- **Create**: Click "Add New Event" button
- **Fields**: Title, Description, Date/Time, Location, Category
- **Categories**: Service, Bible Study, Prayer Meeting, Youth Event, Community Outreach, Special Event

#### Sermons
- **Create**: Click "Add New Sermon" button
- **Fields**: Title, Description, Date, Speaker, Video URL, Thumbnail, Scripture, Series
- **Video Integration**: Supports YouTube and other video platforms

### Image Upload

Each content type supports image uploads:
- **File Types**: JPEG, PNG, GIF, WebP
- **Size Limit**: 5MB maximum
- **Storage**: Files stored in `backend/uploads/` directory
- **Alternative**: Manual URL input also supported

## 🔧 API Endpoints

### Public Endpoints (Frontend)
```
GET /api/blog/public          # Get published blog posts
GET /api/blog/public/:id      # Get single blog post
GET /api/events/public        # Get published events
GET /api/events/public/:id    # Get single event
GET /api/sermons/public       # Get published sermons
GET /api/sermons/public/:id   # Get single sermon
```

### Admin Endpoints (Protected)
```
POST /api/auth/login          # Admin login
GET  /api/auth/verify         # Verify token
POST /api/auth/logout         # Admin logout

GET    /api/blog              # Get all blog posts
POST   /api/blog              # Create blog post
GET    /api/blog/:id          # Get single blog post
PUT    /api/blog/:id          # Update blog post
DELETE /api/blog/:id          # Delete blog post

GET    /api/events            # Get all events
POST   /api/events            # Create event
GET    /api/events/:id        # Get single event
PUT    /api/events/:id        # Update event
DELETE /api/events/:id        # Delete event

GET    /api/sermons           # Get all sermons
POST   /api/sermons           # Create sermon
GET    /api/sermons/:id       # Get single sermon
PUT    /api/sermons/:id       # Update sermon
DELETE /api/sermons/:id       # Delete sermon

GET /api/admin/stats          # Dashboard statistics
GET /api/admin/recent-activity # Recent activity

POST   /api/upload/image      # Upload image
DELETE /api/upload/image/:filename # Delete image
```

## 🔒 Security Features

### Authentication
- JWT tokens with 24-hour expiration
- Bcrypt password hashing with salt rounds
- Secure token storage in localStorage

### Rate Limiting
- **Authentication**: 5 attempts per 15 minutes
- **File Upload**: 10 uploads per minute
- **API Requests**: 100 requests per minute

### Input Validation
- Server-side validation for all inputs
- XSS protection with input sanitization
- File type and size validation for uploads
- SQL injection prevention (though using JSON storage)

### Security Headers
- Helmet.js for security headers
- CORS configuration
- Content Security Policy

## 🗄️ Data Storage

Currently uses JSON files for data storage:
- `backend/data/admins.json` - Admin users
- `backend/data/blog-posts.json` - Blog posts
- `backend/data/events.json` - Events
- `backend/data/sermons.json` - Sermons

### Migration to MySQL

The system is designed for easy migration to MySQL. The `DataStore.js` model can be replaced with database queries while maintaining the same interface.

## 🎨 Customization

### Styling
- Admin dashboard styles: `backend/admin/css/admin.css`
- Frontend styles: `css/style.css`
- Responsive design with mobile-first approach

### Configuration
- Server port: Environment variable `PORT` or default 3000
- JWT secret: Environment variable `JWT_SECRET` or default value
- Upload limits: Configurable in `backend/routes/upload.js`

## 🚀 Deployment

### Environment Variables
```bash
PORT=3000
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=production
```

### Production Considerations
1. Change default admin password
2. Set strong JWT secret
3. Configure proper CORS origins
4. Set up HTTPS
5. Configure file upload limits
6. Set up backup for JSON data files
7. Consider migrating to a proper database

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
1. Check the documentation above
2. Review the code comments
3. Create an issue in the repository

## 🔄 Updates and Maintenance

### Regular Tasks
- Update dependencies regularly
- Monitor security vulnerabilities
- Backup data files
- Review and rotate JWT secrets
- Monitor server logs

### Future Enhancements
- Database migration (MySQL/PostgreSQL)
- User role management
- Email notifications
- Content scheduling
- SEO optimization
- Analytics integration
- Backup and restore functionality