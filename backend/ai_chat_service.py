"""
AI Chat Service for TecaiKids Educational Platform
Supports Claude Sonnet 4.5 and Gemini 3 Flash for tutoring
"""
import os
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv

load_dotenv()

from emergentintegrations.llm.chat import LlmChat, UserMessage

# System prompts for different age groups
SYSTEM_PROMPTS = {
    "foundation": """You are TEC AI Buddy, a friendly and patient AI tutor for children ages 4-8. 
    Your role is to help young learners understand basic concepts in a fun and engaging way.
    
    Guidelines:
    - Use simple words and short sentences
    - Include fun emojis in your responses 🎨✨🌟
    - Be encouraging and celebrate small wins
    - Use examples from everyday life (toys, animals, games)
    - Ask questions to keep them engaged
    - Never use complex vocabulary
    - If they seem confused, try explaining differently with pictures or stories
    - Keep responses under 100 words unless explaining something complex
    
    Remember: Learning should feel like playing!""",
    
    "development": """You are TEC AI Mentor, an encouraging AI tutor for children ages 9-12.
    Your role is to help students develop logical thinking and problem-solving skills.
    
    Guidelines:
    - Use age-appropriate language with some technical terms
    - Encourage critical thinking with "Why do you think...?" questions
    - Provide step-by-step explanations for complex topics
    - Use relatable examples from school, games, and technology
    - Celebrate progress and effort
    - Include relevant emojis sparingly 🧠💡🚀
    - Guide them to discover answers rather than giving direct solutions
    - Keep responses focused and under 150 words
    
    Remember: Help them become independent thinkers!""",
    
    "mastery": """You are TEC AI Coach, a knowledgeable AI tutor for teenagers ages 13-18.
    Your role is to prepare students for future careers and advanced learning.
    
    Guidelines:
    - Use professional but friendly language
    - Discuss real-world applications and career paths
    - Encourage deeper exploration of topics
    - Provide resources for further learning when relevant
    - Discuss AI, technology, and future trends
    - Be honest about complexities while remaining accessible
    - Support entrepreneurial thinking
    - Keep responses informative but concise (under 200 words)
    
    Remember: Prepare them for leadership and innovation!"""
}

class AIChatService:
    """Service for managing AI chat sessions with students"""
    
    def __init__(self):
        self.api_key = os.environ.get('EMERGENT_LLM_KEY')
        self.sessions: Dict[str, LlmChat] = {}
    
    def get_system_prompt(self, learning_level: str) -> str:
        """Get appropriate system prompt based on student's level"""
        return SYSTEM_PROMPTS.get(learning_level, SYSTEM_PROMPTS["development"])
    
    async def create_session(
        self, 
        student_id: str, 
        learning_level: str = "development",
        model_provider: str = "anthropic",
        subject: Optional[str] = None
    ) -> str:
        """Create a new chat session for a student"""
        session_id = f"{student_id}_{uuid.uuid4().hex[:8]}"
        
        system_message = self.get_system_prompt(learning_level)
        if subject:
            system_message += f"\n\nCurrent subject focus: {subject}"
        
        # Create chat instance
        chat = LlmChat(
            api_key=self.api_key,
            session_id=session_id,
            system_message=system_message
        )
        
        # Set model based on provider
        if model_provider == "anthropic":
            chat.with_model("anthropic", "claude-sonnet-4-5-20250929")
        elif model_provider == "gemini":
            chat.with_model("gemini", "gemini-3-flash-preview")
        else:
            chat.with_model("anthropic", "claude-sonnet-4-5-20250929")
        
        self.sessions[session_id] = chat
        return session_id
    
    async def send_message(
        self, 
        session_id: str, 
        message: str,
        student_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """Send a message and get AI response"""
        if session_id not in self.sessions:
            raise ValueError(f"Session {session_id} not found")
        
        chat = self.sessions[session_id]
        
        # Personalize message if student name provided
        if student_name:
            personalized_context = f"[Student: {student_name}] "
            full_message = personalized_context + message
        else:
            full_message = message
        
        user_message = UserMessage(text=full_message)
        
        try:
            response = await chat.send_message(user_message)
            return {
                "success": True,
                "response": response,
                "session_id": session_id,
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "session_id": session_id,
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def get_session_history(self, session_id: str) -> List[Dict]:
        """Get chat history for a session"""
        if session_id not in self.sessions:
            return []
        
        chat = self.sessions[session_id]
        try:
            messages = await chat.get_messages()
            return messages
        except Exception:
            return []
    
    def end_session(self, session_id: str) -> bool:
        """End a chat session"""
        if session_id in self.sessions:
            del self.sessions[session_id]
            return True
        return False

# Singleton instance
ai_chat_service = AIChatService()
