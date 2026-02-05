"""
Examination Evaluation Bureau - Grade 5 Scholarship Exam Platform
Backend API - FastAPI + MongoDB
"""

from fastapi import FastAPI, HTTPException, Depends, status, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime, timedelta, timezone
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
import jwt
from passlib.context import CryptContext
import uuid
from enum import Enum
import logging

# Load environment variables
load_dotenv()

# MongoDB setup
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(MONGO_URL)
db = client[os.environ.get('DB_NAME_EXAM', 'exam_bureau_db')]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.environ.get('SECRET_KEY', 'exam-bureau-secret-2024')
ALGORITHM = "HS256"
security = HTTPBearer()

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(title="Examination Evaluation Bureau API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# MODELS & ENUMS
# ============================================================================

class UserRole(str, Enum):
    STUDENT = "student"
    PARENT = "parent"
    TEACHER = "teacher"
    ADMIN = "admin"

class Grade(str, Enum):
    GRADE_2 = "grade_2"
    GRADE_3 = "grade_3"
    GRADE_4 = "grade_4"
    GRADE_5 = "grade_5"

class SkillArea(str, Enum):
    MATHEMATICAL_REASONING = "mathematical_reasoning"
    LANGUAGE_PROFICIENCY = "language_proficiency"
    GENERAL_KNOWLEDGE = "general_knowledge"
    COMPREHENSION_SKILLS = "comprehension_skills"
    PROBLEM_SOLVING = "problem_solving"
    LOGICAL_THINKING = "logical_thinking"
    SPATIAL_REASONING = "spatial_reasoning"
    MEMORY_RECALL = "memory_recall"
    ANALYTICAL_SKILLS = "analytical_skills"
    CRITICAL_THINKING = "critical_thinking"

class ExamStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    CLOSED = "closed"

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    full_name: str
    role: UserRole
    hashed_password: str
    grade: Optional[Grade] = None  # For students
    parent_id: Optional[str] = None  # Link student to parent
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_active: bool = True

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    role: UserRole
    grade: Optional[Grade] = None

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class MCQOption(BaseModel):
    option_id: str
    text: str
    is_correct: bool

class MCQQuestion(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    question_number: int
    question_text: str
    options: List[MCQOption]  # 5 options
    correct_option_id: str
    skill_area: SkillArea
    marks: int = 1

class Exam(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    grade: Grade
    month: str  # e.g., "2024-01" for January 2024
    paper1_questions: List[MCQQuestion] = []  # 60 questions
    paper2_essay_prompt: str = ""  # 1 essay question
    paper2_short_questions: List[str] = []  # 10 short answer prompts
    duration_minutes: int = 60  # Paper 1 duration
    total_marks_paper1: int = 60
    total_marks_paper2: int = 40  # Essay 20 + Short answers 20
    status: ExamStatus = ExamStatus.DRAFT
    created_by: str  # Teacher ID
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    published_at: Optional[datetime] = None

class ExamAttempt(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    exam_id: str
    student_id: str
    started_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    submitted_at: Optional[datetime] = None
    answers: Dict[str, str] = {}  # question_id -> selected_option_id
    time_taken_seconds: int = 0
    score_paper1: int = 0
    skill_scores: Dict[str, int] = {}  # skill -> score
    is_completed: bool = False

class Paper2Submission(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    exam_id: str
    student_id: str
    submitted_via: str = "whatsapp"  # How submitted
    whatsapp_reference: Optional[str] = None  # Message ID or note
    teacher_id: Optional[str] = None  # Who marked it
    essay_marks: int = 0  # Out of 20
    short_answer_marks: List[int] = []  # 10 marks, each out of 2
    total_marks: int = 0
    teacher_comments: Optional[str] = None
    marked_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ============================================================================
# AUTH HELPERS
# ============================================================================

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=7)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user_doc = await db.users.find_one({"id": user_id}, {"_id": 0, "hashed_password": 0})
        if not user_doc:
            raise HTTPException(status_code=401, detail="User not found")
        
        return User(**user_doc)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid authentication")

# ============================================================================
# AUTH ENDPOINTS
# ============================================================================

@app.post("/api/register", response_model=dict)
async def register_user(user_data: UserCreate):
    """Register new user"""
    # Check if email exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    hashed_password = get_password_hash(user_data.password)
    
    new_user = {
        "id": str(uuid.uuid4()),
        "email": user_data.email,
        "full_name": user_data.full_name,
        "role": user_data.role.value,
        "grade": user_data.grade.value if user_data.grade else None,
        "hashed_password": hashed_password,
        "created_at": datetime.now(timezone.utc),
        "is_active": True
    }
    
    await db.users.insert_one(new_user)
    
    new_user.pop("hashed_password")
    return new_user

@app.post("/api/login", response_model=Token)
async def login(login_data: UserLogin):
    """Login user"""
    user_doc = await db.users.find_one({"email": login_data.email})
    
    if not user_doc or not verify_password(login_data.password, user_doc["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user_doc.get("is_active", True):
        raise HTTPException(status_code=403, detail="Account inactive")
    
    # Create token
    access_token = create_access_token({"sub": user_doc["id"]})
    
    user_doc.pop("_id", None)
    user_doc.pop("hashed_password", None)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_doc
    }

# ============================================================================
# EXAM MANAGEMENT (TEACHER/ADMIN)
# ============================================================================

@app.post("/api/exams/create")
async def create_exam(exam_data: dict, current_user: User = Depends(get_current_user)):
    """Create new exam (teacher/admin only)"""
    if current_user.role not in [UserRole.TEACHER, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Only teachers/admins can create exams")
    
    exam = {
        "id": str(uuid.uuid4()),
        "title": exam_data["title"],
        "grade": exam_data["grade"],
        "month": exam_data["month"],
        "paper1_questions": exam_data.get("paper1_questions", []),
        "paper2_essay_prompt": exam_data.get("paper2_essay_prompt", ""),
        "paper2_short_questions": exam_data.get("paper2_short_questions", []),
        "duration_minutes": exam_data.get("duration_minutes", 60),
        "total_marks_paper1": exam_data.get("total_marks_paper1", 60),
        "total_marks_paper2": exam_data.get("total_marks_paper2", 40),
        "status": "draft",
        "created_by": current_user.id,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.exams.insert_one(exam)
    exam.pop("_id")
    return exam

@app.get("/api/exams")
async def list_exams(grade: Optional[str] = None, status: Optional[str] = None):
    """List exams (filter by grade/status)"""
    query = {}
    if grade:
        query["grade"] = grade
    if status:
        query["status"] = status
    
    exams = await db.exams.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"exams": exams}

@app.get("/api/exams/{exam_id}")
async def get_exam(exam_id: str):
    """Get exam details"""
    exam = await db.exams.find_one({"id": exam_id}, {"_id": 0})
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    return exam

@app.put("/api/exams/{exam_id}/publish")
async def publish_exam(exam_id: str, current_user: User = Depends(get_current_user)):
    """Publish exam (make available to students)"""
    if current_user.role not in [UserRole.TEACHER, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    result = await db.exams.update_one(
        {"id": exam_id},
        {
            "$set": {
                "status": "published",
                "published_at": datetime.now(timezone.utc)
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    return {"message": "Exam published successfully"}

# ============================================================================
# PAPER 1 - MCQ EXAM TAKING
# ============================================================================

@app.post("/api/exams/{exam_id}/start")
async def start_exam(exam_id: str, current_user: User = Depends(get_current_user)):
    """Start Paper 1 MCQ exam"""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can take exams")
    
    # Get exam
    exam = await db.exams.find_one({"id": exam_id, "status": "published"}, {"_id": 0})
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found or not published")
    
    # Check if student already has active attempt
    existing_attempt = await db.attempts.find_one({
        "exam_id": exam_id,
        "student_id": current_user.id,
        "is_completed": False
    })
    
    if existing_attempt:
        existing_attempt.pop("_id")
        return {"attempt": existing_attempt, "resume": True}
    
    # Create new attempt
    attempt = {
        "id": str(uuid.uuid4()),
        "exam_id": exam_id,
        "student_id": current_user.id,
        "started_at": datetime.now(timezone.utc),
        "answers": {},
        "time_taken_seconds": 0,
        "is_completed": False
    }
    
    await db.attempts.insert_one(attempt)
    attempt.pop("_id")
    
    # Return exam questions (shuffled if needed)
    return {
        "attempt": attempt,
        "exam": {
            "id": exam["id"],
            "title": exam["title"],
            "duration_minutes": exam["duration_minutes"],
            "questions": exam["paper1_questions"]
        },
        "resume": False
    }

@app.post("/api/attempts/{attempt_id}/save")
async def save_answer(
    attempt_id: str,
    answer_data: dict,
    current_user: User = Depends(get_current_user)
):
    """Save answer for a question (auto-save during exam)"""
    attempt = await db.attempts.find_one({"id": attempt_id, "student_id": current_user.id})
    
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    
    if attempt.get("is_completed"):
        raise HTTPException(status_code=400, detail="Exam already submitted")
    
    # Update answer
    question_id = answer_data["question_id"]
    selected_option = answer_data["selected_option"]
    
    await db.attempts.update_one(
        {"id": attempt_id},
        {"$set": {f"answers.{question_id}": selected_option}}
    )
    
    return {"message": "Answer saved"}

@app.post("/api/attempts/{attempt_id}/submit")
async def submit_exam(
    attempt_id: str,
    current_user: User = Depends(get_current_user)
):
    """Submit Paper 1 and auto-grade"""
    attempt = await db.attempts.find_one({"id": attempt_id, "student_id": current_user.id})
    
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    
    if attempt.get("is_completed"):
        raise HTTPException(status_code=400, detail="Already submitted")
    
    # Get exam with answers
    exam = await db.exams.find_one({"id": attempt["exam_id"]}, {"_id": 0})
    
    # Auto-grade
    score = 0
    skill_scores = {skill.value: 0 for skill in SkillArea}
    skill_totals = {skill.value: 0 for skill in SkillArea}
    
    for question in exam["paper1_questions"]:
        q_id = question["id"]
        student_answer = attempt["answers"].get(q_id)
        correct_answer = question["correct_option_id"]
        skill = question["skill_area"]
        marks = question.get("marks", 1)
        
        skill_totals[skill] += marks
        
        if student_answer == correct_answer:
            score += marks
            skill_scores[skill] += marks
    
    # Calculate skill percentages
    skill_percentages = {}
    for skill, earned in skill_scores.items():
        total = skill_totals[skill]
        percentage = (earned / total * 100) if total > 0 else 0
        skill_percentages[skill] = round(percentage, 1)
    
    # Calculate time taken
    time_taken = (datetime.now(timezone.utc) - attempt["started_at"]).total_seconds()
    
    # Update attempt
    await db.attempts.update_one(
        {"id": attempt_id},
        {
            "$set": {
                "submitted_at": datetime.now(timezone.utc),
                "time_taken_seconds": int(time_taken),
                "score_paper1": score,
                "skill_scores": skill_scores,
                "skill_percentages": skill_percentages,
                "is_completed": True
            }
        }
    )
    
    return {
        "score": score,
        "total": exam["total_marks_paper1"],
        "percentage": round(score / exam["total_marks_paper1"] * 100, 1),
        "skill_scores": skill_scores,
        "skill_percentages": skill_percentages,
        "time_taken_seconds": int(time_taken)
    }

# ============================================================================
# PAPER 2 - MANUAL MARKING
# ============================================================================

@app.post("/api/paper2/submit-meta")
async def submit_paper2_meta(
    submission_data: dict,
    current_user: User = Depends(get_current_user)
):
    """Student/Parent records that Paper 2 was submitted via WhatsApp"""
    if current_user.role not in [UserRole.STUDENT, UserRole.PARENT]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    submission = {
        "id": str(uuid.uuid4()),
        "exam_id": submission_data["exam_id"],
        "student_id": submission_data.get("student_id", current_user.id),
        "submitted_via": "whatsapp",
        "whatsapp_reference": submission_data.get("whatsapp_reference", ""),
        "short_answer_marks": [0] * 10,  # Initialize with zeros
        "essay_marks": 0,
        "total_marks": 0,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.paper2_submissions.insert_one(submission)
    submission.pop("_id")
    return submission

@app.put("/api/paper2/{submission_id}/mark")
async def mark_paper2(
    submission_id: str,
    marks_data: dict,
    current_user: User = Depends(get_current_user)
):
    """Teacher marks Paper 2"""
    if current_user.role not in [UserRole.TEACHER, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Only teachers can mark exams")
    
    essay_marks = marks_data.get("essay_marks", 0)
    short_answer_marks = marks_data.get("short_answer_marks", [0] * 10)
    total = essay_marks + sum(short_answer_marks)
    
    await db.paper2_submissions.update_one(
        {"id": submission_id},
        {
            "$set": {
                "teacher_id": current_user.id,
                "essay_marks": essay_marks,
                "short_answer_marks": short_answer_marks,
                "total_marks": total,
                "teacher_comments": marks_data.get("comments", ""),
                "marked_at": datetime.now(timezone.utc)
            }
        }
    )
    
    return {"message": "Paper 2 marked successfully", "total_marks": total}

# ============================================================================
# RESULTS & PROGRESS
# ============================================================================

@app.get("/api/students/{student_id}/progress")
async def get_student_progress(student_id: str, current_user: User = Depends(get_current_user)):
    """Get student progress across all monthly exams (blood report style)"""
    
    # Get all attempts for student
    attempts = await db.attempts.find(
        {"student_id": student_id, "is_completed": True},
        {"_id": 0}
    ).sort("submitted_at", 1).to_list(100)
    
    # Get Paper 2 submissions
    paper2_subs = await db.paper2_submissions.find(
        {"student_id": student_id, "marked_at": {"$exists": True}},
        {"_id": 0}
    ).to_list(100)
    
    # Build monthly progress
    monthly_progress = []
    skill_trends = {skill.value: [] for skill in SkillArea}
    
    for attempt in attempts:
        exam = await db.exams.find_one({"id": attempt["exam_id"]}, {"_id": 0, "month": 1, "title": 1})
        
        # Find corresponding Paper 2
        paper2 = next((p for p in paper2_subs if p["exam_id"] == attempt["exam_id"]), None)
        paper2_score = paper2["total_marks"] if paper2 else 0
        
        month_data = {
            "month": exam["month"],
            "exam_title": exam["title"],
            "paper1_score": attempt["score_paper1"],
            "paper2_score": paper2_score,
            "total_score": attempt["score_paper1"] + paper2_score,
            "total_possible": 100,  # 60 + 40
            "skill_percentages": attempt.get("skill_percentages", {}),
            "submitted_at": attempt["submitted_at"]
        }
        
        monthly_progress.append(month_data)
        
        # Add to trends
        for skill, percentage in attempt.get("skill_percentages", {}).items():
            skill_trends[skill].append({
                "month": exam["month"],
                "percentage": percentage
            })
    
    # Calculate strengths & weaknesses (latest month)
    if attempts:
        latest_skills = attempts[-1].get("skill_percentages", {})
        sorted_skills = sorted(latest_skills.items(), key=lambda x: x[1], reverse=True)
        
        strengths = sorted_skills[:3]  # Top 3
        weaknesses = sorted_skills[-3:]  # Bottom 3
    else:
        strengths = []
        weaknesses = []
    
    return {
        "student_id": student_id,
        "monthly_progress": monthly_progress,
        "skill_trends": skill_trends,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "total_exams_taken": len(attempts)
    }

@app.get("/api/")
async def root():
    """API root"""
    return {
        "message": "Examination Evaluation Bureau API",
        "version": "1.0.0",
        "status": "operational"
    }

# ============================================================================
# STARTUP
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Create indexes"""
    try:
        await db.users.create_index("email", unique=True)
        await db.exams.create_index([("grade", 1), ("month", 1)])
        await db.attempts.create_index([("student_id", 1), ("exam_id", 1)])
        await db.paper2_submissions.create_index([("student_id", 1), ("exam_id", 1)])
        logger.info("✓ Database indexes created")
    except Exception as e:
        logger.error(f"Error creating indexes: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
