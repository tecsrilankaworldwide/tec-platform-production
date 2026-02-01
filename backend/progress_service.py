"""
Weekly Progress Report Service for TEC Platform
Automatically sends WhatsApp progress summaries to parents every week
"""

import asyncio
import logging
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Optional
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

logger = logging.getLogger(__name__)

# Global scheduler instance
progress_scheduler: Optional[AsyncIOScheduler] = None
_db = None
_notify_func = None


def init_progress_scheduler(db, notify_progress_func):
    """Initialize the weekly progress report scheduler"""
    global progress_scheduler, _db, _notify_func
    
    _db = db
    _notify_func = notify_progress_func
    
    progress_scheduler = AsyncIOScheduler(timezone=timezone.utc)
    
    # Send weekly progress reports every Sunday at 6 PM UTC (11:30 PM Sri Lanka time)
    progress_scheduler.add_job(
        send_weekly_progress_reports,
        trigger=CronTrigger(day_of_week='sun', hour=18, minute=0),
        id='weekly_progress_report_job',
        name='Send weekly progress reports',
        replace_existing=True
    )
    
    progress_scheduler.start()
    logger.info("Weekly progress report scheduler started - runs every Sunday at 6 PM UTC")


def shutdown_progress_scheduler():
    """Shutdown the progress scheduler gracefully"""
    global progress_scheduler
    if progress_scheduler:
        progress_scheduler.shutdown(wait=False)
        logger.info("Progress report scheduler stopped")


async def send_weekly_progress_reports():
    """Send weekly progress reports to all active students' parents"""
    global _db, _notify_func
    
    if _db is None or _notify_func is None:
        logger.warning("Progress report service not properly initialized")
        return
    
    try:
        logger.info("Starting weekly progress report generation...")
        
        # Get all active students with parent contact info
        students = await _db.users.find({
            "role": "student",
            "$or": [
                {"parent_phone": {"$exists": True, "$ne": None}},
                {"phone": {"$exists": True, "$ne": None}}
            ]
        }).to_list(length=1000)
        
        logger.info(f"Found {len(students)} students for progress reports")
        
        for student in students:
            try:
                await send_student_progress_report(student)
            except Exception as e:
                logger.error(f"Error sending progress for student {student.get('id')}: {str(e)}")
        
        logger.info("Weekly progress reports completed")
        
    except Exception as e:
        logger.error(f"Error in weekly progress reports: {str(e)}")


async def send_student_progress_report(student: Dict):
    """Generate and send progress report for a single student"""
    global _db, _notify_func
    
    student_id = student.get("id")
    student_name = student.get("full_name", "Student")
    parent_phone = student.get("parent_phone") or student.get("phone")
    parent_name = student.get("parent_name", "Parent")
    
    if not parent_phone:
        logger.warning(f"No parent phone for student {student_id}")
        return
    
    # Calculate week date range
    now = datetime.now(timezone.utc)
    week_start = now - timedelta(days=7)
    
    # Get progress data for the past week
    progress_data = await get_student_weekly_progress(student_id, week_start, now)
    
    # Only send if there's some activity
    if progress_data["total_activities"] == 0:
        logger.info(f"No activity for student {student_id} this week, skipping report")
        return
    
    # Send the progress report
    result = await _notify_func(
        parent_phone=parent_phone,
        parent_name=parent_name,
        student_name=student_name,
        progress_data=progress_data
    )
    
    # Log the notification
    await _db.notification_logs.insert_one({
        "type": "weekly_progress",
        "student_id": student_id,
        "parent_phone": parent_phone,
        "progress_data": progress_data,
        "result": result,
        "week_start": week_start.isoformat(),
        "week_end": now.isoformat(),
        "sent_at": now.isoformat()
    })
    
    logger.info(f"Progress report sent for student {student_id}")


