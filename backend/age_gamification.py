"""
Age-Appropriate Gamification Configuration
Tailored content, rewards, and challenges for each age group
"""

# Age-specific gamification content
AGE_APPROPRIATE_GAMIFICATION = {
    "4-6": {  # Little Learners (Foundation)
        "age_group": "4-6",
        "name": "Little Learners",
        "level_titles": {
            1: "🌱 Tiny Sprout",
            5: "🌼 Happy Flower",
            10: "🦋 Butterfly Friend",
            15: "🌈 Rainbow Explorer",
            20: "⭐ Shining Star"
        },
        "badges": {
            "first_lesson": {"name": "First Steps!", "icon": "👣", "desc": "You watched your first lesson!"},
            "counting_star": {"name": "Counting Star", "icon": "🔢", "desc": "Counted to 10!"},
            "color_master": {"name": "Color Friend", "icon": "🎨", "desc": "Named all colors!"},
            "shape_hero": {"name": "Shape Hero", "icon": "⭐", "desc": "Found all shapes!"},
            "abc_champion": {"name": "ABC Friend", "icon": "🔤", "desc": "Learned your ABCs!"}
        },
        "rewards": {
            "lesson_complete": 10,  # Lower XP for younger kids
            "quiz_complete": 15,
            "streak_bonus": 5
        },
        "challenges": [
            "Count to 20 today! 🔢",
            "Name 5 colors you see! 🌈",
            "Find 3 circles around you! ⭕",
            "Say the alphabet song! 🎵"
        ],
        "encouragement": [
            "Great job, superstar! ⭐",
            "You're so smart! 🌟",
            "Amazing work! 🎉",
            "Keep going, you're awesome! 💪"
        ]
    },
    
    "7-9": {  # Young Explorers
        "age_group": "7-9",
        "name": "Young Explorers",
        "level_titles": {
            1: "🔍 Junior Explorer",
            5: "🎯 Smart Detective",
            10: "🚀 Space Cadet",
            15: "🧠 Brain Champion",
            20: "🏆 Master Explorer",
            30: "👑 Explorer King/Queen"
        },
        "badges": {
            "math_wizard": {"name": "Math Wizard", "icon": "🧮", "desc": "Solved 50 math problems!"},
            "reading_star": {"name": "Reading Star", "icon": "📚", "desc": "Read 10 stories!"},
            "science_explorer": {"name": "Science Explorer", "icon": "🔬", "desc": "Completed 5 experiments!"},
            "logic_puzzle": {"name": "Puzzle Master", "icon": "🧩", "desc": "Solved 20 logic puzzles!"},
            "creative_thinker": {"name": "Creative Thinker", "icon": "💡", "desc": "Created 5 projects!"}
        },
        "rewards": {
            "lesson_complete": 20,
            "quiz_complete": 30,
            "perfect_score": 50,
            "streak_bonus": 10
        },
        "challenges": [
            "Solve 10 math problems today! 🧮",
            "Read for 20 minutes! 📖",
            "Complete a science quiz! 🔬",
            "Build something creative! 🎨",
            "Help a friend learn! 🤝"
        ],
        "encouragement": [
            "Excellent work, explorer! 🔍",
            "Your brain is growing! 🧠",
            "Keep discovering! 🚀",
            "You're a natural learner! ⭐"
        ]
    },
    
    "10-12": {  # Smart Kids
        "age_group": "10-12",
        "name": "Smart Kids",
        "level_titles": {
            1: "🎓 Smart Student",
            5: "💻 Tech Learner",
            10: "🧪 Science Genius",
            15: "🤖 AI Apprentice",
            20: "🏅 Innovation Pro",
            30: "🚀 Future Inventor",
            40: "👨‍🔬 Young Scientist"
        },
        "badges": {
            "coding_starter": {"name": "Code Starter", "icon": "💻", "desc": "Wrote your first code!"},
            "algorithm_ace": {"name": "Algorithm Ace", "icon": "🔄", "desc": "Understood algorithms!"},
            "ai_explorer": {"name": "AI Explorer", "icon": "🤖", "desc": "Learned about AI!"},
            "project_builder": {"name": "Project Builder", "icon": "🏗️", "desc": "Built 3 projects!"},
            "stem_champion": {"name": "STEM Champion", "icon": "⚗️", "desc": "Mastered STEM basics!"}
        },
        "rewards": {
            "lesson_complete": 30,
            "quiz_complete": 40,
            "perfect_score": 75,
            "project_complete": 100,
            "streak_bonus": 15
        },
        "challenges": [
            "Write your first program! 💻",
            "Solve a complex problem! 🧠",
            "Research an AI topic! 🤖",
            "Design a simple app! 📱",
            "Explain coding to someone! 👨‍🏫"
        ],
        "encouragement": [
            "Outstanding problem-solving! 🎯",
            "Your logic is impressive! 🧠",
            "Future tech leader! 💻",
            "Keep innovating! 🚀"
        ]
    },
    
    "13-15": {  # Tech Teens
        "age_group": "13-15",
        "name": "Tech Teens",
        "level_titles": {
            1: "👨‍💻 Junior Developer",
            5: "🖥️ Code Warrior",
            10: "🎮 App Creator",
            15: "🌐 Web Developer",
            20: "⚡ Tech Innovator",
            30: "🚀 Software Engineer",
            40: "🏆 Tech Master",
            50: "💎 Elite Developer"
        },
        "badges": {
            "full_stack": {"name": "Full Stack Starter", "icon": "🌐", "desc": "Built a full web app!"},
            "mobile_dev": {"name": "Mobile Developer", "icon": "📱", "desc": "Created a mobile app!"},
            "ai_developer": {"name": "AI Developer", "icon": "🤖", "desc": "Built an AI model!"},
            "hackathon_hero": {"name": "Hackathon Hero", "icon": "⚡", "desc": "Completed a challenge!"},
            "open_source": {"name": "Open Source Contributor", "icon": "🌍", "desc": "Contributed to projects!"}
        },
        "rewards": {
            "lesson_complete": 40,
            "quiz_complete": 50,
            "perfect_score": 100,
            "project_complete": 150,
            "code_review": 75,
            "streak_bonus": 20
        },
        "challenges": [
            "Build a full-stack app! 🌐",
            "Contribute to open source! 🌍",
            "Master a new framework! ⚛️",
            "Debug complex code! 🐛",
            "Mentor a younger student! 👨‍🏫"
        ],
        "encouragement": [
            "Professional-level work! 💼",
            "Your code is clean! ✨",
            "Future startup founder! 🚀",
            "Tech industry ready! 💻"
        ]
    },
    
    "16-18": {  # Future Leaders
        "age_group": "16-18",
        "name": "Future Leaders",
        "level_titles": {
            1: "🎯 Career Starter",
            5: "💼 Professional Learner",
            10: "🚀 Industry Ready",
            15: "🏢 Enterprise Developer",
            20: "🌟 Tech Leader",
            30: "👑 Innovation Leader",
            40: "🎖️ Industry Expert",
            50: "💎 Tech Visionary"
        },
        "badges": {
            "enterprise_dev": {"name": "Enterprise Developer", "icon": "🏢", "desc": "Built enterprise-level app!"},
            "ai_ml_expert": {"name": "AI/ML Expert", "icon": "🧠", "desc": "Mastered machine learning!"},
            "cloud_architect": {"name": "Cloud Architect", "icon": "☁️", "desc": "Deployed on cloud!"},
            "startup_founder": {"name": "Startup Mindset", "icon": "🚀", "desc": "Built a business plan!"},
            "tech_leader": {"name": "Tech Leader", "icon": "👔", "desc": "Led a tech project!"}
        },
        "rewards": {
            "lesson_complete": 50,
            "quiz_complete": 60,
            "perfect_score": 125,
            "project_complete": 200,
            "leadership": 100,
            "mentorship": 150,
            "streak_bonus": 25
        },
        "challenges": [
            "Build a production app! 🏭",
            "Lead a team project! 👥",
            "Deploy to the cloud! ☁️",
            "Implement AI/ML! 🤖",
            "Present your work! 🎤",
            "Contribute to community! 🌍"
        ],
        "encouragement": [
            "Industry-level achievement! 🏆",
            "Leadership potential! 👔",
            "Ready for the workforce! 💼",
            "Future tech CEO! 🚀"
        ]
    }
}

def get_age_appropriate_content(age_group: str):
    """Get age-appropriate gamification content"""
    return AGE_APPROPRIATE_GAMIFICATION.get(age_group, AGE_APPROPRIATE_GAMIFICATION["7-9"])

def get_level_title(age_group: str, level: int):
    """Get appropriate title for level based on age group"""
    age_config = get_age_appropriate_content(age_group)
    level_titles = age_config["level_titles"]
    
    # Find closest level title
    for threshold in sorted(level_titles.keys(), reverse=True):
        if level >= threshold:
            return level_titles[threshold]
    
    return level_titles[1]  # Default to level 1 title

def get_age_appropriate_rewards(age_group: str, action: str):
    """Get XP rewards appropriate for age group"""
    age_config = get_age_appropriate_content(age_group)
    return age_config["rewards"].get(action, 10)

def get_daily_challenge(age_group: str):
    """Get a random daily challenge for age group"""
    import random
    age_config = get_age_appropriate_content(age_group)
    return random.choice(age_config["challenges"])

def get_encouragement(age_group: str):
    """Get random encouragement message for age group"""
    import random
    age_config = get_age_appropriate_content(age_group)
    return random.choice(age_config["encouragement"])
