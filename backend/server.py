from fastapi import FastAPI, APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ReturnDocument
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta, timezone
import jwt
from passlib.context import CryptContext
import aiofiles
import mimetypes
from enum import Enum
from io import BytesIO
import qrcode
import base64

# AI Chat Service
from ai_chat_service import ai_chat_service

# Gamification Service
from gamification_service import (
    BADGES, BadgeType, Badge, GamificationStats, LeaderboardEntry,
    POINT_REWARDS, get_xp_for_level, get_level_from_xp, get_all_badges
)

# Quiz Service
from quiz_service import (
    Quiz, QuizAttempt, Question, SAMPLE_QUIZZES, grade_quiz
)

# Certificate Service
from certificate_service import (
    Certificate, generate_certificate_pdf, create_and_save_certificate
)

# WhatsApp Service
from whatsapp_service import (
    send_whatsapp_message, 
    notify_enrollment, 
    notify_welcome,
    notify_class_reminder,
    notify_subscription,
    notify_progress_report,
    NotificationTemplates
)

# PayPal Service
from paypal_service import (
    paypal_service,
    get_paypal_price,
    PAYPAL_SUBSCRIPTION_PRICES,
    convert_lkr_to_usd,
    convert_usd_to_lkr
)

# Challenges Service
from challenges_service import (
    Challenge,
    ChallengeProgress,
    ChallengeType,
    generate_daily_challenge,
    generate_weekly_challenge,
    get_challenge_status,
    calculate_time_remaining
)

# Class Reminder Service
from reminder_service import (
    send_email_reminder,
    get_whatsapp_reminder_link,
    send_bulk_reminders
)

# Reminder Service
from reminder_service import (
    init_reminder_scheduler,
    shutdown_reminder_scheduler,
    schedule_lesson,
    get_upcoming_lessons,
    cancel_scheduled_lesson
)

# Progress Report Service
from progress_service import (
    init_progress_scheduler,
    shutdown_progress_scheduler,
    get_student_weekly_progress,
    get_student_all_time_progress,
    trigger_manual_progress_report,
    record_video_progress
)

# PDF Generation
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.units import inch, cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

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
SECRET_KEY = os.environ.get('SECRET_KEY', 'tec-secure-key-2024')  # Fallback for dev only
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
    PARENT = "parent"

class AgeGroup(str, Enum):
    FOUNDATION = "4-6"   # Little Learners (Ages 4-6)
    EXPLORERS = "7-9"    # Young Explorers (Ages 7-9)
    SMART = "10-12"      # Smart Kids (Ages 10-12)
    TEENS = "13-15"      # Tech Teens (Ages 13-15)
    LEADERS = "16-18"    # Future Leaders (Ages 16-18)

class LearningLevel(str, Enum):
    FOUNDATION = "foundation"
    EXPLORERS = "explorers"
    SMART = "smart"
    TEENS = "teens"
    LEADERS = "leaders"

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

# Country codes for student index
COUNTRY_CODES = {
    "sri_lanka": "SRI",
    "india": "IND", 
    "malaysia": "MAL",
    "bangladesh": "BAN",
    "pakistan": "PAK",
    "indonesia": "IDN",
    "singapore": "SGP",
    "uae": "UAE",
    "saudi": "SAU",
    "other": "INT"  # International
}

# Language to Country mapping (auto-detect)
LANGUAGE_TO_COUNTRY = {
    "en": "other",        # English → International
    "si": "sri_lanka",    # Sinhala → Sri Lanka
    "ta": "india",        # Tamil → India (can be SRI too, defaulting to IND)
    "zh-CN": "singapore", # Chinese → Singapore
    "id": "indonesia",    # Indonesian → Indonesia
    "ar": "saudi",        # Arabic → Saudi Arabia
    "hi": "india",        # Hindi → India
    "ms": "malaysia",     # Malay → Malaysia
    "bn": "bangladesh",   # Bengali → Bangladesh
    "ur": "pakistan",     # Urdu → Pakistan
}

def get_country_from_language(language: str) -> str:
    """Auto-detect country from selected language"""
    return LANGUAGE_TO_COUNTRY.get(language, "other")

# Age group codes for student index
AGE_GROUP_CODES = {
    "4-6": "F",   # Foundation
    "7-9": "E",   # Explorers
    "10-12": "S", # Smart
    "13-15": "T", # Teens
    "16-18": "L"  # Leaders
}

async def generate_student_index(country: str, age_group: str) -> str:
    """Generate student index number: COUNTRY-GROUP-NUMBER (starting from 1001)"""
    country_code = COUNTRY_CODES.get(country.lower(), "INT")
    group_code = AGE_GROUP_CODES.get(age_group, "F")
    
    # Get the next sequence number for this country-group combination
    counter_key = f"{country_code}-{group_code}"
    counter = await db.student_counters.find_one_and_update(
        {"_id": counter_key},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER
    )
    
    # Start from 1001 to hide actual count
    seq_number = 1000 + counter.get("seq", 1)
    
    return f"{country_code}-{group_code}-{seq_number}"

# Models
class UserBase(BaseModel):
    email: str
    full_name: str
    role: UserRole
    age_group: Optional[AgeGroup] = None  # Only for students
    parent_phone: Optional[str] = None  # Parent's phone for notifications
    parent_name: Optional[str] = None  # Parent's name
    phone: Optional[str] = None  # Student/user phone
    country: Optional[str] = None  # Country for student index
    language: Optional[str] = None  # Selected language (for auto-detecting country)

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_index: Optional[str] = None  # Student index number (e.g., SRI-F-1001)
    photo_url: Optional[str] = None  # Student photo URL
    photo_type: str = "photo"  # "photo", "initials", "avatar" - for alternate display
    date_of_birth: Optional[str] = None  # For ID card
    school_name: Optional[str] = None  # For ID card
    guardian_name: Optional[str] = None  # For ID card
    emergency_contact: Optional[str] = None  # For ID card
    blood_group: Optional[str] = None  # For ID card
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True
    subscription_type: Optional[SubscriptionType] = None
    subscription_expires: Optional[datetime] = None
    learning_level: Optional[LearningLevel] = None
    skill_progress: Dict[str, int] = {}  # Skill area progress percentages
    total_watch_time: int = 0  # in minutes
    id_card_issued: bool = False  # Track if ID card has been issued
    id_card_issued_date: Optional[str] = None
    referral_code: Optional[str] = None  # Unique referral code for user
    referral_conversions: int = 0  # Count of successful referrals
    trial_used: bool = False  # Track if user has used free trial
    trial_started_at: Optional[datetime] = None  # When trial started
    is_trial_active: bool = False  # Currently in trial period

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
        AgeGroup.EXPLORERS: LearningLevel.EXPLORERS,
        AgeGroup.SMART: LearningLevel.SMART,
        AgeGroup.TEENS: LearningLevel.TEENS,
        AgeGroup.LEADERS: LearningLevel.LEADERS
    }
    return mapping.get(age_group, LearningLevel.FOUNDATION)

def get_pricing_key_from_age(age_group: AgeGroup) -> str:
    mapping = {
        AgeGroup.FOUNDATION: "foundation",
        AgeGroup.EXPLORERS: "explorers",
        AgeGroup.SMART: "smart",
        AgeGroup.TEENS: "teens",
        AgeGroup.LEADERS: "leaders"
    }
    return mapping.get(age_group, "foundation")

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
    
    # Generate student index for students
    if user_obj.role == UserRole.STUDENT and user_obj.age_group:
        # Auto-detect country from language, fallback to provided country or default
        if user_obj.language:
            country = get_country_from_language(user_obj.language)
        else:
            country = user_obj.country or "sri_lanka"  # Default to Sri Lanka
        user_obj.country = country  # Store detected country
        user_obj.student_index = await generate_student_index(country, user_obj.age_group.value)
    
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

# ============================================
# STUDENT DASHBOARD & ID CARD ENDPOINTS
# ============================================

# Countries where photo alternatives are preferred
PHOTO_ALTERNATIVE_COUNTRIES = ["saudi", "uae", "pakistan"]

@api_router.get("/student/dashboard")
async def get_student_dashboard(current_user: User = Depends(get_current_user)):
    """Get comprehensive student dashboard data"""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Student access only")
    
    # Get learning path
    learning_path = await db.learning_paths.find_one({"student_id": current_user.id}, {"_id": 0})
    
    # Get gamification stats
    gamification = await db.gamification_stats.find_one({"user_id": current_user.id}, {"_id": 0})
    
    # Get recent certificates
    certificates = await db.certificates.find(
        {"student_id": current_user.id}, {"_id": 0}
    ).sort("issued_date", -1).limit(5).to_list(5)
    
    # Get upcoming classes/reminders
    upcoming_classes = await db.scheduled_classes.find(
        {"student_id": current_user.id, "date": {"$gte": datetime.utcnow().strftime("%Y-%m-%d")}}
    ).sort("date", 1).limit(5).to_list(5)
    
    # Get recent quiz scores
    recent_quizzes = await db.quiz_results.find(
        {"student_id": current_user.id}, {"_id": 0}
    ).sort("completed_at", -1).limit(5).to_list(5)
    
    # Get badges earned
    badges = []
    if gamification:
        badges = gamification.get("badges", [])
    
    # Determine if photo alternative is recommended
    recommend_photo_alternative = current_user.country in PHOTO_ALTERNATIVE_COUNTRIES
    
    return {
        "student": {
            "id": current_user.id,
            "student_index": current_user.student_index,
            "full_name": current_user.full_name,
            "email": current_user.email,
            "age_group": current_user.age_group,
            "country": current_user.country,
            "photo_url": current_user.photo_url,
            "photo_type": current_user.photo_type or "photo",
            "learning_level": current_user.learning_level,
            "id_card_issued": current_user.id_card_issued,
            "recommend_photo_alternative": recommend_photo_alternative
        },
        "progress": {
            "learning_path": learning_path,
            "skill_progress": current_user.skill_progress,
            "total_watch_time": current_user.total_watch_time
        },
        "gamification": {
            "xp": gamification.get("xp", 0) if gamification else 0,
            "level": gamification.get("level", 1) if gamification else 1,
            "badges": badges,
            "streak_days": gamification.get("streak_days", 0) if gamification else 0
        },
        "certificates": certificates,
        "upcoming_classes": upcoming_classes,
        "recent_quizzes": recent_quizzes
    }

@api_router.post("/student/photo/upload")
async def upload_student_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload student photo for ID card and workbooks"""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Student access only")
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/jpg"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only JPEG and PNG images allowed")
    
    # Create uploads directory if not exists
    upload_dir = Path("/app/backend/uploads/photos")
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate unique filename
    file_ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{current_user.student_index or current_user.id}_photo.{file_ext}"
    file_path = upload_dir / filename
    
    # Save file
    async with aiofiles.open(file_path, 'wb') as f:
        content = await file.read()
        await f.write(content)
    
    # Update user record
    photo_url = f"/api/uploads/photos/{filename}"
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": {"photo_url": photo_url, "photo_type": "photo"}}
    )
    
    return {"success": True, "photo_url": photo_url}

@api_router.post("/student/photo/use-initials")
async def use_initials_instead(current_user: User = Depends(get_current_user)):
    """Use initials instead of photo (for privacy/religious reasons)"""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Student access only")
    
    # Generate initials from name
    name_parts = current_user.full_name.split()
    initials = "".join([part[0].upper() for part in name_parts[:2]])
    
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": {"photo_type": "initials", "photo_url": None}}
    )
    
    return {"success": True, "photo_type": "initials", "initials": initials}

@api_router.post("/student/photo/use-avatar")
async def use_avatar_instead(
    avatar_data: dict,
    current_user: User = Depends(get_current_user)
):
    """Use a generic avatar instead of photo"""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Student access only")
    
    # Avatar options: male, female, neutral
    avatar_type = avatar_data.get("avatar_type", "neutral")
    
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": {"photo_type": f"avatar_{avatar_type}", "photo_url": None}}
    )
    
    return {"success": True, "photo_type": f"avatar_{avatar_type}"}

@api_router.put("/student/profile")
async def update_student_profile(
    profile_data: dict,
    current_user: User = Depends(get_current_user)
):
    """Update student profile details for ID card"""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Student access only")
    
    allowed_fields = [
        "date_of_birth", "school_name", "guardian_name", 
        "emergency_contact", "blood_group", "phone"
    ]
    
    update_data = {k: v for k, v in profile_data.items() if k in allowed_fields}
    
    if update_data:
        await db.users.update_one(
            {"id": current_user.id},
            {"$set": update_data}
        )
    
    return {"success": True, "updated_fields": list(update_data.keys())}

@api_router.get("/student/id-card")
async def get_student_id_card(current_user: User = Depends(get_current_user)):
    """Get student ID card data"""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Student access only")
    
    # Get full user data
    user_data = await db.users.find_one({"id": current_user.id}, {"_id": 0, "hashed_password": 0})
    
    # Generate initials if using initials mode
    initials = ""
    if user_data.get("photo_type") == "initials":
        name_parts = user_data.get("full_name", "").split()
        initials = "".join([part[0].upper() for part in name_parts[:2]])
    
    # Get age group label
    age_group_labels = {
        "4-6": "Foundation Level",
        "7-9": "Explorers Level",
        "10-12": "Smart Level",
        "13-15": "Teens Level",
        "16-18": "Leaders Level"
    }
    
    return {
        "id_card": {
            "student_index": user_data.get("student_index"),
            "full_name": user_data.get("full_name"),
            "photo_url": user_data.get("photo_url"),
            "photo_type": user_data.get("photo_type", "photo"),
            "initials": initials,
            "date_of_birth": user_data.get("date_of_birth"),
            "age_group": user_data.get("age_group"),
            "level_name": age_group_labels.get(user_data.get("age_group"), "Student"),
            "school_name": user_data.get("school_name"),
            "guardian_name": user_data.get("guardian_name") or user_data.get("parent_name"),
            "emergency_contact": user_data.get("emergency_contact") or user_data.get("parent_phone"),
            "blood_group": user_data.get("blood_group"),
            "country": user_data.get("country"),
            "issue_date": user_data.get("id_card_issued_date") or datetime.utcnow().strftime("%Y-%m-%d"),
            "valid_until": (datetime.utcnow() + timedelta(days=365)).strftime("%Y-%m-%d"),
            "organization": "TEC Future-Ready Learning",
            "tagline": "Empowering Future Leaders"
        }
    }

@api_router.post("/student/id-card/issue")
async def issue_id_card(current_user: User = Depends(get_current_user)):
    """Mark ID card as issued"""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Student access only")
    
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": {
            "id_card_issued": True,
            "id_card_issued_date": datetime.utcnow().strftime("%Y-%m-%d")
        }}
    )
    
    return {"success": True, "message": "ID card marked as issued"}

# Serve uploaded photos
@api_router.get("/uploads/photos/{filename}")
async def get_uploaded_photo(filename: str):
    """Serve uploaded student photos"""
    file_path = Path(f"/app/backend/uploads/photos/{filename}")
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Photo not found")
    
    return FileResponse(file_path)

# ============================================
# QR CODE & PUBLIC VERIFICATION SYSTEM
# ============================================

def generate_qr_code(data: str) -> str:
    """Generate QR code and return as base64 string"""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    img_base64 = base64.b64encode(buffer.getvalue()).decode()
    
    return f"data:image/png;base64,{img_base64}"

@api_router.get("/student/qr-code")
async def get_student_qr_code(current_user: User = Depends(get_current_user)):
    """Generate QR code for student ID card verification"""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Student access only")
    
    # Get frontend URL for verification page
    frontend_url = os.environ.get("FRONTEND_URL", "https://tecaikids.com")
    verification_url = f"{frontend_url}/verify/{current_user.student_index}"
    
    # Generate QR code
    qr_base64 = generate_qr_code(verification_url)
    
    return {
        "qr_code": qr_base64,
        "verification_url": verification_url,
        "student_index": current_user.student_index
    }

@api_router.get("/student/qr-code/image")
async def get_student_qr_code_image(current_user: User = Depends(get_current_user)):
    """Get QR code as downloadable PNG image"""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Student access only")
    
    frontend_url = os.environ.get("FRONTEND_URL", "https://tecaikids.com")
    verification_url = f"{frontend_url}/verify/{current_user.student_index}"
    
    # Generate QR code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(verification_url)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    
    return Response(
        content=buffer.getvalue(),
        media_type="image/png",
        headers={"Content-Disposition": f"attachment; filename={current_user.student_index}_qr.png"}
    )

# ============================================
# NFC TAG SUPPORT
# ============================================

@api_router.get("/student/nfc-data")
async def get_nfc_tag_data(current_user: User = Depends(get_current_user)):
    """
    Get NFC tag data for student ID card.
    NFC tags have limited storage (48-888 bytes typically).
    We provide a short URL format for NFC tags.
    """
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Student access only")
    
    # Get frontend URL
    frontend_url = os.environ.get("FRONTEND_URL", "https://tecaikids.com")
    
    # Full verification URL
    full_url = f"{frontend_url}/verify/{current_user.student_index}"
    
    # Short URL format for NFC (uses /v/ instead of /verify/)
    short_url = f"{frontend_url}/v/{current_user.student_index}"
    
    # NFC NDEF Record format
    # Type: URL Record (U)
    # Payload: URL
    
    return {
        "student_index": current_user.student_index,
        "full_name": current_user.full_name,
        "nfc_data": {
            "url_full": full_url,
            "url_short": short_url,
            "ndef_type": "U",  # URL type
            "recommended_tag": "NTAG213",  # 144 bytes, good for URLs
            "tag_types": {
                "NTAG213": {"bytes": 144, "suitable": True, "cost": "Low ($0.10-0.30)"},
                "NTAG215": {"bytes": 504, "suitable": True, "cost": "Medium ($0.20-0.50)"},
                "NTAG216": {"bytes": 888, "suitable": True, "cost": "Higher ($0.30-0.70)"},
                "Mifare Classic": {"bytes": 1024, "suitable": False, "reason": "Not NDEF compatible"}
            }
        },
        "instructions": {
            "step1": "Purchase NFC tags (NTAG213 recommended for cost efficiency)",
            "step2": "Download NFC writing app (NFC Tools, TagWriter by NXP)",
            "step3": f"Write URL record: {short_url}",
            "step4": "Attach tag to back of physical ID card",
            "step5": "Test by tapping with any NFC-enabled smartphone"
        },
        "apps_recommended": [
            {"name": "NFC Tools", "platform": "Android/iOS", "free": True},
            {"name": "TagWriter by NXP", "platform": "Android", "free": True},
            {"name": "Simply NFC", "platform": "iOS", "free": True}
        ]
    }

@api_router.get("/student/nfc-sticker")
async def get_nfc_sticker_template(current_user: User = Depends(get_current_user)):
    """
    Get printable NFC sticker template with student info.
    This can be printed and attached to the NFC tag.
    """
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Student access only")
    
    # Get user details
    user_data = await db.users.find_one({"id": current_user.id}, {"_id": 0, "hashed_password": 0})
    
    # Generate initials
    name_parts = user_data.get("full_name", "").split()
    initials = "".join([part[0].upper() for part in name_parts[:2]])
    
    return {
        "sticker_data": {
            "student_index": user_data.get("student_index"),
            "initials": initials,
            "level_code": {
                "4-6": "F", "7-9": "E", "10-12": "S", "13-15": "T", "16-18": "L"
            }.get(user_data.get("age_group"), "S"),
            "organization": "TEC",
            "icon": "📱 TAP TO VERIFY"
        },
        "print_size": {
            "width_mm": 25,
            "height_mm": 25,
            "shape": "circle"
        }
    }

# Short URL redirect for NFC (saves bytes on tag)
@api_router.get("/v/{student_index}")
async def verify_short_redirect(student_index: str):
    """Short URL for NFC tags - redirects to full verification"""
    # Just call the main verification endpoint
    return await verify_student_public(student_index)

# PUBLIC VERIFICATION ENDPOINT (No authentication required)
@api_router.get("/verify/{student_index}")
async def verify_student_public(student_index: str):
    """
    Public verification endpoint - anyone can verify a student ID
    Returns limited public information for verification
    """
    # Find student by index
    student = await db.users.find_one(
        {"student_index": student_index, "role": "student"},
        {"_id": 0, "hashed_password": 0, "email": 0}  # Exclude sensitive data
    )
    
    if not student:
        return {
            "verified": False,
            "status": "NOT_FOUND",
            "message": "Student ID not found in our system"
        }
    
    # Check if student is active
    is_active = student.get("is_active", True)
    
    # Check subscription status
    subscription_expires = student.get("subscription_expires")
    subscription_active = True
    if subscription_expires:
        if isinstance(subscription_expires, str):
            exp_date = datetime.fromisoformat(subscription_expires.replace("Z", "+00:00"))
        else:
            exp_date = subscription_expires
        subscription_active = exp_date > datetime.now(timezone.utc)
    
    # Get age group label
    age_group_labels = {
        "4-6": "Foundation Level (Ages 4-6)",
        "7-9": "Explorers Level (Ages 7-9)",
        "10-12": "Smart Level (Ages 10-12)",
        "13-15": "Teens Level (Ages 13-15)",
        "16-18": "Leaders Level (Ages 16-18)"
    }
    
    # Country names
    country_names = {
        "sri_lanka": "Sri Lanka", "india": "India", "malaysia": "Malaysia",
        "bangladesh": "Bangladesh", "pakistan": "Pakistan", "indonesia": "Indonesia",
        "singapore": "Singapore", "uae": "UAE", "saudi": "Saudi Arabia", "other": "International"
    }
    
    # Generate initials if needed
    initials = ""
    if student.get("photo_type") == "initials" or not student.get("photo_url"):
        name_parts = student.get("full_name", "").split()
        initials = "".join([part[0].upper() for part in name_parts[:2]])
    
    # Determine overall status
    if not is_active:
        status = "INACTIVE"
        status_message = "This student account is currently inactive"
    elif not subscription_active:
        status = "EXPIRED"
        status_message = "Student subscription has expired"
    else:
        status = "ACTIVE"
        status_message = "This is a verified TEC Future-Ready Learning student"
    
    return {
        "verified": True,
        "status": status,
        "status_message": status_message,
        "student": {
            "student_index": student.get("student_index"),
            "full_name": student.get("full_name"),
            "photo_url": student.get("photo_url"),
            "photo_type": student.get("photo_type", "photo"),
            "initials": initials,
            "age_group": student.get("age_group"),
            "level_name": age_group_labels.get(student.get("age_group"), "Student"),
            "country": country_names.get(student.get("country"), student.get("country")),
            "school_name": student.get("school_name"),
            "guardian_name": student.get("guardian_name") or student.get("parent_name"),
            "id_card_issued": student.get("id_card_issued", False),
            "id_card_issued_date": student.get("id_card_issued_date"),
            "member_since": student.get("created_at").strftime("%B %Y") if isinstance(student.get("created_at"), datetime) else "2024"
        },
        "organization": {
            "name": "TEC Future-Ready Learning",
            "tagline": "Empowering Future Leaders",
            "established": "1982",
            "website": "www.tecaikids.com"
        },
        "verification_time": datetime.utcnow().isoformat()
    }

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
    
    # Send WhatsApp notification to parent
    whatsapp_result = None
    if phone:
        try:
            # Get course/program name for notification
            program_names = {
                "foundation": "TEC Foundation (Ages 4-6)",
                "explorers": "TEC Explorers (Ages 7-9)",
                "smart": "TEC Smart Kids (Ages 10-12)",
                "teens": "TEC Teens (Ages 13-15)",
                "leaders": "TEC Leaders (Ages 16-18)"
            }
            course_name = program_names.get(program_id, program_id)
            
            whatsapp_result = await notify_enrollment(
                parent_phone=phone,
                parent_name=parent_name or "Parent",
                student_name=student_name,
                course_name=course_name,
                age_group=age_range or "Not specified"
            )
            logger.info(f"WhatsApp notification sent for enrollment: {enrollment_record['id']}")
        except Exception as e:
            logger.error(f"Failed to send WhatsApp notification: {str(e)}")
    
    return {
        "success": True,
        "enrollment_id": enrollment_record["id"],
        "message": "Enrollment submitted. Please complete bank transfer.",
        "whatsapp_notification": whatsapp_result
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


# ============================================
# PAYPAL PAYMENT ENDPOINTS
# ============================================

@api_router.get("/paypal/client-token")
async def get_paypal_client_token():
    """Get PayPal client token for frontend SDK initialization"""
    try:
        client_token = await paypal_service.get_client_token()
        return {
            "client_token": client_token,
            "client_id": os.environ.get("PAYPAL_CLIENT_ID", ""),
            "mode": os.environ.get("PAYPAL_MODE", "sandbox")
        }
    except Exception as e:
        logger.error(f"Failed to get PayPal client token: {e}")
        raise HTTPException(status_code=500, detail="Failed to initialize PayPal")


@api_router.get("/paypal/pricing")
async def get_paypal_pricing():
    """Get subscription pricing in USD for PayPal payments"""
    return {
        "currency": "USD",
        "prices": PAYPAL_SUBSCRIPTION_PRICES,
        "currency_note": "Prices shown in USD for international payments"
    }


class PayPalOrderRequest(BaseModel):
    subscription_type: str  # monthly, quarterly, annual
    age_group: str  # 5-8, 9-12, 13-16
    success_url: str
    cancel_url: str


@api_router.post("/paypal/create-order")
async def create_paypal_order(
    order_request: PayPalOrderRequest,
    current_user: User = Depends(get_current_user)
):
    """Create a PayPal order for subscription payment"""
    try:
        # Get price in USD
        amount = get_paypal_price(order_request.subscription_type, order_request.age_group)
        
        if amount <= 0:
            raise HTTPException(status_code=400, detail="Invalid subscription type or age group")
        
        # Create level name for description
        level_names = {"5-8": "Foundation", "9-12": "Development", "13-16": "Mastery"}
        level_name = level_names.get(order_request.age_group, "Development")
        
        # Create PayPal order
        order = await paypal_service.create_order(
            amount=amount,
            currency="USD",
            description=f"TEC {level_name} Level - {order_request.subscription_type.capitalize()} Subscription",
            custom_id=f"{current_user.id}|{order_request.subscription_type}|{order_request.age_group}"
        )
        
        # Store order info in database for tracking
        await db.paypal_orders.insert_one({
            "order_id": order["id"],
            "user_id": current_user.id,
            "user_email": current_user.email,
            "subscription_type": order_request.subscription_type,
            "age_group": order_request.age_group,
            "amount_usd": amount,
            "status": order["status"],
            "created_at": datetime.now(timezone.utc)
        })
        
        return {
            "orderId": order["id"],
            "status": order["status"],
            "amount": amount,
            "currency": "USD"
        }
        
    except Exception as e:
        logger.error(f"PayPal create order error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create PayPal order: {str(e)}")


@api_router.post("/paypal/capture-order/{order_id}")
async def capture_paypal_order(
    order_id: str,
    current_user: User = Depends(get_current_user)
):
    """Capture a PayPal order after buyer approval"""
    try:
        # Capture the order
        capture_result = await paypal_service.capture_order(order_id)
        
        if capture_result["status"] == "COMPLETED":
            # Get the order details from our database
            order_record = await db.paypal_orders.find_one({"order_id": order_id})
            
            if order_record:
                subscription_type = order_record.get("subscription_type", "monthly")
                age_group = order_record.get("age_group", "9-12")
                
                # Calculate subscription expiry
                duration_days = {"monthly": 30, "quarterly": 90, "annual": 365}
                expires = datetime.now(timezone.utc) + timedelta(days=duration_days.get(subscription_type, 30))
                
                # Update user subscription
                await db.users.update_one(
                    {"id": current_user.id},
                    {
                        "$set": {
                            "subscription_type": subscription_type,
                            "subscription_expires": expires,
                            "payment_method": "paypal",
                            "last_payment_date": datetime.now(timezone.utc)
                        }
                    }
                )
                
                # Update order status
                await db.paypal_orders.update_one(
                    {"order_id": order_id},
                    {
                        "$set": {
                            "status": "COMPLETED",
                            "captured_at": datetime.now(timezone.utc),
                            "capture_id": capture_result.get("purchase_units", [{}])[0].get("payments", {}).get("captures", [{}])[0].get("id")
                        }
                    }
                )
                
                # Log activity
                await log_activity(
                    current_user.id,
                    ActivityType.PAYMENT_MADE,
                    {
                        "payment_method": "paypal",
                        "order_id": order_id,
                        "amount_usd": order_record.get("amount_usd"),
                        "subscription_type": subscription_type
                    }
                )
                
                # Send notification
                try:
                    await notify_subscription(
                        phone_number=current_user.phone if hasattr(current_user, 'phone') else None,
                        student_name=current_user.full_name,
                        plan_name=f"{subscription_type.capitalize()} Plan (PayPal)",
                        amount=f"${order_record.get('amount_usd', 0):.2f} USD"
                    )
                except Exception as notify_error:
                    logger.warning(f"Failed to send PayPal payment notification: {notify_error}")
            
            return {
                "success": True,
                "status": "COMPLETED",
                "message": "Payment successful! Your subscription is now active.",
                "order_id": order_id
            }
        else:
            return {
                "success": False,
                "status": capture_result["status"],
                "message": "Payment was not completed"
            }
            
    except Exception as e:
        logger.error(f"PayPal capture order error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to capture PayPal order: {str(e)}")


@api_router.get("/paypal/order/{order_id}")
async def get_paypal_order_status(
    order_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get PayPal order status"""
    try:
        order = await paypal_service.get_order_details(order_id)
        return {
            "order_id": order_id,
            "status": order["status"],
            "amount": order.get("purchase_units", [{}])[0].get("amount", {})
        }
    except Exception as e:
        logger.error(f"PayPal get order error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get order status")


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

