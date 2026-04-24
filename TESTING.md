# SiteScout Authentication System - Testing Guide

This guide will help you test the complete authentication system before going to production.

## 🚀 Quick Start Testing

### Option 1: Automated Test Suite (Recommended)

Run the complete automated test suite:

```bash
node test-authentication-system.js
```

This will:
- ✅ Check prerequisites (Node.js, npm, PostgreSQL)
- ✅ Install dependencies
- ✅ Setup database
- ✅ Run migrations
- ✅ Start backend server
- ✅ Run backend tests
- ✅ Run frontend tests
- ✅ Test frontend build
- ✅ Provide manual testing instructions

### Option 2: Manual Testing

If you prefer to test manually, follow these steps:

## 📋 Prerequisites

1. **Node.js** (v18 or higher)
2. **npm** (v8 or higher)
3. **PostgreSQL** (v12 or higher)
4. **Git** (for cloning the repository)

## 🗄️ Database Setup

1. **Install PostgreSQL** if not already installed
2. **Run the database setup script**:
   ```bash
   cd backend
   .\setup-database.ps1
   ```

## 📦 Installation

1. **Install backend dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Install frontend dependencies**:
   ```bash
   cd frontend
   npm install
   ```

3. **Create environment file**:
   ```bash
   cd backend
   copy env.example .env
   ```
   
   Edit `.env` with your database credentials:
   ```env
   DB_USER=postgres
   DB_HOST=localhost
   DB_NAME=sitescout
   DB_PASSWORD=your_password_here
   DB_PORT=5432
   JWT_SECRET=your_jwt_secret_here
   ```

## 🔄 Database Migration

Run the database migration to create/update tables:

```bash
cd backend
npm run migrate
```

## 🧪 Running Tests

### Backend Tests

```bash
cd backend
npm run test:auth
```

This tests:
- ✅ Database connection
- ✅ Server health
- ✅ User signup
- ✅ User login
- ✅ Token verification
- ✅ User profile access
- ✅ Forgot password
- ✅ Password reset
- ✅ User logout

### Frontend Tests

```bash
cd frontend
npm run test:auth
```

This tests:
- ✅ API integration
- ✅ LocalStorage operations

### Database Connection Test

```bash
cd backend
npm run test:db
```

## 🚀 Manual Testing

### 1. Start the Backend Server

```bash
cd backend
npm run dev
```

The server will start on `http://localhost:3001`

### 2. Start the Frontend Development Server

```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:3000`

### 3. Test the Authentication Flow

#### Signup Flow
1. Open `http://localhost:3000/signup`
2. Fill out the form with test data:
   - First Name: Test
   - Last Name: User
   - Email: test@example.com
   - Password: testpassword123
   - Company: Test Company
   - Phone: +1234567890
3. Accept terms and conditions
4. Click "Create account"
5. Verify you're redirected to the main page

#### Login Flow
1. Open `http://localhost:3000/login`
2. Enter the credentials from signup
3. Click "Sign in"
4. Verify you're logged in and can access protected content

#### Forgot Password Flow
1. Open `http://localhost:3000/forgot-password`
2. Enter your email address
3. Click "Send reset link"
4. Verify you see the success message

#### Profile Access
1. While logged in, try to access profile information
2. Verify user data is displayed correctly

#### Logout Flow
1. Click logout or navigate to logout
2. Verify you're logged out and redirected

## 🔍 API Testing

You can also test the API endpoints directly using tools like Postman or curl:

### Signup
```bash
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "password": "testpassword123",
    "confirmPassword": "testpassword123",
    "companyName": "Test Company",
    "phone": "+1234567890"
  }'
```

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123"
  }'
```

### Get Profile (with token)
```bash
curl -X GET http://localhost:3001/api/user/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Ensure PostgreSQL is running
   - Check database credentials in `.env`
   - Verify database exists

2. **Port Already in Use**
   - Change the port in `.env` file
   - Kill existing processes using the port

3. **CORS Errors**
   - Ensure frontend URL is correct in backend `.env`
   - Check that both servers are running

4. **JWT Token Issues**
   - Verify JWT_SECRET is set in `.env`
   - Check token expiration settings

### Debug Mode

Enable debug logging by setting in backend `.env`:
```env
LOG_LEVEL=debug
NODE_ENV=development
```

## 📊 Test Results

After running tests, you should see results like:

```
📊 Test Results:
   Passed: 9/9
   Success Rate: 100%

🎉 All tests passed! Authentication system is working correctly.
```

## 🚀 Production Readiness Checklist

Before going to production, ensure:

- [ ] All tests pass
- [ ] Environment variables are properly configured
- [ ] JWT_SECRET is changed from default
- [ ] Database is properly secured
- [ ] CORS settings are configured for production domain
- [ ] SSL/TLS is enabled
- [ ] Rate limiting is implemented
- [ ] Error logging is configured
- [ ] Backup strategy is in place

## 📞 Support

If you encounter issues during testing:

1. Check the troubleshooting section above
2. Review the error logs
3. Ensure all prerequisites are met
4. Verify database connectivity
5. Check network connectivity between frontend and backend

## 🎯 Next Steps

After successful testing:

1. **Deploy to staging environment**
2. **Run integration tests**
3. **Perform security audit**
4. **Deploy to production**
5. **Monitor system performance**

---

**Happy Testing! 🧪✨**
