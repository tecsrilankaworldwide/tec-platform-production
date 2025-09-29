from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
import hashlib
import jwt
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Settings
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Create the main app
app = FastAPI(title="TEC Learning Platform")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Enums
class UserRole(str, Enum):
    STUDENT = "student"
    INSTRUCTOR = "instructor"
    ADMIN = "admin"

class CourseLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"

class LessonType(str, Enum):
    VIDEO = "video"
    TEXT = "text"
    QUIZ = "quiz"
    ASSIGNMENT = "assignment"

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    full_name: str
    role: UserRole = UserRole.STUDENT
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    profile_image: Optional[str] = None
    bio: Optional[str] = None

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    role: UserRole = UserRole.STUDENT

class UserLogin(BaseModel):
    email: str
    password: str

class Course(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    instructor_id: str
    level: CourseLevel
    duration_hours: int
    price: float
    thumbnail: Optional[str] = None
    is_published: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class CourseCreate(BaseModel):
    title: str
    description: str
    level: CourseLevel
    duration_hours: int
    price: float
    thumbnail: Optional[str] = None

class Lesson(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    course_id: str
    title: str
    content: str
    type: LessonType
    order: int
    duration_minutes: Optional[int] = None
    video_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class LessonCreate(BaseModel):
    title: str
    content: str
    type: LessonType
    order: int
    duration_minutes: Optional[int] = None
    video_url: Optional[str] = None

class Enrollment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    course_id: str
    enrolled_at: datetime = Field(default_factory=datetime.utcnow)
    progress: float = 0.0
    completed: bool = False
    completion_date: Optional[datetime] = None

class LessonProgress(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    lesson_id: str
    course_id: str
    completed: bool = False
    time_spent_minutes: int = 0
    completed_at: Optional[datetime] = None

# Helper Functions
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    return hash_password(password) == hashed

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid authentication")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication")
    
    user = await db.users.find_one({"email": email})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return User(**user)

# Auth Routes
@api_router.post("/auth/register", response_model=User)
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    user_dict = user_data.dict()
    user_dict["password"] = hash_password(user_data.password)
    user = User(**{k: v for k, v in user_dict.items() if k != "password"})
    
    # Save to database
    await db.users.insert_one(user_dict)
    return user

@api_router.post("/auth/login")
async def login(user_data: UserLogin):
    print(f"DEBUG: Login attempt for email: {user_data.email}")
    user = await db.users.find_one({"email": user_data.email})
    print(f"DEBUG: User found: {user is not None}")
    if user:
        print(f"DEBUG: User email: {user['email']}")
        print(f"DEBUG: Password verification: {verify_password(user_data.password, user['password'])}")
    
    if not user or not verify_password(user_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token = create_access_token({"sub": user["email"]})
    return {"access_token": access_token, "token_type": "bearer", "user": User(**user)}

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# Course Routes
@api_router.post("/courses", response_model=Course)
async def create_course(course_data: CourseCreate, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.INSTRUCTOR, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Only instructors can create courses")
    
    course_dict = course_data.dict()
    course_dict["instructor_id"] = current_user.id
    course = Course(**course_dict)
    
    await db.courses.insert_one(course.dict())
    return course

@api_router.get("/courses", response_model=List[Course])
async def get_courses():
    courses = await db.courses.find({"is_published": True}).to_list(1000)
    return [Course(**course) for course in courses]

@api_router.get("/courses/{course_id}", response_model=Course)
async def get_course(course_id: str):
    course = await db.courses.find_one({"id": course_id})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return Course(**course)

@api_router.get("/courses/{course_id}/lessons", response_model=List[Lesson])
async def get_course_lessons(course_id: str):
    lessons = await db.lessons.find({"course_id": course_id}).sort("order", 1).to_list(1000)
    return [Lesson(**lesson) for lesson in lessons]

@api_router.post("/courses/{course_id}/lessons", response_model=Lesson)
async def create_lesson(course_id: str, lesson_data: LessonCreate, current_user: User = Depends(get_current_user)):
    # Check if user owns the course
    course = await db.courses.find_one({"id": course_id, "instructor_id": current_user.id})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found or access denied")
    
    lesson_dict = lesson_data.dict()
    lesson_dict["course_id"] = course_id
    lesson = Lesson(**lesson_dict)
    
    await db.lessons.insert_one(lesson.dict())
    return lesson

# Enrollment Routes
@api_router.post("/enrollments/{course_id}")
async def enroll_course(course_id: str, current_user: User = Depends(get_current_user)):
    # Check if course exists
    course = await db.courses.find_one({"id": course_id})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Check if already enrolled
    existing = await db.enrollments.find_one({"student_id": current_user.id, "course_id": course_id})
    if existing:
        raise HTTPException(status_code=400, detail="Already enrolled in this course")
    
    enrollment = Enrollment(student_id=current_user.id, course_id=course_id)
    await db.enrollments.insert_one(enrollment.dict())
    return {"message": "Successfully enrolled"}

@api_router.get("/enrollments/my", response_model=List[dict])
async def get_my_enrollments(current_user: User = Depends(get_current_user)):
    enrollments = await db.enrollments.find({"student_id": current_user.id}).to_list(1000)
    result = []
    for enrollment in enrollments:
        course = await db.courses.find_one({"id": enrollment["course_id"]})
        result.append({
            "enrollment": Enrollment(**enrollment),
            "course": Course(**course) if course else None
        })
    return result

# Progress Routes
@api_router.post("/progress/lesson/{lesson_id}")
async def mark_lesson_complete(lesson_id: str, current_user: User = Depends(get_current_user)):
    lesson = await db.lessons.find_one({"id": lesson_id})
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    # Check enrollment
    enrollment = await db.enrollments.find_one({"student_id": current_user.id, "course_id": lesson["course_id"]})
    if not enrollment:
        raise HTTPException(status_code=403, detail="Not enrolled in this course")
    
    # Mark lesson complete
    progress = LessonProgress(
        student_id=current_user.id,
        lesson_id=lesson_id,
        course_id=lesson["course_id"],
        completed=True,
        completed_at=datetime.utcnow()
    )
    await db.lesson_progress.insert_one(progress.dict())
    
    # Update course progress
    total_lessons = await db.lessons.count_documents({"course_id": lesson["course_id"]})
    completed_lessons = await db.lesson_progress.count_documents({
        "student_id": current_user.id,
        "course_id": lesson["course_id"],
        "completed": True
    })
    
    progress_percent = (completed_lessons / total_lessons) * 100 if total_lessons > 0 else 0
    await db.enrollments.update_one(
        {"student_id": current_user.id, "course_id": lesson["course_id"]},
        {"$set": {"progress": progress_percent, "completed": progress_percent >= 100}}
    )
    
    return {"message": "Lesson marked as complete", "progress": progress_percent}

# Analytics Routes
@api_router.get("/analytics/dashboard")
async def get_dashboard_analytics(current_user: User = Depends(get_current_user)):
    if current_user.role == UserRole.STUDENT:
        # Student analytics
        enrollments = await db.enrollments.find({"student_id": current_user.id}).to_list(1000)
        total_courses = len(enrollments)
        completed_courses = len([e for e in enrollments if e.get("completed", False)])
        avg_progress = sum([e.get("progress", 0) for e in enrollments]) / total_courses if total_courses > 0 else 0
        
        return {
            "total_courses": total_courses,
            "completed_courses": completed_courses,
            "in_progress_courses": total_courses - completed_courses,
            "average_progress": avg_progress
        }
    
    elif current_user.role == UserRole.INSTRUCTOR:
        # Instructor analytics
        courses = await db.courses.find({"instructor_id": current_user.id}).to_list(1000)
        total_courses = len(courses)
        
        total_students = 0
        for course in courses:
            student_count = await db.enrollments.count_documents({"course_id": course["id"]})
            total_students += student_count
        
        return {
            "total_courses": total_courses,
            "total_students": total_students,
            "published_courses": len([c for c in courses if c.get("is_published", False)])
        }
    
    else:  # ADMIN
        # Admin analytics
        total_users = await db.users.count_documents({})
        total_courses = await db.courses.count_documents({})
        total_enrollments = await db.enrollments.count_documents({})
        
        return {
            "total_users": total_users,
            "total_courses": total_courses,
            "total_enrollments": total_enrollments,
            "total_instructors": await db.users.count_documents({"role": "instructor"})
        }

# Basic Routes
@api_router.get("/")
async def root():
    return {"message": "TEC Learning Platform API"}

# Include router
app.include_router(api_router)

# Serve React build files for production (Heroku)
frontend_build_path = Path(__file__).parent.parent / "frontend" / "build"
if frontend_build_path.exists():
    app.mount("/static", StaticFiles(directory=str(frontend_build_path / "static")), name="static")
    
    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        # Serve API routes through /api prefix
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API route not found")
        
        # Serve React app for all other routes
        index_file = frontend_build_path / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))
        else:
            raise HTTPException(status_code=404, detail="Frontend not built")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()