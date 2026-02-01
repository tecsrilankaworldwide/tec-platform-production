"""
Automated Class Reminder Service for TEC Platform
- Sends WhatsApp notifications 1 hour before scheduled lessons (automatic)
- Sends Email + WhatsApp reminders 24 hours before (manual/automatic)
"""

import os
import asyncio
import logging
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Optional
from urllib.parse import quote
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

import resend
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Initialize Resend for email
RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")

if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY
    logger.info("Resend API initialized for email reminders")
else:
    logger.warning("RESEND_API_KEY not found - email reminders will be disabled")

# Global scheduler instance
scheduler: Optional[AsyncIOScheduler] = None

# Store reference to database and notification function
_db = None
_notify_func = None


# ============================================
# SCHEDULER FUNCTIONS
# ============================================

def init_reminder_scheduler(db, notify_reminder_func):
    """Initialize the reminder scheduler with database and notification function"""
    global scheduler, _db, _notify_func
    
    _db = db
    _notify_func = notify_reminder_func
    
    scheduler = AsyncIOScheduler(timezone=timezone.utc)
    
    # Check for upcoming lessons every 5 minutes
    scheduler.add_job(
        check_and_send_reminders,
        trigger=IntervalTrigger(minutes=5),
        id='class_reminder_job',
        name='Check and send class reminders',
        replace_existing=True
    )
    
    # Also run immediately on startup
    scheduler.add_job(
        check_and_send_reminders,
        id='class_reminder_startup',
        name='Initial reminder check',
        replace_existing=True
    )
    
    scheduler.start()
    logger.info("Class reminder scheduler started - checking every 5 minutes")


def shutdown_reminder_scheduler():
    """Shutdown the scheduler gracefully"""
    global scheduler
    if scheduler:
        scheduler.shutdown(wait=False)
        logger.info("Class reminder scheduler stopped")


async def check_and_send_reminders():
    """Check for upcoming lessons and send reminders"""
    global _db, _notify_func
    
    if _db is None or _notify_func is None:
        logger.warning("Reminder service not properly initialized")
        return
    
    try:
        now = datetime.now(timezone.utc)
        
        # Find scheduled lessons in the next hour that haven't been reminded
        reminder_window_start = now + timedelta(minutes=55)
        reminder_window_end = now + timedelta(minutes=65)
        
        logger.info(f"Checking for lessons between {reminder_window_start} and {reminder_window_end}")
        
        # Query scheduled lessons
        upcoming_lessons = await _db.scheduled_lessons.find({
            "scheduled_time": {
                "$gte": reminder_window_start.isoformat(),
                "$lte": reminder_window_end.isoformat()
            },
            "status": "scheduled",
            "reminder_sent": {"$ne": True}
        }).to_list(length=100)
        
        logger.info(f"Found {len(upcoming_lessons)} lessons needing reminders")
        
        for lesson in upcoming_lessons:
            await send_lesson_reminder(lesson)
            
    except Exception as e:
        logger.error(f"Error checking reminders: {str(e)}")


