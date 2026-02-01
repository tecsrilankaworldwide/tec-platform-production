"""
Gamification Service for TecaiKids Educational Platform
Handles points, XP, badges, achievements, and leaderboards
"""
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from enum import Enum
from pydantic import BaseModel, Field

class BadgeType(str, Enum):
    # Learning milestones
    FIRST_LESSON = "first_lesson"
    COURSE_COMPLETE = "course_complete"
    PERFECT_QUIZ = "perfect_quiz"
    STREAK_3 = "streak_3"
    STREAK_7 = "streak_7"
    STREAK_30 = "streak_30"
    
    # Skill badges
    AI_EXPLORER = "ai_explorer"
    LOGIC_MASTER = "logic_master"
    CREATIVE_THINKER = "creative_thinker"
    PROBLEM_SOLVER = "problem_solver"
    
    # Activity badges
    CHAT_CHAMPION = "chat_champion"
    QUIZ_WIZARD = "quiz_wizard"
    VIDEO_VIEWER = "video_viewer"
    HELPER = "helper"
    
    # Level badges
    LEVEL_5 = "level_5"
    LEVEL_10 = "level_10"
    LEVEL_25 = "level_25"
    LEVEL_50 = "level_50"

class Badge(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    badge_type: BadgeType
    name: str
    description: str
    icon: str  # emoji or icon name
    rarity: str  # common, rare, epic, legendary
    points_reward: int
    unlocked_at: Optional[datetime] = None

# Badge definitions
BADGES = {
    BadgeType.FIRST_LESSON: Badge(
        badge_type=BadgeType.FIRST_LESSON,
        name="First Steps",
        description="Completed your first lesson!",
        icon="🎯",
        rarity="common",
        points_reward=50
    ),
    BadgeType.COURSE_COMPLETE: Badge(
        badge_type=BadgeType.COURSE_COMPLETE,
        name="Course Champion",
        description="Finished an entire course!",
        icon="🏆",
        rarity="rare",
        points_reward=200
    ),
    BadgeType.PERFECT_QUIZ: Badge(
        badge_type=BadgeType.PERFECT_QUIZ,
        name="Perfect Score",
        description="Scored 100% on a quiz!",
        icon="⭐",
        rarity="rare",
        points_reward=100
    ),
    BadgeType.STREAK_3: Badge(
        badge_type=BadgeType.STREAK_3,
        name="Getting Started",
        description="3 day learning streak!",
        icon="🔥",
        rarity="common",
        points_reward=75
    ),
    BadgeType.STREAK_7: Badge(
        badge_type=BadgeType.STREAK_7,
        name="Week Warrior",
        description="7 day learning streak!",
        icon="💪",
        rarity="rare",
        points_reward=150
    ),
    BadgeType.STREAK_30: Badge(
        badge_type=BadgeType.STREAK_30,
        name="Dedication Master",
        description="30 day learning streak!",
        icon="🌟",
        rarity="legendary",
        points_reward=500
    ),
    BadgeType.AI_EXPLORER: Badge(
        badge_type=BadgeType.AI_EXPLORER,
        name="AI Explorer",
        description="Had 10 conversations with AI tutor",
        icon="🤖",
        rarity="common",
        points_reward=100
    ),
    BadgeType.LOGIC_MASTER: Badge(
        badge_type=BadgeType.LOGIC_MASTER,
        name="Logic Master",
        description="Solved 20 logic puzzles",
        icon="🧩",
        rarity="rare",
        points_reward=200
    ),
    BadgeType.CREATIVE_THINKER: Badge(
        badge_type=BadgeType.CREATIVE_THINKER,
        name="Creative Thinker",
        description="Completed creative problem solving challenges",
        icon="💡",
        rarity="rare",
        points_reward=150
    ),
    BadgeType.CHAT_CHAMPION: Badge(
        badge_type=BadgeType.CHAT_CHAMPION,
        name="Chat Champion",
        description="50 messages with AI tutor",
        icon="💬",
        rarity="epic",
        points_reward=250
    ),
    BadgeType.QUIZ_WIZARD: Badge(
        badge_type=BadgeType.QUIZ_WIZARD,
        name="Quiz Wizard",
        description="Completed 10 quizzes",
        icon="📝",
        rarity="rare",
        points_reward=175
    ),
    BadgeType.VIDEO_VIEWER: Badge(
        badge_type=BadgeType.VIDEO_VIEWER,
        name="Video Viewer",
        description="Watched 20 lesson videos",
        icon="🎬",
        rarity="common",
        points_reward=100
    ),
    BadgeType.LEVEL_5: Badge(
        badge_type=BadgeType.LEVEL_5,
        name="Rising Star",
        description="Reached Level 5!",
        icon="⭐",
        rarity="common",
        points_reward=100
    ),
    BadgeType.LEVEL_10: Badge(
        badge_type=BadgeType.LEVEL_10,
        name="Super Learner",
        description="Reached Level 10!",
        icon="🌟",
        rarity="rare",
        points_reward=250
    ),
    BadgeType.LEVEL_25: Badge(
        badge_type=BadgeType.LEVEL_25,
        name="Knowledge Seeker",
        description="Reached Level 25!",
        icon="🎖️",
        rarity="epic",
        points_reward=500
    ),
    BadgeType.LEVEL_50: Badge(
        badge_type=BadgeType.LEVEL_50,
        name="Future Leader",
        description="Reached Level 50!",
        icon="👑",
        rarity="legendary",
        points_reward=1000
    )
}

# XP required per level (progressive)
def get_xp_for_level(level: int) -> int:
    """Calculate XP required to reach a level"""
    return int(100 * (level ** 1.5))

def get_level_from_xp(total_xp: int) -> int:
    """Calculate level from total XP"""
    level = 1
    while get_xp_for_level(level + 1) <= total_xp:
        level += 1
    return level

# Points rewards for different actions
POINT_REWARDS = {
    "lesson_complete": 25,
    "video_watched": 15,
    "quiz_complete": 30,
    "quiz_perfect": 50,
    "workout_complete": 20,
    "workout_correct": 35,
    "ai_chat_message": 5,
    "daily_login": 10,
    "course_complete": 100,
    "certificate_earned": 150,
}

class GamificationStats(BaseModel):
    """Student gamification statistics"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    total_points: int = 0
    total_xp: int = 0
    level: int = 1
    current_streak: int = 0
    longest_streak: int = 0
    last_activity_date: Optional[datetime] = None
    badges_earned: List[str] = []  # List of BadgeType values
    lessons_completed: int = 0
    quizzes_completed: int = 0
    videos_watched: int = 0
    ai_messages_sent: int = 0
    workouts_completed: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LeaderboardEntry(BaseModel):
    """Leaderboard entry"""
    rank: int
    student_id: str
    student_name: str
    avatar_emoji: str = "👤"
    total_points: int
    level: int
    badges_count: int

async def get_badge_info(badge_type: str) -> Dict[str, Any]:
    """Get badge information"""
    try:
        badge_enum = BadgeType(badge_type)
        badge = BADGES.get(badge_enum)
        if badge:
            return badge.dict()
    except ValueError:
        pass
    return None

async def get_all_badges() -> List[Dict[str, Any]]:
    """Get all available badges"""
    return [badge.dict() for badge in BADGES.values()]