async def get_student_weekly_progress(student_id: str, week_start: datetime, week_end: datetime) -> Dict:
    """Get comprehensive progress data for a student's week"""
    global _db
    
    # Get video watch time
    video_progress = await _db.video_progress.find({
        "user_id": student_id,
        "last_watched": {"$gte": week_start.isoformat(), "$lte": week_end.isoformat()}
    }).to_list(length=100)
    
    total_watch_time = sum(v.get("watch_time", 0) for v in video_progress)
    videos_watched = len(video_progress)
    videos_completed = len([v for v in video_progress if v.get("completed", False)])
    
    # Get workout attempts
    workout_attempts = await _db.workout_attempts.find({
        "user_id": student_id,
        "started_at": {"$gte": week_start.isoformat(), "$lte": week_end.isoformat()}
    }).to_list(length=100)
    
    workouts_completed = len([w for w in workout_attempts if w.get("status") == "completed"])
    workouts_started = len(workout_attempts)
    
    # Calculate average score
    completed_with_score = [w for w in workout_attempts if w.get("score") is not None]
    avg_score = sum(w.get("score", 0) for w in completed_with_score) / len(completed_with_score) if completed_with_score else 0
    
    # Get courses enrolled/started this week
    enrollments = await _db.enrollments.find({
        "student_id": student_id,
        "created_at": {"$gte": week_start.isoformat(), "$lte": week_end.isoformat()}
    }).to_list(length=50)
    
    # Get scheduled lessons attended
    lessons_attended = await _db.scheduled_lessons.find({
        "student_id": student_id,
        "scheduled_time": {"$gte": week_start.isoformat(), "$lte": week_end.isoformat()},
        "status": {"$in": ["completed", "attended"]}
    }).to_list(length=50)
    
    # Determine skill highlights based on activity
    skill_highlights = []
    if workouts_completed > 0:
        skill_highlights.append("Logical Thinking")
    if videos_completed > 2:
        skill_highlights.append("AI Literacy")
    if avg_score >= 80:
        skill_highlights.append("Problem Solving")
    
    # Calculate engagement level
    total_activities = videos_watched + workouts_started + len(lessons_attended)
    if total_activities >= 10:
        engagement = "Excellent"
    elif total_activities >= 5:
        engagement = "Good"
    elif total_activities >= 1:
        engagement = "Moderate"
    else:
        engagement = "Needs Attention"
    
    # Get achievements/badges earned this week
    achievements = []
    if videos_completed >= 5:
        achievements.append("Video Master")
    if workouts_completed >= 3:
        achievements.append("Logic Champion")
    if avg_score >= 90:
        achievements.append("High Scorer")
    if total_watch_time >= 120:  # 2+ hours
        achievements.append("Dedicated Learner")
    
    return {
        "total_activities": total_activities,
        "videos_watched": videos_watched,
        "videos_completed": videos_completed,
        "total_watch_time_minutes": round(total_watch_time / 60, 1) if total_watch_time else 0,
        "workouts_started": workouts_started,
        "workouts_completed": workouts_completed,
        "average_score": round(avg_score, 1),
        "lessons_attended": len(lessons_attended),
        "new_enrollments": len(enrollments),
        "skill_highlights": skill_highlights,
        "achievements": achievements,
        "engagement_level": engagement,
        "week_start": week_start.strftime("%b %d"),
        "week_end": week_end.strftime("%b %d, %Y")
    }


async def record_video_progress(
    db,
    user_id: str,
    video_id: str,
    course_id: str,
    watch_time: int,
    completed: bool = False
):
    """Record video watching progress for a student"""
    await db.video_progress.update_one(
        {"user_id": user_id, "video_id": video_id},
        {
            "$set": {
                "course_id": course_id,
                "watch_time": watch_time,
                "completed": completed,
                "last_watched": datetime.now(timezone.utc).isoformat()
            },
            "$setOnInsert": {
                "started_at": datetime.now(timezone.utc).isoformat()
            }
        },
        upsert=True
    )


async def get_student_all_time_progress(db, student_id: str) -> Dict:
    """Get all-time progress statistics for a student"""
    
    # Total video progress
    video_progress = await db.video_progress.find({"user_id": student_id}).to_list(length=1000)
    total_watch_time = sum(v.get("watch_time", 0) for v in video_progress)
    total_videos_completed = len([v for v in video_progress if v.get("completed", False)])
    
    # Total workout progress
    workout_attempts = await db.workout_attempts.find({
        "user_id": student_id,
        "status": "completed"
    }).to_list(length=1000)
    
    total_workouts = len(workout_attempts)
    all_scores = [w.get("score", 0) for w in workout_attempts if w.get("score") is not None]
    overall_avg_score = sum(all_scores) / len(all_scores) if all_scores else 0
    
    # Courses completed
    courses_completed = await db.course_completions.count_documents({"user_id": student_id})
    
    # Calculate level/rank
    total_points = (total_videos_completed * 10) + (total_workouts * 20) + int(total_watch_time / 60)
    
    if total_points >= 1000:
        rank = "TEC Master"
        rank_emoji = "🏆"
    elif total_points >= 500:
        rank = "TEC Expert"
        rank_emoji = "⭐"
    elif total_points >= 200:
        rank = "TEC Explorer"
        rank_emoji = "🚀"
    elif total_points >= 50:
        rank = "TEC Learner"
        rank_emoji = "📚"
    else:
        rank = "TEC Beginner"
        rank_emoji = "🌱"
    
    return {
        "total_watch_time_hours": round(total_watch_time / 3600, 1),
        "total_videos_completed": total_videos_completed,
        "total_workouts_completed": total_workouts,
        "overall_average_score": round(overall_avg_score, 1),
        "courses_completed": courses_completed,
        "total_points": total_points,
        "rank": rank,
        "rank_emoji": rank_emoji
    }


async def trigger_manual_progress_report(db, notify_func, student_id: str) -> Dict:
    """Manually trigger a progress report for a specific student"""
    student = await db.users.find_one({"id": student_id})
    if not student:
        return {"success": False, "error": "Student not found"}
    
    parent_phone = student.get("parent_phone") or student.get("phone")
    if not parent_phone:
        return {"success": False, "error": "No parent phone number"}
    
    # Get last 7 days progress
    now = datetime.now(timezone.utc)
    week_start = now - timedelta(days=7)
    
    progress_data = await get_student_weekly_progress(student_id, week_start, now)
    
    result = await notify_func(
        parent_phone=parent_phone,
        parent_name=student.get("parent_name", "Parent"),
        student_name=student.get("full_name", "Student"),
        progress_data=progress_data
    )
    
    # Log the notification
    await db.notification_logs.insert_one({
        "type": "manual_progress",
        "student_id": student_id,
        "parent_phone": parent_phone,
        "progress_data": progress_data,
        "result": result,
        "sent_at": now.isoformat()
    })
    
    return {
        "success": True,
        "progress_data": progress_data,
        "notification_result": result
    }
