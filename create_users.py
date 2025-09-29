#!/usr/bin/env python3

import asyncio
import os
import hashlib
import uuid
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

async def create_demo_users():
    MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(MONGO_URL)
    db = client.tec_learning_platform
    
    # Clear existing users first
    await db.users.delete_many({})
    print("Cleared existing users")
    
    # Create demo users with proper password hashing
    demo_users = [
        {
            "id": str(uuid.uuid4()),
            "email": "admin@demo.com", 
            "full_name": "Demo Admin",
            "password": hash_password("password123"),
            "role": "instructor",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "profile_image": None,
            "bio": "AI Learning Platform Administrator"
        },
        {
            "id": str(uuid.uuid4()),
            "email": "instructor@demo.com",
            "full_name": "Dr. Sarah Chen", 
            "password": hash_password("password123"),
            "role": "instructor",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "profile_image": None,
            "bio": "AI and Machine Learning Expert"
        },
        {
            "id": str(uuid.uuid4()),
            "email": "student@demo.com",
            "full_name": "Alex Wang",
            "password": hash_password("password123"), 
            "role": "student",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "profile_image": None,
            "bio": "AI Student at Hong Kong University"
        }
    ]
    
    # Insert demo users
    await db.users.insert_many(demo_users)
    print(f"✅ Created {len(demo_users)} demo users")
    
    # Verify users were created
    users = await db.users.find({}, {"email": 1, "full_name": 1, "role": 1}).to_list(10)
    print("\n📋 Available Login Credentials:")
    for user in users:
        print(f"   Email: {user['email']} | Name: {user['full_name']} | Role: {user['role']}")
    
    print(f"\n🔑 Password for all accounts: password123")

if __name__ == "__main__":
    asyncio.run(create_demo_users())