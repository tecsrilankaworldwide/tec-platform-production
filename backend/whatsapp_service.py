"""
WhatsApp Notification Service for TEC Platform
Uses Twilio WhatsApp API for sending enrollment notifications to parents
"""

import os
from twilio.rest import Client
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# Twilio Configuration - Set these in your .env file
TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN')
TWILIO_WHATSAPP_NUMBER = os.environ.get('TWILIO_WHATSAPP_NUMBER', 'whatsapp:+14155238886')  # Twilio sandbox number

def get_twilio_client():
    """Get Twilio client instance"""
    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN:
        logger.warning("Twilio credentials not configured. WhatsApp notifications disabled.")
        return None
    return Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

def format_phone_number(phone: str) -> str:
    """Format phone number for WhatsApp"""
    # Remove any spaces, dashes, or parentheses
    cleaned = ''.join(c for c in phone if c.isdigit() or c == '+')
    
    # Add + prefix if not present
    if not cleaned.startswith('+'):
        # Assume Sri Lanka country code if no prefix
        if len(cleaned) == 9 or len(cleaned) == 10:
            cleaned = '+94' + cleaned.lstrip('0')
        else:
            cleaned = '+' + cleaned
    
    return f"whatsapp:{cleaned}"

async def send_whatsapp_message(to_phone: str, message: str) -> dict:
    """
    Send WhatsApp message using Twilio API
    
    Args:
        to_phone: Recipient's phone number (e.g., "+94771234567")
        message: Message text to send
    
    Returns:
        dict with success status and message details
    """
    client = get_twilio_client()
    
    if not client:
        return {
            "success": False,
            "error": "Twilio not configured",
            "mock": True,
            "message": message
        }
    
    try:
        whatsapp_to = format_phone_number(to_phone)
        
        message_response = client.messages.create(
            body=message,
            from_=TWILIO_WHATSAPP_NUMBER,
            to=whatsapp_to
        )
        
        logger.info(f"WhatsApp message sent to {whatsapp_to}: {message_response.sid}")
        
        return {
            "success": True,
            "sid": message_response.sid,
            "status": message_response.status,
            "to": whatsapp_to
        }
        
    except Exception as e:
        logger.error(f"Failed to send WhatsApp message: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }

# Pre-defined message templates for TEC Platform
class NotificationTemplates:
    
    @staticmethod
    def enrollment_confirmation(
        parent_name: str,
        student_name: str,
        course_name: str,
        age_group: str
    ) -> str:
        return f"""🎉 *TEC AI Kids - Enrollment Confirmed!*

Dear {parent_name},

Congratulations! *{student_name}* has been successfully enrolled in:

📚 *Course:* {course_name}
👶 *Age Group:* {age_group}
🌐 *Platform:* www.tecaikids.com

*Next Steps:*
1. Log in to your TEC account
2. Access the course from the Dashboard
3. Start the first lesson together!

Need help? Reply to this message or email support@tecaikids.com

_Building future-ready kids since 1982_ 🚀
*TEC Sri Lanka Worldwide*"""

    @staticmethod
    def welcome_message(parent_name: str, student_name: str) -> str:
        return f"""👋 *Welcome to TEC AI Kids!*

Dear {parent_name},

We're thrilled to have *{student_name}* join the TEC family!

🎯 *What you can expect:*
• AI Literacy & Future Skills
• Logical Thinking Workouts
• Interactive Video Lessons
• Progress Tracking Dashboard

📱 *Quick Links:*
• Website: www.tecaikids.com
• Login: tecaikids.com/login

We'll notify you about:
✅ New course enrollments
✅ Class reminders
✅ Progress updates
✅ Special offers

Reply STOP to unsubscribe from notifications.

_42 Years of Educational Excellence_ 🏆
*TEC Sri Lanka Worldwide*"""

    @staticmethod
    def class_reminder(
        parent_name: str,
        student_name: str,
        course_name: str,
        lesson_title: str,
        scheduled_time: str = None
    ) -> str:
        time_str = f"\n⏰ *Time:* {scheduled_time}" if scheduled_time else ""
        return f"""⏰ *Class Reminder - TEC AI Kids*

Dear {parent_name},

Reminder for *{student_name}*:

📚 *Course:* {course_name}
📖 *Lesson:* {lesson_title}{time_str}

🔗 *Start Lesson:* tecaikids.com/login

Tips for a great learning session:
• Find a quiet space
• Have a notebook ready
• Stay hydrated! 💧

Happy Learning! 🌟
*TEC Sri Lanka Worldwide*"""

    @staticmethod
    def progress_update(
        parent_name: str,
        student_name: str,
        courses_completed: int,
        total_watch_time: int,
        skill_highlight: str = None
    ) -> str:
        skill_text = f"\n🌟 *Skill Highlight:* {skill_highlight}" if skill_highlight else ""
        return f"""📊 *Weekly Progress Report - TEC AI Kids*

Dear {parent_name},

Here's *{student_name}*'s progress this week:

📈 *Stats:*
• Courses Completed: {courses_completed}
• Total Learning Time: {total_watch_time} mins{skill_text}

Keep up the great work! 🎉

View full progress: tecaikids.com/dashboard

*TEC Sri Lanka Worldwide*"""

    @staticmethod
    def subscription_success(
        parent_name: str,
        plan_name: str,
        amount: str
    ) -> str:
        return f"""✅ *Subscription Activated - TEC AI Kids*

Dear {parent_name},

Your subscription is now active!

💎 *Plan:* {plan_name}
💰 *Amount:* {amount}

*Benefits Unlocked:*
• Access to all premium courses
• Unlimited logical workouts
• Parent guides in multiple languages
• Priority support

Start exploring: tecaikids.com/courses

Thank you for investing in your child's future! 🚀

*TEC Sri Lanka Worldwide*"""

    @staticmethod
    def weekly_progress_report(
        parent_name: str,
        student_name: str,
        progress_data: dict
    ) -> str:
        # Build achievements string
        achievements_str = ""
        if progress_data.get("achievements"):
            achievements_str = "\n\n🏅 *Achievements Earned:*\n" + "\n".join(
                f"• {a}" for a in progress_data["achievements"]
            )
        
        # Build skills string
        skills_str = ""
        if progress_data.get("skill_highlights"):
            skills_str = "\n\n💪 *Skills Developed:*\n" + ", ".join(progress_data["skill_highlights"])
        
        # Engagement emoji
        engagement_emoji = {
            "Excellent": "🌟",
            "Good": "👍",
            "Moderate": "📈",
            "Needs Attention": "💭"
        }.get(progress_data.get("engagement_level", ""), "")
        
        return f"""📊 *Weekly Progress Report - TEC AI Kids*

Dear {parent_name},

Here's *{student_name}*'s learning journey this week!
_{progress_data.get('week_start', '')} - {progress_data.get('week_end', '')}_

📈 *Activity Summary:*
• Videos Watched: {progress_data.get('videos_watched', 0)}
• Videos Completed: {progress_data.get('videos_completed', 0)}
• Learning Time: {progress_data.get('total_watch_time_minutes', 0)} mins
• Workouts Completed: {progress_data.get('workouts_completed', 0)}/{progress_data.get('workouts_started', 0)}
• Average Score: {progress_data.get('average_score', 0)}%
• Classes Attended: {progress_data.get('lessons_attended', 0)}

{engagement_emoji} *Engagement Level:* {progress_data.get('engagement_level', 'N/A')}{skills_str}{achievements_str}

🎯 *Tips for Next Week:*
• Set a daily learning goal
• Complete at least 3 workouts
• Review previous lessons

View full progress: tecaikids.com/dashboard

Keep up the amazing work! 🚀
*TEC Sri Lanka Worldwide*
_Building future-ready kids since 1982_"""


# Helper functions for easy notification sending
async def notify_enrollment(
    parent_phone: str,
    parent_name: str,
    student_name: str,
    course_name: str,
    age_group: str
) -> dict:
    """Send enrollment confirmation notification"""
    message = NotificationTemplates.enrollment_confirmation(
        parent_name, student_name, course_name, age_group
    )
    return await send_whatsapp_message(parent_phone, message)

async def notify_welcome(
    parent_phone: str,
    parent_name: str,
    student_name: str
) -> dict:
    """Send welcome message to new user"""
    message = NotificationTemplates.welcome_message(parent_name, student_name)
    return await send_whatsapp_message(parent_phone, message)

async def notify_class_reminder(
    parent_phone: str,
    parent_name: str,
    student_name: str,
    course_name: str,
    lesson_title: str,
    scheduled_time: str = None
) -> dict:
    """Send class reminder notification"""
    message = NotificationTemplates.class_reminder(
        parent_name, student_name, course_name, lesson_title, scheduled_time
    )
    return await send_whatsapp_message(parent_phone, message)

async def notify_subscription(
    parent_phone: str,
    parent_name: str,
    plan_name: str,
    amount: str
) -> dict:
    """Send subscription success notification"""
    message = NotificationTemplates.subscription_success(parent_name, plan_name, amount)
    return await send_whatsapp_message(parent_phone, message)

async def notify_progress_report(
    parent_phone: str,
    parent_name: str,
    student_name: str,
    progress_data: dict
) -> dict:
    """Send weekly progress report notification"""
    message = NotificationTemplates.weekly_progress_report(
        parent_name, student_name, progress_data
    )
    return await send_whatsapp_message(parent_phone, message)
