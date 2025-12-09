from fastapi import FastAPI, APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext
import aiofiles
import mimetypes
from enum import Enum

# Stripe Integration
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create uploads directory
UPLOAD_DIR = ROOT_DIR / "uploads" / "videos"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security setup
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Stripe configuration
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY')
if not STRIPE_API_KEY:
    logging.warning("STRIPE_API_KEY not found in environment variables")

# Create the main app
app = FastAPI(title="TEC Future-Ready Learning Platform")

# Serve uploaded videos
app.mount("/uploads", StaticFiles(directory=str(ROOT_DIR / "uploads")), name="uploads")

# Create API router
api_router = APIRouter(prefix="/api")

# Enums
class UserRole(str, Enum):
    STUDENT = "student"
    TEACHER = "teacher"
    ADMIN = "admin"

class AgeGroup(str, Enum):
    FOUNDATION = "5-8"  # Foundation Level
    DEVELOPMENT = "9-12"  # Development Level  
    MASTERY = "13-16"  # Mastery Level

class LearningLevel(str, Enum):
    FOUNDATION = "foundation"
    DEVELOPMENT = "development"
    MASTERY = "mastery"

class SkillArea(str, Enum):
    AI_LITERACY = "ai_literacy"
    LOGICAL_THINKING = "logical_thinking"
    CREATIVE_PROBLEM_SOLVING = "creative_problem_solving"
    FUTURE_CAREER_SKILLS = "future_career_skills"
    SYSTEMS_THINKING = "systems_thinking"
    INNOVATION_METHODS = "innovation_methods"

class ActivityType(str, Enum):
    LOGIN = "login"
    LOGOUT = "logout"
    COURSE_ENROLLMENT = "course_enrollment"
    VIDEO_WATCHED = "video_watched"
    VIDEO_COMPLETED = "video_completed"
    COURSE_STARTED = "course_started"
    COURSE_COMPLETED = "course_completed"
    SKILL_PROGRESSION = "skill_progression"
    PAYMENT_MADE = "payment_made"
    LEARNING_PATH_UPDATED = "learning_path_updated"
    WORKOUT_STARTED = "workout_started"
    WORKOUT_COMPLETED = "workout_completed"
    WORKOUT_ATTEMPT = "workout_attempt"

class SubscriptionType(str, Enum):
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    ANNUAL = "annual"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    INITIATED = "initiated"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    EXPIRED = "expired"

class WorkoutType(str, Enum):
    PATTERN_RECOGNITION = "pattern_recognition"
    LOGICAL_SEQUENCES = "logical_sequences"
    PUZZLE_SOLVING = "puzzle_solving"
    REASONING_CHAINS = "reasoning_chains"
    CRITICAL_THINKING = "critical_thinking"
    PROBLEM_DECOMPOSITION = "problem_decomposition"

