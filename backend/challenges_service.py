"""
Daily/Weekly Challenges Service for TEC Educational Platform
Provides engaging challenges to boost student learning and engagement
"""

from datetime import datetime, timedelta, timezone
from typing import Optional, List
from pydantic import BaseModel
from enum import Enum
import random


class ChallengeType(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"


class ChallengeDifficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class ChallengeCategory(str, Enum):
    LOGIC = "logic"
    CODING = "coding"
    CREATIVITY = "creativity"
    AI_LITERACY = "ai_literacy"
    PROBLEM_SOLVING = "problem_solving"
    QUIZ = "quiz"


class Challenge(BaseModel):
    id: str
    title: str
    description: str
    challenge_type: ChallengeType
    category: ChallengeCategory
    difficulty: ChallengeDifficulty
    points_reward: int
    xp_reward: int
    time_limit_minutes: Optional[int] = None
    start_date: datetime
    end_date: datetime
    tasks: List[dict]  # List of task items
    badge_reward: Optional[str] = None
    age_groups: List[str] = ["5-8", "9-12", "13-16"]


class ChallengeProgress(BaseModel):
    user_id: str
    challenge_id: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    tasks_completed: List[str] = []
    is_completed: bool = False
    points_earned: int = 0
    xp_earned: int = 0


# Challenge Templates
DAILY_CHALLENGE_TEMPLATES = [
    {
        "title": "Logic Puzzle Master",
        "description": "Solve 3 logic puzzles to sharpen your thinking skills!",
        "category": ChallengeCategory.LOGIC,
        "difficulty": ChallengeDifficulty.MEDIUM,
        "points_reward": 50,
        "xp_reward": 25,
        "time_limit_minutes": 30,
        "tasks": [
            {"id": "task1", "title": "Complete a pattern recognition puzzle", "type": "puzzle"},
            {"id": "task2", "title": "Solve a sequence problem", "type": "puzzle"},
            {"id": "task3", "title": "Crack a logic riddle", "type": "puzzle"}
        ]
    },
    {
        "title": "AI Explorer",
        "description": "Learn something new about AI today!",
        "category": ChallengeCategory.AI_LITERACY,
        "difficulty": ChallengeDifficulty.EASY,
        "points_reward": 30,
        "xp_reward": 15,
        "time_limit_minutes": 20,
        "tasks": [
            {"id": "task1", "title": "Watch an AI concept video", "type": "video"},
            {"id": "task2", "title": "Chat with AI Tutor about a topic", "type": "ai_chat"},
            {"id": "task3", "title": "Complete the AI basics quiz", "type": "quiz"}
        ]
    },
    {
        "title": "Quick Quiz Champion",
        "description": "Test your knowledge with today's quiz!",
        "category": ChallengeCategory.QUIZ,
        "difficulty": ChallengeDifficulty.EASY,
        "points_reward": 40,
        "xp_reward": 20,
        "time_limit_minutes": 15,
        "tasks": [
            {"id": "task1", "title": "Complete any course quiz with 70%+ score", "type": "quiz"}
        ]
    },
    {
        "title": "Creative Thinker",
        "description": "Express your creativity today!",
        "category": ChallengeCategory.CREATIVITY,
        "difficulty": ChallengeDifficulty.MEDIUM,
        "points_reward": 45,
        "xp_reward": 22,
        "time_limit_minutes": 45,
        "tasks": [
            {"id": "task1", "title": "Design a solution to a real-world problem", "type": "creative"},
            {"id": "task2", "title": "Share your idea with AI Tutor for feedback", "type": "ai_chat"}
        ]
    },
    {
        "title": "Speed Learner",
        "description": "Complete a lesson in record time!",
        "category": ChallengeCategory.PROBLEM_SOLVING,
        "difficulty": ChallengeDifficulty.EASY,
        "points_reward": 35,
        "xp_reward": 18,
        "time_limit_minutes": 25,
        "tasks": [
            {"id": "task1", "title": "Watch a course video", "type": "video"},
            {"id": "task2", "title": "Complete the lesson quiz", "type": "quiz"}
        ]
    }
]

WEEKLY_CHALLENGE_TEMPLATES = [
    {
        "title": "Weekly Logic Marathon",
        "description": "Complete 10 logic challenges this week to earn the Logic Master badge!",
        "category": ChallengeCategory.LOGIC,
        "difficulty": ChallengeDifficulty.HARD,
        "points_reward": 200,
        "xp_reward": 100,
        "badge_reward": "logic_master",
        "tasks": [
            {"id": "task1", "title": "Complete 3 easy logic puzzles", "type": "puzzle", "count": 3},
            {"id": "task2", "title": "Complete 4 medium logic puzzles", "type": "puzzle", "count": 4},
            {"id": "task3", "title": "Complete 3 hard logic puzzles", "type": "puzzle", "count": 3}
        ]
    },
    {
        "title": "AI Knowledge Quest",
        "description": "Become an AI expert this week!",
        "category": ChallengeCategory.AI_LITERACY,
        "difficulty": ChallengeDifficulty.MEDIUM,
        "points_reward": 150,
        "xp_reward": 75,
        "badge_reward": "ai_explorer",
        "tasks": [
            {"id": "task1", "title": "Complete 5 AI lessons", "type": "lesson", "count": 5},
            {"id": "task2", "title": "Have 3 AI Tutor conversations", "type": "ai_chat", "count": 3},
            {"id": "task3", "title": "Score 80%+ on AI quiz", "type": "quiz"}
        ]
    },
    {
        "title": "Course Completionist",
        "description": "Finish an entire course this week!",
        "category": ChallengeCategory.PROBLEM_SOLVING,
        "difficulty": ChallengeDifficulty.HARD,
        "points_reward": 300,
        "xp_reward": 150,
        "badge_reward": "course_champion",
        "tasks": [
            {"id": "task1", "title": "Complete all lessons in a course", "type": "course"},
            {"id": "task2", "title": "Pass the final course quiz with 75%+", "type": "quiz"},
            {"id": "task3", "title": "Earn the course certificate", "type": "certificate"}
        ]
    },
    {
        "title": "Social Learner",
        "description": "Learn together with others!",
        "category": ChallengeCategory.CREATIVITY,
        "difficulty": ChallengeDifficulty.MEDIUM,
        "points_reward": 120,
        "xp_reward": 60,
        "tasks": [
            {"id": "task1", "title": "Attend a live class", "type": "live_class"},
            {"id": "task2", "title": "Complete 3 daily challenges", "type": "challenge", "count": 3},
            {"id": "task3", "title": "Reach top 10 on weekly leaderboard", "type": "leaderboard"}
        ]
    },
    {
        "title": "Quiz Master Week",
        "description": "Prove your knowledge across multiple subjects!",
        "category": ChallengeCategory.QUIZ,
        "difficulty": ChallengeDifficulty.MEDIUM,
        "points_reward": 175,
        "xp_reward": 85,
        "badge_reward": "quiz_master",
        "tasks": [
            {"id": "task1", "title": "Complete 5 different quizzes", "type": "quiz", "count": 5},
            {"id": "task2", "title": "Achieve 90%+ on any quiz", "type": "quiz"},
            {"id": "task3", "title": "Maintain 75%+ average across all quizzes", "type": "quiz"}
        ]
    }
]


def generate_daily_challenge(age_group: str = "9-12") -> Challenge:
    """Generate a new daily challenge"""
    template = random.choice(DAILY_CHALLENGE_TEMPLATES)
    
    now = datetime.now(timezone.utc)
    start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_day = start_of_day + timedelta(days=1) - timedelta(seconds=1)
    
    challenge_id = f"daily_{now.strftime('%Y%m%d')}_{template['category'].value}"
    
    return Challenge(
        id=challenge_id,
        title=template["title"],
        description=template["description"],
        challenge_type=ChallengeType.DAILY,
        category=template["category"],
        difficulty=template["difficulty"],
        points_reward=template["points_reward"],
        xp_reward=template["xp_reward"],
        time_limit_minutes=template.get("time_limit_minutes"),
        start_date=start_of_day,
        end_date=end_of_day,
        tasks=template["tasks"],
        badge_reward=template.get("badge_reward"),
        age_groups=[age_group] if age_group else ["5-8", "9-12", "13-16"]
    )


def generate_weekly_challenge(age_group: str = "9-12") -> Challenge:
    """Generate a new weekly challenge"""
    template = random.choice(WEEKLY_CHALLENGE_TEMPLATES)
    
    now = datetime.now(timezone.utc)
    # Start from Monday of current week
    start_of_week = now - timedelta(days=now.weekday())
    start_of_week = start_of_week.replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_week = start_of_week + timedelta(days=7) - timedelta(seconds=1)
    
    challenge_id = f"weekly_{start_of_week.strftime('%Y%m%d')}_{template['category'].value}"
    
    return Challenge(
        id=challenge_id,
        title=template["title"],
        description=template["description"],
        challenge_type=ChallengeType.WEEKLY,
        category=template["category"],
        difficulty=template["difficulty"],
        points_reward=template["points_reward"],
        xp_reward=template["xp_reward"],
        time_limit_minutes=None,  # Weekly challenges don't have time limits
        start_date=start_of_week,
        end_date=end_of_week,
        tasks=template["tasks"],
        badge_reward=template.get("badge_reward"),
        age_groups=[age_group] if age_group else ["5-8", "9-12", "13-16"]
    )


def get_challenge_status(challenge: Challenge) -> str:
    """Get the current status of a challenge"""
    now = datetime.now(timezone.utc)
    
    if now < challenge.start_date:
        return "upcoming"
    elif now > challenge.end_date:
        return "expired"
    else:
        return "active"


def calculate_time_remaining(challenge: Challenge) -> dict:
    """Calculate time remaining for a challenge"""
    now = datetime.now(timezone.utc)
    remaining = challenge.end_date - now
    
    if remaining.total_seconds() <= 0:
        return {"hours": 0, "minutes": 0, "expired": True}
    
    hours = int(remaining.total_seconds() // 3600)
    minutes = int((remaining.total_seconds() % 3600) // 60)
    
    return {
        "hours": hours,
        "minutes": minutes,
        "expired": False,
        "formatted": f"{hours}h {minutes}m" if hours > 0 else f"{minutes}m"
    }
