#!/usr/bin/env python3

import asyncio
import os
from datetime import datetime
import uuid
from motor.motor_asyncio import AsyncIOMotorClient

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(MONGO_URL)
db = client.tec_learning_platform

async def add_demo_data():
    # Sample courses for AI demonstration
    demo_courses = [
        {
            "id": str(uuid.uuid4()),
            "title": "Introduction to Artificial Intelligence",
            "description": "Comprehensive introduction to AI concepts, machine learning fundamentals, and practical applications in modern technology. Perfect for beginners wanting to understand AI.",
            "instructor_id": "demo-instructor-1", 
            "level": "beginner",
            "duration_hours": 40,
            "price": 199.99,
            "thumbnail": "https://images.unsplash.com/photo-1555255707-c07966088b7b?w=400",
            "is_published": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Machine Learning with Python",
            "description": "Hands-on machine learning course using Python, scikit-learn, and TensorFlow. Build real ML models and deploy them to production.",
            "instructor_id": "demo-instructor-1",
            "level": "intermediate", 
            "duration_hours": 60,
            "price": 299.99,
            "thumbnail": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400",
            "is_published": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Deep Learning & Neural Networks",
            "description": "Advanced deep learning course covering CNNs, RNNs, transformers, and cutting-edge architectures. Build state-of-the-art AI models.",
            "instructor_id": "demo-instructor-1",
            "level": "advanced",
            "duration_hours": 80,
            "price": 399.99,
            "thumbnail": "https://images.unsplash.com/photo-1507146426996-ef05306b995a?w=400",
            "is_published": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "AI Ethics and Responsible AI",
            "description": "Critical examination of AI ethics, bias in algorithms, privacy concerns, and building responsible AI systems for the future.",
            "instructor_id": "demo-instructor-1",
            "level": "intermediate",
            "duration_hours": 25,
            "price": 149.99,
            "thumbnail": "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400",
            "is_published": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    ]
    
    # Sample students for enrollment stats
    demo_students = [
        {
            "id": str(uuid.uuid4()),
            "email": "student1@university.com",
            "full_name": "Alice Chen",
            "role": "student",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "password": "hashed_password_demo"
        },
        {
            "id": str(uuid.uuid4()),
            "email": "student2@university.com", 
            "full_name": "Bob Martinez",
            "role": "student",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "password": "hashed_password_demo"
        },
        {
            "id": str(uuid.uuid4()),
            "email": "student3@university.com",
            "full_name": "Carol Kim",
            "role": "student", 
            "is_active": True,
            "created_at": datetime.utcnow(),
            "password": "hashed_password_demo"
        }
    ]
    
    # Sample enrollments
    demo_enrollments = []
    for i, student in enumerate(demo_students):
        for j, course in enumerate(demo_courses):
            if i + j < 7:  # Create varied enrollments
                demo_enrollments.append({
                    "id": str(uuid.uuid4()),
                    "student_id": student["id"],
                    "course_id": course["id"],
                    "enrolled_at": datetime.utcnow(),
                    "progress": min(90, (i + j) * 15),  # Varied progress
                    "completed": (i + j) % 3 == 0,
                    "completion_date": datetime.utcnow() if (i + j) % 3 == 0 else None
                })
    
    try:
        # Insert demo data
        if demo_courses:
            await db.courses.insert_many(demo_courses)
            print(f"✅ Added {len(demo_courses)} demo courses")
            
        if demo_students:
            await db.users.insert_many(demo_students)
            print(f"✅ Added {len(demo_students)} demo students")
            
        if demo_enrollments:
            await db.enrollments.insert_many(demo_enrollments)
            print(f"✅ Added {len(demo_enrollments)} demo enrollments")
            
        print("🎓 Demo data added successfully!")
        
    except Exception as e:
        print(f"Error adding demo data: {e}")

if __name__ == "__main__":
    asyncio.run(add_demo_data())