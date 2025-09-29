# TEC Learning Platform 🎓

A comprehensive learning and training platform built with **React** frontend and **FastAPI** backend.

## 🚀 Quick Deploy to Heroku

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/tecsrilankaworldwide/tec-platform-production)

## ✨ Features

- **User Authentication** - Student, Instructor, and Admin roles
- **Course Management** - Create, manage, and enroll in courses
- **Progress Tracking** - Real-time learning progress and analytics
- **Dashboard Analytics** - Comprehensive learning insights
- **Responsive Design** - Works on all devices

## 🛠️ Tech Stack

- **Frontend**: React 19, Tailwind CSS, Radix UI
- **Backend**: FastAPI, Python 3.11
- **Database**: MongoDB
- **Deployment**: Heroku

## 📋 Prerequisites for Local Development

- Node.js 18.x
- Python 3.11
- MongoDB
- Yarn package manager

## 🔧 Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/tecsrilankaworldwide/tec-platform-production.git
   cd tec-platform-production
   ```

2. **Install dependencies**
   ```bash
   yarn install-deps
   ```

3. **Set up environment variables**
   
   Backend (`backend/.env`):
   ```
   MONGO_URL=mongodb://localhost:27017
   DB_NAME=tec_platform
   CORS_ORIGINS=*
   SECRET_KEY=your-secret-key-here
   ```
   
   Frontend (`frontend/.env`):
   ```
   REACT_APP_BACKEND_URL=http://localhost:8001
   ```

4. **Start development servers**
   ```bash
   yarn dev
   ```

## 🌐 Heroku Deployment

### Automatic Deployment
Click the "Deploy to Heroku" button above for one-click deployment.

### Manual Deployment

1. **Create Heroku app**
   ```bash
   heroku create your-app-name
   ```

2. **Set up MongoDB**
   ```bash
   heroku addons:create mongolab:sandbox
   ```

3. **Set environment variables**
   ```bash
   heroku config:set SECRET_KEY=$(openssl rand -base64 32)
   heroku config:set NODE_ENV=production
   ```

4. **Deploy**
   ```bash
   git push heroku main
   ```

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGO_URL` | MongoDB connection string | ✅ |
| `DB_NAME` | Database name | ✅ |
| `SECRET_KEY` | JWT secret key | ✅ |
| `CORS_ORIGINS` | Allowed CORS origins | ✅ |
| `NODE_ENV` | Node environment | ✅ |

## 👥 User Roles

- **Student**: Enroll in courses, track progress, view analytics
- **Instructor**: Create courses, manage content, view student analytics  
- **Admin**: Platform-wide analytics and user management

## 📱 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Courses
- `GET /api/courses` - List all courses
- `POST /api/courses` - Create new course (instructor only)
- `GET /api/courses/{id}` - Get course details
- `GET /api/courses/{id}/lessons` - Get course lessons

### Enrollment & Progress
- `POST /api/enrollments/{course_id}` - Enroll in course
- `GET /api/enrollments/my` - Get user enrollments
- `POST /api/progress/lesson/{lesson_id}` - Mark lesson complete

### Analytics
- `GET /api/analytics/dashboard` - Get dashboard analytics

## 🔍 Testing

### Test User Accounts
After deployment, you can create test accounts:

**Test Student:**
- Email: `student@test.com`
- Password: `password123`

**Test Instructor:**  
- Email: `instructor@test.com`
- Password: `password123`

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions, please contact [TEC Sri Lanka](mailto:info@tecsl.lk)

---

**Made with ❤️ by TEC Sri Lanka**
