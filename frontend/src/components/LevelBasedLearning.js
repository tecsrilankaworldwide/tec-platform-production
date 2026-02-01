import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './auth/AuthContext';
import { 
  Trophy, Star, Zap, Medal, Crown, Flame, Target, Award, 
  Lock, Unlock, ChevronRight, BookOpen, Brain, Lightbulb, 
  Rocket, GraduationCap, CheckCircle, Circle, Play
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

// Learning levels with skills and content
const LEARNING_LEVELS = {
  1: {
    name: "Beginner Explorer",
    minXP: 0,
    maxXP: 100,
    icon: "🌱",
    color: "from-green-400 to-emerald-500",
    skills: [
      { id: 'basic_ai', name: 'Introduction to AI', description: 'Learn what AI is and how it helps us', unlocked: true },
      { id: 'pattern_basics', name: 'Pattern Recognition', description: 'Find simple patterns in shapes', unlocked: true },
      { id: 'creative_start', name: 'Creative Thinking Basics', description: 'Start your creative journey', unlocked: true }
    ],
    rewards: ['First Steps Badge', '🎁 Starter Kit'],
    nextLevelRequirements: 'Complete 3 lessons and 1 quiz'
  },
  2: {
    name: "Young Learner",
    minXP: 100,
    maxXP: 250,
    icon: "🌿",
    color: "from-teal-400 to-cyan-500",
    skills: [
      { id: 'ai_helpers', name: 'AI Helpers', description: 'Discover AI in everyday life', unlocked: false },
      { id: 'logic_puzzles', name: 'Logic Puzzles', description: 'Solve beginner logic challenges', unlocked: false },
      { id: 'idea_generation', name: 'Idea Generation', description: 'Learn to brainstorm ideas', unlocked: false }
    ],
    rewards: ['Learning Badge', '50 Bonus Points'],
    nextLevelRequirements: 'Master basic patterns and complete AI introduction'
  },
  3: {
    name: "Knowledge Seeker",
    minXP: 250,
    maxXP: 500,
    icon: "🧠",
    color: "from-blue-400 to-indigo-500",
    skills: [
      { id: 'ai_chat', name: 'Talking with AI', description: 'Learn to use AI assistants', unlocked: false },
      { id: 'sequences', name: 'Number Sequences', description: 'Find patterns in numbers', unlocked: false },
      { id: 'problem_solving', name: 'Problem Solving', description: 'Break down complex problems', unlocked: false }
    ],
    rewards: ['Seeker Badge', 'Access to Advanced Quizzes'],
    nextLevelRequirements: 'Complete 5 AI conversations and 3 logic challenges'
  },
  4: {
    name: "Smart Thinker",
    minXP: 500,
    maxXP: 850,
    icon: "💡",
    color: "from-purple-400 to-pink-500",
    skills: [
      { id: 'ai_projects', name: 'AI Mini Projects', description: 'Build simple AI projects', unlocked: false },
      { id: 'advanced_logic', name: 'Advanced Logic', description: 'Master complex puzzles', unlocked: false },
      { id: 'innovation', name: 'Innovation Basics', description: 'Create new solutions', unlocked: false }
    ],
    rewards: ['Smart Badge', 'Certificate of Progress'],
    nextLevelRequirements: 'Complete a mini project and score 80%+ on quizzes'
  },
  5: {
    name: "Rising Star",
    minXP: 850,
    maxXP: 1300,
    icon: "⭐",
    color: "from-yellow-400 to-orange-500",
    skills: [
      { id: 'ai_ethics', name: 'AI Ethics', description: 'Learn responsible AI use', unlocked: false },
      { id: 'critical_thinking', name: 'Critical Thinking', description: 'Analyze and evaluate', unlocked: false },
      { id: 'design_thinking', name: 'Design Thinking', description: 'Design solutions for problems', unlocked: false }
    ],
    rewards: ['Star Badge', '200 Bonus Points', 'Special Certificate'],
    nextLevelRequirements: 'Master 3 skill areas and complete weekly challenges'
  },
  6: {
    name: "Future Leader",
    minXP: 1300,
    maxXP: 2000,
    icon: "🚀",
    color: "from-red-400 to-rose-500",
    skills: [
      { id: 'ai_creation', name: 'Creating with AI', description: 'Build AI-powered creations', unlocked: false },
      { id: 'systems_thinking', name: 'Systems Thinking', description: 'Understand complex systems', unlocked: false },
      { id: 'leadership', name: 'Future Leadership', description: 'Lead projects and teams', unlocked: false }
    ],
    rewards: ['Leader Badge', 'Premium Access', 'Leadership Certificate'],
    nextLevelRequirements: 'Lead a project and help others learn'
  },
  7: {
    name: "Master Explorer",
    minXP: 2000,
    maxXP: 3000,
    icon: "👑",
    color: "from-amber-400 to-yellow-500",
    skills: [
      { id: 'ai_advanced', name: 'Advanced AI Concepts', description: 'Deep dive into AI', unlocked: false },
      { id: 'expert_logic', name: 'Expert Problem Solving', description: 'Tackle any challenge', unlocked: false },
      { id: 'mentor', name: 'Become a Mentor', description: 'Help younger students', unlocked: false }
    ],
    rewards: ['Crown Badge', 'Master Certificate', 'Mentor Status'],
    nextLevelRequirements: 'Complete all skill areas at advanced level'
  }
};

const LevelBasedLearning = () => {
  const { token, user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [activeTab, setActiveTab] = useState('progress');

  useEffect(() => {
    loadStats();
  }, [token]);

  const loadStats = async () => {
    try {
      const response = await axios.get(`${API}/gamification/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
      
      // Set selected level to current level
      const currentLevel = response.data?.level || 1;
      setSelectedLevel(Math.min(currentLevel, 7));
    } catch (error) {
      console.error('Failed to load stats:', error);
      // Set defaults
      setStats({ level: 1, total_xp: 0, total_points: 0, current_streak: 0, badges_earned: [] });
      setSelectedLevel(1);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLevelData = () => {
    const level = stats?.level || 1;
    return LEARNING_LEVELS[Math.min(level, 7)] || LEARNING_LEVELS[1];
  };

  const getXPProgress = () => {
    if (!stats) return 0;
    const currentLevelData = getCurrentLevelData();
    const xpInLevel = stats.total_xp - currentLevelData.minXP;
    const xpNeeded = currentLevelData.maxXP - currentLevelData.minXP;
    return Math.min((xpInLevel / xpNeeded) * 100, 100);
  };

  const isLevelUnlocked = (level) => {
    return (stats?.level || 1) >= level;
  };

  const isSkillUnlocked = (levelNum, skillIndex) => {
    if (!isLevelUnlocked(levelNum)) return false;
    if (levelNum < (stats?.level || 1)) return true;
    // For current level, check progress
    return skillIndex === 0 || stats?.total_xp >= LEARNING_LEVELS[levelNum].minXP + (skillIndex * 50);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your learning journey...</p>
        </div>
      </div>
    );
  }

  const currentLevelData = getCurrentLevelData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className={`bg-gradient-to-r ${currentLevelData.color} text-white p-6 shadow-lg`}>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <GraduationCap className="mr-3" size={32} /> My Learning Journey
              </h1>
              <p className="text-white/80 mt-1">Level up by mastering new skills!</p>
            </div>
            <div className="text-right">
              <div className="text-5xl mb-1">{currentLevelData.icon}</div>
              <div className="text-xl font-bold">{currentLevelData.name}</div>
              <div className="text-white/80">Level {stats?.level || 1}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* XP Progress Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Level Progress</h2>
              <p className="text-gray-500">
                {stats?.total_xp || 0} XP / {currentLevelData.maxXP} XP
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats?.total_points || 0}</div>
                <div className="text-xs text-gray-500">Points</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-500">{stats?.current_streak || 0}🔥</div>
                <div className="text-xs text-gray-500">Day Streak</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">{stats?.badges_earned?.length || 0}</div>
                <div className="text-xs text-gray-500">Badges</div>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${currentLevelData.color} rounded-full transition-all duration-1000 flex items-center justify-end pr-2`}
                style={{ width: `${Math.max(getXPProgress(), 5)}%` }}
              >
                <span className="text-white text-xs font-bold">{Math.round(getXPProgress())}%</span>
              </div>
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-500">
              <span>Level {stats?.level || 1}</span>
              <span className="text-gray-400">{currentLevelData.nextLevelRequirements}</span>
              <span>Level {(stats?.level || 1) + 1}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'progress', label: 'My Progress', icon: Target },
            { id: 'levels', label: 'All Levels', icon: Rocket },
            { id: 'skills', label: 'Skill Tree', icon: Brain }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-5 py-3 rounded-xl font-medium transition-all ${
                activeTab === tab.id 
                  ? `bg-gradient-to-r ${currentLevelData.color} text-white shadow-lg` 
                  : 'bg-white text-gray-600 hover:bg-gray-100 shadow'
              }`}
            >
              <tab.icon size={18} className="mr-2" />{tab.label}
            </button>
          ))}
        </div>

        {/* Progress Tab */}
        {activeTab === 'progress' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current Level Skills */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <BookOpen className="mr-2 text-purple-600" size={20} />
                Current Level Skills
              </h3>
              <div className="space-y-4">
                {currentLevelData.skills.map((skill, idx) => {
                  const unlocked = isSkillUnlocked(stats?.level || 1, idx);
                  return (
                    <div 
                      key={skill.id}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        unlocked 
                          ? 'border-purple-200 bg-purple-50 hover:border-purple-400 cursor-pointer' 
                          : 'border-gray-200 bg-gray-50 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {unlocked ? (
                            <Unlock className="text-green-500 mr-3" size={20} />
                          ) : (
                            <Lock className="text-gray-400 mr-3" size={20} />
                          )}
                          <div>
                            <div className="font-bold text-gray-800">{skill.name}</div>
                            <div className="text-sm text-gray-500">{skill.description}</div>
                          </div>
                        </div>
                        {unlocked && (
                          <button className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                            <Play size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Level Rewards */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <Trophy className="mr-2 text-yellow-500" size={20} />
                Level Rewards
              </h3>
              <div className="space-y-3 mb-6">
                {currentLevelData.rewards.map((reward, idx) => (
                  <div key={idx} className="flex items-center p-3 bg-yellow-50 rounded-lg">
                    <Award className="text-yellow-500 mr-3" size={20} />
                    <span className="font-medium text-gray-800">{reward}</span>
                  </div>
                ))}
              </div>
              
              {/* Next Level Preview */}
              {LEARNING_LEVELS[(stats?.level || 1) + 1] && (
                <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
                  <div className="text-sm text-gray-500 mb-2">Next Level Preview</div>
                  <div className="flex items-center">
                    <span className="text-3xl mr-3">{LEARNING_LEVELS[(stats?.level || 1) + 1].icon}</span>
                    <div>
                      <div className="font-bold text-gray-800">{LEARNING_LEVELS[(stats?.level || 1) + 1].name}</div>
                      <div className="text-sm text-gray-500">Unlock at {LEARNING_LEVELS[(stats?.level || 1) + 1].minXP} XP</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* All Levels Tab */}
        {activeTab === 'levels' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-6">Learning Level Roadmap</h3>
            <div className="space-y-4">
              {Object.entries(LEARNING_LEVELS).map(([levelNum, levelData]) => {
                const num = parseInt(levelNum);
                const unlocked = isLevelUnlocked(num);
                const isCurrent = (stats?.level || 1) === num;
                
                return (
                  <div 
                    key={num}
                    onClick={() => unlocked && setSelectedLevel(num)}
                    className={`p-5 rounded-xl border-2 transition-all cursor-pointer ${
                      isCurrent 
                        ? `border-purple-500 bg-gradient-to-r ${levelData.color} bg-opacity-10` 
                        : unlocked 
                          ? 'border-gray-200 hover:border-purple-300 bg-white' 
                          : 'border-gray-100 bg-gray-50 opacity-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${levelData.color} flex items-center justify-center text-3xl mr-4 ${!unlocked && 'grayscale'}`}>
                          {unlocked ? levelData.icon : '🔒'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-800 text-lg">Level {num}: {levelData.name}</span>
                            {isCurrent && (
                              <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded-full">CURRENT</span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {levelData.minXP} - {levelData.maxXP} XP • {levelData.skills.length} Skills
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {unlocked ? (
                          <CheckCircle className="text-green-500" size={24} />
                        ) : (
                          <Lock className="text-gray-400" size={24} />
                        )}
                        <ChevronRight className="text-gray-400 ml-2" size={20} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Skill Tree Tab */}
        {activeTab === 'skills' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
              <Brain className="mr-2 text-purple-600" size={20} />
              Complete Skill Tree
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* AI Skills Column */}
              <div>
                <div className="text-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Zap className="text-blue-600" size={24} />
                  </div>
                  <h4 className="font-bold text-blue-600">AI & Technology</h4>
                </div>
                <div className="space-y-3">
                  {['Introduction to AI', 'AI Helpers', 'Talking with AI', 'AI Projects', 'AI Ethics', 'Creating with AI', 'Advanced AI'].map((skill, idx) => {
                    const unlocked = (stats?.level || 1) > idx;
                    return (
                      <div key={skill} className={`p-3 rounded-lg flex items-center ${unlocked ? 'bg-blue-50' : 'bg-gray-50'}`}>
                        {unlocked ? (
                          <CheckCircle className="text-green-500 mr-2" size={18} />
                        ) : (
                          <Circle className="text-gray-300 mr-2" size={18} />
                        )}
                        <span className={unlocked ? 'text-gray-800' : 'text-gray-400'}>{skill}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Logic Skills Column */}
              <div>
                <div className="text-center mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Brain className="text-purple-600" size={24} />
                  </div>
                  <h4 className="font-bold text-purple-600">Logic & Thinking</h4>
                </div>
                <div className="space-y-3">
                  {['Pattern Basics', 'Logic Puzzles', 'Sequences', 'Advanced Logic', 'Critical Thinking', 'Systems Thinking', 'Expert Problem Solving'].map((skill, idx) => {
                    const unlocked = (stats?.level || 1) > idx;
                    return (
                      <div key={skill} className={`p-3 rounded-lg flex items-center ${unlocked ? 'bg-purple-50' : 'bg-gray-50'}`}>
                        {unlocked ? (
                          <CheckCircle className="text-green-500 mr-2" size={18} />
                        ) : (
                          <Circle className="text-gray-300 mr-2" size={18} />
                        )}
                        <span className={unlocked ? 'text-gray-800' : 'text-gray-400'}>{skill}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Creative Skills Column */}
              <div>
                <div className="text-center mb-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Lightbulb className="text-orange-600" size={24} />
                  </div>
                  <h4 className="font-bold text-orange-600">Creative & Innovation</h4>
                </div>
                <div className="space-y-3">
                  {['Creative Basics', 'Idea Generation', 'Problem Solving', 'Innovation', 'Design Thinking', 'Leadership', 'Mentor'].map((skill, idx) => {
                    const unlocked = (stats?.level || 1) > idx;
                    return (
                      <div key={skill} className={`p-3 rounded-lg flex items-center ${unlocked ? 'bg-orange-50' : 'bg-gray-50'}`}>
                        {unlocked ? (
                          <CheckCircle className="text-green-500 mr-2" size={18} />
                        ) : (
                          <Circle className="text-gray-300 mr-2" size={18} />
                        )}
                        <span className={unlocked ? 'text-gray-800' : 'text-gray-400'}>{skill}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LevelBasedLearning;