class WorkoutDifficulty(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"

# Future-Ready Curriculum Structure
LEARNING_FRAMEWORK = {
    "foundation": {  # Ages 5-8
        "level_name": "Foundation Level",
        "age_range": "5-8",
        "icon": "🌱",
        "description": "Building blocks of future thinking",
        "core_skills": [
            "Basic AI Understanding",
            "Simple Logical Reasoning", 
            "Creative Expression",
            "Problem Recognition",
            "Digital Awareness"
        ],
        "future_readiness": [
            "Technology Curiosity",
            "Basic Computational Thinking",
            "Creative Confidence",
            "Question Asking Skills"
        ]
    },
    "development": {  # Ages 9-12  
        "level_name": "Development Level",
        "age_range": "9-12",
        "icon": "🧠", 
        "description": "Expanding logical and creative thinking",
        "core_skills": [
            "Logical Reasoning Mastery",
            "AI Applications Understanding",
            "Design Thinking Process",
            "Complex Problem Solving",
            "Systems Understanding"
        ],
        "future_readiness": [
            "Algorithmic Thinking",
            "Innovation Mindset", 
            "Collaboration Skills",
            "Adaptability Training"
        ]
    },
    "mastery": {  # Ages 13-16
        "level_name": "Mastery Level", 
        "age_range": "13-16",
        "icon": "🎯",
        "description": "Future career and leadership preparation",
        "core_skills": [
            "Advanced AI Concepts",
            "Innovation Methodologies",
            "Systems Thinking",
            "Leadership Principles",
            "Future Career Navigation"
        ],
        "future_readiness": [
            "Entrepreneurial Thinking",
            "Advanced Problem Solving",
            "Technology Leadership",
            "Global Perspective",
            "Continuous Learning Mindset"
        ]
    }
}

# Unified Subscription Pricing
UNIFIED_PRICING = {
    "foundation": {  # Ages 5-8
        "monthly": {
            "price": 1200.00,  # Slightly increased for unified platform value
            "currency": "lkr",
            "duration_days": 30,
            "name": "Foundation Level - Monthly",
            "description": "Complete foundation skills for ages 5-8",
            "features": ["AI Basics", "Simple Logic", "Creative Play", "Progress Tracking"]
        },
        "quarterly": {
            "digital_price": 3060.00,  # 15% discount
            "materials_price": 1500.00,
            "total_price": 4560.00,
            "currency": "lkr",
            "duration_days": 90,
            "name": "Foundation Level - Quarterly",
            "description": "3 months + learning materials for ages 5-8",
            "features": ["All digital content", "Physical learning kit", "Activity books", "Parent guides"]
        }
    },
    "development": {  # Ages 9-12
        "monthly": {
            "price": 1800.00,
            "currency": "lkr",
            "duration_days": 30,
            "name": "Development Level - Monthly", 
            "description": "Advanced thinking skills for ages 9-12",
            "features": ["Logical Reasoning", "AI Applications", "Design Thinking", "Complex Problems"]
        },
        "quarterly": {
            "digital_price": 4590.00,  # 15% discount
            "materials_price": 1500.00,
            "total_price": 6090.00,
            "currency": "lkr",
            "duration_days": 90,
            "name": "Development Level - Quarterly",
            "description": "3 months + advanced materials for ages 9-12",
            "features": ["All digital content", "Advanced project kits", "Logic puzzles", "Innovation challenges"]
        }
    },
    "mastery": {  # Ages 13-16
        "monthly": {
            "price": 2800.00,
            "currency": "lkr",
            "duration_days": 30,
            "name": "Mastery Level - Monthly",
            "description": "Future career preparation for ages 13-16",
            "features": ["Advanced AI", "Innovation Methods", "Leadership Skills", "Career Guidance"]
        },
        "quarterly": {
            "digital_price": 7140.00,  # 15% discount
            "materials_price": 1500.00,
            "total_price": 8640.00,
            "currency": "lkr",
            "duration_days": 90,
            "name": "Mastery Level - Quarterly", 
            "description": "3 months + professional materials for ages 13-16",
            "features": ["All digital content", "Professional toolkit", "Career workbooks", "Future skills training"]
        }
    }
}

# Models
class UserBase(BaseModel):
    email: str
    full_name: str
    role: UserRole
    age_group: Optional[AgeGroup] = None  # Only for students

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True
    subscription_type: Optional[SubscriptionType] = None
    subscription_expires: Optional[datetime] = None
    learning_level: Optional[LearningLevel] = None
    skill_progress: Dict[str, int] = {}  # Skill area progress percentages
    total_watch_time: int = 0  # in minutes

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

# Enhanced Course Models
class CourseBase(BaseModel):
    title: str
    description: str
    learning_level: LearningLevel
    skill_areas: List[SkillArea]
    age_group: AgeGroup
    thumbnail_url: Optional[str] = None
    is_premium: bool = False
    difficulty_level: int = 1  # 1-5 scale
    estimated_hours: Optional[int] = None

class CourseCreate(CourseBase):
    pass

class Course(CourseBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_by: str  # teacher user id
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_published: bool = False
    videos: List[Dict[str, Any]] = []
    enrollment_count: int = 0
    average_rating: float = 0.0

class LearningPathProgress(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    learning_level: LearningLevel
    skill_progress: Dict[str, int] = {}  # Skill area completion percentages
    completed_courses: List[str] = []
    current_focus_areas: List[SkillArea] = []
    total_learning_time: int = 0
    level_completion_percentage: float = 0.0
    next_recommended_courses: List[str] = []
    last_updated: datetime = Field(default_factory=datetime.utcnow)

# Logical Thinking Workout Models
class LogicalWorkout(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    workout_type: WorkoutType
    difficulty: WorkoutDifficulty
    learning_level: LearningLevel
    age_group: AgeGroup
    estimated_time_minutes: int
    exercise_data: Dict[str, Any]  # Contains the actual workout content
    solution: Dict[str, Any]       # Contains the solution/answers
    hints: List[str] = []
    skill_areas: List[SkillArea] = []
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

class WorkoutAttempt(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    workout_id: str
    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    student_answer: Optional[Dict[str, Any]] = None
    is_correct: Optional[bool] = None
    time_spent_minutes: int = 0
    hints_used: int = 0
    attempts_count: int = 1
    score: Optional[int] = None  # 0-100 score

class WorkoutProgress(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    workout_type: WorkoutType
    difficulty: WorkoutDifficulty
    learning_level: LearningLevel
    total_attempts: int = 0
    successful_attempts: int = 0
    average_score: float = 0.0
    average_time_minutes: float = 0.0
    improvement_rate: float = 0.0
    last_attempt: Optional[datetime] = None
    mastery_level: int = 0  # 0-100 percentage

# Helper functions (keeping existing ones and adding new)
def get_learning_level_from_age(age_group: AgeGroup) -> LearningLevel:
    mapping = {
        AgeGroup.FOUNDATION: LearningLevel.FOUNDATION,
        AgeGroup.DEVELOPMENT: LearningLevel.DEVELOPMENT,
        AgeGroup.MASTERY: LearningLevel.MASTERY
    }
    return mapping[age_group]

def get_pricing_key_from_age(age_group: AgeGroup) -> str:
    mapping = {
        AgeGroup.FOUNDATION: "foundation",
        AgeGroup.DEVELOPMENT: "development", 
        AgeGroup.MASTERY: "mastery"
    }
    return mapping[age_group]

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def log_activity(user_id: str, activity_type: ActivityType, details: Dict[str, Any] = None, request: Request = None):
    """Log user activity for analytics"""
    activity = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "activity_type": activity_type.value,
        "timestamp": datetime.utcnow(),
        "details": details or {},
        "ip_address": request.client.host if request else None,
        "user_agent": request.headers.get("user-agent") if request else None
    }
    await db.activity_logs.insert_one(activity)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    user = await db.users.find_one({"id": user_id})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    return User(**user)

async def get_current_teacher(current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.TEACHER, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Teacher access required")
    return current_user

async def get_current_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# Authentication Routes
@api_router.post("/register", response_model=User)
async def register_user(user: UserCreate, request: Request):
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password and create user
    hashed_password = get_password_hash(user.password)
    user_dict = user.dict()
    del user_dict["password"]
    user_obj = User(**user_dict)
    
    # Set learning level based on age group
    if user_obj.age_group:
        user_obj.learning_level = get_learning_level_from_age(user_obj.age_group)
    
    # Store in database
    user_data = user_obj.dict()
    user_data["hashed_password"] = hashed_password
    await db.users.insert_one(user_data)
    
    # Initialize learning path for students
    if user_obj.role == UserRole.STUDENT and user_obj.learning_level:
        learning_path = LearningPathProgress(
            student_id=user_obj.id,
            learning_level=user_obj.learning_level,
            skill_progress={skill.value: 0 for skill in SkillArea}
        )
        await db.learning_paths.insert_one(learning_path.dict())
    
    # Log registration activity
    await log_activity(user_obj.id, ActivityType.LOGIN, {"action": "registration"}, request)
    
    return user_obj

@api_router.post("/login", response_model=Token)
async def login_user(login_data: UserLogin, request: Request):
    user_data = await db.users.find_one({"email": login_data.email})
    if not user_data or not verify_password(login_data.password, user_data["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    # Create access token
    access_token = create_access_token(data={"sub": user_data["id"]})
    user = User(**{k: v for k, v in user_data.items() if k != "hashed_password"})
    
    # Log login activity
    await log_activity(user.id, ActivityType.LOGIN, {"login_time": datetime.utcnow().isoformat()}, request)
    
    return Token(access_token=access_token, token_type="bearer", user=user)

@api_router.post("/logout")
async def logout_user(current_user: User = Depends(get_current_user), request: Request = None):
    await log_activity(current_user.id, ActivityType.LOGOUT, {"logout_time": datetime.utcnow().isoformat()}, request)
    return {"message": "Logged out successfully"}

@api_router.get("/me", response_model=User)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user

# Learning Framework Routes
@api_router.get("/learning-framework")
async def get_learning_framework():
    """Get the complete TEC learning framework"""
    return LEARNING_FRAMEWORK

@api_router.get("/learning-path")
async def get_learning_path(current_user: User = Depends(get_current_user)):
    """Get student's learning path progress"""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Only students have learning paths")
    
    learning_path = await db.learning_paths.find_one({"student_id": current_user.id})
    if not learning_path:
        # Create learning path if doesn't exist
        learning_path = LearningPathProgress(
            student_id=current_user.id,
            learning_level=current_user.learning_level or LearningLevel.FOUNDATION,
            skill_progress={skill.value: 0 for skill in SkillArea}
        )
        await db.learning_paths.insert_one(learning_path.dict())
        learning_path = learning_path.dict()
    
    # Add framework information
    framework_info = LEARNING_FRAMEWORK.get(learning_path["learning_level"], LEARNING_FRAMEWORK["foundation"])
    learning_path["framework"] = framework_info
    
    return learning_path

# Subscription Routes
@api_router.get("/subscription/plans")
async def get_subscription_plans():
    """Get unified subscription plans"""
    return UNIFIED_PRICING

@api_router.post("/enrollment/bank-transfer")
async def create_bank_transfer_enrollment(enrollment_data: dict):
    """Public enrollment with bank transfer - no authentication required"""
    
    # Extract data
    student_name = enrollment_data.get("student_name")
    parent_name = enrollment_data.get("parent_name")
    email = enrollment_data.get("email")
    phone = enrollment_data.get("phone")
    address = enrollment_data.get("address", "")
    program_id = enrollment_data.get("program_id")
    age_range = enrollment_data.get("age_group")
    billing_cycle = enrollment_data.get("subscription_type", "monthly")
    amount = enrollment_data.get("amount")
    
    # Store enrollment in database
    enrollment_record = {
        "id": str(uuid.uuid4()),
        "student_name": student_name,
        "parent_name": parent_name,
        "email": email,
        "phone": phone,
        "address": address,
        "program_id": program_id,
        "age_range": age_range,
        "billing_cycle": billing_cycle,
        "amount": amount,
        "payment_method": "bank_transfer",
        "status": "pending_payment",
        "created_at": datetime.utcnow().isoformat()
    }
    
    await db.enrollments.insert_one(enrollment_record)
    
    return {
        "success": True,
        "enrollment_id": enrollment_record["id"],
        "message": "Enrollment submitted. Please complete bank transfer."
    }

@api_router.post("/enrollment/checkout")
async def create_public_enrollment_checkout(
    enrollment_data: dict,
    request: Request = None
):
    """Public enrollment with Stripe checkout - no authentication required"""
    if not STRIPE_API_KEY:
        raise HTTPException(status_code=500, detail="Payment processing not configured")
    
    # Extract data
    student_name = enrollment_data.get("student_name")
    parent_name = enrollment_data.get("parent_name")
    email = enrollment_data.get("email")
    phone = enrollment_data.get("phone")
    address = enrollment_data.get("address", "")
    program_id = enrollment_data.get("program_id")
    age_range = enrollment_data.get("age_group")
    billing_cycle = enrollment_data.get("subscription_type", "monthly")
    
    # Pricing map (simplified - matches frontend)
    pricing = {
        "foundation": {"monthly": 800, "quarterly": 2800},
        "explorers": {"monthly": 1200, "quarterly": 4200},
        "smart": {"monthly": 1500, "quarterly": 5250},
        "teens": {"monthly": 2000, "quarterly": 7000},
        "leaders": {"monthly": 2500, "quarterly": 8750}
    }
    
    if program_id not in pricing:
        raise HTTPException(status_code=400, detail="Invalid program")
    
    amount = pricing[program_id].get(billing_cycle, pricing[program_id]["monthly"])
    
    # Initialize Stripe checkout
    host_url = str(request.base_url).rstrip("/")
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    # Create checkout session
    checkout_request = CheckoutSessionRequest(
        amount=amount,
        currency="lkr",
        success_url=enrollment_data.get("success_url"),
        cancel_url=enrollment_data.get("cancel_url"),
        metadata={
            "student_name": student_name,
            "parent_name": parent_name,
            "email": email,
            "phone": phone,
            "address": address,
            "program_id": program_id,
            "age_range": age_range,
            "billing_cycle": billing_cycle,
            "enrollment_type": "public"
        }
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Store enrollment in database for later processing
    enrollment_record = {
        "id": str(uuid.uuid4()),
        "student_name": student_name,
        "parent_name": parent_name,
        "email": email,
        "phone": phone,
        "address": address,
        "program_id": program_id,
        "age_range": age_range,
        "billing_cycle": billing_cycle,
        "amount": amount,
        "stripe_session_id": session.session_id,
        "status": "pending_payment",
        "created_at": datetime.utcnow().isoformat()
    }
    
    await db.enrollments.insert_one(enrollment_record)
    
    return {"checkout_url": session.url, "session_id": session.session_id}

@api_router.post("/subscription/checkout")
async def create_subscription_checkout(
    subscription_request: dict,
    current_user: User = Depends(get_current_user),
    request: Request = None
):
    if not STRIPE_API_KEY:
        raise HTTPException(status_code=500, detail="Payment processing not configured")
    
    subscription_type = subscription_request.get("subscription_type")
    age_group = subscription_request.get("age_group")
    
    # Get pricing
    pricing_key = get_pricing_key_from_age(AgeGroup(age_group))
    
    if pricing_key not in UNIFIED_PRICING:
        raise HTTPException(status_code=400, detail="Invalid pricing level")
    
    if subscription_type not in UNIFIED_PRICING[pricing_key]:
        raise HTTPException(status_code=400, detail="Invalid subscription type")
    
    plan_info = UNIFIED_PRICING[pricing_key][subscription_type]
    
    # Calculate amount
    amount = plan_info.get("total_price", plan_info["price"])
    
    # Initialize Stripe checkout
    host_url = str(request.base_url).rstrip("/")
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    # Create checkout session
    checkout_request = CheckoutSessionRequest(
        amount=amount,
        currency="lkr",
        success_url=subscription_request["success_url"],
        cancel_url=subscription_request["cancel_url"],
        metadata={
            "user_id": current_user.id,
            "subscription_type": subscription_type,
            "age_group": age_group,
            "user_email": current_user.email,
            "plan_name": plan_info["name"]
        }
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    return {"checkout_url": session.url, "session_id": session.session_id}

# Course Routes  
@api_router.post("/courses", response_model=Course)
async def create_course(course: CourseCreate, current_user: User = Depends(get_current_teacher), request: Request = None):
    course_obj = Course(**course.dict(), created_by=current_user.id)
    await db.courses.insert_one(course_obj.dict())
    
    await log_activity(
        current_user.id,
        ActivityType.COURSE_STARTED,
        {"action": "course_created", "course_id": course_obj.id, "course_title": course_obj.title},
        request
    )
    
    return course_obj

@api_router.get("/courses")
async def get_courses(
    learning_level: Optional[LearningLevel] = None,
    skill_area: Optional[SkillArea] = None,
    age_group: Optional[AgeGroup] = None,
    published_only: bool = True
):
    query = {}
    if learning_level:
        query["learning_level"] = learning_level.value
    if age_group:
        query["age_group"] = age_group.value
    if skill_area:
        query["skill_areas"] = {"$in": [skill_area.value]}
    if published_only:
        query["is_published"] = True
    
    courses = await db.courses.find(query).to_list(100)
    
    # Remove MongoDB ObjectId from response
    for course in courses:
        if "_id" in course:
            del course["_id"]
    
    return courses

# Analytics Routes
@api_router.get("/analytics/students")
async def get_students_analytics(current_user: User = Depends(get_current_teacher)):
    """Get detailed student analytics for the unified platform"""
    
    students = []
    if current_user.role == UserRole.TEACHER:
        # Get students from teacher's courses
        teacher_courses = await db.courses.find({"created_by": current_user.id}).to_list(1000)
        course_ids = [course["id"] for course in teacher_courses]
        enrollments = await db.enrollments.find({"course_id": {"$in": course_ids}}).to_list(1000)
        student_ids = list(set([e["student_id"] for e in enrollments]))
    else:
        # Admins see all students
        all_users = await db.users.find({"role": "student"}).to_list(1000)
        student_ids = [user["id"] for user in all_users]
    
    for student_id in student_ids:
        user = await db.users.find_one({"id": student_id})
        if user:
            # Get learning path progress
            learning_path = await db.learning_paths.find_one({"student_id": student_id})
            
            # Get recent activities
            activities = await db.activity_logs.find(
                {"user_id": student_id}
            ).sort("timestamp", -1).limit(5).to_list(5)
            
            students.append({
                "user_id": user["id"],
                "full_name": user["full_name"],
                "email": user["email"],
                "age_group": user.get("age_group"),
                "learning_level": user.get("learning_level"),
                "subscription_type": user.get("subscription_type"),
                "skill_progress": learning_path["skill_progress"] if learning_path else {},
                "level_completion": learning_path["level_completion_percentage"] if learning_path else 0,
                "total_learning_time": learning_path["total_learning_time"] if learning_path else 0,
                "recent_activities": activities
            })
    
    return students

# Sample Logical Thinking Workouts Data
SAMPLE_WORKOUTS = [
    {
        "title": "Pattern Detective",
        "description": "Find the hidden pattern in this sequence and predict what comes next!",
        "workout_type": "pattern_recognition",
        "difficulty": "beginner",
        "learning_level": "foundation",
        "age_group": "5-8",
        "estimated_time_minutes": 5,
        "exercise_data": {
            "sequence": [1, 3, 5, 7, "?"],
            "type": "number_sequence",
            "instructions": "Look at the numbers and find the pattern. What number should replace the question mark?"
        },
        "solution": {"answer": 9, "explanation": "The pattern is adding 2 each time: 1+2=3, 3+2=5, 5+2=7, 7+2=9"},
        "hints": ["Look at the difference between consecutive numbers", "Try adding the same number each time"],
        "skill_areas": ["logical_thinking"]
    },
    {
        "title": "Logic Grid Challenge",
        "description": "Use logical reasoning to solve this puzzle about three friends and their favorite activities.",
        "workout_type": "reasoning_chains",
        "difficulty": "intermediate", 
        "learning_level": "development",
        "age_group": "9-12",
        "estimated_time_minutes": 10,
        "exercise_data": {
            "clues": [
                "Anna likes reading more than swimming but less than coding",
                "Ben's favorite activity is not reading",
                "The person who likes coding most also likes swimming least",
                "Chris likes swimming more than Anna does"
            ],
            "people": ["Anna", "Ben", "Chris"],
            "activities": ["reading", "swimming", "coding"],
            "instructions": "Rank each person's preference for each activity from 1 (least favorite) to 3 (most favorite)"
        },
        "solution": {
            "Anna": {"reading": 2, "swimming": 1, "coding": 3},
            "Ben": {"reading": 1, "swimming": 3, "coding": 2}, 
            "Chris": {"reading": 3, "swimming": 2, "coding": 1}
        },
        "hints": ["Start with the clearest clues first", "Use process of elimination", "Draw a grid to track possibilities"],
        "skill_areas": ["logical_thinking", "creative_problem_solving"]
    },
    {
        "title": "Shape Puzzle Master",
        "description": "Arrange geometric shapes to create the target pattern using spatial reasoning.",
        "workout_type": "puzzle_solving",
        "difficulty": "advanced",
        "learning_level": "mastery", 
        "age_group": "13-16",
        "estimated_time_minutes": 15,
        "exercise_data": {
            "available_shapes": ["triangle", "square", "circle", "rectangle"],
            "target_pattern": "house_with_garden",
            "rules": ["Each shape can only be used once", "Shapes must touch at least one other shape", "Final pattern must be symmetrical"],
            "instructions": "Create a house with a garden using all available shapes following the given rules"
        },
        "solution": {
            "arrangement": {
                "house_roof": "triangle",
                "house_body": "square", 
                "door": "rectangle",
                "garden": "circle"
            },
            "explanation": "Triangle forms the roof, square is the house body, rectangle is the door, and circle represents the garden"
        },
        "hints": ["Think about what each shape could represent", "Start with the most obvious placements", "Consider symmetry requirements"],
        "skill_areas": ["logical_thinking", "creative_problem_solving", "systems_thinking"]
    },
    {
        "title": "Future Problem Solver",
        "description": "Break down a complex future scenario into manageable parts and develop solutions.",
        "workout_type": "problem_decomposition",
        "difficulty": "expert",
        "learning_level": "mastery",
        "age_group": "13-16", 
        "estimated_time_minutes": 20,
        "exercise_data": {
            "scenario": "By 2030, your city needs to reduce traffic by 50% while increasing economic activity. Design a solution.",
            "constraints": ["Limited budget", "Current infrastructure", "Environmental concerns", "Public acceptance"],
            "steps_required": 5,
            "instructions": "Break this problem into smaller parts and propose a step-by-step solution addressing each constraint"
        },
        "solution": {
            "steps": [
                "Analyze current traffic patterns and economic drivers",
                "Develop remote work incentives for businesses", 
                "Create efficient public transportation network",
                "Implement smart traffic management systems",
                "Launch community engagement and education programs"
            ],
            "reasoning": "Each step addresses multiple constraints while building toward the 50% reduction goal"
        },
        "hints": ["Break the problem into smaller, manageable pieces", "Consider what causes traffic in the first place", "Think about solutions that address multiple constraints"],
        "skill_areas": ["logical_thinking", "systems_thinking", "future_career_skills", "creative_problem_solving"]
    }
]

# Logical Thinking Workouts API Routes
@api_router.get("/workouts/progress")
async def get_workout_progress(
    current_user: User = Depends(get_current_user)
):
    """Get student's workout progress across all types"""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can view workout progress")
    
    progress = await db.workout_progress.find({"student_id": current_user.id}).to_list(100)
    
    # Clean up ObjectId from progress records
    for record in progress:
        if "_id" in record:
            del record["_id"]
    
    # Also get recent attempts
    recent_attempts = await db.workout_attempts.find(
        {"student_id": current_user.id}
    ).sort("started_at", -1).limit(10).to_list(10)
    
    # Clean up ObjectId from attempts
    for attempt in recent_attempts:
        if "_id" in attempt:
            del attempt["_id"]
    
    return {
        "progress_by_type": progress,
        "recent_attempts": recent_attempts,
        "total_attempts": len(recent_attempts)
    }

@api_router.get("/workouts")
async def get_workouts(
    current_user: User = Depends(get_current_user),
    learning_level: Optional[LearningLevel] = None,
    workout_type: Optional[WorkoutType] = None,
    difficulty: Optional[WorkoutDifficulty] = None,
    age_group: Optional[AgeGroup] = None
):
    """Get available logical thinking workouts"""
    query = {"is_active": True}
    if learning_level:
        query["learning_level"] = learning_level.value
    if workout_type:
        query["workout_type"] = workout_type.value
    if difficulty:
        query["difficulty"] = difficulty.value
    if age_group:
        query["age_group"] = age_group.value
    
    workouts = await db.logical_workouts.find(query).to_list(100)
    
    # Remove solution from response for security and convert ObjectId to string
    for workout in workouts:
        if "solution" in workout:
            del workout["solution"]
        # Convert MongoDB ObjectId to string if present
        if "_id" in workout:
            del workout["_id"]
    
    return workouts

@api_router.get("/workouts/{workout_id}")
async def get_workout(workout_id: str, current_user: User = Depends(get_current_user)):
    """Get a specific workout (without solution for students)"""
    workout = await db.logical_workouts.find_one({"id": workout_id, "is_active": True})
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")
    
    # Remove solution from response unless user is teacher/admin
    if current_user.role == UserRole.STUDENT and "solution" in workout:
        del workout["solution"]
    
    # Convert MongoDB ObjectId to string if present
    if "_id" in workout:
        del workout["_id"]
    
    return workout

@api_router.post("/workouts")
async def create_workout(
    workout: LogicalWorkout,
    current_user: User = Depends(get_current_teacher)
):
    """Create a new logical thinking workout"""
    workout.created_by = current_user.id
    await db.logical_workouts.insert_one(workout.dict())
    return workout

@api_router.post("/workouts/initialize-samples")
async def initialize_sample_workouts(current_user: User = Depends(get_current_admin)):
    """Initialize the system with sample logical thinking workouts (Admin only)"""
    try:
        created_count = 0
        for workout_data in SAMPLE_WORKOUTS:
            # Check if workout already exists
            existing = await db.logical_workouts.find_one({"title": workout_data["title"]})
            if not existing:
                workout = LogicalWorkout(
                    **workout_data,
                    created_by=current_user.id
                )
                await db.logical_workouts.insert_one(workout.dict())
                created_count += 1
        
        return {"message": f"Successfully initialized {created_count} sample workouts"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to initialize workouts: {str(e)}")

@api_router.post("/workouts/{workout_id}/attempt")
async def start_workout_attempt(
    workout_id: str,
    current_user: User = Depends(get_current_user),
    request: Request = None
):
    """Start a new workout attempt"""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can attempt workouts")
    
    workout = await db.logical_workouts.find_one({"id": workout_id, "is_active": True})
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")
    
    # Create new attempt
    attempt = WorkoutAttempt(
        student_id=current_user.id,
        workout_id=workout_id
    )
    
    await db.workout_attempts.insert_one(attempt.dict())
    
    # Log activity
    await log_activity(
        current_user.id,
        ActivityType.WORKOUT_STARTED,
        {
            "workout_id": workout_id,
            "workout_title": workout["title"],
            "workout_type": workout["workout_type"]
        },
        request
    )
    
    return {"attempt_id": attempt.id, "message": "Workout attempt started"}

@api_router.post("/workouts/attempts/{attempt_id}/submit")
async def submit_workout_attempt(
    attempt_id: str,
    submission: dict,
    current_user: User = Depends(get_current_user),
    request: Request = None
):
    """Submit a workout attempt with student's answer"""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can submit attempts")
    
    attempt = await db.workout_attempts.find_one({
        "id": attempt_id,
        "student_id": current_user.id,
        "completed_at": None
    })
    
    if not attempt:
        raise HTTPException(status_code=404, detail="Active attempt not found")
    
    workout = await db.logical_workouts.find_one({"id": attempt["workout_id"]})
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")
    
    # Calculate score and correctness
    student_answer = submission.get("answer", {})
    hints_used = submission.get("hints_used", 0)
    
    # Simple scoring logic - compare the answer field
    workout_solution = workout["solution"]
    is_correct = False
    
    if isinstance(student_answer, dict) and isinstance(workout_solution, dict):
        # Compare the answer field specifically
        student_answer_value = student_answer.get("answer")
        correct_answer_value = workout_solution.get("answer")
        is_correct = student_answer_value == correct_answer_value
    else:
        # Direct comparison if not dict format
        is_correct = student_answer == workout_solution
    
    base_score = 100 if is_correct else 0
    hint_penalty = hints_used * 10
    score = max(0, base_score - hint_penalty)
    
    # Calculate time spent
    started_at = datetime.fromisoformat(attempt["started_at"].replace("Z", "+00:00")) if isinstance(attempt["started_at"], str) else attempt["started_at"]
    time_spent = (datetime.utcnow() - started_at).total_seconds() / 60
    
    # Update attempt
    update_data = {
        "completed_at": datetime.utcnow(),
        "student_answer": student_answer,
        "is_correct": is_correct,
        "time_spent_minutes": int(time_spent),
        "hints_used": hints_used,
        "score": score
    }
    
    await db.workout_attempts.update_one(
        {"id": attempt_id},
        {"$set": update_data}
    )
    
    # Update workout progress
    await update_workout_progress(current_user.id, workout, score, time_spent, is_correct)
    
    # Log activity
    await log_activity(
        current_user.id,
        ActivityType.WORKOUT_COMPLETED,
        {
            "workout_id": workout["id"],
            "workout_title": workout["title"],
            "score": score,
            "is_correct": is_correct,
            "time_spent_minutes": int(time_spent)
        },
        request
    )
    
    return {
        "score": score,
        "is_correct": is_correct,
        "time_spent_minutes": int(time_spent),
        "solution": workout["solution"] if not is_correct else None,
        "feedback": "Excellent work!" if is_correct else "Keep practicing! Check the solution to understand better."
    }

async def update_workout_progress(student_id: str, workout: dict, score: int, time_spent: float, is_correct: bool):
    """Update student's workout progress statistics"""
    progress = await db.workout_progress.find_one({
        "student_id": student_id,
        "workout_type": workout["workout_type"],
        "difficulty": workout["difficulty"],
        "learning_level": workout["learning_level"]
    })
    
    if not progress:
        # Create new progress record
        new_progress = WorkoutProgress(
            student_id=student_id,
            workout_type=WorkoutType(workout["workout_type"]),
            difficulty=WorkoutDifficulty(workout["difficulty"]),
            learning_level=LearningLevel(workout["learning_level"]),
            total_attempts=1,
            successful_attempts=1 if is_correct else 0,
            average_score=score,
            average_time_minutes=time_spent,
            last_attempt=datetime.utcnow(),
            mastery_level=min(score, 100)
        )
        await db.workout_progress.insert_one(new_progress.dict())
    else:
        # Update existing progress
        new_total_attempts = progress["total_attempts"] + 1
        new_successful_attempts = progress["successful_attempts"] + (1 if is_correct else 0)
        new_average_score = ((progress["average_score"] * progress["total_attempts"]) + score) / new_total_attempts
        new_average_time = ((progress["average_time_minutes"] * progress["total_attempts"]) + time_spent) / new_total_attempts
        
        # Calculate improvement rate (simplified)
        improvement_rate = max(0, new_average_score - progress["average_score"])
        
        await db.workout_progress.update_one(
            {"id": progress["id"]},
            {
                "$set": {
                    "total_attempts": new_total_attempts,
                    "successful_attempts": new_successful_attempts,
                    "average_score": new_average_score,
                    "average_time_minutes": new_average_time,
                    "improvement_rate": improvement_rate,
                    "last_attempt": datetime.utcnow(),
                    "mastery_level": min(new_average_score, 100)
                }
            }
        )

# Basic health check
@api_router.get("/")
async def root():
    return {
        "message": "TEC Future-Ready Learning Platform API",
        "operator": "TEC Sri Lanka Worldwide (Pvt.) Ltd",
        "services": "Complete Future-Ready Education for Ages 5-16",
        "established": "1982",
        "legacy": "42 Years of Educational Excellence",
        "focus": "AI • Logical Thinking • Creative Problem Solving • Future Career Skills",
        "version": "2.0.0 - Unified Platform"
    }

# Include router
app.include_router(api_router)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()