async def send_lesson_reminder(lesson: Dict):
    """Send a reminder for a specific lesson"""
    global _db, _notify_func
    
    if _db is None or _notify_func is None:
        logger.warning("Cannot send reminder - service not initialized")
        return
    
    try:
        student_id = lesson.get("student_id")
        parent_phone = lesson.get("parent_phone")
        
        if not parent_phone:
            student = await _db.users.find_one(
                {"user_id": student_id},
                {"parent_phone": 1, "parent_name": 1, "full_name": 1}
            )
            if student:
                parent_phone = student.get("parent_phone")
        
        if not parent_phone:
            logger.warning(f"No parent phone for lesson {lesson.get('id')}")
            return
        
        parent_name = lesson.get("parent_name", "Parent")
        lesson_title = lesson.get("lesson_title", "Your Scheduled Class")
        scheduled_time = lesson.get("scheduled_time", "")
        
        result = await _notify_func(
            phone=parent_phone,
            parent_name=parent_name,
            lesson_title=lesson_title,
            scheduled_time=scheduled_time
        )
        
        # Mark reminder as sent
        await _db.scheduled_lessons.update_one(
            {"id": lesson.get("id")},
            {
                "$set": {
                    "reminder_sent": True,
                    "reminder_sent_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        logger.info(f"Reminder sent for lesson {lesson.get('id')} to {parent_phone}")
        
        # Log notification
        await _db.notification_logs.insert_one({
            "type": "class_reminder",
            "lesson_id": lesson.get("id"),
            "student_id": student_id,
            "parent_phone": parent_phone,
            "result": result,
            "sent_at": datetime.now(timezone.utc).isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error sending reminder for lesson {lesson.get('id')}: {str(e)}")


async def schedule_lesson(
    db,
    student_id: str,
    course_id: str,
    lesson_title: str,
    scheduled_time: datetime,
    parent_phone: str = None,
    parent_name: str = None
) -> Dict:
    """Schedule a lesson for a student"""
    import uuid
    
    lesson_record = {
        "id": str(uuid.uuid4()),
        "student_id": student_id,
        "course_id": course_id,
        "lesson_title": lesson_title,
        "scheduled_time": scheduled_time.isoformat(),
        "parent_phone": parent_phone,
        "parent_name": parent_name,
        "status": "scheduled",
        "reminder_sent": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.scheduled_lessons.insert_one(lesson_record)
    logger.info(f"Scheduled lesson {lesson_record['id']} for {scheduled_time}")
    
    return lesson_record


async def get_upcoming_lessons(db, student_id: str = None, limit: int = 10) -> List[Dict]:
    """Get upcoming scheduled lessons"""
    now = datetime.now(timezone.utc)
    
    query = {
        "scheduled_time": {"$gte": now.isoformat()},
        "status": "scheduled"
    }
    
    if student_id:
        query["student_id"] = student_id
    
    lessons = await db.scheduled_lessons.find(
        query,
        {"_id": 0}
    ).sort("scheduled_time", 1).to_list(length=limit)
    
    return lessons


async def cancel_scheduled_lesson(db, lesson_id: str) -> bool:
    """Cancel a scheduled lesson"""
    result = await db.scheduled_lessons.update_one(
        {"id": lesson_id},
        {"$set": {"status": "cancelled", "cancelled_at": datetime.now(timezone.utc).isoformat()}}
    )
    return result.modified_count > 0


# ============================================
# EMAIL REMINDER FUNCTIONS
# ============================================

def generate_whatsapp_link(phone: str, message: str) -> str:
    """Generate a WhatsApp click-to-send link"""
    clean_phone = ''.join(filter(str.isdigit, phone))
    if not clean_phone.startswith('94'):
        clean_phone = '94' + clean_phone.lstrip('0')
    
    encoded_message = quote(message)
    return f"https://wa.me/{clean_phone}?text={encoded_message}"


def create_reminder_email_html(
    parent_name: str,
    child_name: str,
    class_name: str,
    class_time: datetime,
    zoom_link: Optional[str] = None,
    teacher_name: Optional[str] = None
) -> str:
    """Create HTML email content for class reminder"""
    
    formatted_time = class_time.strftime("%A, %B %d, %Y at %I:%M %p")
    
    zoom_section = ""
    if zoom_link:
        zoom_section = f"""
        <tr>
            <td style="padding: 15px 0;">
                <a href="{zoom_link}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                    Join Zoom Class
                </a>
            </td>
        </tr>
        """
    
    teacher_section = f"<p style='color: #666;'>Teacher: {teacher_name}</p>" if teacher_name else ""
    
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px 10px 0 0;">
            <tr>
                <td style="padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0;">TecAI Kids</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Class Reminder</p>
                </td>
            </tr>
        </table>
        
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <tr>
                <td>
                    <p>Dear <strong>{parent_name}</strong>,</p>
                    
                    <p>This is a friendly reminder that <strong>{child_name}</strong> has an upcoming class:</p>
                    
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #667eea;">
                        <tr>
                            <td>
                                <h2 style="color: #667eea; margin: 0 0 10px 0;">{class_name}</h2>
                                <p style="margin: 5px 0;"><strong>Date and Time:</strong> {formatted_time}</p>
                                {teacher_section}
                            </td>
                        </tr>
                    </table>
                    
                    {zoom_section}
                    
                    <h3 style="color: #333;">Before Class Checklist:</h3>
                    <ul style="color: #555;">
                        <li>Ensure stable internet connection</li>
                        <li>Have tablet/computer charged and ready</li>
                        <li>Find a quiet, well-lit space</li>
                        <li>Keep headphones handy for better audio</li>
                    </ul>
                    
                    <p style="color: #666; font-size: 14px; margin-top: 30px;">
                        If you have any questions, please contact us via WhatsApp at 
                        <a href="https://wa.me/94779779668" style="color: #667eea;">+94 77 977 9668</a>
                    </p>
                    
                    <p style="color: #888; font-size: 12px; text-align: center; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
                        2025 TEC WORLD Worldwide (Pvt.) Ltd<br>
                        42 Years of Educational Excellence
                    </p>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """


def create_whatsapp_reminder_message(
    child_name: str,
    class_name: str,
    class_time: datetime,
    zoom_link: Optional[str] = None
) -> str:
    """Create WhatsApp reminder message text"""
    
    formatted_time = class_time.strftime("%A, %B %d at %I:%M %p")
    
    message = f"""*TecAI Kids - Class Reminder*

Hello! This is a reminder that *{child_name}* has an upcoming class:

*{class_name}*
{formatted_time}
"""
    
    if zoom_link:
        message += f"\nZoom Link: {zoom_link}"
    
    message += """

*Before Class:*
- Check internet connection
- Charge device
- Find quiet space
- Have headphones ready

See you in class!

_TEC WORLD Worldwide - 42 Years of Excellence_"""
    
    return message


async def send_email_reminder(
    recipient_email: str,
    parent_name: str,
    child_name: str,
    class_name: str,
    class_time: datetime,
    zoom_link: Optional[str] = None,
    teacher_name: Optional[str] = None
) -> dict:
    """Send email reminder for upcoming class"""
    
    if not RESEND_API_KEY:
        return {
            "status": "error",
            "message": "Email service not configured (RESEND_API_KEY missing)"
        }
    
    html_content = create_reminder_email_html(
        parent_name=parent_name,
        child_name=child_name,
        class_name=class_name,
        class_time=class_time,
        zoom_link=zoom_link,
        teacher_name=teacher_name
    )
    
    params = {
        "from": SENDER_EMAIL,
        "to": [recipient_email],
        "subject": f"Class Reminder: {class_name} - {class_time.strftime('%B %d')}",
        "html": html_content
    }
    
    try:
        email = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Email reminder sent to {recipient_email}")
        return {
            "status": "success",
            "message": f"Email sent to {recipient_email}",
            "email_id": email.get("id")
        }
    except Exception as e:
        logger.error(f"Failed to send email reminder: {str(e)}")
        return {
            "status": "error",
            "message": f"Failed to send email: {str(e)}"
        }


def get_whatsapp_reminder_link(
    phone: str,
    child_name: str,
    class_name: str,
    class_time: datetime,
    zoom_link: Optional[str] = None
) -> str:
    """Get WhatsApp link with pre-filled reminder message"""
    
    message = create_whatsapp_reminder_message(
        child_name=child_name,
        class_name=class_name,
        class_time=class_time,
        zoom_link=zoom_link
    )
    
    return generate_whatsapp_link(phone, message)


async def send_bulk_reminders(
    students: List[dict],
    class_name: str,
    class_time: datetime,
    zoom_link: Optional[str] = None,
    teacher_name: Optional[str] = None
) -> dict:
    """Send reminders to multiple students/parents"""
    
    results = {
        "total": len(students),
        "email_sent": 0,
        "email_failed": 0,
        "whatsapp_links": [],
        "errors": []
    }
    
    for student in students:
        # Send email if available
        if student.get("parent_email"):
            result = await send_email_reminder(
                recipient_email=student["parent_email"],
                parent_name=student.get("parent_name", "Parent"),
                child_name=student.get("name", "Student"),
                class_name=class_name,
                class_time=class_time,
                zoom_link=zoom_link,
                teacher_name=teacher_name
            )
            
            if result["status"] == "success":
                results["email_sent"] += 1
            else:
                results["email_failed"] += 1
                results["errors"].append({
                    "student": student.get("name"),
                    "error": result["message"]
                })
        
        # Generate WhatsApp link if phone available
        if student.get("parent_phone"):
            wa_link = get_whatsapp_reminder_link(
                phone=student["parent_phone"],
                child_name=student.get("name", "Student"),
                class_name=class_name,
                class_time=class_time,
                zoom_link=zoom_link
            )
            results["whatsapp_links"].append({
                "student": student.get("name"),
                "parent_phone": student.get("parent_phone"),
                "link": wa_link
            })
    
    return results