# ============================================
# VIDEO/LESSON UPLOAD ENDPOINTS
# ============================================

# Supported video languages
SUPPORTED_VIDEO_LANGUAGES = ["en", "si", "ta", "zh-CN", "hi", "ar", "id", "ms", "bn", "ur"]

@api_router.post("/courses/{course_id}/videos")
async def upload_course_video(
    course_id: str,
    video: UploadFile = File(...),
    title: str = Form(...),
    description: str = Form(""),
    language: str = Form("en"),  # Language of the video content
    current_user: User = Depends(get_current_teacher)
):
    """Upload a video lesson to a course (Teacher/Admin only)"""
    
    # Check course exists
    course = await db.courses.find_one({"id": course_id})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Check permission - only course creator or admin can upload
    if course.get("created_by") != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to upload to this course")
    
    # Validate file type
    allowed_types = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"]
    if video.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail=f"Invalid file type. Allowed: {allowed_types}")
    
    # Validate language
    if language not in SUPPORTED_VIDEO_LANGUAGES:
        language = "en"  # Default to English if invalid
    
    # Create video ID and filename
    video_id = str(uuid.uuid4())
    file_extension = video.filename.split('.')[-1] if '.' in video.filename else 'mp4'
    filename = f"{video_id}.{file_extension}"
    
    # Ensure upload directory exists
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    
    # Save file
    file_path = UPLOAD_DIR / filename
    try:
        async with aiofiles.open(file_path, 'wb') as f:
            content = await video.read()
            await f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save video: {str(e)}")
    
    # Create video document with language
    video_doc = {
        "id": video_id,
        "title": title,
        "description": description,
        "language": language,  # Store video language
        "filename": filename,
        "url": f"/uploads/videos/{filename}",
        "content_type": video.content_type,
        "file_size": len(content),
        "course_id": course_id,
        "uploaded_by": current_user.id,
        "uploaded_at": datetime.now(timezone.utc),
        "order": len(course.get("videos", [])) + 1
    }
    
    # Add video to course
    await db.courses.update_one(
        {"id": course_id},
        {"$push": {"videos": video_doc}}
    )
    
    # Log activity
    await log_activity(
        current_user.id,
        ActivityType.VIDEO_WATCHED,
        {"action": "video_uploaded", "video_id": video_id, "course_id": course_id, "language": language}
    )
    
    return {
        "message": "Video uploaded successfully",
        "video": video_doc
    }

@api_router.get("/courses/{course_id}/videos")
async def get_course_videos(
    course_id: str,
    language: Optional[str] = None,  # Filter by language
    current_user: User = Depends(get_current_user)
):
    """Get all videos for a course, optionally filtered by language"""
    course = await db.courses.find_one({"id": course_id}, {"_id": 0})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    videos = course.get("videos", [])
    
    # Filter by language if specified
    if language and language in SUPPORTED_VIDEO_LANGUAGES:
        videos = [v for v in videos if v.get("language", "en") == language]
    
    return {"videos": videos, "count": len(videos), "language_filter": language}

@api_router.get("/supported-languages")
async def get_supported_languages():
    """Get list of supported video languages"""
    language_names = {
        "en": "English",
        "si": "සිංහල (Sinhala)",
        "ta": "தமிழ் (Tamil)",
        "zh-CN": "中文 (Chinese)",
        "hi": "हिन्दी (Hindi)",
        "ar": "العربية (Arabic)",
        "id": "Bahasa Indonesia",
        "ms": "Bahasa Melayu",
        "bn": "বাংলা (Bengali)",
        "ur": "اردو (Urdu)"
    }
    return {
        "languages": [{"code": code, "name": name} for code, name in language_names.items()]
    }

@api_router.delete("/courses/{course_id}/videos/{video_id}")
async def delete_course_video(
    course_id: str,
    video_id: str,
    current_user: User = Depends(get_current_teacher)
):
    """Delete a video from a course (Teacher/Admin only)"""
    course = await db.courses.find_one({"id": course_id})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Check permission
    if course.get("created_by") != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Find and remove video
    videos = course.get("videos", [])
    video_to_delete = None
    for v in videos:
        if v.get("id") == video_id:
            video_to_delete = v
            break
    
    if not video_to_delete:
        raise HTTPException(status_code=404, detail="Video not found")
    
    # Delete file from disk
    try:
        file_path = UPLOAD_DIR / video_to_delete.get("filename", "")
        if file_path.exists():
            file_path.unlink()
    except Exception as e:
        logging.error(f"Failed to delete video file: {e}")
    
    # Remove from course
    await db.courses.update_one(
        {"id": course_id},
        {"$pull": {"videos": {"id": video_id}}}
    )
    
    return {"message": "Video deleted successfully"}

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

# Parent Guides Content - Multilingual
PARENT_GUIDES_CONTENT = {
    "foundation": {
        "title": {
            "en": "Parent Guide: Little Learners (Ages 4-6)",
            "si": "දෙමාපිය මාර්ගෝපදේශය: කුඩා ඉගෙනුම්කරුවන් (වයස 4-6)",
            "ta": "பெற்றோர் வழிகாட்டி: சிறிய கற்பவர்கள் (வயது 4-6)",
            "zh-CN": "家长指南：小小学习者（4-6岁）",
            "id": "Panduan Orang Tua: Pembelajar Kecil (Usia 4-6)",
            "ar": "دليل الوالدين: المتعلمون الصغار (الأعمار 4-6)",
            "hi": "अभिभावक मार्गदर्शिका: छोटे शिक्षार्थी (आयु 4-6)",
            "ms": "Panduan Ibu Bapa: Pelajar Kecil (Umur 4-6)",
            "bn": "অভিভাবক গাইড: ছোট শিক্ষার্থী (বয়স 4-6)",
            "ur": "والدین کی رہنما: چھوٹے سیکھنے والے (عمر 4-6)"
        },
        "age_range": "4-6",
        "sections": {
            "en": [
                {"heading": "Welcome to TEC Future-Ready Learning!", "content": "Congratulations on enrolling your child in our Foundation program! This guide will help you support your little learner's journey into the world of technology, creativity, and logical thinking."},
                {"heading": "About This Program", "content": "The Foundation level is designed specifically for children aged 4-6 years. We focus on building curiosity, basic problem-solving skills, and introducing fundamental concepts through play-based learning."},
                {"heading": "Preparing for Zoom Classes", "content": "• Ensure a quiet, well-lit space for your child\n• Test your internet connection before class\n• Have the device (tablet/computer) charged and ready\n• Keep headphones available for better audio\n• Sit with your child during initial classes"},
                {"heading": "During Class Guidelines", "content": "• Stay nearby to assist with technical issues\n• Encourage participation but don't answer for them\n• Let them make mistakes - it's part of learning!\n• Help them unmute/mute when needed\n• Celebrate their efforts and progress"},
                {"heading": "Weekly Schedule", "content": "• Classes: 2 sessions per week (45 minutes each)\n• Practice activities: 15-20 minutes daily\n• Parent review: 10 minutes at week's end\n• Rest and play: Balance screen time with outdoor activities"},
                {"heading": "What Your Child Will Learn", "content": "• Logical thinking through puzzles and games\n• Pattern recognition and sequences\n• Basic coding concepts (unplugged activities)\n• Creative problem-solving\n• Digital literacy fundamentals\n• Keyboard and mouse skills"},
                {"heading": "How to Support at Home", "content": "• Ask about what they learned today\n• Practice counting and pattern games\n• Use everyday situations for logical thinking\n• Encourage questions and curiosity\n• Praise effort over results\n• Read technology-themed story books together"},
                {"heading": "Communication with Instructors", "content": "• WhatsApp group for class updates\n• Email for detailed queries\n• Monthly progress reports\n• Parent-teacher meetings quarterly\n• Feedback forms after each module"},
                {"heading": "Technical Requirements", "content": "• Device: Tablet or computer with camera\n• Internet: Stable broadband connection\n• Browser: Latest Chrome or Firefox\n• Zoom app: Latest version installed\n• Audio: Working speakers/headphones and microphone"},
                {"heading": "Important Contacts", "content": "• Technical Support: [Support Email]\n• Academic Queries: [Academic Email]\n• WhatsApp Helpline: [WhatsApp Number]\n• Emergency Contact: [Phone Number]"}
            ],
            "si": [
                {"heading": "TEC අනාගත-සූදානම් ඉගෙනුමට සාදරයෙන් පිළිගනිමු!", "content": "ඔබේ දරුවා අපගේ Foundation වැඩසටහනට ඇතුළත් කිරීම සම්බන්ධයෙන් සුභ පැතුම්! මෙම මාර්ගෝපදේශය ඔබේ කුඩා ඉගෙනුම්කරුගේ තාක්ෂණය, නිර්මාණශීලීත්වය සහ තාර්කික චින්තනය පිළිබඳ ගමනට සහාය වීමට ඔබට උපකාර කරයි."},
                {"heading": "මෙම වැඩසටහන ගැන", "content": "Foundation මට්ටම විශේෂයෙන් වයස අවුරුදු 4-6 අතර දරුවන් සඳහා නිර්මාණය කර ඇත. ක්‍රීඩා පදනම් කරගත් ඉගෙනීම හරහා කුතුහලය, මූලික ගැටළු විසඳීමේ කුසලතා සහ මූලික සංකල්ප හඳුන්වා දීම කෙරෙහි අපි අවධානය යොමු කරමු."},
                {"heading": "Zoom පන්ති සඳහා සූදානම් වීම", "content": "• ඔබේ දරුවාට නිහඬ, හොඳින් ආලෝකය ඇති ස්ථානයක් සහතික කරන්න\n• පන්තියට පෙර ඔබේ අන්තර්ජාල සම්බන්ධතාවය පරීක්ෂා කරන්න\n• උපකරණය (ටැබ්ලට්/පරිගණකය) ආරෝපණය කර සූදානමින් තබන්න\n• වඩා හොඳ ශ්‍රව්‍ය සඳහා හෙඩ්ෆෝන් තබා ගන්න\n• ආරම්භක පන්ති වලදී ඔබේ දරුවා සමඟ වාඩි වන්න"},
                {"heading": "පන්ති කාලයේ මාර්ගෝපදේශ", "content": "• තාක්ෂණික ගැටළු සඳහා සහාය වීමට ළඟ සිටින්න\n• සහභාගීත්වය දිරිමත් කරන්න නමුත් ඔවුන් වෙනුවෙන් පිළිතුරු නොදෙන්න\n• වැරදි කිරීමට ඉඩ දෙන්න - එය ඉගෙනීමේ කොටසකි!\n• අවශ්‍ය විට unmute/mute කිරීමට උදව් කරන්න\n• ඔවුන්ගේ උත්සාහයන් සහ ප්‍රගතිය සමරන්න"},
                {"heading": "සතිපතා කාලසටහන", "content": "• පන්ති: සතියකට සැසි 2ක් (එක් එක විනාඩි 45 බැගින්)\n• පුහුණු ක්‍රියාකාරකම්: දිනපතා විනාඩි 15-20\n• දෙමාපිය සමාලෝචනය: සතිය අවසානයේ විනාඩි 10\n• විවේකය සහ ක්‍රීඩාව: තිර වේලාව එළිමහන් ක්‍රියාකාරකම් සමඟ සමතුලිත කරන්න"},
                {"heading": "ඔබේ දරුවා ඉගෙන ගන්නේ කුමක්ද", "content": "• ප්‍රහේලිකා සහ ක්‍රීඩා හරහා තාර්කික චින්තනය\n• රටා හඳුනා ගැනීම සහ අනුපිළිවෙල\n• මූලික කේතකරණ සංකල්ප\n• නිර්මාණාත්මක ගැටළු විසඳීම\n• ඩිජිටල් සාක්ෂරතා මූලික කරුණු\n• යතුරුපුවරු සහ මූසික කුසලතා"},
                {"heading": "නිවසේදී සහාය වන්නේ කෙසේද", "content": "• අද ඔවුන් ඉගෙන ගත් දේ ගැන අහන්න\n• ගණන් කිරීම සහ රටා ක්‍රීඩා පුහුණු කරන්න\n• තාර්කික චින්තනය සඳහා එදිනෙදා තත්ත්වයන් භාවිතා කරන්න\n• ප්‍රශ්න සහ කුතුහලය දිරිමත් කරන්න\n• ප්‍රතිඵල වලට වඩා උත්සාහය ප්‍රශංසා කරන්න\n• තාක්ෂණ තේමාවේ කතා පොත් එකට කියවන්න"},
                {"heading": "උපදේශකවරුන් සමඟ සන්නිවේදනය", "content": "• පන්ති යාවත්කාලීන සඳහා WhatsApp කණ්ඩායම\n• සවිස්තරාත්මක විමසීම් සඳහා විද්‍යුත් තැපෑල\n• මාසික ප්‍රගති වාර්තා\n• ත්‍රෛමාසික දෙමාපිය-ගුරු රැස්වීම්\n• සෑම මොඩියුලයකින්ම පසු ප්‍රතිපෝෂණ පෝරම"},
                {"heading": "තාක්ෂණික අවශ්‍යතා", "content": "• උපකරණය: කැමරාව සහිත ටැබ්ලට් හෝ පරිගණකය\n• අන්තර්ජාලය: ස්ථාවර බ්‍රෝඩ්බෑන්ඩ් සම්බන්ධතාවය\n• බ්‍රවුසරය: නවතම Chrome හෝ Firefox\n• Zoom යෙදුම: නවතම අනුවාදය ස්ථාපනය කර ඇත\n• ශ්‍රව්‍ය: ක්‍රියාකාරී ස්පීකර්/හෙඩ්ෆෝන් සහ මයික්‍රෆෝනය"},
                {"heading": "වැදගත් සම්බන්ධතා", "content": "• තාක්ෂණික සහාය: [Support Email]\n• අධ්‍යයන විමසීම්: [Academic Email]\n• WhatsApp උපකාරක මාර්ගය: [WhatsApp Number]\n• හදිසි සම්බන්ධතා: [Phone Number]"}
            ]
        }
    },
    "explorers": {
        "title": {
            "en": "Parent Guide: Young Explorers (Ages 7-9)",
            "si": "දෙමාපිය මාර්ගෝපදේශය: තරුණ ගවේෂකයින් (වයස 7-9)",
            "ta": "பெற்றோர் வழிகாட்டி: இளம் ஆய்வாளர்கள் (வயது 7-9)",
            "zh-CN": "家长指南：年轻探险家（7-9岁）",
            "id": "Panduan Orang Tua: Penjelajah Muda (Usia 7-9)",
            "ar": "دليل الوالدين: المستكشفون الصغار (الأعمار 7-9)",
            "hi": "अभिभावक मार्गदर्शिका: युवा खोजकर्ता (आयु 7-9)",
            "ms": "Panduan Ibu Bapa: Penjelajah Muda (Umur 7-9)",
            "bn": "অভিভাবক গাইড: তরুণ অভিযাত্রী (বয়স 7-9)",
            "ur": "والدین کی رہنما: نوجوان متلاشی (عمر 7-9)"
        },
        "age_range": "7-9"
    },
    "smart": {
        "title": {
            "en": "Parent Guide: Smart Kids (Ages 10-12)",
            "si": "දෙමාපිය මාර්ගෝපදේශය: දක්ෂ දරුවන් (වයස 10-12)",
            "ta": "பெற்றோர் வழிகாட்டி: ஸ்மார்ட் குழந்தைகள் (வயது 10-12)",
            "zh-CN": "家长指南：聪明儿童（10-12岁）",
            "id": "Panduan Orang Tua: Anak Cerdas (Usia 10-12)",
            "ar": "دليل الوالدين: الأطفال الأذكياء (الأعمار 10-12)",
            "hi": "अभिभावक मार्गदर्शिका: स्मार्ट बच्चे (आयु 10-12)",
            "ms": "Panduan Ibu Bapa: Kanak-Kanak Pintar (Umur 10-12)",
            "bn": "অভিভাবক গাইড: স্মার্ট শিশু (বয়স 10-12)",
            "ur": "والدین کی رہنما: سمارٹ بچے (عمر 10-12)"
        },
        "age_range": "10-12"
    },
    "teens": {
        "title": {
            "en": "Parent Guide: Tech Teens (Ages 13-15)",
            "si": "දෙමාපිය මාර්ගෝපදේශය: තාක්ෂණ නව යොවුන් (වයස 13-15)",
            "ta": "பெற்றோர் வழிகாட்டி: டெக் டீன்ஸ் (வயது 13-15)",
            "zh-CN": "家长指南：科技青少年（13-15岁）",
            "id": "Panduan Orang Tua: Remaja Teknologi (Usia 13-15)",
            "ar": "دليل الوالدين: المراهقون التقنيون (الأعمار 13-15)",
            "hi": "अभिभावक मार्गदर्शिका: टेक टीन्स (आयु 13-15)",
            "ms": "Panduan Ibu Bapa: Remaja Teknologi (Umur 13-15)",
            "bn": "অভিভাবক গাইড: টেক টিন্স (বয়স 13-15)",
            "ur": "والدین کی رہنما: ٹیک نوعمر (عمر 13-15)"
        },
        "age_range": "13-15"
    },
    "leaders": {
        "title": {
            "en": "Parent Guide: Future Leaders (Ages 16-18)",
            "si": "දෙමාපිය මාර්ගෝපදේශය: අනාගත නායකයින් (වයස 16-18)",
            "ta": "பெற்றோர் வழிகாட்டி: எதிர்கால தலைவர்கள் (வயது 16-18)",
            "zh-CN": "家长指南：未来领袖（16-18岁）",
            "id": "Panduan Orang Tua: Pemimpin Masa Depan (Usia 16-18)",
            "ar": "دليل الوالدين: قادة المستقبل (الأعمار 16-18)",
            "hi": "अभिभावक मार्गदर्शिका: भविष्य के नेता (आयु 16-18)",
            "ms": "Panduan Ibu Bapa: Pemimpin Masa Depan (Umur 16-18)",
            "bn": "অভিভাবক গাইড: ভবিষ্যতের নেতা (বয়স 16-18)",
            "ur": "والدین کی رہنما: مستقبل کے رہنما (عمر 16-18)"
        },
        "age_range": "16-18"
    }
}

async def generate_parent_guide_pdf_async(age_group: str, language: str) -> bytes:
    """Generate a PDF parent guide with proper font support"""
    from pdf_generator_v2 import generate_pdf_with_playwright
    from parent_guide_translations import get_sections_for_language
    
    # Get content for the age group
    guide_content = PARENT_GUIDES_CONTENT.get(age_group, PARENT_GUIDES_CONTENT["foundation"])
    
    # Get title in the selected language
    title = guide_content["title"].get(language, guide_content["title"]["en"])
    
    # Get sections for the language
    sections = get_sections_for_language(language)
    
    # Generate PDF with new generator
    pdf_bytes = await generate_pdf_with_playwright(title, sections, language)
    
    return pdf_bytes

@api_router.get("/parent-guides/{age_group}/{language}")
async def get_parent_guide(age_group: str, language: str):
    """Generate and return parent guide PDF for the specified age group and language"""
    valid_age_groups = ["foundation", "explorers", "smart", "teens", "leaders"]
    valid_languages = ["en", "si", "ta", "zh-CN", "id", "ar", "hi", "ms", "bn", "ur"]
    
    if age_group not in valid_age_groups:
        raise HTTPException(status_code=400, detail=f"Invalid age group. Must be one of: {valid_age_groups}")
    
    if language not in valid_languages:
        language = "en"  # Default to English if language not supported
    
    try:
        pdf_bytes = await generate_parent_guide_pdf_async(age_group, language)
        
        filename = f"TEC_Parent_Guide_{age_group}_{language}.pdf"
        
        return StreamingResponse(
            BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"inline; filename={filename}",
                "Content-Type": "application/pdf",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Expose-Headers": "Content-Disposition",
                "Cache-Control": "no-cache"
            }
        )
    except Exception as e:
        logging.error(f"Error generating parent guide PDF: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error generating PDF: {str(e)}")

# ============================================
# CURRICULUM PDF GENERATOR
# ============================================

class CurriculumPDFRequest(BaseModel):
    course_id: Optional[str] = None
    title: str = "TEC Curriculum"
    include_lessons: bool = True
    include_schedule: bool = True
    include_objectives: bool = True
    custom_sections: Optional[List[Dict[str, str]]] = None  # [{"title": "...", "content": "..."}]
    language: str = "en"

