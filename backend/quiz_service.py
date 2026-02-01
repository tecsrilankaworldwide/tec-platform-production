"""
Quiz and Assessment Service for TecaiKids Educational Platform
Interactive quizzes with auto-grading
"""
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from enum import Enum
from pydantic import BaseModel, Field

class QuestionType(str, Enum):
    MULTIPLE_CHOICE = "multiple_choice"
    TRUE_FALSE = "true_false"
    FILL_BLANK = "fill_blank"
    MATCHING = "matching"
    ORDERING = "ordering"

class DifficultyLevel(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

class Question(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    question_type: QuestionType
    question_text: str
    options: Optional[List[str]] = None  # For multiple choice
    correct_answer: Any  # Can be string, int, list, or dict depending on type
    explanation: Optional[str] = None
    points: int = 10
    difficulty: DifficultyLevel = DifficultyLevel.MEDIUM
    image_url: Optional[str] = None
    hint: Optional[str] = None

class Quiz(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: Optional[str] = None
    subject: str
    learning_level: str  # foundation, development, mastery
    age_group: str
    questions: List[Question]
    time_limit_minutes: Optional[int] = None
    passing_score: int = 60  # percentage
    total_points: int = 0
    created_by: str  # teacher id
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class QuizAttempt(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    quiz_id: str
    student_id: str
    answers: Dict[str, Any] = {}  # question_id -> student answer
    score: int = 0
    total_points: int = 0
    percentage: float = 0.0
    passed: bool = False
    time_taken_seconds: int = 0
    started_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None
    results: List[Dict[str, Any]] = []  # Detailed results per question

# Sample quizzes for different levels
SAMPLE_QUIZZES = [
    {
        "title": "AI Basics for Young Minds",
        "description": "Learn about artificial intelligence in a fun way!",
        "subject": "AI Literacy",
        "learning_level": "foundation",
        "age_group": "5-8",
        "questions": [
            {
                "question_type": "multiple_choice",
                "question_text": "What does AI stand for?",
                "options": ["Amazing Internet", "Artificial Intelligence", "Automatic Ideas", "Animal Information"],
                "correct_answer": "Artificial Intelligence",
                "explanation": "AI stands for Artificial Intelligence - computers that can think and learn!",
                "points": 10,
                "difficulty": "easy"
            },
            {
                "question_type": "true_false",
                "question_text": "Robots can talk to us because of AI",
                "correct_answer": True,
                "explanation": "Yes! AI helps robots understand and respond to what we say.",
                "points": 10,
                "difficulty": "easy"
            },
            {
                "question_type": "multiple_choice",
                "question_text": "Which of these uses AI?",
                "options": ["A regular book", "A toy car without batteries", "Voice assistants like Siri", "A paper airplane"],
                "correct_answer": "Voice assistants like Siri",
                "explanation": "Voice assistants use AI to understand what you're saying and help you!",
                "points": 10,
                "difficulty": "easy"
            }
        ],
        "time_limit_minutes": 10,
        "passing_score": 60
    },
    {
        "title": "Logical Thinking Challenge",
        "description": "Test your problem-solving skills!",
        "subject": "Logical Thinking",
        "learning_level": "development",
        "age_group": "9-12",
        "questions": [
            {
                "question_type": "multiple_choice",
                "question_text": "What comes next in the pattern: 2, 4, 8, 16, ?",
                "options": ["20", "24", "32", "18"],
                "correct_answer": "32",
                "explanation": "Each number is multiplied by 2. So 16 × 2 = 32",
                "points": 15,
                "difficulty": "medium"
            },
            {
                "question_type": "fill_blank",
                "question_text": "If all cats are animals, and Whiskers is a cat, then Whiskers is a(n) ____",
                "correct_answer": "animal",
                "explanation": "This is called deductive reasoning - if all cats are animals, any cat must be an animal!",
                "points": 15,
                "difficulty": "medium"
            },
            {
                "question_type": "multiple_choice",
                "question_text": "Complete the analogy: Book is to Reading as Fork is to ____",
                "options": ["Kitchen", "Eating", "Silver", "Cooking"],
                "correct_answer": "Eating",
                "explanation": "A book is used for reading, just like a fork is used for eating!",
                "points": 15,
                "difficulty": "medium"
            },
            {
                "question_type": "true_false",
                "question_text": "In the sequence 1, 1, 2, 3, 5, 8, each number is the sum of the two before it",
                "correct_answer": True,
                "explanation": "This is the Fibonacci sequence! 1+1=2, 1+2=3, 2+3=5, 3+5=8",
                "points": 20,
                "difficulty": "hard"
            }
        ],
        "time_limit_minutes": 15,
        "passing_score": 70
    },
    {
        "title": "Future Technology & AI",
        "description": "Explore advanced concepts in AI and future tech",
        "subject": "Advanced AI",
        "learning_level": "mastery",
        "age_group": "13-16",
        "questions": [
            {
                "question_type": "multiple_choice",
                "question_text": "What is Machine Learning?",
                "options": [
                    "Teaching machines to read books",
                    "A type of AI where computers learn from data without being explicitly programmed",
                    "Learning how to build machines",
                    "A type of robot"
                ],
                "correct_answer": "A type of AI where computers learn from data without being explicitly programmed",
                "explanation": "Machine Learning allows AI systems to learn patterns from data and improve over time!",
                "points": 20,
                "difficulty": "medium"
            },
            {
                "question_type": "multiple_choice",
                "question_text": "Which company created ChatGPT?",
                "options": ["Google", "Microsoft", "OpenAI", "Apple"],
                "correct_answer": "OpenAI",
                "explanation": "ChatGPT was created by OpenAI, an AI research company.",
                "points": 15,
                "difficulty": "easy"
            },
            {
                "question_type": "true_false",
                "question_text": "Neural networks in AI are inspired by the human brain",
                "correct_answer": True,
                "explanation": "Yes! Neural networks mimic how neurons in our brain connect and process information.",
                "points": 20,
                "difficulty": "medium"
            },
            {
                "question_type": "multiple_choice",
                "question_text": "What ethical concern is important when developing AI?",
                "options": [
                    "Making AI colorful",
                    "Ensuring AI is fair and doesn't discriminate",
                    "Making AI expensive",
                    "Keeping AI a secret"
                ],
                "correct_answer": "Ensuring AI is fair and doesn't discriminate",
                "explanation": "AI ethics involves ensuring AI systems are fair, transparent, and don't harm people.",
                "points": 25,
                "difficulty": "hard"
            }
        ],
        "time_limit_minutes": 20,
        "passing_score": 70
    }
]

def grade_answer(question: Dict, student_answer: Any) -> Dict[str, Any]:
    """Grade a single answer"""
    question_type = question.get("question_type")
    correct_answer = question.get("correct_answer")
    
    is_correct = False
    
    if question_type == "multiple_choice":
        is_correct = str(student_answer).strip().lower() == str(correct_answer).strip().lower()
    elif question_type == "true_false":
        # Handle various boolean representations
        if isinstance(student_answer, bool):
            is_correct = student_answer == correct_answer
        else:
            student_bool = str(student_answer).lower() in ['true', 'yes', '1']
            is_correct = student_bool == correct_answer
    elif question_type == "fill_blank":
        is_correct = str(student_answer).strip().lower() == str(correct_answer).strip().lower()
    elif question_type == "matching":
        is_correct = student_answer == correct_answer
    elif question_type == "ordering":
        is_correct = student_answer == correct_answer
    
    points_earned = question.get("points", 10) if is_correct else 0
    
    return {
        "question_id": question.get("id"),
        "is_correct": is_correct,
        "student_answer": student_answer,
        "correct_answer": correct_answer,
        "points_earned": points_earned,
        "max_points": question.get("points", 10),
        "explanation": question.get("explanation", "")
    }

def grade_quiz(quiz: Dict, answers: Dict[str, Any]) -> Dict[str, Any]:
    """Grade an entire quiz"""
    results = []
    total_points = 0
    earned_points = 0
    
    for question in quiz.get("questions", []):
        q_id = question.get("id")
        student_answer = answers.get(q_id)
        
        result = grade_answer(question, student_answer)
        results.append(result)
        
        total_points += result["max_points"]
        earned_points += result["points_earned"]
    
    percentage = (earned_points / total_points * 100) if total_points > 0 else 0
    passed = percentage >= quiz.get("passing_score", 60)
    
    return {
        "score": earned_points,
        "total_points": total_points,
        "percentage": round(percentage, 1),
        "passed": passed,
        "results": results,
        "passing_score": quiz.get("passing_score", 60)
    }
