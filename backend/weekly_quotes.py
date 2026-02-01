"""
Weekly Inspirational Quotes for TecaiKids Students
Rotates through 12 weeks (3 months) of wisdom from great leaders and thinkers
"""

from datetime import datetime, timezone
from typing import Dict

# 12 Weeks of Inspirational Quotes (3 months cycle)
WEEKLY_QUOTES = [
    {
        "week": 1,
        "quote": "The only way to do great work is to love what you do.",
        "author": "Steve Jobs",
        "title": "Co-founder of Apple",
        "image": "💻",
        "theme": "Passion for Learning"
    },
    {
        "week": 2,
        "quote": "Education is the most powerful weapon which you can use to change the world.",
        "author": "Nelson Mandela",
        "title": "Former President of South Africa",
        "image": "✊",
        "theme": "Power of Education"
    },
    {
        "week": 3,
        "quote": "Live as if you were to die tomorrow. Learn as if you were to live forever.",
        "author": "Mahatma Gandhi",
        "title": "Leader of Indian Independence",
        "image": "🕊️",
        "theme": "Lifelong Learning"
    },
    {
        "week": 4,
        "quote": "The future belongs to those who believe in the beauty of their dreams.",
        "author": "Eleanor Roosevelt",
        "title": "Former First Lady, Human Rights Activist",
        "image": "🌟",
        "theme": "Dream Big"
    },
    {
        "week": 5,
        "quote": "Success is not final, failure is not fatal: it is the courage to continue that counts.",
        "author": "Winston Churchill",
        "title": "Former Prime Minister of UK",
        "image": "🦁",
        "theme": "Perseverance"
    },
    {
        "week": 6,
        "quote": "The mind is not a vessel to be filled, but a fire to be kindled.",
        "author": "Plutarch",
        "title": "Ancient Greek Philosopher",
        "image": "🔥",
        "theme": "Curiosity"
    },
    {
        "week": 7,
        "quote": "In the middle of difficulty lies opportunity.",
        "author": "Albert Einstein",
        "title": "Physicist, Theory of Relativity",
        "image": "⚛️",
        "theme": "Problem Solving"
    },
    {
        "week": 8,
        "quote": "Whatever the mind can conceive and believe, it can achieve.",
        "author": "Napoleon Hill",
        "title": "Author, Think and Grow Rich",
        "image": "💡",
        "theme": "Belief in Self"
    },
    {
        "week": 9,
        "quote": "The best time to plant a tree was 20 years ago. The second best time is now.",
        "author": "Chinese Proverb",
        "title": "Ancient Wisdom",
        "image": "🌳",
        "theme": "Take Action Now"
    },
    {
        "week": 10,
        "quote": "I have not failed. I've just found 10,000 ways that won't work.",
        "author": "Thomas Edison",
        "title": "Inventor of the Light Bulb",
        "image": "💡",
        "theme": "Learning from Failure"
    },
    {
        "week": 11,
        "quote": "The only impossible journey is the one you never begin.",
        "author": "Tony Robbins",
        "title": "Motivational Speaker",
        "image": "🚀",
        "theme": "Starting Your Journey"
    },
    {
        "week": 12,
        "quote": "Be the change you wish to see in the world.",
        "author": "Mahatma Gandhi",
        "title": "Leader of Indian Independence",
        "image": "🌍",
        "theme": "Personal Responsibility"
    }
]

def get_current_week_number() -> int:
    """
    Calculate which week of the year it is.
    Returns 1-52 based on ISO week number.
    """
    now = datetime.now(timezone.utc)
    iso_calendar = now.isocalendar()
    return iso_calendar.week

def get_quote_of_the_week() -> Dict:
    """
    Get the inspirational quote for the current week.
    Rotates through 12 weeks and repeats.
    """
    current_week = get_current_week_number()
    
    # Use modulo to cycle through 12 quotes
    quote_index = (current_week - 1) % 12
    
    quote_data = WEEKLY_QUOTES[quote_index]
    
    # Add current week info
    quote_data["current_week"] = current_week
    quote_data["cycle_week"] = quote_index + 1
    
    return quote_data

def get_all_quotes() -> list:
    """Get all 12 quotes (for admin preview)"""
    return WEEKLY_QUOTES

def get_quote_by_week(week_number: int) -> Dict:
    """Get quote for a specific week number (1-12)"""
    if week_number < 1 or week_number > 12:
        week_number = ((week_number - 1) % 12) + 1
    
    return WEEKLY_QUOTES[week_number - 1]