@api_router.post("/curriculum/generate-pdf")
async def generate_curriculum_pdf(
    request: CurriculumPDFRequest,
    current_user: User = Depends(get_current_teacher)
):
    """Generate a curriculum PDF for parents (Teacher/Admin only)"""
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.units import inch
    from reportlab.lib.enums import TA_CENTER, TA_LEFT
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from pathlib import Path
    
    # Register Unicode fonts for proper character display
    fonts_dir = Path(__file__).parent / "fonts"
    font_registered = False
    
    try:
        # Register NotoSans for general Unicode support
        noto_path = fonts_dir / "NotoSans-Regular.ttf"
        if noto_path.exists():
            pdfmetrics.registerFont(TTFont('NotoSans', str(noto_path)))
            font_registered = True
        
        # Register Sinhala font
        sinhala_path = fonts_dir / "NotoSansSinhala-Regular.ttf"
        if sinhala_path.exists():
            pdfmetrics.registerFont(TTFont('NotoSansSinhala', str(sinhala_path)))
        
        # Register Tamil font
        tamil_path = fonts_dir / "NotoSansTamil-Regular.ttf"
        if tamil_path.exists():
            pdfmetrics.registerFont(TTFont('NotoSansTamil', str(tamil_path)))
        
        # Register Arabic font
        arabic_path = fonts_dir / "NotoSansArabic-Regular.ttf"
        if arabic_path.exists():
            pdfmetrics.registerFont(TTFont('NotoSansArabic', str(arabic_path)))
        
        # Register Hindi/Devanagari font
        hindi_path = fonts_dir / "NotoSansDevanagari-Regular.ttf"
        if hindi_path.exists():
            pdfmetrics.registerFont(TTFont('NotoSansDevanagari', str(hindi_path)))
        
        # Register Bengali font
        bengali_path = fonts_dir / "NotoSansBengali-Regular.ttf"
        if bengali_path.exists():
            pdfmetrics.registerFont(TTFont('NotoSansBengali', str(bengali_path)))
    except Exception as e:
        logging.warning(f"Font registration warning: {e}")
    
    # Select the appropriate font based on content language
    default_font = 'NotoSans' if font_registered else 'Helvetica'
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=50, leftMargin=50, topMargin=50, bottomMargin=50)
    
    styles = getSampleStyleSheet()
    
    # Custom styles with Unicode font
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontName=default_font,
        fontSize=24,
        textColor=colors.HexColor('#667eea'),
        alignment=TA_CENTER,
        spaceAfter=20
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontName=default_font,
        fontSize=16,
        textColor=colors.HexColor('#764ba2'),
        spaceAfter=10,
        spaceBefore=15
    )
    
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['Normal'],
        fontName=default_font,
        fontSize=11,
        textColor=colors.HexColor('#374151'),
        spaceAfter=8
    )
    
    # Style for normal text with proper font
    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontName=default_font,
        fontSize=10,
        textColor=colors.HexColor('#374151'),
    )
    
    content = []
    
    # Title (removed emoji - causes boxes)
    content.append(Paragraph(f"{request.title}", title_style))
    content.append(Paragraph("TEC Future-Ready Learning Platform", normal_style))
    content.append(Spacer(1, 20))
    
    # If course_id provided, get course details
    if request.course_id:
        course = await db.courses.find_one({"id": request.course_id}, {"_id": 0})
        if course:
            content.append(Paragraph(f"Course: {course.get('title', 'N/A')}", heading_style))
            content.append(Paragraph(course.get('description', ''), body_style))
            content.append(Spacer(1, 10))
            
            # Course info table
            course_data = [
                ["Learning Level", course.get('learning_level', 'N/A').title()],
                ["Age Group", course.get('age_group', 'N/A')],
                ["Duration", f"{course.get('estimated_hours', 0)} hours"],
                ["Difficulty", f"Level {course.get('difficulty_level', 1)}/5"],
            ]
            
            table = Table(course_data, colWidths=[2*inch, 3*inch])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f3f4f6')),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#374151')),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('PADDING', (0, 0), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb')),
            ]))
            content.append(table)
            content.append(Spacer(1, 20))
            
            # Lessons/Videos (removed emoji)
            if request.include_lessons and course.get('videos'):
                content.append(Paragraph("Lessons & Videos", heading_style))
                for i, video in enumerate(course.get('videos', []), 1):
                    content.append(Paragraph(f"{i}. {video.get('title', 'Untitled')}", body_style))
                    if video.get('description'):
                        content.append(Paragraph(f"   {video.get('description')}", normal_style))
                content.append(Spacer(1, 15))
    
    # Learning Objectives (removed emoji)
    if request.include_objectives:
        content.append(Paragraph("Learning Objectives", heading_style))
        objectives = [
            "Develop AI literacy and understanding of how AI impacts daily life",
            "Build logical thinking and problem-solving skills",
            "Foster creative thinking and innovation",
            "Prepare for future career opportunities in technology",
            "Develop critical analysis and evaluation skills"
        ]
        for obj in objectives:
            content.append(Paragraph(f"• {obj}", body_style))
        content.append(Spacer(1, 15))
    
    # Custom sections
    if request.custom_sections:
        for section in request.custom_sections:
            content.append(Paragraph(section.get('title', 'Section'), heading_style))
            content.append(Paragraph(section.get('content', ''), body_style))
            content.append(Spacer(1, 10))
    
    # Footer
    content.append(Spacer(1, 30))
    content.append(Paragraph("_" * 60, normal_style))
    content.append(Paragraph(
        f"Generated by TEC Future-Ready Learning Platform | {datetime.now().strftime('%B %d, %Y')}",
        ParagraphStyle('Footer', parent=styles['Normal'], fontName=default_font, fontSize=9, textColor=colors.gray, alignment=TA_CENTER)
    ))
    content.append(Paragraph(
        "www.tecaikids.com | Building Tomorrow's Minds Since 1982",
        ParagraphStyle('Footer2', parent=styles['Normal'], fontName=default_font, fontSize=9, textColor=colors.HexColor('#667eea'), alignment=TA_CENTER)
    ))
    
    doc.build(content)
    buffer.seek(0)
    
    filename = f"TEC_Curriculum_{datetime.now().strftime('%Y%m%d')}.pdf"
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "Content-Type": "application/pdf"
        }
    )

@api_router.get("/curriculum/courses")
async def get_courses_for_curriculum(current_user: User = Depends(get_current_teacher)):
    """Get teacher's courses for curriculum generation"""
    if current_user.role == UserRole.ADMIN:
        courses = await db.courses.find({}, {"_id": 0}).to_list(100)
    else:
        courses = await db.courses.find({"created_by": current_user.id}, {"_id": 0}).to_list(100)
    
    return {"courses": courses}

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

# ============================================
# ADMIN DASHBOARD ENDPOINTS
# ============================================

