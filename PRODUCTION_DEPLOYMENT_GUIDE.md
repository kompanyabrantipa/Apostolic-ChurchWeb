# 🚀 Production Deployment Guide - Apostolic Church Website

## ✅ **Current Status: READY FOR PRODUCTION**

Your frontend and backend are now properly configured for production deployment. Here's your complete deployment and testing guide.

## 🌐 **Production URLs**
- **Frontend (Hostinger)**: https://apostolicchurchlouisville.org
- **Backend (Render)**: https://apostolic-church-louisville-assembly.onrender.com
- **Admin Dashboard**: https://apostolicchurchlouisville.org/dashboard.html
- **Admin Login**: https://apostolicchurchlouisville.org/login.html

## 📋 **Step-by-Step Deployment Process**

### **1. Backend Deployment on Render**

#### **Environment Variables to Set in Render Dashboard:**
```bash
# Database
MONGODB_URI=your_mongodb_atlas_connection_string
NODE_ENV=production

# CORS Configuration (CRITICAL)
ALLOWED_ORIGINS=https://apostolicchurchlouisville.org,https://www.apostolicchurchlouisville.org
FRONTEND_URL=https://apostolicchurchlouisville.org

# Authentication
JWT_SECRET=your_super_secure_jwt_secret_here
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_secure_admin_password

# Stripe (if using payments)
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_key
STRIPE_SECRET_KEY=sk_live_your_stripe_secret

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=uploads
```

#### **Deploy Backend:**
1. Push your backend code to GitHub
2. Connect GitHub repo to Render
3. Set environment variables in Render dashboard
4. Deploy and wait for build to complete
5. Test backend health: `https://apostolic-church-louisville-assembly.onrender.com/api/health`

### **2. Frontend Deployment on Hostinger**

#### **Files to Upload to Hostinger:**
```
public_html/
├── index.html
├── about.html
├── contact.html
├── donate.html
├── login.html
├── dashboard.html
├── css/
├── js/
├── images/
└── ... (all other static files)
```

#### **Critical Files for Production:**
- ✅ `js/config.js` - Environment detection and API URLs
- ✅ `js/data-service-api.js` - Enhanced API handling with retries
- ✅ `login.html` - Admin authentication
- ✅ `dashboard.html` - Admin portal

## 🧪 **Complete Testing Guide**

### **Phase 1: Backend API Testing**

#### **1. Test Backend Health**
```bash
# Open browser dev tools (F12) and run in console:
fetch('https://apostolic-church-louisville-assembly.onrender.com/api/health')
  .then(response => response.json())
  .then(data => console.log('Backend Health:', data))
  .catch(error => console.error('Backend Error:', error));
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "database": "connected"
}
```

#### **2. Test CORS Configuration**
```bash
# In browser console on https://apostolicchurchlouisville.org:
fetch('https://apostolic-church-louisville-assembly.onrender.com/api/config/client', {
  credentials: 'include'
})
.then(response => {
  console.log('CORS Status:', response.status);
  console.log('CORS Headers:', response.headers.get('Access-Control-Allow-Origin'));
  return response.json();
})
.then(data => console.log('Config Data:', data))
.catch(error => console.error('CORS Error:', error));
```

### **Phase 2: Frontend Configuration Testing**

#### **1. Test Environment Detection**
```bash
# In browser console on https://apostolicchurchlouisville.org:
console.log('Environment:', window.Config?.environment);
console.log('API Base URL:', window.Config?.api?.baseUrl);
console.log('Is Production:', window.location.hostname === 'apostolicchurchlouisville.org');
```

#### **2. Test API Integration**
```bash
# Test blog loading:
fetch(window.Config.api.baseUrl + '/blogs', { credentials: 'include' })
  .then(response => response.json())
  .then(data => console.log('Blogs loaded:', data))
  .catch(error => console.error('Blog loading error:', error));
```

### **Phase 3: Admin Portal Testing**

#### **1. Test Admin Login**
1. Go to: https://apostolicchurchlouisville.org/login.html
2. Open browser dev tools (F12) → Network tab
3. Enter admin credentials and submit
4. Check network requests:
   - Should see POST to `/api/auth/login`
   - Response should be 200 with success message
   - Should redirect to dashboard

#### **2. Test Dashboard Functionality**
1. Go to: https://apostolicchurchlouisville.org/dashboard.html
2. Open dev tools → Network tab
3. Test each feature:
   - Create new blog post
   - Upload image
   - Save content
   - Check network requests for errors

### **Phase 4: Payment System Testing (if applicable)**

#### **1. Test Donation Form**
1. Go to: https://apostolicchurchlouisville.org/donate.html
2. Open dev tools → Network tab
3. Fill out donation form
4. Check Stripe integration:
   - Should see requests to Stripe API
   - Should see requests to your backend `/api/payments`

## 🔧 **Troubleshooting Common Issues**

### **CORS Errors**
**Symptoms:** Console shows "blocked by CORS policy"
**Solution:**
1. Check Render environment variables: `ALLOWED_ORIGINS`
2. Ensure no trailing slashes in URLs
3. Restart Render service after environment changes

### **API Connection Errors**
**Symptoms:** Network errors, timeouts, 404s
**Solution:**
1. Verify backend is running: check Render logs
2. Test direct API URL in browser
3. Check environment detection in frontend

### **Authentication Issues**
**Symptoms:** Login fails, redirects don't work
**Solution:**
1. Check JWT_SECRET is set in Render
2. Verify admin credentials in environment
3. Check cookie settings and CORS credentials

### **File Upload Issues**
**Symptoms:** Images don't save, quota errors
**Solution:**
1. Check MAX_FILE_SIZE environment variable
2. Verify upload directory permissions
3. Test with smaller images first

## 📊 **Production Monitoring**

### **Key Metrics to Monitor:**
1. **Backend Health**: Regular health check calls
2. **API Response Times**: Monitor in browser dev tools
3. **Error Rates**: Check browser console for errors
4. **User Authentication**: Monitor login success rates

### **Render Monitoring:**
1. Check Render dashboard for service status
2. Monitor logs for errors
3. Set up alerts for downtime

## 🔒 **Security Checklist**

- ✅ HTTPS enabled on both frontend and backend
- ✅ CORS properly configured with specific origins
- ✅ JWT secrets are secure and environment-specific
- ✅ Admin credentials are strong and secure
- ✅ File upload limits are enforced
- ✅ Rate limiting is enabled on API endpoints

## 🎉 **Go Live Checklist**

### **Before Going Live:**
- [ ] Backend deployed and health check passes
- [ ] Frontend uploaded to Hostinger
- [ ] All environment variables set in Render
- [ ] CORS testing completed successfully
- [ ] Admin login tested and working
- [ ] Content creation tested in dashboard
- [ ] Payment system tested (if applicable)
- [ ] All forms tested and working

### **After Going Live:**
- [ ] Monitor Render logs for errors
- [ ] Test all functionality from production URLs
- [ ] Verify Google Analytics/tracking (if configured)
- [ ] Test on multiple devices and browsers
- [ ] Set up monitoring and alerts

## 🆘 **Emergency Contacts & Rollback**

### **If Something Goes Wrong:**
1. **Check Render logs** for backend errors
2. **Revert to previous GitHub commit** if needed
3. **Check environment variables** in Render dashboard
4. **Test individual API endpoints** to isolate issues

Your website is now production-ready! 🚀
