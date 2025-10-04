from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime, timedelta
import hashlib
from jose import JWTError, jwt
import os
import uuid
import logging
from pathlib import Path
from dotenv import load_dotenv
import asyncpg
import json

# Load environment variables
load_dotenv()

# Database connection
class Database:
    def __init__(self):
        self.pool = None
    
    async def connect(self):
        database_url = os.environ.get('DATABASE_URL')
        if database_url and database_url.startswith('postgres://'):
            database_url = database_url.replace('postgres://', 'postgresql://', 1)
        
        self.pool = await asyncpg.create_pool(
            database_url or 'postgresql://localhost/tec_platform',
            min_size=1,
            max_size=10
        )
        await self.create_tables()
    
    async def create_tables(self):
        async with self.pool.acquire() as conn:
            await conn.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id VARCHAR PRIMARY KEY,
                    email VARCHAR UNIQUE NOT NULL,
                    full_name VARCHAR NOT NULL,
                    phone VARCHAR,
                    role VARCHAR DEFAULT 'parent',
                    password VARCHAR NOT NULL,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            await conn.execute('''
                CREATE TABLE IF NOT EXISTS programs (
                    id VARCHAR PRIMARY KEY,
                    name VARCHAR NOT NULL,
                    description TEXT,
                    age_range VARCHAR,
                    price_lkr INTEGER,
                    features JSONB,
                    level VARCHAR,
                    duration_months INTEGER DEFAULT 12
                )
            ''')
            
            await conn.execute('''
                CREATE TABLE IF NOT EXISTS children (
                    id VARCHAR PRIMARY KEY,
                    name VARCHAR NOT NULL,
                    age INTEGER,
                    parent_id VARCHAR,
                    program_id VARCHAR,
                    progress JSONB DEFAULT '{}',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            await conn.execute('''
                CREATE TABLE IF NOT EXISTS enrollments (
                    id VARCHAR PRIMARY KEY,
                    child_id VARCHAR,
                    program_id VARCHAR,
                    parent_id VARCHAR,
                    status VARCHAR DEFAULT 'pending',
                    payment_status VARCHAR DEFAULT 'pending',
                    monthly_fee INTEGER,
                    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            await conn.execute('''
                CREATE TABLE IF NOT EXISTS payments (
                    id VARCHAR PRIMARY KEY,
                    enrollment_id VARCHAR,
                    amount_lkr INTEGER,
                    payment_method VARCHAR,
                    status VARCHAR DEFAULT 'pending',
                    transaction_id VARCHAR,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
    
    async def insert_one(self, table: str, data: dict):
        columns = list(data.keys())
        placeholders = [f'${i+1}' for i in range(len(columns))]
        values = [json.dumps(v) if isinstance(v, (dict, list)) else v for v in data.values()]
        
        query = f'INSERT INTO {table} ({", ".join(columns)}) VALUES ({", ".join(placeholders)})'
        
        async with self.pool.acquire() as conn:
            await conn.execute(query, *values)
    
    async def find_one(self, table: str, filters: dict = None):
        if not filters:
            query = f'SELECT * FROM {table} LIMIT 1'
            values = []
        else:
            conditions = []
            values = []
            for i, (key, value) in enumerate(filters.items(), 1):
                conditions.append(f'{key} = ${i}')
                values.append(value)
            
            query = f'SELECT * FROM {table} WHERE {" AND ".join(conditions)} LIMIT 1'
        
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(query, *values)
            return dict(row) if row else None
    
    async def find(self, table: str, filters: dict = None, limit: int = 1000):
        if not filters:
            query = f'SELECT * FROM {table} ORDER BY created_at DESC LIMIT {limit}'
            values = []
        else:
            conditions = []
            values = []
            for i, (key, value) in enumerate(filters.items(), 1):
                conditions.append(f'{key} = ${i}')
                values.append(value)
            
            query = f'SELECT * FROM {table} WHERE {" AND ".join(conditions)} ORDER BY created_at DESC LIMIT {limit}'
        
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(query, *values)
            return [dict(row) for row in rows]
    
    async def count_documents(self, table: str, filters: dict = None):
        if not filters:
            query = f'SELECT COUNT(*) FROM {table}'
            values = []
        else:
            conditions = []
            values = []
            for i, (key, value) in enumerate(filters.items(), 1):
                conditions.append(f'{key} = ${i}')
                values.append(value)
            
            query = f'SELECT COUNT(*) FROM {table} WHERE {" AND ".join(conditions)}'
        
        async with self.pool.acquire() as conn:
            result = await conn.fetchval(query, *values)
            return result

# Initialize database
db = Database()

# Security
SECRET_KEY = os.environ.get('SECRET_KEY', 'tec-secret-key-2024')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

security = HTTPBearer()

# Create FastAPI app
app = FastAPI(title="TecaiKids Learning Platform API")
api_router = APIRouter(prefix="/api")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    role: str = "parent"

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Child(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    age: int
    parent_id: str
    program_id: Optional[str] = None
    progress: dict = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Program(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    age_range: str
    price_lkr: int
    features: List[str]
    level: str
    duration_months: int = 12

class EnrollmentRequest(BaseModel):
    child_name: str
    parent_name: str
    email: EmailStr
    phone: Optional[str] = None
    child_age: int
    program_id: str
    additional_message: Optional[str] = None

class Enrollment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    child_id: str
    program_id: str
    parent_id: str
    status: str = "pending"
    payment_status: str = "pending"
    monthly_fee: int
    start_date: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Payment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    enrollment_id: str
    amount_lkr: int
    payment_method: str
    status: str = "pending"
    transaction_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

# Authentication functions
def verify_password(plain_password, hashed_password):
    return hashlib.sha256(plain_password.encode()).hexdigest() == hashed_password

def get_password_hash(password):
    return hashlib.sha256(password.encode()).hexdigest()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = await db.find_one('users', {"email": email})
    if user is None:
        raise credentials_exception
    return User(**user)

# API Routes
@api_router.get("/")
async def root():
    return {"message": "TecaiKids Learning Platform API"}

@api_router.get("/programs")
async def get_programs():
    programs = await db.find('programs')
    return programs

@api_router.post("/enroll")
async def enroll_student(enrollment_request: EnrollmentRequest):
    try:
        # Check if user exists, if not create one
        existing_user = await db.find_one('users', {"email": enrollment_request.email})

        if not existing_user:
            # Create parent user
            temp_password = "temppass123"
            hashed_password = get_password_hash(temp_password)

            user_obj = User(
                email=enrollment_request.email,
                full_name=enrollment_request.parent_name,
                phone=enrollment_request.phone
            )
            user_data = user_obj.dict()
            user_data["password"] = hashed_password
            user_data["created_at"] = datetime.utcnow().isoformat()

            await db.insert_one('users', user_data)
            parent_id = user_obj.id
        else:
            parent_id = existing_user["id"]

        # Get program details
        program = await db.find_one('programs', {"id": enrollment_request.program_id})
        if not program:
            raise HTTPException(status_code=404, detail="Program not found")

        # Create child
        child_obj = Child(
            name=enrollment_request.child_name,
            age=enrollment_request.child_age,
            parent_id=parent_id,
            program_id=enrollment_request.program_id
        )
        child_data = child_obj.dict()
        child_data["created_at"] = datetime.utcnow().isoformat()
        await db.insert_one('children', child_data)

        # Create enrollment
        enrollment_obj = Enrollment(
            child_id=child_obj.id,
            program_id=enrollment_request.program_id,
            parent_id=parent_id,
            monthly_fee=program["price_lkr"]
        )
        enrollment_data = enrollment_obj.dict()
        enrollment_data["created_at"] = datetime.utcnow().isoformat()
        enrollment_data["start_date"] = datetime.utcnow().isoformat()
        await db.insert_one('enrollments', enrollment_data)

        return {
            "success": True,
            "enrollment_id": enrollment_obj.id,
            "message": "Enrollment created successfully",
            "temp_password": "temppass123" if not existing_user else None
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Startup event
@app.on_event("startup")
async def startup():
    await db.connect()
    
    # Check if programs exist
    existing_programs = await db.count_documents('programs')

    if existing_programs == 0:
        default_programs = [
            {
                "id": str(uuid.uuid4()),
                "name": "Foundation Level Program",
                "description": "Basic AI & Logic • Building blocks of future thinking",
                "age_range": "5-8 years",
                "price_lkr": 1200,
                "features": [
                    "Interactive learning activities",
                    "Basic AI literacy concepts", 
                    "Logical thinking fundamentals",
                    "Creative problem solving basics",
                    "Pattern recognition games",
                    "Age-appropriate challenges"
                ],
                "level": "foundation",
                "duration_months": 12
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Development Level Program",
                "description": "Logical Thinking & Creativity • Expanding cognitive abilities",
                "age_range": "9-12 years",
                "price_lkr": 1800,
                "features": [
                    "Advanced logical reasoning",
                    "Creative problem solving",
                    "AI literacy deep dive",
                    "Systems thinking introduction",
                    "Interactive brain workouts",
                    "Personalized learning paths"
                ],
                "level": "development",
                "duration_months": 12
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Mastery Level Program", 
                "description": "Future Career Skills • Leadership preparation",
                "age_range": "13-16 years",
                "price_lkr": 2800,
                "features": [
                    "Future career preparation",
                    "Advanced AI applications",
                    "Innovation methodologies", 
                    "Leadership development",
                    "Entrepreneurship basics",
                    "Real-world project experience"
                ],
                "level": "mastery",
                "duration_months": 12
            }
        ]

        for program in default_programs:
            await db.insert_one('programs', program)

    # Create default admin user
    admin_exists = await db.find_one('users', {"role": "admin"})
    if not admin_exists:
        admin_user = {
            "id": str(uuid.uuid4()),
            "email": "admin@tecaikids.com",
            "full_name": "Admin User",
            "phone": "+94771234567",
            "role": "admin",
            "password": get_password_hash("admin123"),
            "is_active": True,
            "created_at": datetime.utcnow().isoformat()
        }
        await db.insert_one('users', admin_user)

# Include router
app.include_router(api_router)

# Serve static files for React frontend
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

app.mount("/static", StaticFiles(directory="frontend/build/static"), name="static")

@app.get("/{full_path:path}")
async def serve_react_app(full_path: str):
    return FileResponse("frontend/build/index.html")