@api_router.get("/admin/dashboard/stats")
async def get_admin_dashboard_stats(current_user: User = Depends(get_current_admin)):
    """Get overview statistics for admin dashboard"""
    
    # Total students by status
    total_students = await db.users.count_documents({"role": "student"})
    active_students = await db.users.count_documents({"role": "student", "is_active": True})
    
    # Students by age group
    students_by_age = {}
    for age in ["4-6", "7-9", "10-12", "13-15", "16-18"]:
        count = await db.users.count_documents({"role": "student", "age_group": age})
        students_by_age[age] = count
    
    # Students by country
    students_by_country = {}
    pipeline = [
        {"$match": {"role": "student"}},
        {"$group": {"_id": "$country", "count": {"$sum": 1}}}
    ]
    async for doc in db.users.aggregate(pipeline):
        country = doc["_id"] or "unknown"
        students_by_country[country] = doc["count"]
    
    # Total teachers
    total_teachers = await db.users.count_documents({"role": "teacher"})
    
    # Total courses
    total_courses = await db.courses.count_documents({})
    published_courses = await db.courses.count_documents({"is_published": True})
    
    # Enrollments
    total_enrollments = await db.enrollments.count_documents({})
    
    # Revenue from PayPal orders (completed)
    revenue_pipeline = [
        {"$match": {"status": "COMPLETED"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    revenue_result = await db.paypal_orders.aggregate(revenue_pipeline).to_list(1)
    total_revenue_usd = revenue_result[0]["total"] if revenue_result else 0
    
    # Recent enrollments (last 7 days)
    week_ago = datetime.utcnow() - timedelta(days=7)
    recent_enrollments = await db.enrollments.count_documents({
        "created_at": {"$gte": week_ago.isoformat()}
    })
    
    return {
        "students": {
            "total": total_students,
            "active": active_students,
            "by_age_group": students_by_age,
            "by_country": students_by_country
        },
        "teachers": {
            "total": total_teachers
        },
        "courses": {
            "total": total_courses,
            "published": published_courses
        },
        "enrollments": {
            "total": total_enrollments,
            "last_7_days": recent_enrollments
        },
        "revenue": {
            "total_usd": total_revenue_usd
        }
    }

@api_router.get("/admin/students")
async def get_all_students(
    current_user: User = Depends(get_current_admin),
    skip: int = 0,
    limit: int = 50,
    age_group: Optional[str] = None,
    country: Optional[str] = None,
    search: Optional[str] = None
):
    """Get all students with filtering options"""
    
    query = {"role": "student"}
    
    if age_group:
        query["age_group"] = age_group
    if country:
        query["country"] = country
    if search:
        query["$or"] = [
            {"full_name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"student_index": {"$regex": search, "$options": "i"}}
        ]
    
    total = await db.users.count_documents(query)
    students = await db.users.find(query, {"_id": 0, "hashed_password": 0}).skip(skip).limit(limit).to_list(limit)
    
    return {
        "total": total,
        "students": students,
        "skip": skip,
        "limit": limit
    }

@api_router.get("/admin/teachers")
async def get_all_teachers(current_user: User = Depends(get_current_admin)):
    """Get all teachers"""
    teachers = await db.users.find(
        {"role": "teacher"}, 
        {"_id": 0, "hashed_password": 0}
    ).to_list(100)
    
    # Get course count for each teacher
    for teacher in teachers:
        course_count = await db.courses.count_documents({"created_by": teacher["id"]})
        teacher["course_count"] = course_count
    
    return {"teachers": teachers}

@api_router.post("/admin/teachers")
async def create_teacher(
    teacher_data: UserCreate,
    current_user: User = Depends(get_current_admin)
):
    """Create a new teacher account"""
    existing = await db.users.find_one({"email": teacher_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(teacher_data.password)
    teacher_dict = teacher_data.dict()
    del teacher_dict["password"]
    teacher_dict["role"] = UserRole.TEACHER
    teacher_obj = User(**teacher_dict)
    
    user_data = teacher_obj.dict()
    user_data["hashed_password"] = hashed_password
    await db.users.insert_one(user_data)
    
    return teacher_obj

@api_router.get("/admin/payments")
async def get_payment_history(
    current_user: User = Depends(get_current_admin),
    skip: int = 0,
    limit: int = 50,
    status: Optional[str] = None
):
    """Get payment history"""
    query = {}
    if status:
        query["status"] = status
    
    total = await db.paypal_orders.count_documents(query)
    payments = await db.paypal_orders.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    return {
        "total": total,
        "payments": payments,
        "skip": skip,
        "limit": limit
    }

@api_router.get("/admin/attendance")
async def get_attendance_report(
    current_user: User = Depends(get_current_admin),
    date_from: Optional[str] = None,
    date_to: Optional[str] = None
):
    """Get attendance report"""
    query = {}
    if date_from:
        query["date"] = {"$gte": date_from}
    if date_to:
        if "date" in query:
            query["date"]["$lte"] = date_to
        else:
            query["date"] = {"$lte": date_to}
    
    attendance_records = await db.attendance.find(query, {"_id": 0}).sort("date", -1).to_list(500)
    
    # Calculate summary
    total_classes = len(attendance_records)
    total_present = sum(1 for r in attendance_records if r.get("status") == "present")
    
    return {
        "records": attendance_records,
        "summary": {
            "total_classes": total_classes,
            "total_present": total_present,
            "attendance_rate": (total_present / total_classes * 100) if total_classes > 0 else 0
        }
    }

@api_router.post("/admin/attendance")
async def mark_attendance(
    attendance_data: dict,
    current_user: User = Depends(get_current_teacher)
):
    """Mark attendance for a class"""
    record = {
        "id": str(uuid.uuid4()),
        "student_id": attendance_data.get("student_id"),
        "student_index": attendance_data.get("student_index"),
        "class_id": attendance_data.get("class_id"),
        "date": attendance_data.get("date", datetime.utcnow().strftime("%Y-%m-%d")),
        "status": attendance_data.get("status", "present"),  # present, absent, late
        "marked_by": current_user.id,
        "created_at": datetime.utcnow().isoformat()
    }
    
    await db.attendance.insert_one(record)
    return {"success": True, "record": record}

@api_router.get("/admin/recent-activity")
async def get_recent_activity(
    current_user: User = Depends(get_current_admin),
    limit: int = 20
):
    """Get recent platform activity"""
    activities = await db.activity_logs.find(
        {}, {"_id": 0}
    ).sort("timestamp", -1).limit(limit).to_list(limit)
    
    return {"activities": activities}

# ============================================
# FINANCE MANAGEMENT (Income, Expenses, Payroll by Country)
# ============================================

# Supported countries for finance
FINANCE_COUNTRIES = ["sri_lanka", "india", "malaysia", "bangladesh", "pakistan", "indonesia", "singapore", "uae", "saudi"]
MAX_WORKERS_PER_COUNTRY = 25

# Income endpoints
@api_router.get("/admin/finance/income")
async def get_income(
    current_user: User = Depends(get_current_admin),
    country: Optional[str] = None,
    month: Optional[str] = None  # Format: YYYY-MM
):
    """Get income records by country"""
    query = {}
    if country:
        query["country"] = country
    if month:
        query["month"] = month
    
    records = await db.finance_income.find(query, {"_id": 0}).sort("date", -1).to_list(500)
    
    # Calculate totals by country
    totals_by_country = {}
    for c in FINANCE_COUNTRIES:
        pipeline = [
            {"$match": {"country": c}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]
        result = await db.finance_income.aggregate(pipeline).to_list(1)
        totals_by_country[c] = result[0]["total"] if result else 0
    
    return {
        "records": records,
        "totals_by_country": totals_by_country,
        "grand_total": sum(totals_by_country.values())
    }

@api_router.post("/admin/finance/income")
async def add_income(
    income_data: dict,
    current_user: User = Depends(get_current_admin)
):
    """Add income record"""
    record = {
        "id": str(uuid.uuid4()),
        "country": income_data.get("country", "sri_lanka"),
        "category": income_data.get("category", "tuition"),  # tuition, materials, other
        "description": income_data.get("description", ""),
        "amount": float(income_data.get("amount", 0)),
        "currency": income_data.get("currency", "LKR"),
        "date": income_data.get("date", datetime.utcnow().strftime("%Y-%m-%d")),
        "month": income_data.get("date", datetime.utcnow().strftime("%Y-%m-%d"))[:7],
        "student_index": income_data.get("student_index"),
        "payment_method": income_data.get("payment_method", "bank_transfer"),
        "created_by": current_user.id,
        "created_at": datetime.utcnow().isoformat()
    }
    
    await db.finance_income.insert_one(record)
    return {"success": True, "record": {k: v for k, v in record.items() if k != "_id"}}

@api_router.delete("/admin/finance/income/{record_id}")
async def delete_income(record_id: str, current_user: User = Depends(get_current_admin)):
    """Delete income record"""
    result = await db.finance_income.delete_one({"id": record_id})
    return {"success": result.deleted_count > 0}

# Expenses endpoints
@api_router.get("/admin/finance/expenses")
async def get_expenses(
    current_user: User = Depends(get_current_admin),
    country: Optional[str] = None,
    month: Optional[str] = None
):
    """Get expense records by country"""
    query = {}
    if country:
        query["country"] = country
    if month:
        query["month"] = month
    
    records = await db.finance_expenses.find(query, {"_id": 0}).sort("date", -1).to_list(500)
    
    # Calculate totals by country
    totals_by_country = {}
    for c in FINANCE_COUNTRIES:
        pipeline = [
            {"$match": {"country": c}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]
        result = await db.finance_expenses.aggregate(pipeline).to_list(1)
        totals_by_country[c] = result[0]["total"] if result else 0
    
    return {
        "records": records,
        "totals_by_country": totals_by_country,
        "grand_total": sum(totals_by_country.values())
    }

@api_router.post("/admin/finance/expenses")
async def add_expense(
    expense_data: dict,
    current_user: User = Depends(get_current_admin)
):
    """Add expense record"""
    record = {
        "id": str(uuid.uuid4()),
        "country": expense_data.get("country", "sri_lanka"),
        "category": expense_data.get("category", "operations"),  # operations, marketing, software, rent, utilities, other
        "description": expense_data.get("description", ""),
        "amount": float(expense_data.get("amount", 0)),
        "currency": expense_data.get("currency", "LKR"),
        "date": expense_data.get("date", datetime.utcnow().strftime("%Y-%m-%d")),
        "month": expense_data.get("date", datetime.utcnow().strftime("%Y-%m-%d"))[:7],
        "vendor": expense_data.get("vendor"),
        "receipt_number": expense_data.get("receipt_number"),
        "created_by": current_user.id,
        "created_at": datetime.utcnow().isoformat()
    }
    
    await db.finance_expenses.insert_one(record)
    return {"success": True, "record": {k: v for k, v in record.items() if k != "_id"}}

@api_router.delete("/admin/finance/expenses/{record_id}")
async def delete_expense(record_id: str, current_user: User = Depends(get_current_admin)):
    """Delete expense record"""
    result = await db.finance_expenses.delete_one({"id": record_id})
    return {"success": result.deleted_count > 0}

# Payroll endpoints
@api_router.get("/admin/finance/payroll/workers")
async def get_workers(
    current_user: User = Depends(get_current_admin),
    country: Optional[str] = None
):
    """Get all workers by country (max 25 per country)"""
    query = {"is_active": True}
    if country:
        query["country"] = country
    
    workers = await db.payroll_workers.find(query, {"_id": 0}).to_list(500)
    
    # Count by country
    counts_by_country = {}
    for c in FINANCE_COUNTRIES:
        count = await db.payroll_workers.count_documents({"country": c, "is_active": True})
        counts_by_country[c] = count
    
    return {
        "workers": workers,
        "counts_by_country": counts_by_country,
        "max_per_country": MAX_WORKERS_PER_COUNTRY
    }

@api_router.post("/admin/finance/payroll/workers")
async def add_worker(
    worker_data: dict,
    current_user: User = Depends(get_current_admin)
):
    """Add a worker (max 25 per country)"""
    country = worker_data.get("country", "sri_lanka")
    
    # Check limit
    current_count = await db.payroll_workers.count_documents({"country": country, "is_active": True})
    if current_count >= MAX_WORKERS_PER_COUNTRY:
        raise HTTPException(
            status_code=400, 
            detail=f"Maximum {MAX_WORKERS_PER_COUNTRY} workers allowed per country. {country} already has {current_count}."
        )
    
    worker = {
        "id": str(uuid.uuid4()),
        "country": country,
        "name": worker_data.get("name"),
        "email": worker_data.get("email"),
        "phone": worker_data.get("phone"),
        "role": worker_data.get("role", "teacher"),  # teacher, assistant, admin, support
        "salary": float(worker_data.get("salary", 0)),
        "currency": worker_data.get("currency", "LKR"),
        "payment_frequency": worker_data.get("payment_frequency", "monthly"),  # monthly, weekly, bi-weekly
        "bank_name": worker_data.get("bank_name"),
        "bank_account": worker_data.get("bank_account"),
        "join_date": worker_data.get("join_date", datetime.utcnow().strftime("%Y-%m-%d")),
        "is_active": True,
        "created_by": current_user.id,
        "created_at": datetime.utcnow().isoformat()
    }
    
    await db.payroll_workers.insert_one(worker)
    return {"success": True, "worker": {k: v for k, v in worker.items() if k != "_id"}}

@api_router.put("/admin/finance/payroll/workers/{worker_id}")
async def update_worker(
    worker_id: str,
    worker_data: dict,
    current_user: User = Depends(get_current_admin)
):
    """Update worker details"""
    update_fields = {k: v for k, v in worker_data.items() if k not in ["id", "_id", "created_by", "created_at"]}
    update_fields["updated_at"] = datetime.utcnow().isoformat()
    
    result = await db.payroll_workers.update_one(
        {"id": worker_id},
        {"$set": update_fields}
    )
    return {"success": result.modified_count > 0}

@api_router.delete("/admin/finance/payroll/workers/{worker_id}")
async def deactivate_worker(worker_id: str, current_user: User = Depends(get_current_admin)):
    """Deactivate a worker (soft delete)"""
    result = await db.payroll_workers.update_one(
        {"id": worker_id},
        {"$set": {"is_active": False, "deactivated_at": datetime.utcnow().isoformat()}}
    )
    return {"success": result.modified_count > 0}

@api_router.get("/admin/finance/payroll/payments")
async def get_payroll_payments(
    current_user: User = Depends(get_current_admin),
    country: Optional[str] = None,
    month: Optional[str] = None
):
    """Get payroll payment history"""
    query = {}
    if country:
        query["country"] = country
    if month:
        query["month"] = month
    
    payments = await db.payroll_payments.find(query, {"_id": 0}).sort("date", -1).to_list(500)
    
    # Calculate totals by country
    totals_by_country = {}
    for c in FINANCE_COUNTRIES:
        pipeline = [
            {"$match": {"country": c}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]
        result = await db.payroll_payments.aggregate(pipeline).to_list(1)
        totals_by_country[c] = result[0]["total"] if result else 0
    
    return {
        "payments": payments,
        "totals_by_country": totals_by_country,
        "grand_total": sum(totals_by_country.values())
    }

@api_router.post("/admin/finance/payroll/payments")
async def process_payroll_payment(
    payment_data: dict,
    current_user: User = Depends(get_current_admin)
):
    """Process salary payment to a worker"""
    worker_id = payment_data.get("worker_id")
    worker = await db.payroll_workers.find_one({"id": worker_id})
    
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    
    payment = {
        "id": str(uuid.uuid4()),
        "worker_id": worker_id,
        "worker_name": worker.get("name"),
        "country": worker.get("country"),
        "amount": float(payment_data.get("amount", worker.get("salary", 0))),
        "currency": worker.get("currency", "LKR"),
        "date": payment_data.get("date", datetime.utcnow().strftime("%Y-%m-%d")),
        "month": payment_data.get("date", datetime.utcnow().strftime("%Y-%m-%d"))[:7],
        "payment_method": payment_data.get("payment_method", "bank_transfer"),
        "reference_number": payment_data.get("reference_number"),
        "notes": payment_data.get("notes"),
        "processed_by": current_user.id,
        "created_at": datetime.utcnow().isoformat()
    }
    
    await db.payroll_payments.insert_one(payment)
    return {"success": True, "payment": {k: v for k, v in payment.items() if k != "_id"}}

@api_router.get("/admin/finance/summary")
async def get_finance_summary(
    current_user: User = Depends(get_current_admin),
    month: Optional[str] = None
):
    """Get financial summary by country"""
    query = {}
    if month:
        query["month"] = month
    
    summary = {}
    for country in FINANCE_COUNTRIES:
        country_query = {**query, "country": country}
        
        # Income
        income_pipeline = [{"$match": country_query}, {"$group": {"_id": None, "total": {"$sum": "$amount"}}}]
        income_result = await db.finance_income.aggregate(income_pipeline).to_list(1)
        total_income = income_result[0]["total"] if income_result else 0
        
        # Expenses
        expense_pipeline = [{"$match": country_query}, {"$group": {"_id": None, "total": {"$sum": "$amount"}}}]
        expense_result = await db.finance_expenses.aggregate(expense_pipeline).to_list(1)
        total_expenses = expense_result[0]["total"] if expense_result else 0
        
        # Payroll
        payroll_pipeline = [{"$match": country_query}, {"$group": {"_id": None, "total": {"$sum": "$amount"}}}]
        payroll_result = await db.payroll_payments.aggregate(payroll_pipeline).to_list(1)
        total_payroll = payroll_result[0]["total"] if payroll_result else 0
        
        # Worker count
        worker_count = await db.payroll_workers.count_documents({"country": country, "is_active": True})
        
        summary[country] = {
            "income": total_income,
            "expenses": total_expenses,
            "payroll": total_payroll,
            "net_profit": total_income - total_expenses - total_payroll,
            "workers": worker_count,
            "max_workers": MAX_WORKERS_PER_COUNTRY
        }
    
    return {"summary": summary, "month": month or "all_time"}

# ============================================
# PARENT PORTAL ENDPOINTS
# ============================================

@api_router.post("/parent/link-child")
async def link_child_to_parent(
    link_data: dict,
    current_user: User = Depends(get_current_user)
):
    """Link a child to parent account using student index"""
    student_index = link_data.get("student_index")
    
    # Find the student
    student = await db.users.find_one({"student_index": student_index, "role": "student"})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found with this ID")
    
    # Create parent-child link
    link = {
        "id": str(uuid.uuid4()),
        "parent_id": current_user.id,
        "parent_email": current_user.email,
        "student_id": student["id"],
        "student_index": student_index,
        "student_name": student.get("full_name"),
        "linked_at": datetime.utcnow().isoformat(),
        "is_active": True
    }
    
    # Check if already linked
    existing = await db.parent_child_links.find_one({
        "parent_id": current_user.id,
        "student_id": student["id"]
    })
    if existing:
        raise HTTPException(status_code=400, detail="Child already linked to your account")
    
    await db.parent_child_links.insert_one(link)
    
    return {"success": True, "message": f"Successfully linked to {student.get('full_name')}", "link": link}

@api_router.get("/parent/children")
async def get_parent_children(current_user: User = Depends(get_current_user)):
    """Get all children linked to parent"""
    links = await db.parent_child_links.find(
        {"parent_id": current_user.id, "is_active": True},
        {"_id": 0}
    ).to_list(20)
    
    children = []
    for link in links:
        student = await db.users.find_one(
            {"id": link["student_id"]},
            {"_id": 0, "hashed_password": 0}
        )
        if student:
            # Get gamification data
            gamification = await db.gamification_stats.find_one({"user_id": student["id"]}, {"_id": 0})
            
            # Get attendance summary
            attendance_count = await db.attendance.count_documents({"student_id": student["id"], "status": "present"})
            
            children.append({
                "link_id": link["id"],
                "student": student,
                "gamification": gamification or {"xp": 0, "level": 1, "badges": []},
                "attendance_count": attendance_count,
                "linked_at": link["linked_at"]
            })
    
    return {"children": children}

@api_router.get("/parent/child/{student_id}/progress")
async def get_child_progress(student_id: str, current_user: User = Depends(get_current_user)):
    """Get detailed progress for a linked child"""
    
    # Verify parent has access
    link = await db.parent_child_links.find_one({
        "parent_id": current_user.id,
        "student_id": student_id,
        "is_active": True
    })
    if not link:
        raise HTTPException(status_code=403, detail="You don't have access to this student's data")
    
    # Get student data
    student = await db.users.find_one({"id": student_id}, {"_id": 0, "hashed_password": 0})
    
    # Get learning path
    learning_path = await db.learning_paths.find_one({"student_id": student_id}, {"_id": 0})
    
    # Get gamification
    gamification = await db.gamification_stats.find_one({"user_id": student_id}, {"_id": 0})
    
    # Get recent quiz results
    quizzes = await db.quiz_results.find(
        {"student_id": student_id}, {"_id": 0}
    ).sort("completed_at", -1).limit(10).to_list(10)
    
    # Get certificates
    certificates = await db.certificates.find(
        {"student_id": student_id}, {"_id": 0}
    ).sort("issued_date", -1).to_list(10)
    
    # Get attendance records
    attendance = await db.attendance.find(
        {"student_id": student_id}, {"_id": 0}
    ).sort("date", -1).limit(30).to_list(30)
    
    # Calculate attendance rate
    total_classes = len(attendance)
    present_count = sum(1 for a in attendance if a.get("status") == "present")
    attendance_rate = (present_count / total_classes * 100) if total_classes > 0 else 0
    
    return {
        "student": student,
        "learning_path": learning_path,
        "gamification": gamification or {"xp": 0, "level": 1, "badges": [], "streak_days": 0},
        "recent_quizzes": quizzes,
        "certificates": certificates,
        "attendance": {
            "records": attendance,
            "total_classes": total_classes,
            "present_count": present_count,
            "attendance_rate": round(attendance_rate, 1)
        }
    }

@api_router.get("/parent/child/{student_id}/payments")
async def get_child_payments(student_id: str, current_user: User = Depends(get_current_user)):
    """Get payment history for a linked child"""
    
    # Verify parent has access
    link = await db.parent_child_links.find_one({
        "parent_id": current_user.id,
        "student_id": student_id,
        "is_active": True
    })
    if not link:
        raise HTTPException(status_code=403, detail="Access denied")
    
    payments = await db.paypal_orders.find(
        {"student_id": student_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    # Calculate totals
    total_paid = sum(p.get("amount", 0) for p in payments if p.get("status") == "COMPLETED")
    
    return {
        "payments": payments,
        "total_paid": total_paid
    }

@api_router.delete("/parent/unlink-child/{link_id}")
async def unlink_child(link_id: str, current_user: User = Depends(get_current_user)):
    """Unlink a child from parent account"""
    result = await db.parent_child_links.update_one(
        {"id": link_id, "parent_id": current_user.id},
        {"$set": {"is_active": False, "unlinked_at": datetime.utcnow().isoformat()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Link not found")
    
    return {"success": True, "message": "Child unlinked successfully"}

# ============================================
# ATTENDANCE SYSTEM ENDPOINTS  
# ============================================

@api_router.post("/attendance/class")
async def create_class_session(
    class_data: dict,
    current_user: User = Depends(get_current_teacher)
):
    """Create a new class session for attendance"""
    session = {
        "id": str(uuid.uuid4()),
        "title": class_data.get("title", "Class Session"),
        "description": class_data.get("description"),
        "date": class_data.get("date", datetime.utcnow().strftime("%Y-%m-%d")),
        "time": class_data.get("time", datetime.utcnow().strftime("%H:%M")),
        "age_group": class_data.get("age_group"),
        "teacher_id": current_user.id,
        "teacher_name": current_user.full_name,
        "zoom_link": class_data.get("zoom_link"),
        "duration_minutes": class_data.get("duration_minutes", 60),
        "status": "scheduled",  # scheduled, in_progress, completed
        "created_at": datetime.utcnow().isoformat()
    }
    
    await db.class_sessions.insert_one(session)
    # Remove MongoDB _id before returning
    session.pop("_id", None)
    return {"success": True, "session": session}

@api_router.get("/attendance/classes")
async def get_class_sessions(
    current_user: User = Depends(get_current_teacher),
    date: Optional[str] = None,
    status: Optional[str] = None
):
    """Get class sessions for attendance"""
    query = {"teacher_id": current_user.id}
    if date:
        query["date"] = date
    if status:
        query["status"] = status
    
    sessions = await db.class_sessions.find(query, {"_id": 0}).sort("date", -1).to_list(100)
    return {"sessions": sessions}

@api_router.post("/attendance/mark")
async def mark_student_attendance(
    attendance_data: dict,
    current_user: User = Depends(get_current_teacher)
):
    """Mark attendance for a student in a class session"""
    session_id = attendance_data.get("session_id")
    student_id = attendance_data.get("student_id")
    status = attendance_data.get("status", "present")  # present, absent, late, excused
    
    # Get student info
    student = await db.users.find_one({"id": student_id})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Get session info
    session = await db.class_sessions.find_one({"id": session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Class session not found")
    
    record = {
        "id": str(uuid.uuid4()),
        "session_id": session_id,
        "session_title": session.get("title"),
        "student_id": student_id,
        "student_index": student.get("student_index"),
        "student_name": student.get("full_name"),
        "date": session.get("date"),
        "time": session.get("time"),
        "status": status,
        "marked_by": current_user.id,
        "marked_at": datetime.utcnow().isoformat(),
        "notes": attendance_data.get("notes")
    }
    
    # Upsert - update if exists, insert if not
    await db.attendance.update_one(
        {"session_id": session_id, "student_id": student_id},
        {"$set": record},
        upsert=True
    )
    
    return {"success": True, "record": record}

@api_router.post("/attendance/mark-bulk")
async def mark_bulk_attendance(
    bulk_data: dict,
    current_user: User = Depends(get_current_teacher)
):
    """Mark attendance for multiple students at once"""
    session_id = bulk_data.get("session_id")
    attendance_list = bulk_data.get("attendance", [])  # [{student_id, status}, ...]
    
    session = await db.class_sessions.find_one({"id": session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Class session not found")
    
    marked_count = 0
    for item in attendance_list:
        student = await db.users.find_one({"id": item.get("student_id")})
        if student:
            record = {
                "id": str(uuid.uuid4()),
                "session_id": session_id,
                "session_title": session.get("title"),
                "student_id": item.get("student_id"),
                "student_index": student.get("student_index"),
                "student_name": student.get("full_name"),
                "date": session.get("date"),
                "time": session.get("time"),
                "status": item.get("status", "present"),
                "marked_by": current_user.id,
                "marked_at": datetime.utcnow().isoformat()
            }
            await db.attendance.update_one(
                {"session_id": session_id, "student_id": item.get("student_id")},
                {"$set": record},
                upsert=True
            )
            marked_count += 1
    
    # Update session status
    await db.class_sessions.update_one(
        {"id": session_id},
        {"$set": {"status": "completed", "attendance_marked": True}}
    )
    
    return {"success": True, "marked_count": marked_count}

@api_router.get("/attendance/session/{session_id}")
async def get_session_attendance(
    session_id: str,
    current_user: User = Depends(get_current_teacher)
):
    """Get attendance for a specific class session"""
    session = await db.class_sessions.find_one({"id": session_id}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    attendance = await db.attendance.find(
        {"session_id": session_id}, {"_id": 0}
    ).to_list(100)
    
    # Get all students in the age group
    all_students = await db.users.find(
        {"role": "student", "age_group": session.get("age_group")},
        {"_id": 0, "hashed_password": 0}
    ).to_list(100)
    
    # Map attendance
    attended_ids = {a["student_id"] for a in attendance}
    
    return {
        "session": session,
        "attendance": attendance,
        "all_students": all_students,
        "summary": {
            "total_students": len(all_students),
            "present": sum(1 for a in attendance if a.get("status") == "present"),
            "absent": sum(1 for a in attendance if a.get("status") == "absent"),
            "late": sum(1 for a in attendance if a.get("status") == "late"),
            "not_marked": len(all_students) - len(attendance)
        }
    }

@api_router.get("/attendance/student/{student_id}/report")
async def get_student_attendance_report(
    student_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get attendance report for a student"""
    # Check access
    if current_user.role == UserRole.STUDENT and current_user.id != student_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    attendance = await db.attendance.find(
        {"student_id": student_id}, {"_id": 0}
    ).sort("date", -1).to_list(100)
    
    total = len(attendance)
    present = sum(1 for a in attendance if a.get("status") == "present")
    late = sum(1 for a in attendance if a.get("status") == "late")
    absent = sum(1 for a in attendance if a.get("status") == "absent")
    excused = sum(1 for a in attendance if a.get("status") == "excused")
    
    return {
        "attendance": attendance,
        "summary": {
            "total_classes": total,
            "present": present,
            "late": late,
            "absent": absent,
            "excused": excused,
            "attendance_rate": round((present + late) / total * 100, 1) if total > 0 else 0
        }
    }

# ============================================
# CERTIFICATE PDF GENERATION
# ============================================

from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.lib.units import inch, cm
from reportlab.pdfgen import canvas
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph

# Certificate email notification
async def send_certificate_email(student_email: str, student_name: str, certificate: dict, frontend_url: str):
    """Send email notification when a certificate is issued"""
    import resend
    import os
    
    RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
    SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
    
    if not RESEND_API_KEY:
        logging.warning("RESEND_API_KEY not found - certificate email not sent")
        return {"success": False, "message": "Email service not configured"}
    
    resend.api_key = RESEND_API_KEY
    
    cert_url = f"{frontend_url}/api/certificates/{certificate['id']}/pdf"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background: #f8f9fa; padding: 30px; }}
            .certificate-box {{ background: white; border: 2px solid #667eea; border-radius: 10px; padding: 25px; text-align: center; margin: 20px 0; }}
            .certificate-icon {{ font-size: 48px; margin-bottom: 15px; }}
            .btn {{ display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; margin: 20px 0; }}
            .footer {{ text-align: center; color: #666; font-size: 12px; padding: 20px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎓 Certificate Awarded!</h1>
                <p>TEC Future-Ready Learning Platform</p>
            </div>
            <div class="content">
                <p>Dear <strong>{student_name}</strong>,</p>
                <p>Congratulations! You have been awarded a certificate for your achievements.</p>
                
                <div class="certificate-box">
                    <div class="certificate-icon">🏆</div>
                    <h2>Certificate of {certificate['certificate_type'].title()}</h2>
                    <h3>{certificate['course_name']}</h3>
                    <p><strong>Certificate Number:</strong> {certificate['certificate_number']}</p>
                    <p><strong>Issued:</strong> {certificate['issued_date']}</p>
                    <p><strong>Issued By:</strong> {certificate['issued_by']}</p>
                </div>
                
                <p style="text-align: center;">
                    <a href="{cert_url}" class="btn">📥 Download Certificate PDF</a>
                </p>
                
                <p>Keep up the excellent work! Your dedication to learning is inspiring.</p>
                
                <p>Best regards,<br>TEC Sri Lanka Worldwide (Pvt.) Ltd</p>
            </div>
            <div class="footer">
                <p>© 2024 TEC Sri Lanka Worldwide (Pvt.) Ltd | 42 Years of Educational Excellence</p>
                <p>This is an automated notification from tecaikids.com</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    try:
        params = {
            "from": SENDER_EMAIL,
            "to": [student_email],
            "subject": f"🎓 Certificate Awarded: {certificate['course_name']}",
            "html": html_content
        }
        
        import asyncio
        email = await asyncio.to_thread(resend.Emails.send, params)
        logging.info(f"Certificate email sent to {student_email}")
        return {"success": True, "email_id": email.get("id")}
    except Exception as e:
        logging.error(f"Failed to send certificate email: {str(e)}")
        return {"success": False, "message": str(e)}


async def send_article_review_notification(
    student_email: str, 
    student_name: str, 
    article_title: str, 
    action: str, 
    feedback: str,
    reviewer_name: str
):
    """Send email notification when an article is approved or rejected"""
    import resend
    import os
    
    RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
    SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
    
    if not RESEND_API_KEY:
        logging.warning("RESEND_API_KEY not found - article review email not sent")
        return {"success": False, "message": "Email service not configured"}
    
    resend.api_key = RESEND_API_KEY
    
    is_approved = action == "approve"
    
    # Different content based on approval/rejection
    if is_approved:
        status_icon = "🎉"
        status_text = "Published!"
        status_color = "#22c55e"  # green
        main_message = "Great news! Your article has been reviewed and published to the TecAI Kids Magazine!"
        action_text = "Your article is now live and visible to students in your age group across all countries. Keep writing and sharing your knowledge!"
    else:
        status_icon = "📝"
        status_text = "Needs Revision"
        status_color = "#f59e0b"  # amber
        main_message = "Your article has been reviewed by our editorial team."
        action_text = "Don't be discouraged! Review the feedback below and consider submitting a revised version. We'd love to see your improved article!"
    
    feedback_section = ""
    if feedback:
        feedback_section = f"""
        <div style="background: #f3f4f6; border-left: 4px solid {status_color}; padding: 15px 20px; margin: 20px 0; border-radius: 0 10px 10px 0;">
            <p style="margin: 0 0 5px 0; font-weight: bold; color: #374151;">💬 Reviewer Feedback:</p>
            <p style="margin: 0; color: #4b5563; font-style: italic;">"{feedback}"</p>
            <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 12px;">— {reviewer_name}</p>
        </div>
        """
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background: #f8f9fa; padding: 30px; }}
            .article-box {{ background: white; border: 2px solid {status_color}; border-radius: 10px; padding: 25px; text-align: center; margin: 20px 0; }}
            .status-badge {{ display: inline-block; background: {status_color}; color: white; padding: 8px 20px; border-radius: 20px; font-weight: bold; margin-bottom: 15px; }}
            .btn {{ display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; margin: 20px 0; }}
            .footer {{ text-align: center; color: #666; font-size: 12px; padding: 20px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>{status_icon} Article Review Update</h1>
                <p>TecAI Kids Magazine</p>
            </div>
            <div class="content">
                <p>Dear <strong>{student_name}</strong>,</p>
                <p>{main_message}</p>
                
                <div class="article-box">
                    <span class="status-badge">{status_text}</span>
                    <h2 style="margin: 10px 0; color: #1f2937;">📰 {article_title}</h2>
                </div>
                
                {feedback_section}
                
                <p>{action_text}</p>
                
                <p style="text-align: center;">
                    <a href="https://tecaikids.com/magazine" class="btn">📖 Visit the Magazine</a>
                </p>
                
                <p>Keep learning and creating!<br>
                <strong>TEC Editorial Team</strong></p>
            </div>
            <div class="footer">
                <p>© 2024 TEC Sri Lanka Worldwide (Pvt.) Ltd | 42 Years of Educational Excellence</p>
                <p>This is an automated notification from tecaikids.com</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    try:
        subject = f"{'🎉 Your Article is Published!' if is_approved else '📝 Article Review Feedback'}: {article_title}"
        params = {
            "from": SENDER_EMAIL,
            "to": [student_email],
            "subject": subject,
            "html": html_content
        }
        
        import asyncio
        email = await asyncio.to_thread(resend.Emails.send, params)
        logging.info(f"Article review notification sent to {student_email}")
        return {"success": True, "email_id": email.get("id")}
    except Exception as e:
        logging.error(f"Failed to send article review notification: {str(e)}")
        return {"success": False, "message": str(e)}


async def send_parent_article_notification(
    parent_email: str,
    parent_name: str,
    student_name: str,
    article_title: str
):
    """Send email to parent when their child's article is published"""
    import resend
    import os
    
    RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
    SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
    
    if not RESEND_API_KEY:
        logging.warning("RESEND_API_KEY not found - parent article email not sent")
        return {"success": False, "message": "Email service not configured"}
    
    resend.api_key = RESEND_API_KEY
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background: #fffbeb; padding: 30px; }}
            .celebration-box {{ background: white; border: 3px solid #f59e0b; border-radius: 15px; padding: 30px; text-align: center; margin: 20px 0; }}
            .star {{ font-size: 60px; margin-bottom: 10px; }}
            .btn {{ display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; margin: 20px 0; }}
            .footer {{ text-align: center; color: #666; font-size: 12px; padding: 20px; background: #f8f9fa; border-radius: 0 0 10px 10px; }}
            .highlight {{ background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 15px 20px; border-radius: 10px; margin: 15px 0; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🌟 Proud Parent Moment! 🌟</h1>
                <p>TecAI Kids Magazine</p>
            </div>
            <div class="content">
                <p>Dear <strong>{parent_name}</strong>,</p>
                
                <p>We have wonderful news to share with you!</p>
                
                <div class="celebration-box">
                    <div class="star">⭐</div>
                    <h2 style="color: #d97706; margin: 10px 0;">Your Child is a Published Author!</h2>
                    <p style="font-size: 18px; color: #374151;"><strong>{student_name}</strong>'s article has been published in the TecAI Kids Magazine!</p>
                    <div class="highlight">
                        <p style="margin: 0; font-size: 16px;">📰 <strong>"{article_title}"</strong></p>
                    </div>
                </div>
                
                <p>This is a remarkable achievement! {student_name} has demonstrated creativity, knowledge, and excellent writing skills. The article is now visible to students across multiple countries in their age group.</p>
                
                <p>We encourage you to:</p>
                <ul style="color: #4b5563;">
                    <li>🎉 Celebrate this achievement with {student_name}</li>
                    <li>📖 Read the published article together</li>
                    <li>💬 Share this proud moment with family and friends</li>
                    <li>✍️ Encourage more writing and creativity</li>
                </ul>
                
                <p style="text-align: center;">
                    <a href="https://tecaikids.com/magazine" class="btn">📖 Read the Article</a>
                </p>
                
                <p>Thank you for supporting your child's educational journey with TecAI Kids!</p>
                
                <p>Warm regards,<br>
                <strong>TEC Editorial Team</strong><br>
                <em>Building future-ready kids since 1982</em></p>
            </div>
            <div class="footer">
                <p>© 2024 TEC Sri Lanka Worldwide (Pvt.) Ltd | 42 Years of Educational Excellence</p>
                <p>This is an automated notification from tecaikids.com</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    try:
        params = {
            "from": SENDER_EMAIL,
            "to": [parent_email],
            "subject": f"🌟 Proud Moment: {student_name}'s Article is Published!",
            "html": html_content
        }
        
        import asyncio
        email = await asyncio.to_thread(resend.Emails.send, params)
        logging.info(f"Parent article notification sent to {parent_email}")
        return {"success": True, "email_id": email.get("id")}
    except Exception as e:
        logging.error(f"Failed to send parent article notification: {str(e)}")
        return {"success": False, "message": str(e)}


@api_router.post("/certificates/generate")
async def generate_certificate(
    cert_data: dict,
    current_user: User = Depends(get_current_teacher)
):
    """Generate a certificate for a student"""
    student_id = cert_data.get("student_id")
    certificate_type = cert_data.get("type", "completion")  # completion, achievement, participation
    course_name = cert_data.get("course_name", "Future-Ready Learning Program")
    send_email = cert_data.get("send_email", True)  # Send email notification by default
    
    student = await db.users.find_one({"id": student_id})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Create certificate record
    cert_id = str(uuid.uuid4())
    certificate = {
        "id": cert_id,
        "student_id": student_id,
        "student_index": student.get("student_index"),
        "student_name": student.get("full_name"),
        "certificate_type": certificate_type,
        "course_name": course_name,
        "issued_by": current_user.full_name,
        "issued_date": datetime.utcnow().strftime("%Y-%m-%d"),
        "certificate_number": f"TEC-{datetime.utcnow().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}",
        "created_at": datetime.utcnow().isoformat()
    }
    
    await db.certificates.insert_one(certificate)
    
    # Send email notification
    email_result = None
    if send_email and student.get("email"):
        frontend_url = os.environ.get("FRONTEND_URL", "https://tecaikids.com")
        email_result = await send_certificate_email(
            student.get("email"),
            student.get("full_name"),
            {k: v for k, v in certificate.items() if k != "_id"},
            frontend_url
        )
    
    # Also send email to linked parent(s)
    parent_emails_sent = []
    if send_email:
        parent_links = await db.parent_child_links.find({"child_id": student_id}).to_list(100)
        for link in parent_links:
            parent = await db.users.find_one({"id": link.get("parent_id")})
            if parent and parent.get("email"):
                parent_result = await send_certificate_email(
                    parent.get("email"),
                    f"{parent.get('full_name')} (Parent of {student.get('full_name')})",
                    {k: v for k, v in certificate.items() if k != "_id"},
                    frontend_url
                )
                if parent_result.get("success"):
                    parent_emails_sent.append(parent.get("email"))
    
    # Return certificate without _id
    return {
        "success": True, 
        "certificate": {k: v for k, v in certificate.items() if k != "_id"},
        "email_sent": email_result.get("success") if email_result else False,
        "parent_emails_sent": len(parent_emails_sent)
    }

@api_router.get("/certificates/{certificate_id}/pdf")
async def get_certificate_pdf(certificate_id: str):
    """Generate and download certificate as PDF"""
    cert = await db.certificates.find_one({"id": certificate_id})
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    
    # Generate PDF
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=landscape(A4))
    width, height = landscape(A4)
    
    # Background gradient effect (light blue)
    c.setFillColor(colors.HexColor("#F0F8FF"))
    c.rect(0, 0, width, height, fill=True, stroke=False)
    
    # Border - Gold/Purple gradient effect
    c.setStrokeColor(colors.HexColor("#4B0082"))
    c.setLineWidth(4)
    c.rect(25, 25, width-50, height-50, fill=False, stroke=True)
    
    # Inner border
    c.setStrokeColor(colors.HexColor("#DAA520"))  # Gold
    c.setLineWidth(2)
    c.rect(35, 35, width-70, height-70, fill=False, stroke=True)
    
    # Corner decorations
    c.setStrokeColor(colors.HexColor("#4B0082"))
    c.setLineWidth(1)
    for x, y in [(45, height-45), (width-45, height-45), (45, 45), (width-45, 45)]:
        c.circle(x, y, 8, fill=False, stroke=True)
    
    # TEC Logo - Try to load from static folder
    logo_path = os.path.join(os.path.dirname(__file__), "static", "tec_logo.png")
    try:
        from reportlab.lib.utils import ImageReader
        if os.path.exists(logo_path):
            logo = ImageReader(logo_path)
            c.drawImage(logo, width/2 - 50, height - 160, width=100, height=100, preserveAspectRatio=True, mask='auto')
    except Exception as e:
        logging.warning(f"Could not load logo: {e}")
    
    # Header
    c.setFillColor(colors.HexColor("#4B0082"))
    c.setFont("Helvetica-Bold", 40)
    c.drawCentredString(width/2, height-180, "CERTIFICATE")
    
    c.setFont("Helvetica", 20)
    c.drawCentredString(width/2, height-210, f"of {cert.get('certificate_type', 'Completion').title()}")
    
    # Organization with motto
    c.setFillColor(colors.HexColor("#666666"))
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(width/2, height-240, "TEC FUTURE-READY LEARNING")
    c.setFont("Helvetica-Oblique", 10)
    c.drawCentredString(width/2, height-255, "SCIENTIA PRO HOMINIUS - Knowledge for Humanity")
    
    # Decorative line
    c.setStrokeColor(colors.HexColor("#DAA520"))
    c.setLineWidth(1)
    c.line(width/2 - 150, height-270, width/2 + 150, height-270)
    
    # Presented to
    c.setFillColor(colors.HexColor("#333333"))
    c.setFont("Helvetica", 16)
    c.drawCentredString(width/2, height-300, "This is to certify that")
    
    # Student name with underline
    c.setFillColor(colors.HexColor("#4B0082"))
    c.setFont("Helvetica-Bold", 36)
    student_name = cert.get("student_name", "Student")
    c.drawCentredString(width/2, height-350, student_name)
    
    # Underline for name
    name_width = c.stringWidth(student_name, "Helvetica-Bold", 36)
    c.setStrokeColor(colors.HexColor("#DAA520"))
    c.line(width/2 - name_width/2 - 20, height-360, width/2 + name_width/2 + 20, height-360)
    
    # Student ID
    c.setFillColor(colors.HexColor("#666666"))
    c.setFont("Helvetica", 12)
    c.drawCentredString(width/2, height-385, f"Student ID: {cert.get('student_index', 'N/A')}")
    
    # Course/Achievement
    c.setFillColor(colors.HexColor("#333333"))
    c.setFont("Helvetica", 16)
    c.drawCentredString(width/2, height-420, "has successfully completed")
    
    c.setFillColor(colors.HexColor("#4B0082"))
    c.setFont("Helvetica-Bold", 24)
    c.drawCentredString(width/2, height-455, cert.get("course_name", "Future-Ready Learning Program"))
    
    # Date and signature area
    c.setFillColor(colors.HexColor("#333333"))
    c.setFont("Helvetica", 12)
    
    # Date on left
    c.drawString(100, 130, f"Date: {cert.get('issued_date', '')}")
    c.drawString(100, 110, f"Certificate No: {cert.get('certificate_number', '')}")
    
    # Seal/Badge area (center bottom)
    c.setStrokeColor(colors.HexColor("#DAA520"))
    c.setFillColor(colors.HexColor("#FFF8DC"))
    c.circle(width/2, 110, 35, fill=True, stroke=True)
    c.setFillColor(colors.HexColor("#4B0082"))
    c.setFont("Helvetica-Bold", 10)
    c.drawCentredString(width/2, 118, "TEC")
    c.setFont("Helvetica", 8)
    c.drawCentredString(width/2, 105, "CERTIFIED")
    c.drawCentredString(width/2, 95, "EST. 1982")
    
    # Signature line on right
    c.setStrokeColor(colors.HexColor("#333333"))
    c.line(width-250, 120, width-100, 120)
    c.setFillColor(colors.HexColor("#333333"))
    c.setFont("Helvetica", 12)
    c.drawCentredString(width-175, 100, cert.get("issued_by", "Authorized Signatory"))
    c.setFont("Helvetica", 10)
    c.drawCentredString(width-175, 85, "Program Director")
    
    # Footer
    c.setFillColor(colors.HexColor("#666666"))
    c.setFont("Helvetica", 9)
    c.drawCentredString(width/2, 50, "TEC Sri Lanka Worldwide (Pvt.) Ltd • Established 1982 • 42 Years of Educational Excellence")
    c.setFont("Helvetica", 8)
    c.drawCentredString(width/2, 38, "www.tecaikids.com • Verify at: tecaikids.com/verify")
    
    c.save()
    buffer.seek(0)
    
    filename = f"Certificate_{cert.get('student_index', 'student')}_{cert.get('certificate_number', '')}.pdf"
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@api_router.get("/certificates/student/{student_id}")
async def get_student_certificates(
    student_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get all certificates for a student"""
    certificates = await db.certificates.find(
        {"student_id": student_id}, {"_id": 0}
    ).sort("issued_date", -1).to_list(50)
    
    return {"certificates": certificates}

@api_router.get("/certificates/verify/{certificate_number}")
async def verify_certificate(certificate_number: str):
    """Public endpoint to verify a certificate"""
    cert = await db.certificates.find_one(
        {"certificate_number": certificate_number},
        {"_id": 0}
    )
    
    if not cert:
        return {"verified": False, "message": "Certificate not found"}
    
    return {
        "verified": True,
        "certificate": {
            "certificate_number": cert.get("certificate_number"),
            "student_name": cert.get("student_name"),
            "student_index": cert.get("student_index"),
            "certificate_type": cert.get("certificate_type"),
            "course_name": cert.get("course_name"),
            "issued_date": cert.get("issued_date"),
            "issued_by": cert.get("issued_by")
        },
        "organization": "TEC Future-Ready Learning"
    }

# ============================================
# STUDENT SHOWCASE ENDPOINTS
# ============================================

@api_router.get("/showcase/gallery")
async def get_showcase_gallery(
    level: Optional[int] = None,
    category: Optional[str] = None,
    limit: int = 50
):
    """Get all showcase items for gallery view"""
    query = {"status": "approved"}
    if level:
        query["level"] = level
    if category:
        query["category"] = category
    
    items = await db.showcase.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return {"items": items}

@api_router.get("/showcase/my-work")
async def get_my_showcase_work(current_user: User = Depends(get_current_user)):
    """Get current user's showcase items"""
    items = await db.showcase.find(
        {"student_id": current_user.id}, 
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return {"items": items}

@api_router.post("/showcase/upload")
async def upload_showcase_work(
    title: str = Form(...),
    description: str = Form(""),
    category: str = Form("art"),
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload new showcase work"""
    import base64
    
    # Read and encode image
    image_data = await image.read()
    image_base64 = base64.b64encode(image_data).decode('utf-8')
    image_url = f"data:image/{image.content_type.split('/')[-1]};base64,{image_base64}"
    
    # Get user's current level from gamification stats
    stats = await db.gamification_stats.find_one({"student_id": current_user.id})
    user_level = stats.get("level", 1) if stats else 1
    
    showcase_item = {
        "id": str(uuid.uuid4()),
        "student_id": current_user.id,
        "student_name": current_user.full_name,
        "student_index": current_user.student_index,
        "title": title,
        "description": description,
        "category": category,
        "image_url": image_url,
        "level": user_level,
        "likes": 0,
        "comments": 0,
        "status": "approved",  # Auto-approve for now
        "created_at": datetime.utcnow().isoformat()
    }
    
    await db.showcase.insert_one(showcase_item)
    
    return {"success": True, "item": {k: v for k, v in showcase_item.items() if k != "_id"}}

@api_router.post("/showcase/{item_id}/like")
async def like_showcase_item(item_id: str, current_user: User = Depends(get_current_user)):
    """Like a showcase item"""
    # Check if already liked
    existing_like = await db.showcase_likes.find_one({
        "item_id": item_id,
        "user_id": current_user.id
    })
    
    if existing_like:
        return {"success": False, "message": "Already liked"}
    
    # Add like
    await db.showcase_likes.insert_one({
        "id": str(uuid.uuid4()),
        "item_id": item_id,
        "user_id": current_user.id,
        "created_at": datetime.utcnow().isoformat()
    })
    
    # Increment likes count
    await db.showcase.update_one(
        {"id": item_id},
        {"$inc": {"likes": 1}}
    )
    
    return {"success": True}

@api_router.get("/showcase/featured")
async def get_featured_showcase():
    """Get featured showcase items (most liked)"""
    items = await db.showcase.find(
        {"status": "approved", "likes": {"$gte": 10}},
        {"_id": 0}
    ).sort("likes", -1).to_list(10)
    return {"items": items}

# ============================================
# TECH & AI MAGAZINE ENDPOINTS
# ============================================

@api_router.get("/magazine/articles")
async def get_magazine_articles(
    age_group: str = "10-12",
    category: Optional[str] = None,
    limit: int = 20
):
    """Get official magazine articles for an age group"""
    query = {"age_group": age_group, "type": "official"}
    if category:
        query["category"] = category
    
    articles = await db.magazine_articles.find(query, {"_id": 0}).sort("date", -1).to_list(limit)
    return {"articles": articles}

@api_router.get("/magazine/student-articles")
async def get_student_magazine_articles(
    age_group: str = "10-12",
    category: Optional[str] = None,
    limit: int = 50
):
    """Get student-contributed articles for an age group"""
    query = {"age_group": age_group, "type": "student", "approved": True}
    if category:
        query["category"] = category
    
    articles = await db.magazine_articles.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return {"articles": articles}

@api_router.post("/magazine/submit-article")
async def submit_magazine_article(
    article_data: dict,
    current_user: User = Depends(get_current_user)
):
    """Submit a student article for the magazine"""
    article = {
        "id": str(uuid.uuid4()),
        "type": "student",
        "title": article_data.get("title"),
        "content": article_data.get("content"),
        "summary": article_data.get("content", "")[:200] + "..." if len(article_data.get("content", "")) > 200 else article_data.get("content", ""),
        "category": article_data.get("category", "student_stories"),
        "age_group": article_data.get("age_group", current_user.age_group or "10-12"),
        "author_id": current_user.id,
        "author_name": current_user.full_name,
        "author_country": current_user.country or "International",
        "author_index": current_user.student_index,
        "date": datetime.utcnow().strftime("%B %Y"),
        "likes": 0,
        "views": 0,
        "approved": True,  # Auto-approve for now
        "created_at": datetime.utcnow().isoformat()
    }
    
    await db.magazine_articles.insert_one(article)
    
    return {"success": True, "article": {k: v for k, v in article.items() if k != "_id"}}

@api_router.post("/magazine/articles/{article_id}/like")
async def like_magazine_article(
    article_id: str,
    current_user: User = Depends(get_current_user)
):
    """Like a magazine article"""
    # Check if already liked
    existing = await db.magazine_likes.find_one({
        "article_id": article_id,
        "user_id": current_user.id
    })
    
    if existing:
        return {"success": False, "message": "Already liked"}
    
    # Add like
    await db.magazine_likes.insert_one({
        "id": str(uuid.uuid4()),
        "article_id": article_id,
        "user_id": current_user.id,
        "created_at": datetime.utcnow().isoformat()
    })
    
    # Increment likes
    await db.magazine_articles.update_one(
        {"id": article_id},
        {"$inc": {"likes": 1}}
    )
    
    return {"success": True}

@api_router.get("/magazine/featured")
async def get_featured_magazine_articles(age_group: str = "10-12"):
    """Get featured magazine articles"""
    articles = await db.magazine_articles.find(
        {"age_group": age_group, "approved": True, "likes": {"$gte": 20}},
        {"_id": 0}
    ).sort("likes", -1).to_list(10)
    return {"articles": articles}

@api_router.get("/magazine/my-articles")
async def get_my_magazine_articles(current_user: User = Depends(get_current_user)):
    """Get current user's submitted articles"""
    articles = await db.magazine_articles.find(
        {"author_id": current_user.id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return {"articles": articles}

@api_router.post("/magazine/save-draft")
async def save_article_draft(
    article_data: dict,
    current_user: User = Depends(get_current_user)
):
    """Save article as draft"""
    draft = {
        "id": str(uuid.uuid4()),
        "type": "student",
        "status": "draft",
        **article_data,
        "author_id": current_user.id,
        "author_name": current_user.full_name,
        "author_country": current_user.country or "International",
        "author_index": current_user.student_index,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    await db.magazine_articles.insert_one(draft)
    return {"success": True, "draft": {k: v for k, v in draft.items() if k != "_id"}}


# ============================================
# ARTICLE REVIEW WORKFLOW (Teacher/Admin)
# ============================================

@api_router.get("/magazine/pending-reviews")
async def get_pending_article_reviews(
    current_user: User = Depends(get_current_teacher)
):
    """Get pending student articles for review (Teacher/Admin only)"""
    # Get articles that are pending review (not approved and not rejected)
    pending = await db.magazine_articles.find(
        {
            "type": "student",
            "$or": [
                {"status": "pending"},
                {"status": {"$exists": False}, "approved": False}
            ]
        },
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return {"articles": pending}


@api_router.get("/magazine/all-submissions")
async def get_all_article_submissions(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_teacher)
):
    """Get all student article submissions (Teacher/Admin only)"""
    query = {"type": "student"}
    if status:
        if status == "pending":
            query["$or"] = [
                {"status": "pending"},
                {"status": {"$exists": False}, "approved": False}
            ]
        elif status == "approved":
            query["$or"] = [{"status": "approved"}, {"approved": True}]
        elif status == "rejected":
            query["status"] = "rejected"
    
    articles = await db.magazine_articles.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
    
    # Count by status
    total_pending = await db.magazine_articles.count_documents({
        "type": "student",
        "$or": [{"status": "pending"}, {"status": {"$exists": False}, "approved": False}]
    })
    total_approved = await db.magazine_articles.count_documents({
        "type": "student",
        "$or": [{"status": "approved"}, {"approved": True}]
    })
    total_rejected = await db.magazine_articles.count_documents({
        "type": "student",
        "status": "rejected"
    })
    
    return {
        "articles": articles,
        "stats": {
            "pending": total_pending,
            "approved": total_approved,
            "rejected": total_rejected,
            "total": total_pending + total_approved + total_rejected
        }
    }


@api_router.post("/magazine/review/{article_id}")
async def review_article(
    article_id: str,
    review_data: dict,
    current_user: User = Depends(get_current_teacher)
):
    """Approve or reject a student article (Teacher/Admin only)"""
    action = review_data.get("action")  # "approve" or "reject"
    feedback = review_data.get("feedback", "")
    edited_content = review_data.get("edited_content")
    edited_title = review_data.get("edited_title")
    
    if action not in ["approve", "reject"]:
        raise HTTPException(status_code=400, detail="Action must be 'approve' or 'reject'")
    
    # Get article first to get author info
    article = await db.magazine_articles.find_one({"id": article_id}, {"_id": 0})
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    update_fields = {
        "status": "approved" if action == "approve" else "rejected",
        "approved": action == "approve",
        "reviewed_by": current_user.id,
        "reviewer_name": current_user.full_name,
        "review_feedback": feedback,
        "reviewed_at": datetime.utcnow().isoformat()
    }
    
    # If approved with edits, update content
    final_title = article.get("title")
    if action == "approve":
        if edited_content:
            update_fields["content"] = edited_content
            update_fields["summary"] = edited_content[:200] + "..." if len(edited_content) > 200 else edited_content
        if edited_title:
            update_fields["title"] = edited_title
            final_title = edited_title
        update_fields["published_at"] = datetime.utcnow().isoformat()
    
    result = await db.magazine_articles.update_one(
        {"id": article_id},
        {"$set": update_fields}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Article not found")
    
    # Send email notification to the student author
    author_id = article.get("author_id")
    notifications_sent = {"student": False, "parents": []}
    
    if author_id:
        author = await db.users.find_one({"id": author_id}, {"_id": 0, "email": 1, "full_name": 1})
        if author and author.get("email"):
            try:
                await send_article_review_notification(
                    student_email=author.get("email"),
                    student_name=author.get("full_name", "Student"),
                    article_title=final_title,
                    action=action,
                    feedback=feedback,
                    reviewer_name=current_user.full_name
                )
                notifications_sent["student"] = True
                logger.info(f"Article review notification sent to {author.get('email')}")
            except Exception as e:
                logger.error(f"Failed to send article review notification: {str(e)}")
        
        # Send parent notification for APPROVED articles only
        if action == "approve":
            try:
                # Find linked parents
                parent_links = await db.parent_child_links.find({"child_id": author_id}).to_list(10)
                for link in parent_links:
                    parent = await db.users.find_one({"id": link.get("parent_id")}, {"_id": 0, "email": 1, "full_name": 1})
                    if parent and parent.get("email"):
                        try:
                            await send_parent_article_notification(
                                parent_email=parent.get("email"),
                                parent_name=parent.get("full_name", "Parent"),
                                student_name=author.get("full_name", "Your child"),
                                article_title=final_title
                            )
                            notifications_sent["parents"].append(parent.get("email"))
                            logger.info(f"Parent article notification sent to {parent.get('email')}")
                        except Exception as e:
                            logger.error(f"Failed to send parent notification: {str(e)}")
            except Exception as e:
                logger.error(f"Error finding parent links: {str(e)}")
    
    # Get updated article
    updated_article = await db.magazine_articles.find_one({"id": article_id}, {"_id": 0})
    
    return {
        "success": True,
        "message": f"Article {'approved and published' if action == 'approve' else 'rejected'}",
        "article": updated_article,
        "notifications_sent": notifications_sent
    }


@api_router.get("/magazine/article/{article_id}")
async def get_article_details(
    article_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get detailed article information"""
    article = await db.magazine_articles.find_one({"id": article_id}, {"_id": 0})
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return {"article": article}


# ============================================
# BATCH SHOWCASE ENDPOINTS
# ============================================

@api_router.get("/batch-showcase/batches")
async def get_custom_batches(current_user: User = Depends(get_current_user)):
    """Get all custom batches"""
    batches = await db.custom_batches.find({}, {"_id": 0}).to_list(100)
    return {"batches": batches}


@api_router.post("/batch-showcase/create-batch")
async def create_custom_batch(
    batch_data: dict,
    current_user: User = Depends(get_current_teacher)
):
    """Create a new custom batch (Teacher/Admin only)"""
    batch = {
        "id": f"custom-{str(uuid.uuid4())[:8]}",
        "name": batch_data.get("name"),
        "description": batch_data.get("description", ""),
        "created_by": current_user.id,
        "created_at": datetime.utcnow().isoformat(),
        "isCustom": True,
        "color": "from-violet-400 to-purple-500"
    }
    
    await db.custom_batches.insert_one(batch)
    return {"success": True, "batch": {k: v for k, v in batch.items() if k != "_id"}}


@api_router.get("/batch-showcase/{batch_id}/items")
async def get_batch_showcase_items(
    batch_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get showcase items for a specific batch"""
    items = await db.batch_showcase.find(
        {"batch_id": batch_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return {"items": items}


@api_router.post("/batch-showcase/upload")
async def upload_batch_showcase_item(
    title: str = Form(...),
    description: str = Form(""),
    category: str = Form("art"),
    project_type: str = Form("individual"),
    batch_id: str = Form(...),
    group_members: str = Form(""),
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload work to a batch showcase"""
    import base64
    
    # Read and encode image
    content = await image.read()
    base64_image = base64.b64encode(content).decode('utf-8')
    image_data_url = f"data:{image.content_type};base64,{base64_image}"
    
    # Parse group members
    members_list = [m.strip() for m in group_members.split(',') if m.strip()] if group_members else []
    
    item = {
        "id": str(uuid.uuid4()),
        "title": title,
        "description": description,
        "category": category,
        "project_type": project_type,
        "batch_id": batch_id,
        "group_members": members_list,
        "image_url": image_data_url,
        "student_id": current_user.id,
        "student_name": current_user.full_name,
        "student_index": getattr(current_user, 'student_index', ''),
        "likes": 0,
        "comments": 0,
        "created_at": datetime.utcnow().strftime("%Y-%m-%d"),
        "created_by_role": current_user.role
    }
    
    await db.batch_showcase.insert_one(item)
    return {"success": True, "item": {k: v for k, v in item.items() if k != "_id"}}


@api_router.post("/batch-showcase/{item_id}/like")
async def like_batch_showcase_item(
    item_id: str,
    current_user: User = Depends(get_current_user)
):
    """Like a batch showcase item"""
    result = await db.batch_showcase.update_one(
        {"id": item_id},
        {"$inc": {"likes": 1}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    
    return {"success": True}


# ============================================
# REFERRAL SYSTEM ENDPOINTS
# ============================================

@api_router.get("/referral/my-referrals")
async def get_my_referrals(current_user: User = Depends(get_current_user)):
    """Get current user's referral data and history"""
    
    # Get or create referral code for user
    referral_code = getattr(current_user, 'student_index', None) or f"TEC-{current_user.id[:6].upper()}"
    
    # Check if user has referral record
    referral_record = await db.referrals.find_one({"user_id": current_user.id}, {"_id": 0})
    
    if not referral_record:
        # Create initial referral record
        referral_record = {
            "user_id": current_user.id,
            "referral_code": referral_code,
            "total_referrals": 0,
            "successful_referrals": 0,
            "pending_referrals": 0,
            "rewards_earned": 0,
            "months_free": 0,
            "created_at": datetime.utcnow().isoformat()
        }
        await db.referrals.insert_one(referral_record)
        referral_record = {k: v for k, v in referral_record.items() if k != "_id"}
    
    # Get referral history
    referral_history = await db.referral_history.find(
        {"referrer_id": current_user.id},
        {"_id": 0}
    ).sort("date", -1).to_list(50)
    
    # Generate referral link
    frontend_url = os.environ.get("FRONTEND_URL", "https://tecaikids.com")
    referral_link = f"{frontend_url}/register?ref={referral_code}"
    
    return {
        **referral_record,
        "referral_link": referral_link,
        "referral_history": referral_history
    }


@api_router.post("/referral/apply-code")
async def apply_referral_code(
    referral_data: dict,
    current_user: User = Depends(get_current_user)
):
    """Apply a referral code during/after registration"""
    referral_code = referral_data.get("code", "").strip().upper()
    
    if not referral_code:
        raise HTTPException(status_code=400, detail="Referral code is required")
    
    # Check if user already used a referral code
    existing = await db.referral_history.find_one({
        "referred_user_id": current_user.id
    })
    if existing:
        raise HTTPException(status_code=400, detail="You have already used a referral code")
    
    # Find referrer by code
    referrer = await db.users.find_one({
        "$or": [
            {"student_index": referral_code},
            {"referral_code": referral_code}
        ]
    }, {"_id": 0})
    
    # Also check referrals collection
    if not referrer:
        referral_record = await db.referrals.find_one({"referral_code": referral_code})
        if referral_record:
            referrer = await db.users.find_one({"id": referral_record.get("user_id")}, {"_id": 0})
    
    if not referrer:
        raise HTTPException(status_code=404, detail="Invalid referral code")
    
    if referrer.get("id") == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot use your own referral code")
    
    # Create referral history entry
    history_entry = {
        "id": str(uuid.uuid4()),
        "referrer_id": referrer.get("id"),
        "referrer_name": referrer.get("full_name"),
        "referred_user_id": current_user.id,
        "referred_name": current_user.full_name,
        "referral_code": referral_code,
        "status": "pending",
        "reward": "1 month free",
        "date": datetime.utcnow().strftime("%Y-%m-%d"),
        "created_at": datetime.utcnow().isoformat()
    }
    
    await db.referral_history.insert_one(history_entry)
    
    # Update referrer's stats
    await db.referrals.update_one(
        {"user_id": referrer.get("id")},
        {
            "$inc": {"total_referrals": 1, "pending_referrals": 1},
            "$setOnInsert": {
                "referral_code": referral_code,
                "successful_referrals": 0,
                "rewards_earned": 0,
                "months_free": 0
            }
        },
        upsert=True
    )
    
    return {
        "success": True,
        "message": "Referral code applied! You'll receive benefits after enrollment completion.",
        "referrer_name": referrer.get("full_name")
    }


@api_router.post("/referral/complete/{referral_id}")
async def complete_referral(
    referral_id: str,
    current_user: User = Depends(get_current_teacher)
):
    """Mark a referral as complete and award rewards (Admin only)"""
    
    # Find the referral history entry
    referral = await db.referral_history.find_one({"id": referral_id})
    
    if not referral:
        raise HTTPException(status_code=404, detail="Referral not found")
    
    if referral.get("status") == "completed":
        raise HTTPException(status_code=400, detail="Referral already completed")
    
    # Update referral status
    await db.referral_history.update_one(
        {"id": referral_id},
        {"$set": {"status": "completed", "completed_at": datetime.utcnow().isoformat()}}
    )
    
    # Update referrer stats and award free month
    await db.referrals.update_one(
        {"user_id": referral.get("referrer_id")},
        {
            "$inc": {
                "successful_referrals": 1,
                "pending_referrals": -1,
                "rewards_earned": 1,
                "months_free": 1
            }
        }
    )
    
    return {"success": True, "message": "Referral completed and reward granted!"}


@api_router.get("/referral/validate/{code}")
async def validate_referral_code(code: str):
    """Validate if a referral code exists (public endpoint for registration)"""
    code = code.strip().upper()
    
    # Check in users (student_index)
    user = await db.users.find_one({
        "$or": [
            {"student_index": code},
            {"referral_code": code}
        ]
    }, {"_id": 0, "full_name": 1})
    
    if not user:
        # Check in referrals collection
        referral = await db.referrals.find_one({"referral_code": code})
        if referral:
            user = await db.users.find_one({"id": referral.get("user_id")}, {"_id": 0, "full_name": 1})
    
    if user:
        return {"valid": True, "referrer_name": user.get("full_name", "TecAI Member")}
    
    return {"valid": False}


# ============================================
# LEADERBOARD ENDPOINTS
# ============================================

@api_router.get("/leaderboard")
async def get_leaderboard(
    period: str = "weekly",  # weekly, monthly, all_time
    age_group: Optional[str] = None,
    limit: int = 20,
    current_user: User = Depends(get_current_user)
):
    """Get leaderboard rankings - Combined score (XP + badges + activity)
    Visible to students and parents only"""
    
    # Verify user is student or parent
    if current_user.role not in ["student", "parent"]:
        raise HTTPException(status_code=403, detail="Leaderboard is only accessible to students and parents")
    
    # Calculate date range
    now = datetime.now(timezone.utc)
    if period == "weekly":
        start_date = now - timedelta(days=7)
    elif period == "monthly":
        start_date = now - timedelta(days=30)
    else:
        start_date = None  # All time
    
    # Build query for students
    query = {"role": "student", "is_active": True}
    if age_group:
        query["age_group"] = age_group
    
    # Get all students
    students = await db.users.find(query, {"_id": 0}).to_list(500)
    
    leaderboard_data = []
    
    for student in students:
        student_id = student.get("id")
        
        # Get gamification stats
        gamification = await db.gamification.find_one({"user_id": student_id}, {"_id": 0})
        xp = gamification.get("xp", 0) if gamification else 0
        badges_count = len(gamification.get("badges", [])) if gamification else 0
        streak = gamification.get("streak", 0) if gamification else 0
        
        # Get showcase likes (activity metric)
        showcase_likes = await db.showcase.aggregate([
            {"$match": {"author_id": student_id}},
            {"$group": {"_id": None, "total_likes": {"$sum": "$likes"}}}
        ]).to_list(1)
        total_likes = showcase_likes[0]["total_likes"] if showcase_likes else 0
        
        # Get article contributions
        articles_count = await db.magazine_articles.count_documents({
            "author_id": student_id,
            "approved": True
        })
        
        # Calculate combined score
        # XP (weight: 1) + Badges (weight: 50 each) + Streak (weight: 10) + Likes (weight: 5) + Articles (weight: 30)
        combined_score = xp + (badges_count * 50) + (streak * 10) + (total_likes * 5) + (articles_count * 30)
        
        leaderboard_data.append({
            "student_id": student_id,
            "student_name": student.get("full_name", "Unknown"),
            "student_index": student.get("student_index"),
            "age_group": student.get("age_group"),
            "country": student.get("country", "International"),
            "photo_url": student.get("photo_url"),
            "photo_type": student.get("photo_type", "initials"),
            "xp": xp,
            "badges_count": badges_count,
            "streak": streak,
            "showcase_likes": total_likes,
            "articles_published": articles_count,
            "combined_score": combined_score,
            "level": get_level_from_xp(xp)
        })
    
    # Sort by combined score
    leaderboard_data.sort(key=lambda x: x["combined_score"], reverse=True)
    
    # Add rank
    for i, entry in enumerate(leaderboard_data):
        entry["rank"] = i + 1
    
    # Get current user's rank (if student)
    my_rank = None
    if current_user.role == "student":
        for entry in leaderboard_data:
            if entry["student_id"] == current_user.id:
                my_rank = entry
                break
    
    return {
        "leaderboard": leaderboard_data[:limit],
        "my_rank": my_rank,
        "period": period,
        "age_group": age_group,
        "total_students": len(leaderboard_data)
    }


# ============================================
# CLASS SCHEDULING ENDPOINTS
# ============================================

@api_router.get("/classes/schedule")
async def get_class_schedule(
    age_group: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """Get scheduled classes"""
    query = {}
    if age_group:
        query["age_group"] = age_group
    
    classes = await db.scheduled_classes.find(query, {"_id": 0}).sort("date", 1).to_list(100)
    return {"classes": classes}

@api_router.post("/classes/create")
async def create_scheduled_class(
    class_data: dict,
    current_user: User = Depends(get_current_teacher)
):
    """Create a new scheduled class"""
    new_class = {
        "id": str(uuid.uuid4()),
        "title": class_data.get("title"),
        "description": class_data.get("description", ""),
        "age_group": class_data.get("age_group", "10-12"),
        "date": class_data.get("date"),
        "time": class_data.get("time"),
        "duration": class_data.get("duration", 60),
        "zoom_link": class_data.get("zoom_link", ""),
        "zoom_meeting_id": class_data.get("zoom_meeting_id", ""),
        "zoom_password": class_data.get("zoom_password", ""),
        "max_students": class_data.get("max_students", 30),
        "enrolled_count": 0,
        "enrolled_students": [],
        "teacher_id": current_user.id,
        "teacher_name": current_user.full_name,
        "status": "scheduled",
        "created_at": datetime.utcnow().isoformat()
    }
    
    await db.scheduled_classes.insert_one(new_class)
    return {"success": True, "class": {k: v for k, v in new_class.items() if k != "_id"}}

@api_router.delete("/classes/{class_id}")
async def delete_scheduled_class(
    class_id: str,
    current_user: User = Depends(get_current_teacher)
):
    """Delete a scheduled class"""
    result = await db.scheduled_classes.delete_one({"id": class_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Class not found")
    return {"success": True}

@api_router.post("/classes/{class_id}/remind")
async def send_class_reminder(
    class_id: str,
    reminder_data: dict,
    current_user: User = Depends(get_current_teacher)
):
    """Send reminder for a scheduled class"""
    cls = await db.scheduled_classes.find_one({"id": class_id})
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    
    reminder_type = reminder_data.get("type", "both")
    
    # Get enrolled students
    enrolled_ids = cls.get("enrolled_students", [])
    students = await db.users.find(
        {"id": {"$in": enrolled_ids}},
        {"_id": 0, "email": 1, "phone": 1, "full_name": 1}
    ).to_list(100)
    
    # Also get students in the age group if no specific enrollment
    if not students:
        students = await db.users.find(
            {"age_group": cls.get("age_group"), "role": "student"},
            {"_id": 0, "email": 1, "phone": 1, "full_name": 1}
        ).to_list(50)
    
    sent_count = {"email": 0, "whatsapp": 0}
    
    # Send reminders based on type
    if reminder_type in ["email", "both"]:
        for student in students:
            if student.get("email"):
                # Use existing email function
                try:
                    await send_certificate_email(
                        student["email"],
                        student.get("full_name", "Student"),
                        {
                            "certificate_type": "Class Reminder",
                            "course_name": cls.get("title"),
                            "certificate_number": f"Class on {cls.get('date')} at {cls.get('time')}",
                            "issued_date": cls.get("date"),
                            "issued_by": cls.get("teacher_name"),
                            "id": class_id
                        },
                        os.environ.get("FRONTEND_URL", "https://tecaikids.com")
                    )
                    sent_count["email"] += 1
                except Exception as e:
                    logging.error(f"Failed to send email: {e}")
    
    return {
        "success": True,
        "sent": sent_count,
        "message": f"Reminders sent to {sent_count['email']} via email"
    }

@api_router.post("/classes/{class_id}/enroll")
async def enroll_in_class(
    class_id: str,
    current_user: User = Depends(get_current_user)
):
    """Enroll current user in a class"""
    cls = await db.scheduled_classes.find_one({"id": class_id})
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    
    if cls.get("enrolled_count", 0) >= cls.get("max_students", 30):
        raise HTTPException(status_code=400, detail="Class is full")
    
    if current_user.id in cls.get("enrolled_students", []):
        raise HTTPException(status_code=400, detail="Already enrolled")
    
    await db.scheduled_classes.update_one(
        {"id": class_id},
        {
            "$push": {"enrolled_students": current_user.id},
            "$inc": {"enrolled_count": 1}
        }
    )
    
    return {"success": True, "message": "Enrolled successfully"}

# Health check endpoint at root level (required for Kubernetes)
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "tecaikids-backend"}

@app.get("/")
async def app_root():
    return {"status": "ok", "message": "TEC AI Kids API"}

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

# ============ WhatsApp Notification Endpoints ============

class WhatsAppNotificationRequest(BaseModel):
    phone_number: str
    message_type: str  # enrollment, welcome, reminder, progress, subscription
    parent_name: str
    student_name: Optional[str] = None
    course_name: Optional[str] = None
    age_group: Optional[str] = None
    lesson_title: Optional[str] = None
    scheduled_time: Optional[str] = None
    plan_name: Optional[str] = None
    amount: Optional[str] = None

class CustomWhatsAppMessage(BaseModel):
    phone_number: str
    message: str

@api_router.post("/whatsapp/send-notification")
async def send_whatsapp_notification(
    request: WhatsAppNotificationRequest,
    current_user: User = Depends(get_current_user)
):
    """Send WhatsApp notification to a parent (Admin/Teacher only)"""
    if current_user.role not in ["admin", "teacher"]:
        raise HTTPException(status_code=403, detail="Only admin/teacher can send notifications")
    
    result = None
    
    if request.message_type == "enrollment":
        result = await notify_enrollment(
            parent_phone=request.phone_number,
            parent_name=request.parent_name,
            student_name=request.student_name or "Student",
            course_name=request.course_name or "TEC Course",
            age_group=request.age_group or "Not specified"
        )
    elif request.message_type == "welcome":
        result = await notify_welcome(
            parent_phone=request.phone_number,
            parent_name=request.parent_name,
            student_name=request.student_name or "Student"
        )
    elif request.message_type == "reminder":
        result = await notify_class_reminder(
            parent_phone=request.phone_number,
            parent_name=request.parent_name,
            student_name=request.student_name or "Student",
            course_name=request.course_name or "TEC Course",
            lesson_title=request.lesson_title or "Upcoming Lesson",
            scheduled_time=request.scheduled_time
        )
    elif request.message_type == "subscription":
        result = await notify_subscription(
            parent_phone=request.phone_number,
            parent_name=request.parent_name,
            plan_name=request.plan_name or "Premium Plan",
            amount=request.amount or "LKR 0"
        )
    else:
        raise HTTPException(status_code=400, detail="Invalid message type")
    
    return result

@api_router.post("/whatsapp/send-custom")
async def send_custom_whatsapp_message(
    request: CustomWhatsAppMessage,
    current_user: User = Depends(get_current_user)
):
    """Send custom WhatsApp message (Admin only)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can send custom messages")
    
    result = await send_whatsapp_message(request.phone_number, request.message)
    return result

@api_router.get("/whatsapp/templates")
async def get_whatsapp_templates():
    """Get available WhatsApp message templates"""
    return {
        "templates": [
            {
                "type": "enrollment",
                "name": "Enrollment Confirmation",
                "description": "Sent when a student is enrolled in a course",
                "required_fields": ["parent_name", "student_name", "course_name", "age_group"]
            },
            {
                "type": "welcome",
                "name": "Welcome Message",
                "description": "Sent to new users after registration",
                "required_fields": ["parent_name", "student_name"]
            },
            {
                "type": "reminder",
                "name": "Class Reminder",
                "description": "Sent before a scheduled class/lesson",
                "required_fields": ["parent_name", "student_name", "course_name", "lesson_title"]
            },
            {
                "type": "subscription",
                "name": "Subscription Success",
                "description": "Sent when subscription is activated",
                "required_fields": ["parent_name", "plan_name", "amount"]
            }
        ]
    }

# ============ Scheduled Lessons & Reminders Endpoints ============

class ScheduleLessonRequest(BaseModel):
    student_id: str
    course_id: str
    lesson_title: str
    scheduled_time: str  # ISO format datetime
    parent_phone: Optional[str] = None
    parent_name: Optional[str] = None

@api_router.post("/lessons/schedule")
async def create_scheduled_lesson(
    request: ScheduleLessonRequest,
    current_user: User = Depends(get_current_user)
):
    """Schedule a lesson for a student (Teacher/Admin only)"""
    if current_user.role not in ["admin", "teacher"]:
        raise HTTPException(status_code=403, detail="Only teachers/admins can schedule lessons")
    
    try:
        # Parse the scheduled time
        scheduled_dt = datetime.fromisoformat(request.scheduled_time.replace('Z', '+00:00'))
        
        # Ensure it's in the future
        now = datetime.now(timezone.utc)
        if scheduled_dt <= now:
            raise HTTPException(status_code=400, detail="Scheduled time must be in the future")
        
        # Get student info for parent details if not provided
        student = await db.users.find_one({"id": request.student_id})
        parent_phone = request.parent_phone
        parent_name = request.parent_name
        
        if student and not parent_phone:
            parent_phone = student.get("parent_phone") or student.get("phone")
        if student and not parent_name:
            parent_name = student.get("parent_name") or "Parent"
        
        lesson = await schedule_lesson(
            db=db,
            student_id=request.student_id,
            course_id=request.course_id,
            lesson_title=request.lesson_title,
            scheduled_time=scheduled_dt,
            parent_phone=parent_phone,
            parent_name=parent_name
        )
        
        return {
            "success": True,
            "lesson": lesson,
            "reminder_time": (scheduled_dt - timedelta(hours=1)).isoformat(),
            "message": f"Lesson scheduled. Reminder will be sent 1 hour before at {(scheduled_dt - timedelta(hours=1)).strftime('%I:%M %p')}"
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid datetime format: {str(e)}")

@api_router.get("/lessons/upcoming")
async def get_student_upcoming_lessons(
    student_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get upcoming scheduled lessons"""
    # Students can only see their own lessons
    if current_user.role == "student":
        student_id = current_user.id
    
    lessons = await get_upcoming_lessons(db, student_id=student_id)
    return {"lessons": lessons, "count": len(lessons)}

@api_router.delete("/lessons/{lesson_id}")
async def cancel_lesson(
    lesson_id: str,
    current_user: User = Depends(get_current_user)
):
    """Cancel a scheduled lesson (Teacher/Admin only)"""
    if current_user.role not in ["admin", "teacher"]:
        raise HTTPException(status_code=403, detail="Only teachers/admins can cancel lessons")
    
    success = await cancel_scheduled_lesson(db, lesson_id)
    if not success:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    return {"success": True, "message": "Lesson cancelled"}

@api_router.get("/lessons/reminder-status")
async def get_reminder_status(
    current_user: User = Depends(get_current_user)
):
    """Get reminder service status and recent notifications (Admin only)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    # Get recent notification logs
    recent_logs = await db.notification_logs.find(
        {"type": "class_reminder"},
        {"_id": 0}
    ).sort("sent_at", -1).limit(10).to_list(length=10)
    
    # Get pending lessons (scheduled but not reminded)
    pending_count = await db.scheduled_lessons.count_documents({
        "status": "scheduled",
        "reminder_sent": {"$ne": True},
        "scheduled_time": {"$gte": datetime.now(timezone.utc).isoformat()}
    })
    
    return {
        "service_status": "active",
        "check_interval": "5 minutes",
        "reminder_advance": "1 hour before lesson",
        "pending_reminders": pending_count,
        "recent_notifications": recent_logs
    }

# Quick schedule endpoint for testing
@api_router.post("/lessons/quick-schedule")
async def quick_schedule_lesson(
    request: dict,
    current_user: User = Depends(get_current_user)
):
    """Quick schedule a lesson with minutes from now (for testing)"""
    if current_user.role not in ["admin", "teacher"]:
        raise HTTPException(status_code=403, detail="Only teachers/admins can schedule lessons")
    
    minutes_from_now = request.get("minutes_from_now", 65)  # Default 65 mins (will trigger reminder)
    student_email = request.get("student_email")
    course_name = request.get("course_name", "Test Course")
    lesson_title = request.get("lesson_title", "Test Lesson")
    parent_phone = request.get("parent_phone")
    parent_name = request.get("parent_name", "Test Parent")
    
    # Find student by email
    student = await db.users.find_one({"email": student_email})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    scheduled_time = datetime.now(timezone.utc) + timedelta(minutes=minutes_from_now)
    
    # Find or create a test course
    course = await db.courses.find_one({"title": course_name})
    if not course:
        course = {
            "id": str(uuid.uuid4()),
            "title": course_name,
            "description": "Test course for scheduling"
        }
        await db.courses.insert_one(course)
    
    lesson = await schedule_lesson(
        db=db,
        student_id=student["id"],
        course_id=course["id"],
        lesson_title=lesson_title,
        scheduled_time=scheduled_time,
        parent_phone=parent_phone or student.get("phone"),
        parent_name=parent_name
    )
    
    reminder_time = scheduled_time - timedelta(hours=1)
    
    return {
        "success": True,
        "lesson": lesson,
        "scheduled_time": scheduled_time.isoformat(),
        "reminder_will_send_at": reminder_time.isoformat() if reminder_time > datetime.now(timezone.utc) else "Immediately (less than 1 hour away)",
        "message": f"Lesson scheduled for {minutes_from_now} minutes from now"
    }

# ============ Progress Report Endpoints ============

@api_router.get("/progress/weekly/{student_id}")
async def get_weekly_progress(
    student_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get weekly progress for a student"""
    # Students can only view their own progress
    if current_user.role == "student" and current_user.id != student_id:
        raise HTTPException(status_code=403, detail="Cannot view other students' progress")
    
    now = datetime.now(timezone.utc)
    week_start = now - timedelta(days=7)
    
    progress = await get_student_weekly_progress(student_id, week_start, now)
    return progress

@api_router.get("/progress/all-time/{student_id}")
async def get_all_time_progress(
    student_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get all-time progress statistics for a student"""
    if current_user.role == "student" and current_user.id != student_id:
        raise HTTPException(status_code=403, detail="Cannot view other students' progress")
    
    progress = await get_student_all_time_progress(db, student_id)
    return progress

@api_router.post("/progress/send-report/{student_id}")
async def send_manual_progress_report(
    student_id: str,
    current_user: User = Depends(get_current_user)
):
    """Manually trigger a progress report for a student (Teacher/Admin only)"""
    if current_user.role not in ["admin", "teacher"]:
        raise HTTPException(status_code=403, detail="Only teachers/admins can send progress reports")
    
    result = await trigger_manual_progress_report(db, notify_progress_report, student_id)
    return result

@api_router.post("/progress/record-video")
async def record_video_watch_progress(
    request: dict,
    current_user: User = Depends(get_current_user)
):
    """Record video watching progress"""
    await record_video_progress(
        db=db,
        user_id=current_user.id,
        video_id=request.get("video_id"),
        course_id=request.get("course_id"),
        watch_time=request.get("watch_time", 0),
        completed=request.get("completed", False)
    )
    return {"success": True, "message": "Progress recorded"}

@api_router.get("/progress/report-schedule")
async def get_progress_report_schedule(
    current_user: User = Depends(get_current_user)
):
    """Get progress report schedule info (Admin only)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    # Get recent progress reports sent
    recent_reports = await db.notification_logs.find(
        {"type": {"$in": ["weekly_progress", "manual_progress"]}},
        {"_id": 0}
    ).sort("sent_at", -1).limit(20).to_list(length=20)
    
    return {
        "schedule": "Every Sunday at 6 PM UTC (11:30 PM Sri Lanka time)",
        "report_type": "Weekly progress summary",
        "includes": [
            "Videos watched and completed",
            "Workouts completed with scores",
            "Classes attended",
            "Skills developed",
            "Achievements earned",
            "Engagement level assessment"
        ],
        "recent_reports_count": len(recent_reports),
        "recent_reports": recent_reports[:5]
    }

@api_router.get("/progress/students-list")
async def get_students_for_progress(
    current_user: User = Depends(get_current_user)
):
    """Get list of students with progress summary (Teacher/Admin only)"""
    if current_user.role not in ["admin", "teacher"]:
        raise HTTPException(status_code=403, detail="Only teachers/admins can view student list")
    
    students = await db.users.find(
        {"role": "student"},
        {"_id": 0, "password": 0}
    ).to_list(length=100)
    
    # Add progress summary for each student
    now = datetime.now(timezone.utc)
    week_start = now - timedelta(days=7)
    
    students_with_progress = []
    for student in students:
        progress = await get_student_weekly_progress(student["id"], week_start, now)
        students_with_progress.append({
            "id": student["id"],
            "full_name": student.get("full_name", "Unknown"),
            "email": student.get("email"),
            "parent_phone": student.get("parent_phone") or student.get("phone"),
            "age_group": student.get("age_group"),
            "weekly_progress": {
                "total_activities": progress["total_activities"],
                "engagement_level": progress["engagement_level"],
                "videos_completed": progress["videos_completed"],
                "workouts_completed": progress["workouts_completed"]
            }
        })
    
    return {"students": students_with_progress, "count": len(students_with_progress)}

# ============================================
# AI CHAT ROUTES
# ============================================

@api_router.post("/ai-chat/session")
async def create_ai_chat_session(
    request: dict,
    current_user: User = Depends(get_current_user)
):
    """Create a new AI chat session"""
    model_provider = request.get("model_provider", "anthropic")  # anthropic or gemini
    subject = request.get("subject")
    
    session_id = await ai_chat_service.create_session(
        student_id=current_user.id,
        learning_level=current_user.learning_level or "development",
        model_provider=model_provider,
        subject=subject
    )
    
    # Log activity
    await log_activity(
        current_user.id,
        ActivityType.LOGIN,
        {"action": "ai_chat_started", "model": model_provider}
    )
    
    return {
        "session_id": session_id,
        "model_provider": model_provider,
        "message": "Chat session created successfully"
    }

@api_router.post("/ai-chat/message")
async def send_ai_chat_message(
    request: dict,
    current_user: User = Depends(get_current_user)
):
    """Send a message to AI tutor and get response"""
    session_id = request.get("session_id")
    message = request.get("message")
    
    if not session_id or not message:
        raise HTTPException(status_code=400, detail="session_id and message are required")
    
    result = await ai_chat_service.send_message(
        session_id=session_id,
        message=message,
        student_name=current_user.full_name
    )
    
    # Update gamification stats
    await update_gamification_stats(current_user.id, "ai_message")
    
    # Store message in database for history
    chat_log = {
        "id": str(uuid.uuid4()),
        "session_id": session_id,
        "user_id": current_user.id,
        "user_message": message,
        "ai_response": result.get("response", ""),
        "timestamp": datetime.now(timezone.utc)
    }
    await db.ai_chat_logs.insert_one(chat_log)
    
    return result

@api_router.get("/ai-chat/history/{session_id}")
async def get_ai_chat_history(
    session_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get chat history for a session"""
    messages = await db.ai_chat_logs.find(
        {"session_id": session_id, "user_id": current_user.id},
        {"_id": 0}
    ).sort("timestamp", 1).to_list(length=100)
    
    return {"messages": messages, "session_id": session_id}

@api_router.post("/ai-chat/end-session")
async def end_ai_chat_session(
    request: dict,
    current_user: User = Depends(get_current_user)
):
    """End a chat session"""
    session_id = request.get("session_id")
    if session_id:
        ai_chat_service.end_session(session_id)
    return {"message": "Session ended"}

# ============================================
# GAMIFICATION ROUTES
# ============================================

async def update_gamification_stats(user_id: str, action: str):
    """Update gamification stats for a user action"""
    stats = await db.gamification_stats.find_one({"student_id": user_id})
    
    if not stats:
        # Create initial stats
        new_stats = GamificationStats(student_id=user_id).dict()
        await db.gamification_stats.insert_one(new_stats)
        stats = new_stats
    
    # Get points for action
    points = POINT_REWARDS.get(action, 5)
    
    update_data = {
        "total_points": stats.get("total_points", 0) + points,
        "total_xp": stats.get("total_xp", 0) + points,
        "updated_at": datetime.now(timezone.utc)
    }
    
    # Update action-specific counters
    if action == "ai_message" or action == "ai_chat_message":
        update_data["ai_messages_sent"] = stats.get("ai_messages_sent", 0) + 1
    elif action == "quiz_complete":
        update_data["quizzes_completed"] = stats.get("quizzes_completed", 0) + 1
    elif action == "video_watched":
        update_data["videos_watched"] = stats.get("videos_watched", 0) + 1
    elif action == "lesson_complete":
        update_data["lessons_completed"] = stats.get("lessons_completed", 0) + 1
    elif action == "workout_complete":
        update_data["workouts_completed"] = stats.get("workouts_completed", 0) + 1
    
    # Calculate new level
    new_total_xp = update_data["total_xp"]
    update_data["level"] = get_level_from_xp(new_total_xp)
    
    # Update streak
    today = datetime.now(timezone.utc).date()
    last_activity = stats.get("last_activity_date")
    if last_activity:
        if isinstance(last_activity, str):
            last_date = datetime.fromisoformat(last_activity.replace("Z", "+00:00")).date()
        else:
            last_date = last_activity.date()
        
        if (today - last_date).days == 1:
            update_data["current_streak"] = stats.get("current_streak", 0) + 1
        elif (today - last_date).days > 1:
            update_data["current_streak"] = 1
    else:
        update_data["current_streak"] = 1
    
    update_data["last_activity_date"] = datetime.now(timezone.utc)
    
    # Check longest streak
    if update_data.get("current_streak", 0) > stats.get("longest_streak", 0):
        update_data["longest_streak"] = update_data["current_streak"]
    
    await db.gamification_stats.update_one(
        {"student_id": user_id},
        {"$set": update_data}
    )
    
    return update_data

async def check_and_award_badges(user_id: str):
    """Check if user earned any new badges"""
    stats = await db.gamification_stats.find_one({"student_id": user_id})
    if not stats:
        return []
    
    earned_badges = stats.get("badges_earned", [])
    new_badges = []
    
    # Check each badge condition
    badge_conditions = {
        BadgeType.FIRST_LESSON.value: stats.get("lessons_completed", 0) >= 1,
        BadgeType.STREAK_3.value: stats.get("current_streak", 0) >= 3,
        BadgeType.STREAK_7.value: stats.get("current_streak", 0) >= 7,
        BadgeType.STREAK_30.value: stats.get("current_streak", 0) >= 30,
        BadgeType.AI_EXPLORER.value: stats.get("ai_messages_sent", 0) >= 10,
        BadgeType.CHAT_CHAMPION.value: stats.get("ai_messages_sent", 0) >= 50,
        BadgeType.QUIZ_WIZARD.value: stats.get("quizzes_completed", 0) >= 10,
        BadgeType.VIDEO_VIEWER.value: stats.get("videos_watched", 0) >= 20,
        BadgeType.LEVEL_5.value: stats.get("level", 1) >= 5,
        BadgeType.LEVEL_10.value: stats.get("level", 1) >= 10,
        BadgeType.LEVEL_25.value: stats.get("level", 1) >= 25,
        BadgeType.LEVEL_50.value: stats.get("level", 1) >= 50,
    }
    
    for badge_type, condition in badge_conditions.items():
        if condition and badge_type not in earned_badges:
            earned_badges.append(badge_type)
            badge_info = BADGES.get(BadgeType(badge_type))
            if badge_info:
                new_badges.append({
                    "badge_type": badge_type,
                    "name": badge_info.name,
                    "icon": badge_info.icon,
                    "points_reward": badge_info.points_reward
                })
                # Award badge points
                await db.gamification_stats.update_one(
                    {"student_id": user_id},
                    {
                        "$set": {"badges_earned": earned_badges},
                        "$inc": {"total_points": badge_info.points_reward}
                    }
                )
    
    return new_badges

@api_router.get("/gamification/stats")
async def get_gamification_stats(current_user: User = Depends(get_current_user)):
    """Get user's gamification stats"""
    stats = await db.gamification_stats.find_one(
        {"student_id": current_user.id},
        {"_id": 0}
    )
    
    if not stats:
        # Create initial stats
        new_stats = GamificationStats(student_id=current_user.id)
        await db.gamification_stats.insert_one(new_stats.dict())
        stats = new_stats.dict()
    
    # Check for new badges
    new_badges = await check_and_award_badges(current_user.id)
    
    # Get XP for next level
    current_level = stats.get("level", 1)
    xp_for_next = get_xp_for_level(current_level + 1)
    current_xp = stats.get("total_xp", 0)
    xp_progress = (current_xp / xp_for_next * 100) if xp_for_next > 0 else 0
    
    return {
        **stats,
        "xp_for_next_level": xp_for_next,
        "xp_progress_percentage": round(xp_progress, 1),
        "new_badges": new_badges
    }

@api_router.get("/gamification/badges")
async def get_all_available_badges(current_user: User = Depends(get_current_user)):
    """Get all available badges with user's earned status"""
    all_badges = await get_all_badges()
    
    stats = await db.gamification_stats.find_one({"student_id": current_user.id})
    earned_badges = stats.get("badges_earned", []) if stats else []
    
    for badge in all_badges:
        badge["earned"] = badge["badge_type"] in earned_badges
    
    return {"badges": all_badges}

@api_router.get("/gamification/leaderboard")
async def get_leaderboard(
    period: str = "all",  # all, weekly, daily
    limit: int = 20,
    current_user: User = Depends(get_current_user)
):
    """Get leaderboard rankings"""
    # Get all gamification stats sorted by points
    stats_cursor = db.gamification_stats.find({}).sort("total_points", -1).limit(limit)
    stats_list = await stats_cursor.to_list(length=limit)
    
    leaderboard = []
    for rank, stat in enumerate(stats_list, 1):
        user = await db.users.find_one({"id": stat["student_id"]})
        if user:
            # Random avatar emoji based on user id
            avatars = ["👧", "👦", "🧒", "👩", "👨", "🧑", "👸", "🤴", "🦸", "🧙"]
            avatar_idx = hash(stat["student_id"]) % len(avatars)
            
            leaderboard.append({
                "rank": rank,
                "student_id": stat["student_id"],
                "student_name": user.get("full_name", "Anonymous"),
                "avatar_emoji": avatars[avatar_idx],
                "total_points": stat.get("total_points", 0),
                "level": stat.get("level", 1),
                "badges_count": len(stat.get("badges_earned", [])),
                "is_current_user": stat["student_id"] == current_user.id
            })
    
    # Find current user's rank if not in top
    current_user_rank = None
    for entry in leaderboard:
        if entry["is_current_user"]:
            current_user_rank = entry["rank"]
            break
    
    return {
        "leaderboard": leaderboard,
        "current_user_rank": current_user_rank,
        "total_participants": await db.gamification_stats.count_documents({})
    }


# ============================================
# DAILY/WEEKLY CHALLENGES ROUTES
# ============================================

@api_router.get("/challenges")
async def get_challenges(
    current_user: User = Depends(get_current_user)
):
    """Get active daily and weekly challenges"""
    user_age_group = current_user.age_group or "9-12"
    
    # Generate today's daily challenge
    daily = generate_daily_challenge(user_age_group)
    
    # Generate this week's weekly challenge
    weekly = generate_weekly_challenge(user_age_group)
    
    # Get user's progress on challenges
    daily_progress = await db.challenge_progress.find_one({
        "user_id": current_user.id,
        "challenge_id": daily.id
    }, {"_id": 0})
    
    weekly_progress = await db.challenge_progress.find_one({
        "user_id": current_user.id,
        "challenge_id": weekly.id
    }, {"_id": 0})
    
    return {
        "daily": {
            **daily.dict(),
            "status": get_challenge_status(daily),
            "time_remaining": calculate_time_remaining(daily),
            "user_progress": daily_progress
        },
        "weekly": {
            **weekly.dict(),
            "status": get_challenge_status(weekly),
            "time_remaining": calculate_time_remaining(weekly),
            "user_progress": weekly_progress
        }
    }


@api_router.post("/challenges/{challenge_id}/start")
async def start_challenge(
    challenge_id: str,
    current_user: User = Depends(get_current_user)
):
    """Start a challenge"""
    # Check if already started
    existing = await db.challenge_progress.find_one({
        "user_id": current_user.id,
        "challenge_id": challenge_id
    })
    
    if existing:
        return {"message": "Challenge already started", "progress": existing}
    
    # Create progress record
    progress = ChallengeProgress(
        user_id=current_user.id,
        challenge_id=challenge_id,
        started_at=datetime.now(timezone.utc)
    )
    
    await db.challenge_progress.insert_one(progress.dict())
    
    # Log activity
    await log_activity(
        current_user.id,
        ActivityType.COURSE_STARTED,
        {"action": "challenge_started", "challenge_id": challenge_id}
    )
    
    return {"message": "Challenge started!", "progress": progress.dict()}


@api_router.post("/challenges/{challenge_id}/complete-task")
async def complete_challenge_task(
    challenge_id: str,
    task_data: dict,
    current_user: User = Depends(get_current_user)
):
    """Mark a challenge task as completed"""
    task_id = task_data.get("task_id")
    if not task_id:
        raise HTTPException(status_code=400, detail="task_id required")
    
    # Get progress
    progress = await db.challenge_progress.find_one({
        "user_id": current_user.id,
        "challenge_id": challenge_id
    })
    
    if not progress:
        raise HTTPException(status_code=404, detail="Challenge not started")
    
    # Check if task already completed
    tasks_completed = progress.get("tasks_completed", [])
    if task_id in tasks_completed:
        return {"message": "Task already completed", "tasks_completed": tasks_completed}
    
    # Add task to completed list
    tasks_completed.append(task_id)
    
    await db.challenge_progress.update_one(
        {"user_id": current_user.id, "challenge_id": challenge_id},
        {"$set": {"tasks_completed": tasks_completed}}
    )
    
    return {
        "message": "Task completed!",
        "tasks_completed": tasks_completed,
        "tasks_count": len(tasks_completed)
    }


@api_router.post("/challenges/{challenge_id}/complete")
async def complete_challenge(
    challenge_id: str,
    current_user: User = Depends(get_current_user)
):
    """Complete a challenge and claim rewards"""
    # Get progress
    progress = await db.challenge_progress.find_one({
        "user_id": current_user.id,
        "challenge_id": challenge_id
    })
    
    if not progress:
        raise HTTPException(status_code=404, detail="Challenge not started")
    
    if progress.get("is_completed"):
        return {"message": "Challenge already completed", "rewards_claimed": True}
    
    # Determine challenge type and get rewards
    is_daily = challenge_id.startswith("daily_")
    user_age_group = current_user.age_group or "9-12"
    
    if is_daily:
        challenge = generate_daily_challenge(user_age_group)
    else:
        challenge = generate_weekly_challenge(user_age_group)
    
    # Ensure the challenge ID matches
    if challenge.id != challenge_id:
        raise HTTPException(status_code=400, detail="Challenge expired or invalid")
    
    # Check if all tasks completed
    tasks_completed = progress.get("tasks_completed", [])
    required_tasks = [t["id"] for t in challenge.tasks]
    
    if not all(t in tasks_completed for t in required_tasks):
        return {
            "message": "Complete all tasks first",
            "tasks_completed": len(tasks_completed),
            "tasks_required": len(required_tasks)
        }
    
    # Award points and XP
    points_earned = challenge.points_reward
    xp_earned = challenge.xp_reward
    
    # Update gamification stats
    await db.gamification_stats.update_one(
        {"student_id": current_user.id},
        {
            "$inc": {
                "total_points": points_earned,
                "total_xp": xp_earned,
                "challenges_completed": 1
            }
        },
        upsert=True
    )
    
    # Mark challenge as completed
    await db.challenge_progress.update_one(
        {"user_id": current_user.id, "challenge_id": challenge_id},
        {
            "$set": {
                "is_completed": True,
                "completed_at": datetime.now(timezone.utc),
                "points_earned": points_earned,
                "xp_earned": xp_earned
            }
        }
    )
    
    # Award badge if applicable
    badge_awarded = None
    if challenge.badge_reward:
        stats = await db.gamification_stats.find_one({"student_id": current_user.id})
        earned_badges = stats.get("badges_earned", []) if stats else []
        
        if challenge.badge_reward not in earned_badges:
            earned_badges.append(challenge.badge_reward)
            await db.gamification_stats.update_one(
                {"student_id": current_user.id},
                {"$set": {"badges_earned": earned_badges}}
            )
            badge_awarded = challenge.badge_reward
    
    # Log activity
    await log_activity(
        current_user.id,
        ActivityType.COURSE_COMPLETED,
        {
            "action": "challenge_completed",
            "challenge_id": challenge_id,
            "points_earned": points_earned,
            "xp_earned": xp_earned
        }
    )
    
    return {
        "message": "🎉 Challenge completed!",
        "rewards": {
            "points": points_earned,
            "xp": xp_earned,
            "badge": badge_awarded
        }
    }


@api_router.get("/challenges/history")
async def get_challenge_history(
    limit: int = 20,
    current_user: User = Depends(get_current_user)
):
    """Get user's completed challenges history"""
    history = await db.challenge_progress.find(
        {"user_id": current_user.id, "is_completed": True},
        {"_id": 0}
    ).sort("completed_at", -1).limit(limit).to_list(length=limit)
    
    # Calculate stats
    total_completed = await db.challenge_progress.count_documents({
        "user_id": current_user.id,
        "is_completed": True
    })
    
    daily_completed = len([h for h in history if h.get("challenge_id", "").startswith("daily_")])
    weekly_completed = len([h for h in history if h.get("challenge_id", "").startswith("weekly_")])
    
    return {
        "history": history,
        "stats": {
            "total_completed": total_completed,
            "daily_completed": daily_completed,
            "weekly_completed": weekly_completed
        }
    }


# ============================================
# QUIZ ROUTES
# ============================================

@api_router.get("/quizzes")
async def get_quizzes(
    learning_level: Optional[str] = None,
    subject: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get available quizzes"""
    query = {"is_active": True}
    if learning_level:
        query["learning_level"] = learning_level
    if subject:
        query["subject"] = subject
    
    quizzes = await db.quizzes.find(query, {"_id": 0, "questions.correct_answer": 0}).to_list(length=100)
    
    # If no quizzes in DB, return sample quizzes
    if not quizzes:
        # Filter sample quizzes by user's learning level
        user_level = current_user.learning_level or "development"
        filtered = [q for q in SAMPLE_QUIZZES if q["learning_level"] == user_level]
        if not filtered:
            filtered = SAMPLE_QUIZZES
        
        # Add IDs to questions and remove correct answers from response
        for quiz in filtered:
            quiz["id"] = str(uuid.uuid4())
            for q in quiz["questions"]:
                q["id"] = str(uuid.uuid4())
                if "correct_answer" in q:
                    del q["correct_answer"]
        
        return {"quizzes": filtered, "source": "sample"}
    
    return {"quizzes": quizzes, "source": "database"}

@api_router.get("/quizzes/{quiz_id}")
async def get_quiz(quiz_id: str, current_user: User = Depends(get_current_user)):
    """Get a specific quiz (without answers)"""
    quiz = await db.quizzes.find_one(
        {"id": quiz_id},
        {"_id": 0, "questions.correct_answer": 0}
    )
    
    if not quiz:
        # Check sample quizzes
        for sample in SAMPLE_QUIZZES:
            if sample.get("id") == quiz_id:
                quiz = sample.copy()
                for q in quiz["questions"]:
                    if "correct_answer" in q:
                        del q["correct_answer"]
                return quiz
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    return quiz

@api_router.post("/quizzes/{quiz_id}/start")
async def start_quiz(quiz_id: str, current_user: User = Depends(get_current_user)):
    """Start a quiz attempt"""
    attempt = QuizAttempt(
        quiz_id=quiz_id,
        student_id=current_user.id
    )
    
    await db.quiz_attempts.insert_one(attempt.dict())
    
    return {
        "attempt_id": attempt.id,
        "quiz_id": quiz_id,
        "started_at": attempt.started_at.isoformat()
    }

@api_router.post("/quizzes/{quiz_id}/submit")
async def submit_quiz(
    quiz_id: str,
    request: dict,
    current_user: User = Depends(get_current_user)
):
    """Submit quiz answers and get results"""
    attempt_id = request.get("attempt_id")
    answers = request.get("answers", {})
    time_taken = request.get("time_taken_seconds", 0)
    
    # Get quiz with answers for grading
    quiz = await db.quizzes.find_one({"id": quiz_id}, {"_id": 0})
    
    if not quiz:
        # Check sample quizzes
        for sample in SAMPLE_QUIZZES:
            if sample.get("id") == quiz_id:
                quiz = sample.copy()
                quiz["id"] = quiz_id
                # Add IDs to questions if missing
                for i, q in enumerate(quiz["questions"]):
                    if "id" not in q:
                        q["id"] = str(i)
                break
    
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    # Grade the quiz
    grading_result = grade_quiz(quiz, answers)
    
    # Update attempt
    update_data = {
        "answers": answers,
        "score": grading_result["score"],
        "total_points": grading_result["total_points"],
        "percentage": grading_result["percentage"],
        "passed": grading_result["passed"],
        "time_taken_seconds": time_taken,
        "completed_at": datetime.now(timezone.utc),
        "results": grading_result["results"]
    }
    
    if attempt_id:
        await db.quiz_attempts.update_one(
            {"id": attempt_id},
            {"$set": update_data}
        )
    
    # Update gamification
    if grading_result["passed"]:
        await update_gamification_stats(current_user.id, "quiz_complete")
        if grading_result["percentage"] == 100:
            await update_gamification_stats(current_user.id, "quiz_perfect")
    
    # Log activity
    await log_activity(
        current_user.id,
        ActivityType.COURSE_COMPLETED,
        {
            "action": "quiz_completed",
            "quiz_id": quiz_id,
            "score": grading_result["score"],
            "passed": grading_result["passed"]
        }
    )
    
    return {
        **grading_result,
        "quiz_title": quiz.get("title", "Quiz")
    }

@api_router.get("/quizzes/attempts/my")
async def get_my_quiz_attempts(current_user: User = Depends(get_current_user)):
    """Get user's quiz attempts"""
    attempts = await db.quiz_attempts.find(
        {"student_id": current_user.id},
        {"_id": 0}
    ).sort("completed_at", -1).to_list(length=50)
    
    return {"attempts": attempts}

@api_router.post("/quizzes/initialize-samples")
async def initialize_sample_quizzes(current_user: User = Depends(get_current_admin)):
    """Initialize sample quizzes (Admin only)"""
    created_count = 0
    for quiz_data in SAMPLE_QUIZZES:
        existing = await db.quizzes.find_one({"title": quiz_data["title"]})
        if not existing:
            quiz = Quiz(
                **quiz_data,
                created_by=current_user.id
            )
            # Add IDs to questions
            for q in quiz.questions:
                if not q.id:
                    q.id = str(uuid.uuid4())
            quiz.total_points = sum(q.points for q in quiz.questions)
            await db.quizzes.insert_one(quiz.dict())
            created_count += 1
    
    return {"message": f"Created {created_count} sample quizzes"}

# ============================================
# CERTIFICATE ROUTES
# ============================================

@api_router.get("/certificates")
async def get_certificates(current_user: User = Depends(get_current_user)):
    """Get user's certificates"""
    certificates = await db.certificates.find(
        {"student_id": current_user.id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(length=100)
    
    return {"certificates": certificates}

@api_router.post("/certificates/generate")
async def generate_certificate(
    request: dict,
    current_user: User = Depends(get_current_user)
):
    """Generate a certificate for course completion"""
    course_id = request.get("course_id")
    course_title = request.get("course_title")
    grade = request.get("grade")
    
    if not course_id or not course_title:
        raise HTTPException(status_code=400, detail="course_id and course_title required")
    
    # Check if certificate already exists
    existing = await db.certificates.find_one({
        "student_id": current_user.id,
        "course_id": course_id
    })
    
    if existing:
        return {
            "certificate": existing,
            "message": "Certificate already exists"
        }
    
    # Create certificate
    cert = await create_and_save_certificate(
        student_id=current_user.id,
        student_name=current_user.full_name,
        course_id=course_id,
        course_title=course_title,
        grade=grade,
        learning_level=current_user.learning_level or "development"
    )
    
    await db.certificates.insert_one(cert.dict())
    
    # Update gamification
    await update_gamification_stats(current_user.id, "certificate_earned")
    
    return {
        "certificate": cert.dict(),
        "message": "Certificate generated successfully"
    }

@api_router.get("/certificates/{cert_id}/download")
async def download_certificate(cert_id: str, current_user: User = Depends(get_current_user)):
    """Download certificate as PDF"""
    cert = await db.certificates.find_one({"id": cert_id})
    
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    
    # Generate PDF
    pdf_buffer = generate_certificate_pdf(
        student_name=cert.get("student_name", "Student"),
        course_title=cert.get("course_title", "Course"),
        completion_date=datetime.fromisoformat(cert["completion_date"].replace("Z", "+00:00")) if isinstance(cert["completion_date"], str) else cert["completion_date"],
        verification_code=cert.get("verification_code", ""),
        instructor_name=cert.get("instructor_name"),
        grade=cert.get("grade")
    )
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=TEC_Certificate_{cert_id[:8]}.pdf"
        }
    )

@api_router.get("/certificates/verify/{verification_code}")
async def verify_certificate(verification_code: str):
    """Verify a certificate by its code (public endpoint)"""
    cert = await db.certificates.find_one(
        {"verification_code": verification_code},
        {"_id": 0}
    )
    
    if not cert:
        return {"valid": False, "message": "Certificate not found"}
    
    return {
        "valid": True,
        "student_name": cert.get("student_name"),
        "course_title": cert.get("course_title"),
        "completion_date": cert.get("completion_date"),
        "grade": cert.get("grade")
    }

# ============================================
# PARENT DASHBOARD ROUTES
# ============================================

@api_router.post("/parent/link-child")
async def link_parent_to_child(
    request: dict,
    current_user: User = Depends(get_current_user)
):
    """Link a parent account to a child's account"""
    child_email = request.get("child_email")
    
    if not child_email:
        raise HTTPException(status_code=400, detail="child_email required")
    
    # Find child by email
    child = await db.users.find_one({"email": child_email, "role": "student"})
    if not child:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Create parent-child link
    link = {
        "id": str(uuid.uuid4()),
        "parent_id": current_user.id,
        "child_id": child["id"],
        "created_at": datetime.now(timezone.utc)
    }
    
    # Check if link already exists
    existing = await db.parent_child_links.find_one({
        "parent_id": current_user.id,
        "child_id": child["id"]
    })
    
    if existing:
        return {"message": "Link already exists", "child_name": child.get("full_name")}
    
    await db.parent_child_links.insert_one(link)
    
    return {
        "message": "Child linked successfully",
        "child_name": child.get("full_name"),
        "child_id": child["id"]
    }

@api_router.get("/parent/children")
async def get_parent_children(current_user: User = Depends(get_current_user)):
    """Get all children linked to parent"""
    links = await db.parent_child_links.find(
        {"parent_id": current_user.id}
    ).to_list(length=20)
    
    children = []
    for link in links:
        child = await db.users.find_one(
            {"id": link["child_id"]},
            {"_id": 0, "hashed_password": 0}
        )
        if child:
            # Get gamification stats
            stats = await db.gamification_stats.find_one(
                {"student_id": child["id"]},
                {"_id": 0}
            )
            child["gamification"] = stats or {}
            children.append(child)
    
    return {"children": children}

@api_router.get("/parent/child/{child_id}/progress")
async def get_child_progress(
    child_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get detailed progress for a specific child"""
    # Verify parent has access to this child
    link = await db.parent_child_links.find_one({
        "parent_id": current_user.id,
        "child_id": child_id
    })
    
    if not link:
        raise HTTPException(status_code=403, detail="Not authorized to view this child's progress")
    
    # Get child info
    child = await db.users.find_one({"id": child_id}, {"_id": 0, "hashed_password": 0})
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    # Get gamification stats
    stats = await db.gamification_stats.find_one({"student_id": child_id}, {"_id": 0})
    
    # Get weekly progress
    now = datetime.now(timezone.utc)
    week_start = now - timedelta(days=7)
    weekly_progress = await get_student_weekly_progress(child_id, week_start, now)
    
    # Get recent activities
    activities = await db.activity_logs.find(
        {"user_id": child_id}
    ).sort("timestamp", -1).limit(20).to_list(length=20)
    
    for activity in activities:
        if "_id" in activity:
            del activity["_id"]
    
    # Get quiz attempts
    quiz_attempts = await db.quiz_attempts.find(
        {"student_id": child_id, "completed_at": {"$ne": None}},
        {"_id": 0}
    ).sort("completed_at", -1).limit(10).to_list(length=10)
    
    # Get certificates
    certificates = await db.certificates.find(
        {"student_id": child_id},
        {"_id": 0}
    ).to_list(length=20)
    
    return {
        "child": child,
        "gamification": stats or {},
        "weekly_progress": weekly_progress,
        "recent_activities": activities,
        "quiz_attempts": quiz_attempts,
        "certificates": certificates
    }

# ============================================
# LIVE CLASSES (ZOOM) ROUTES - Simplified
# ============================================

class LiveClass(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: Optional[str] = None
    teacher_id: str
    teacher_name: str
    scheduled_time: datetime
    duration_minutes: int = 60
    meeting_link: Optional[str] = None
    meeting_password: Optional[str] = None
    age_group: str
    learning_level: str
    max_students: int = 30
    enrolled_students: List[str] = []
    status: str = "scheduled"  # scheduled, live, completed, cancelled
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

@api_router.post("/live-classes")
async def create_live_class(
    request: dict,
    current_user: User = Depends(get_current_teacher)
):
    """Create a new live class"""
    live_class = LiveClass(
        title=request.get("title"),
        description=request.get("description"),
        teacher_id=current_user.id,
        teacher_name=current_user.full_name,
        scheduled_time=datetime.fromisoformat(request.get("scheduled_time")),
        duration_minutes=request.get("duration_minutes", 60),
        meeting_link=request.get("meeting_link"),
        meeting_password=request.get("meeting_password"),
        age_group=request.get("age_group", "9-12"),
        learning_level=request.get("learning_level", "development"),
        max_students=request.get("max_students", 30)
    )
    
    await db.live_classes.insert_one(live_class.dict())
    
    return {
        "message": "Live class created successfully",
        "class": live_class.dict()
    }

@api_router.get("/live-classes")
async def get_live_classes(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get upcoming live classes"""
    query = {}
    if status:
        query["status"] = status
    else:
        query["status"] = {"$in": ["scheduled", "live"]}
    
    # Filter by user's learning level/age group if student
    if current_user.role == "student":
        if current_user.age_group:
            query["age_group"] = current_user.age_group
    
    classes = await db.live_classes.find(query, {"_id": 0}).sort("scheduled_time", 1).to_list(length=50)
    
    return {"classes": classes}

@api_router.post("/live-classes/{class_id}/enroll")
async def enroll_in_live_class(
    class_id: str,
    current_user: User = Depends(get_current_user)
):
    """Enroll in a live class"""
    live_class = await db.live_classes.find_one({"id": class_id})
    
    if not live_class:
        raise HTTPException(status_code=404, detail="Class not found")
    
    if current_user.id in live_class.get("enrolled_students", []):
        return {"message": "Already enrolled", "class_id": class_id}
    
    if len(live_class.get("enrolled_students", [])) >= live_class.get("max_students", 30):
        raise HTTPException(status_code=400, detail="Class is full")
    
    await db.live_classes.update_one(
        {"id": class_id},
        {"$push": {"enrolled_students": current_user.id}}
    )
    
    return {
        "message": "Enrolled successfully",
        "class_id": class_id,
        "meeting_link": live_class.get("meeting_link")
    }

@api_router.get("/live-classes/{class_id}/join")
async def get_join_info(
    class_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get join information for a live class"""
    live_class = await db.live_classes.find_one({"id": class_id}, {"_id": 0})
    
    if not live_class:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Check if enrolled or is teacher
    if current_user.id not in live_class.get("enrolled_students", []) and current_user.id != live_class.get("teacher_id"):
        raise HTTPException(status_code=403, detail="Not enrolled in this class")
    
    return {
        "title": live_class.get("title"),
        "meeting_link": live_class.get("meeting_link"),
        "meeting_password": live_class.get("meeting_password"),
        "scheduled_time": live_class.get("scheduled_time"),
        "teacher_name": live_class.get("teacher_name")
    }

# ============================================
# ENHANCED ANALYTICS ROUTES
# ============================================

@api_router.get("/analytics/overview")
async def get_analytics_overview(current_user: User = Depends(get_current_teacher)):
    """Get comprehensive analytics overview (Teacher/Admin)"""
    
    # Total users by role
    total_students = await db.users.count_documents({"role": "student"})
    total_teachers = await db.users.count_documents({"role": "teacher"})
    
    # Active students (activity in last 7 days)
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    active_students = await db.activity_logs.distinct(
        "user_id",
        {"timestamp": {"$gte": week_ago}}
    )
    
    # Total courses and quizzes
    total_courses = await db.courses.count_documents({})
    total_quizzes = await db.quizzes.count_documents({})
    
    # Quiz statistics
    quiz_attempts = await db.quiz_attempts.find(
        {"completed_at": {"$ne": None}}
    ).to_list(length=1000)
    
    total_quiz_attempts = len(quiz_attempts)
    passed_quizzes = sum(1 for a in quiz_attempts if a.get("passed", False))
    avg_score = sum(a.get("percentage", 0) for a in quiz_attempts) / len(quiz_attempts) if quiz_attempts else 0
    
    # AI chat usage
    total_ai_messages = await db.ai_chat_logs.count_documents({})
    
    # Certificates issued
    total_certificates = await db.certificates.count_documents({})
    
    # Gamification stats
    gamification_stats = await db.gamification_stats.find({}).to_list(length=1000)
    total_points_earned = sum(s.get("total_points", 0) for s in gamification_stats)
    total_badges_earned = sum(len(s.get("badges_earned", [])) for s in gamification_stats)
    
    return {
        "users": {
            "total_students": total_students,
            "total_teachers": total_teachers,
            "active_students_week": len(active_students)
        },
        "content": {
            "total_courses": total_courses,
            "total_quizzes": total_quizzes
        },
        "quizzes": {
            "total_attempts": total_quiz_attempts,
            "passed_count": passed_quizzes,
            "pass_rate": round(passed_quizzes / total_quiz_attempts * 100, 1) if total_quiz_attempts else 0,
            "average_score": round(avg_score, 1)
        },
        "engagement": {
            "total_ai_messages": total_ai_messages,
            "total_certificates": total_certificates,
            "total_points_earned": total_points_earned,
            "total_badges_earned": total_badges_earned
        }
    }

@api_router.get("/analytics/activity-chart")
async def get_activity_chart_data(
    days: int = 7,
    current_user: User = Depends(get_current_teacher)
):
    """Get activity data for charts"""
    start_date = datetime.now(timezone.utc) - timedelta(days=days)
    
    # Group activities by day
    pipeline = [
        {"$match": {"timestamp": {"$gte": start_date}}},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}},
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id": 1}}
    ]
    
    activities = await db.activity_logs.aggregate(pipeline).to_list(length=100)
    
    return {
        "chart_data": activities,
        "period_days": days
    }

# ============================================
# CLASS REMINDER ROUTES
# ============================================

class SendReminderRequest(BaseModel):
    class_id: str
    class_name: str
    class_time: str  # ISO format datetime
    zoom_link: Optional[str] = None
    student_ids: Optional[List[str]] = None  # If None, send to all enrolled

@api_router.post("/reminders/send")
async def send_class_reminders(
    request: SendReminderRequest,
    current_user: User = Depends(get_current_teacher)
):
    """Send class reminders to students (Teacher/Admin only) - Manual trigger"""
    
    # Parse class time
    try:
        class_time = datetime.fromisoformat(request.class_time.replace('Z', '+00:00'))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid class_time format")
    
    # Get students to notify
    if request.student_ids:
        students_cursor = db.users.find(
            {"user_id": {"$in": request.student_ids}, "role": "student"},
            {"_id": 0}
        )
    else:
        # Get all students enrolled in the class/course
        students_cursor = db.users.find(
            {"role": "student"},
            {"_id": 0}
        )
    
    students = await students_cursor.to_list(length=500)
    
    if not students:
        return {"status": "warning", "message": "No students found to notify"}
    
    # Prepare student data for bulk send
    student_data = []
    for student in students:
        student_data.append({
            "name": student.get("full_name", student.get("name", "Student")),
            "parent_email": student.get("parent_email", student.get("email")),
            "parent_phone": student.get("parent_phone", student.get("phone")),
            "parent_name": student.get("parent_name", "Parent")
        })
    
    # Send reminders
    results = await send_bulk_reminders(
        students=student_data,
        class_name=request.class_name,
        class_time=class_time,
        zoom_link=request.zoom_link,
        teacher_name=current_user.full_name
    )
    
    # Log the action
    await db.activity_logs.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": current_user.user_id,
        "action": "send_class_reminders",
        "details": {
            "class_name": request.class_name,
            "total_students": results["total"],
            "emails_sent": results["email_sent"]
        },
        "timestamp": datetime.now(timezone.utc)
    })
    
    return {
        "status": "success",
        "message": f"Reminders sent to {results['email_sent']} students",
        "results": results
    }

@api_router.post("/reminders/whatsapp-link")
async def get_single_whatsapp_reminder(
    student_name: str,
    parent_phone: str,
    class_name: str,
    class_time: str,
    zoom_link: Optional[str] = None,
    current_user: User = Depends(get_current_teacher)
):
    """Get a WhatsApp reminder link for a single student"""
    
    try:
        class_dt = datetime.fromisoformat(class_time.replace('Z', '+00:00'))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid class_time format")
    
    wa_link = get_whatsapp_reminder_link(
        phone=parent_phone,
        child_name=student_name,
        class_name=class_name,
        class_time=class_dt,
        zoom_link=zoom_link
    )
    
    return {
        "status": "success",
        "whatsapp_link": wa_link,
        "student_name": student_name
    }

@api_router.get("/reminders/scheduled")
async def get_scheduled_reminders(current_user: User = Depends(get_current_teacher)):
    """Get list of scheduled automatic reminders"""
    
    # Get upcoming classes (next 7 days)
    now = datetime.now(timezone.utc)
    week_later = now + timedelta(days=7)
    
    upcoming_classes = await db.live_classes.find({
        "scheduled_time": {"$gte": now, "$lte": week_later},
        "status": {"$ne": "completed"}
    }, {"_id": 0}).to_list(length=100)
    
    reminders = []
    for cls in upcoming_classes:
        scheduled_time = cls.get("scheduled_time")
        if scheduled_time:
            reminder_time = scheduled_time - timedelta(hours=24)
            reminders.append({
                "class_id": cls.get("id"),
                "class_name": cls.get("title", "Untitled Class"),
                "class_time": scheduled_time.isoformat() if isinstance(scheduled_time, datetime) else scheduled_time,
                "reminder_time": reminder_time.isoformat() if isinstance(reminder_time, datetime) else str(reminder_time),
                "status": "scheduled"
            })
    
    return {
        "scheduled_reminders": reminders,
        "total": len(reminders)
    }

# ============================================================================
# REFERRAL SYSTEM POC ENDPOINTS
# ============================================================================

class ReferralCodeResponse(BaseModel):
    referral_code: str
    referral_link: str

class ReferralStatsResponse(BaseModel):
    referral_code: str
    total_clicks: int
    total_conversions: int
    total_rewards: int

@api_router.post("/referrals/code", response_model=ReferralCodeResponse)
async def generate_referral_code(current_user: User = Depends(get_current_user)):
    """Generate or retrieve referral code for current user"""
    import hashlib
    import random
    import string
    
    # Check if user already has a code
    if current_user.referral_code:
        frontend_url = os.environ.get("FRONTEND_URL", "https://tecaikids.com")
        return {
            "referral_code": current_user.referral_code,
            "referral_link": f"{frontend_url}/?ref={current_user.referral_code}"
        }
    
    # Generate unique code: first 4 chars of name + 4 random chars
    base = (current_user.full_name.split()[0][:4] if current_user.full_name else "USER").upper()
    random_suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    referral_code = f"{base}{random_suffix}"
    
    # Ensure uniqueness
    max_attempts = 10
    for _ in range(max_attempts):
        existing = await db.users.find_one({"referral_code": referral_code})
        if not existing:
            break
        random_suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
        referral_code = f"{base}{random_suffix}"
    
    # Update user with referral code
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": {"referral_code": referral_code}}
    )
    
    frontend_url = os.environ.get("FRONTEND_URL", "https://tecaikids.com")
    return {
        "referral_code": referral_code,
        "referral_link": f"{frontend_url}/?ref={referral_code}"
    }

@api_router.get("/referrals/track")
async def track_referral_click(
    request: Request,
    ref: str
):
    """Track referral link click"""
    import hashlib
    
    # Verify referral code exists
    referrer = await db.users.find_one({"referral_code": ref})
    if not referrer:
        raise HTTPException(status_code=404, detail="Invalid referral code")
    
    # Get client info
    user_agent = request.headers.get("user-agent", "unknown")
    client_ip = request.client.host if request.client else "unknown"
    ip_hash = hashlib.sha256(client_ip.encode()).hexdigest()[:16]
    
    # Check if this IP clicked in last 24h (anti-spam)
    day_ago = datetime.now(timezone.utc) - timedelta(days=1)
    recent_click = await db.referral_events.find_one({
        "ref_code": ref,
        "ip_hash": ip_hash,
        "event_type": "click",
        "created_at": {"$gte": day_ago}
    })
    
    if not recent_click:
        # Record click event
        click_event = {
            "id": str(uuid.uuid4()),
            "ref_code": ref,
            "referrer_id": referrer.get("id"),
            "event_type": "click",
            "user_agent": user_agent,
            "ip_hash": ip_hash,
            "created_at": datetime.now(timezone.utc)
        }
        await db.referral_events.insert_one(click_event)
    
    # Set referral cookie (7 days expiry)
    response = Response(
        content='{"status": "tracked", "message": "Referral click recorded"}',
        media_type="application/json"
    )
    response.set_cookie(
        key="ref_code",
        value=ref,
        max_age=7 * 24 * 60 * 60,  # 7 days
        httponly=True,
        samesite="lax"
    )
    
    return response

@api_router.post("/referrals/convert")
async def track_referral_conversion(
    conversion_data: dict
):
    """Track successful conversion (signup) from referral"""
    new_user_id = conversion_data.get("new_user_id")
    ref_code = conversion_data.get("ref_code")
    
    if not new_user_id or not ref_code:
        raise HTTPException(status_code=400, detail="Missing required fields")
    
    # Verify referral code exists
    referrer = await db.users.find_one({"referral_code": ref_code})
    if not referrer:
        raise HTTPException(status_code=404, detail="Invalid referral code")
    
    # Check if conversion already recorded for this user
    existing_conversion = await db.referral_events.find_one({
        "event_type": "conversion",
        "new_user_id": new_user_id
    })
    
    if existing_conversion:
        return {
            "status": "already_recorded",
            "message": "Conversion already tracked",
            "reward_xp": 0
        }
    
    # Record conversion event
    conversion_event = {
        "id": str(uuid.uuid4()),
        "ref_code": ref_code,
        "referrer_id": referrer.get("id"),
        "event_type": "conversion",
        "new_user_id": new_user_id,
        "created_at": datetime.now(timezone.utc)
    }
    await db.referral_events.insert_one(conversion_event)
    
    # Award XP to referrer (configurable, default 100)
    reward_xp = 100
    current_xp = referrer.get("xp", 0)
    await db.users.update_one(
        {"id": referrer.get("id")},
        {
            "$set": {"xp": current_xp + reward_xp},
            "$inc": {"referral_conversions": 1}
        }
    )
    
    return {
        "status": "success",
        "message": "Conversion recorded and reward given",
        "reward_xp": reward_xp
    }

@api_router.get("/referrals/stats", response_model=ReferralStatsResponse)
async def get_referral_stats(current_user: User = Depends(get_current_user)):
    """Get referral statistics for current user"""
    
    # Ensure user has referral code
    if not current_user.referral_code:
        return {
            "referral_code": "",
            "total_clicks": 0,
            "total_conversions": 0,
            "total_rewards": 0
        }
    
    # Count clicks
    clicks_count = await db.referral_events.count_documents({
        "ref_code": current_user.referral_code,
        "event_type": "click"
    })
    
    # Count conversions
    conversions_count = await db.referral_events.count_documents({
        "ref_code": current_user.referral_code,
        "event_type": "conversion"
    })
    
    # Calculate total rewards (100 XP per conversion)
    total_rewards = conversions_count * 100
    
    return {
        "referral_code": current_user.referral_code,
        "total_clicks": clicks_count,
        "total_conversions": conversions_count,
        "total_rewards": total_rewards
    }

# ============================================================================
# CERTIFICATE SOCIAL SHARING POC ENDPOINTS
# ============================================================================

@api_router.get("/og/cert/{cert_number}.png")
async def generate_og_image(cert_number: str):
    """Generate Open Graph share image for certificate (1200x630)"""
    from reportlab.lib.pagesizes import landscape
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.pdfgen import canvas
    from io import BytesIO
    from PIL import Image, ImageDraw, ImageFont
    
    # Get certificate data
    cert = await db.certificates.find_one({"certificate_number": cert_number}, {"_id": 0})
    
    if not cert:
        # Return placeholder for invalid cert
        cert = {
            "student_name": "Student",
            "certificate_type": "achievement",
            "course_name": "TEC Program"
        }
    
    # Create image with PIL (1200x630 for OG standard)
    img = Image.new('RGB', (1200, 630), color='#F8F9FA')
    draw = ImageDraw.Draw(img)
    
    # Draw gradient-like background (purple to gold)
    for i in range(630):
        # Gradient from purple to gold
        r = int(124 + (218 - 124) * i / 630)
        g = int(58 + (165 - 58) * i / 630)
        b = int(237 + (32 - 237) * i / 630)
        draw.rectangle([(0, i), (1200, i+1)], fill=(r, g, b))
    
    # Add semi-transparent overlay
    overlay = Image.new('RGBA', (1200, 630), (255, 255, 255, 180))
    img = Image.alpha_composite(img.convert('RGBA'), overlay).convert('RGB')
    draw = ImageDraw.Draw(img)
    
    # Draw border
    draw.rectangle([(20, 20), (1180, 610)], outline='#7C3AED', width=8)
    draw.rectangle([(30, 30), (1170, 600)], outline='#DAA520', width=4)
    
    # Add text (using default font for POC)
    try:
        # Try to use a nice font if available
        title_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 72)
        subtitle_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 48)
        body_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 36)
    except:
        # Fallback to default
        title_font = ImageFont.load_default()
        subtitle_font = ImageFont.load_default()
        body_font = ImageFont.load_default()
    
    # Draw title
    title = "🎓 TEC Certificate"
    title_bbox = draw.textbbox((0, 0), title, font=title_font)
    title_width = title_bbox[2] - title_bbox[0]
    draw.text(((1200 - title_width) // 2, 120), title, fill='#7C3AED', font=title_font)
    
    # Draw student name (truncated if too long)
    student_name = cert.get("student_name", "Student")
    if len(student_name) > 25:
        student_name = student_name[:22] + "..."
    name_bbox = draw.textbbox((0, 0), student_name, font=subtitle_font)
    name_width = name_bbox[2] - name_bbox[0]
    draw.text(((1200 - name_width) // 2, 250), student_name, fill='#1E293B', font=subtitle_font)
    
    # Draw certificate type
    cert_type = cert.get("certificate_type", "achievement").title()
    type_text = f"Certificate of {cert_type}"
    type_bbox = draw.textbbox((0, 0), type_text, font=body_font)
    type_width = type_bbox[2] - type_bbox[0]
    draw.text(((1200 - type_width) // 2, 350), type_text, fill='#64748B', font=body_font)
    
    # Draw course name (truncated)
    course_name = cert.get("course_name", "TEC Program")
    if len(course_name) > 40:
        course_name = course_name[:37] + "..."
    course_bbox = draw.textbbox((0, 0), course_name, font=body_font)
    course_width = course_bbox[2] - course_bbox[0]
    draw.text(((1200 - course_width) // 2, 430), course_name, fill='#7C3AED', font=body_font)
    
    # Draw footer
    footer = "TEC Sri Lanka Worldwide | 42 Years of Excellence"
    footer_bbox = draw.textbbox((0, 0), footer, font=body_font)
    footer_width = footer_bbox[2] - footer_bbox[0]
    draw.text(((1200 - footer_width) // 2, 530), footer, fill='#64748B', font=body_font)
    
    # Convert to bytes
    img_byte_arr = BytesIO()
    img.save(img_byte_arr, format='PNG', optimize=True)
    img_byte_arr.seek(0)
    
    return StreamingResponse(img_byte_arr, media_type="image/png")

@api_router.get("/certificates/share/{cert_number}")
async def get_certificate_share_data(cert_number: str):
    """Get certificate data for social sharing (POC - returns JSON)"""
    
    # Get certificate
    cert = await db.certificates.find_one({"certificate_number": cert_number}, {"_id": 0})
    
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    
    # Build OG tags
    frontend_url = os.environ.get("FRONTEND_URL", "https://tecaikids.com")
    api_url = os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:8001")
    
    student_name = cert.get("student_name", "Student")
    # Obfuscate last name for privacy
    name_parts = student_name.split()
    if len(name_parts) > 1:
        display_name = f"{name_parts[0]} {name_parts[-1][0]}."
    else:
        display_name = name_parts[0]
    
    og_title = f"🎓 {display_name} earned a TEC Certificate!"
    og_description = f"Certificate of {cert.get('certificate_type', 'achievement').title()} - {cert.get('course_name', 'TEC Program')}"
    og_image = f"{api_url}/api/og/cert/{cert_number}.png"
    
    return {
        "certificate": {
            "number": cert_number,
            "student_name": display_name,
            "type": cert.get("certificate_type"),
            "course": cert.get("course_name"),
            "issued_date": cert.get("issued_date", cert.get("completion_date"))
        },
        "og_tags": {
            "og:title": og_title,
            "og:description": og_description,
            "og:image": og_image,
            "og:type": "website",
            "og:url": f"{frontend_url}/certificates/share/{cert_number}",
            "twitter:card": "summary_large_image",
            "twitter:title": og_title,
            "twitter:description": og_description,
            "twitter:image": og_image
        }
    }

# ============================================================================
# PUBLIC CERTIFICATE SHARE PAGE (HTML with OG Meta Tags)
# ============================================================================

@app.get("/certificates/share/{cert_number}")
async def public_certificate_share_page(cert_number: str):
    """Public HTML page for certificate sharing with Open Graph meta tags"""
    from fastapi.responses import HTMLResponse
    
    # Get certificate
    cert = await db.certificates.find_one({"certificate_number": cert_number}, {"_id": 0})
    
    if not cert:
        return HTMLResponse(content="<h1>Certificate not found</h1>", status_code=404)
    
    # Build meta tags
    frontend_url = os.environ.get("FRONTEND_URL", "https://tecaikids.com")
    api_url = os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:8001")
    
    student_name = cert.get("student_name", "Student")
    # Obfuscate last name for privacy
    name_parts = student_name.split()
    if len(name_parts) > 1:
        display_name = f"{name_parts[0]} {name_parts[-1][0]}."
    else:
        display_name = name_parts[0]
    
    og_title = f"🎓 {display_name} earned a TEC Certificate!"
    og_description = f"Certificate of {cert.get('certificate_type', 'achievement').title()} - {cert.get('course_name', 'TEC Program')}"
    og_image = f"{api_url}/api/og/cert/{cert_number}.png"
    page_url = f"{frontend_url}/certificates/share/{cert_number}"
    
    issued_date = cert.get("issued_date", cert.get("completion_date", ""))
    
    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{og_title}</title>
        
        <!-- Open Graph / Facebook -->
        <meta property="og:type" content="website">
        <meta property="og:url" content="{page_url}">
        <meta property="og:title" content="{og_title}">
        <meta property="og:description" content="{og_description}">
        <meta property="og:image" content="{og_image}">
        <meta property="og:image:width" content="1200">
        <meta property="og:image:height" content="630">
        
        <!-- Twitter -->
        <meta property="twitter:card" content="summary_large_image">
        <meta property="twitter:url" content="{page_url}">
        <meta property="twitter:title" content="{og_title}">
        <meta property="twitter:description" content="{og_description}">
        <meta property="twitter:image" content="{og_image}">
        
        <style>
            * {{ margin: 0; padding: 0; box-sizing: border-box; }}
            body {{
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }}
            .container {{
                background: white;
                border-radius: 20px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                max-width: 600px;
                width: 100%;
                padding: 40px;
                text-align: center;
            }}
            .icon {{
                font-size: 80px;
                margin-bottom: 20px;
                animation: bounce 2s infinite;
            }}
            @keyframes bounce {{
                0%, 100% {{ transform: translateY(0); }}
                50% {{ transform: translateY(-20px); }}
            }}
            h1 {{
                color: #7C3AED;
                font-size: 32px;
                margin-bottom: 10px;
            }}
            .student-name {{
                color: #1E293B;
                font-size: 28px;
                font-weight: bold;
                margin: 20px 0;
            }}
            .cert-type {{
                background: linear-gradient(135deg, #7C3AED, #EC4899);
                color: white;
                padding: 12px 24px;
                border-radius: 50px;
                display: inline-block;
                margin: 10px 0;
                font-weight: 600;
            }}
            .course {{
                color: #64748B;
                font-size: 18px;
                margin: 15px 0;
            }}
            .cert-number {{
                background: #F1F5F9;
                padding: 10px 20px;
                border-radius: 10px;
                font-family: 'Courier New', monospace;
                color: #475569;
                margin: 20px 0;
                font-size: 14px;
            }}
            .date {{
                color: #94A3B8;
                font-size: 14px;
                margin: 10px 0;
            }}
            .footer {{
                margin-top: 30px;
                padding-top: 30px;
                border-top: 2px solid #E2E8F0;
                color: #64748B;
                font-size: 14px;
            }}
            .logo {{
                font-weight: bold;
                color: #7C3AED;
                font-size: 16px;
            }}
            .cta {{
                margin-top: 30px;
            }}
            .btn {{
                display: inline-block;
                background: linear-gradient(135deg, #7C3AED, #EC4899);
                color: white;
                text-decoration: none;
                padding: 15px 40px;
                border-radius: 50px;
                font-weight: 600;
                font-size: 16px;
                transition: transform 0.2s;
            }}
            .btn:hover {{
                transform: scale(1.05);
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="icon">🎓</div>
            <h1>TEC Certificate of Achievement</h1>
            <div class="student-name">{display_name}</div>
            <div class="cert-type">Certificate of {cert.get('certificate_type', 'achievement').title()}</div>
            <div class="course">{cert.get('course_name', 'TEC Program')}</div>
            <div class="cert-number">Certificate No: {cert_number}</div>
            <div class="date">Issued: {issued_date}</div>
            
            <div class="cta">
                <a href="{frontend_url}" class="btn">Explore TEC Programs →</a>
            </div>
            
            <div class="footer">
                <div class="logo">🚀 TEC Sri Lanka Worldwide</div>
                <div style="margin-top: 10px;">42 Years of Educational Excellence since 1982</div>
                <div style="margin-top: 10px; font-size: 12px;">Building Future-Ready Kids | www.tecaikids.com</div>
            </div>
        </div>
    </body>
    </html>
    """
    
    return HTMLResponse(content=html_content)

# ============================================================================
# DATABASE INDEXES (Run on startup)
# ============================================================================

async def create_indexes():
    """Create database indexes for performance"""
    try:
        # Users indexes
        await db.users.create_index("email", unique=True)
        await db.users.create_index("referral_code", unique=True, sparse=True)
        await db.users.create_index("student_index", unique=True, sparse=True)
        
        # Referral events indexes
        await db.referral_events.create_index([("ref_code", 1), ("created_at", -1)])
        await db.referral_events.create_index("event_type")
        await db.referral_events.create_index("new_user_id", sparse=True)
        
        # Certificates indexes
        await db.certificates.create_index("certificate_number", unique=True)
        await db.certificates.create_index("student_id")
        
        # Attendance indexes
        await db.attendance_records.create_index([("student_id", 1), ("date", -1)])
        await db.live_classes.create_index("scheduled_time")
        
        # Magazine articles indexes
        await db.magazine_articles.create_index([("age_group", 1), ("status", 1)])
        await db.magazine_articles.create_index("created_at")
        
        logger.info("✓ Database indexes created successfully")
    except Exception as e:
        logger.error(f"Error creating indexes: {str(e)}")

# Include router after all routes are defined
app.include_router(api_router)

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    # Create database indexes for performance
    await create_indexes()
    # Initialize the reminder scheduler
    init_reminder_scheduler(db, notify_class_reminder)
    # Initialize the progress report scheduler
    init_progress_scheduler(db, notify_progress_report)
    logger.info("TEC Platform started with automated class reminders and weekly progress reports enabled")

@app.on_event("shutdown")
async def shutdown_db_client():
    shutdown_reminder_scheduler()
    shutdown_progress_scheduler()
    client.close()