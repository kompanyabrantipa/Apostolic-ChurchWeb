# Frontend Directory

This directory contains all client-side files for the Apostolic Church International website.

## Structure

```
frontend/
├── *.html              # All HTML pages
├── css/                # Stylesheets
│   ├── style.css       # Main stylesheet
│   ├── admin.css       # Admin dashboard styles
│   └── content-display.css # Content display styles
├── js/                 # JavaScript files
│   ├── script.js       # Main JavaScript
│   ├── admin.js        # Admin functionality
│   ├── config.js       # Frontend configuration
│   └── *.js            # Other JavaScript modules
├── images/             # Static images and assets
├── uploads/            # User uploaded content
└── README.md           # This file
```

## Pages

- `index.html` - Homepage
- `about.html` - About page
- `blog.html` - Blog listing
- `calendar.html` - Events calendar
- `contact.html` - Contact information
- `dashboard.html` - Admin dashboard
- `donate.html` - Donation page
- `events.html` - Events listing
- `leadership.html` - Leadership page
- `login.html` - Admin login
- `sermon-archive.html` - Sermon archive
- `service.html` - Services page

## Development

All paths in this directory are relative to the frontend folder. The backend server serves these files statically from the `/frontend` directory.

## Notes

- All image references use relative paths (`images/filename.jpg`)
- CSS files use relative paths (`../images/filename.jpg`) to reference images
- JavaScript modules are loaded with relative paths (`js/filename.js`)
