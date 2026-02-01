import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth, API } from "../auth/AuthContext";
import AppLayout from "../layout/AppLayout";

const Dashboard = () => {
  const { user, isStudent, isTeacher, hasSubscription, getLearningLevel } = useAuth();
  const [stats, setStats] = useState({ courses: 0, enrollments: 0, skills: 4, activeStudents: 0 });
  const [learningFramework, setLearningFramework] = useState({});
  const [learningPath, setLearningPath] = useState(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Load learning framework
        const frameworkResponse = await axios.get(`${API}/learning-framework`);
        setLearningFramework(frameworkResponse.data);

        // Load student learning path if student
        if (isStudent) {
          try {
            const pathResponse = await axios.get(`${API}/learning-path`, {
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setLearningPath(pathResponse.data);
          } catch (error) {
            console.error('Failed to load learning path:', error);
          }
        }

        // Load general stats
        const coursesResponse = await axios.get(`${API}/courses`);
        setStats(prev => ({ ...prev, courses: coursesResponse.data.length }));

      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      }
    };

    loadDashboardData();
  }, [isStudent]);

  const getLevelInfo = (ageGroup) => {
    const levels = {
      '5-8': {
        name: 'Foundation Level',
        icon: '🌱',
        color: 'from-green-500 to-emerald-600',
        description: 'Building blocks of future thinking',
        nextLevel: 'Development Level'
      },
      '9-12': {
        name: 'Development Level', 
        icon: '🧠',
        color: 'from-blue-500 to-cyan-600',
        description: 'Expanding logical and creative thinking',
        nextLevel: 'Mastery Level'
      },
      '13-16': {
        name: 'Mastery Level',
        icon: '🎯', 
        color: 'from-purple-500 to-indigo-600',
        description: 'Future career and leadership preparation',
        nextLevel: 'Future Leader'
      }
    };
    return levels[ageGroup] || levels['9-12'];
  };

  const levelInfo = getLevelInfo(user?.age_group);
  const currentFramework = learningFramework[user?.learning_level || 'foundation'] || {};

  return (
    <AppLayout>
      {/* Hero Welcome Section */}
      <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-3 gap-8 items-center">
            <div className="lg:col-span-2">
              <h1 className="text-4xl lg:text-5xl font-bold mb-4" data-testid="dashboard-welcome">
                Welcome back, {user?.full_name}! 👋
              </h1>
              <p className="text-xl text-purple-100 mb-6">
                Ready to build the skills that will shape tomorrow?
              </p>
              
              {isStudent && (
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <div className="flex items-center mb-4">
                    <span className="text-4xl mr-4">{levelInfo.icon}</span>
                    <div>
                      <h3 className="text-2xl font-bold">{levelInfo.name}</h3>
                      <p className="text-purple-100">{levelInfo.description}</p>
                    </div>
                  </div>
                  
                  {learningPath && (
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="text-center">
                        <p className="text-3xl font-bold">{Math.round(learningPath.level_completion_percentage || 0)}%</p>
                        <p className="text-sm text-purple-200">Level Progress</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-bold">{learningPath.completed_courses?.length || 0}</p>
                        <p className="text-sm text-purple-200">Courses Completed</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="text-center lg:text-right">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                <h3 className="text-xl font-bold mb-4">🎯 Future Skills Focus</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>🤖 AI Literacy</span>
                    <span className="text-yellow-300">●●●○○</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>🧠 Logical Thinking</span>
                    <span className="text-yellow-300">●●●●○</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>🎨 Creative Problem Solving</span>
                    <span className="text-yellow-300">●●●○○</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>🚀 Future Career Skills</span>
                    <span className="text-yellow-300">●●○○○</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Subscription Prompt for Non-Premium Students */}
        {isStudent && !hasSubscription && (
          <div className="mb-8 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-4xl mr-4">⭐</span>
                <div>
                  <h3 className="text-xl font-bold">Unlock Your Complete Future-Ready Journey!</h3>
                  <p className="text-yellow-100 mt-1">
                    Access all learning levels, get physical materials, and receive future career guidance.
                  </p>
                </div>
              </div>
              <a 
                href="/subscription" 
                className="bg-white text-orange-600 font-bold px-6 py-3 rounded-xl hover:bg-gray-100 transition-colors"
              >
                Get Premium →
              </a>
            </div>
          </div>
        )}

        {/* Stats Dashboard */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 font-medium text-sm">AVAILABLE COURSES</p>
                <p className="text-3xl font-bold text-gray-800">{stats.courses}</p>
              </div>
              <span className="text-4xl text-green-500">📚</span>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 font-medium text-sm">SKILL AREAS</p>
                <p className="text-3xl font-bold text-gray-800">{stats.skills}</p>
              </div>
              <span className="text-4xl text-blue-500">🧠</span>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 font-medium text-sm">LEARNING LEVELS</p>
                <p className="text-3xl font-bold text-gray-800">3</p>
              </div>
              <span className="text-4xl text-purple-500">🎯</span>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 font-medium text-sm">EXCELLENCE YEARS</p>
                <p className="text-3xl font-bold text-gray-800">42</p>
              </div>
              <span className="text-4xl text-orange-500">🏆</span>
            </div>
          </div>
        </div>

        {/* New Features Quick Access - For Students */}
        {isStudent && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center text-gray-800">
              <span className="mr-3">🎮</span>
              New Learning Features
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <a href="/ai-chat" className="block bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1" data-testid="quick-ai-chat">
                <span className="text-4xl mb-3 block">🤖</span>
                <h3 className="text-xl font-bold mb-2">AI Tutor</h3>
                <p className="text-purple-100 text-sm">Chat with your personal AI learning assistant powered by Claude & Gemini</p>
              </a>
              
              <a href="/quizzes" className="block bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1" data-testid="quick-quizzes">
                <span className="text-4xl mb-3 block">📝</span>
                <h3 className="text-xl font-bold mb-2">Quizzes</h3>
                <p className="text-blue-100 text-sm">Test your knowledge with interactive assessments and earn points</p>
              </a>
              
              <a href="/gamification" className="block bg-gradient-to-br from-yellow-500 to-orange-500 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1" data-testid="quick-gamification">
                <span className="text-4xl mb-3 block">🏆</span>
                <h3 className="text-xl font-bold mb-2">Achievements</h3>
                <p className="text-yellow-100 text-sm">Track your points, badges, level and compete on leaderboards</p>
              </a>
              
              <a href="/certificates" className="block bg-gradient-to-br from-green-500 to-emerald-500 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1" data-testid="quick-certificates">
                <span className="text-4xl mb-3 block">🎓</span>
                <h3 className="text-xl font-bold mb-2">Certificates</h3>
                <p className="text-green-100 text-sm">View and download your course completion certificates</p>
              </a>
              
              <a href="/live-classes" className="block bg-gradient-to-br from-red-500 to-pink-500 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1" data-testid="quick-live-classes">
                <span className="text-4xl mb-3 block">📹</span>
                <h3 className="text-xl font-bold mb-2">Live Classes</h3>
                <p className="text-red-100 text-sm">Join interactive live sessions with teachers via Zoom</p>
              </a>
              
              <a href="/challenges" className="block bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1" data-testid="quick-challenges">
                <span className="text-4xl mb-3 block">🎯</span>
                <h3 className="text-xl font-bold mb-2">Daily Challenges</h3>
                <p className="text-amber-100 text-sm">Complete daily & weekly challenges to earn bonus XP and badges</p>
              </a>
              
              <a href="/workouts" className="block bg-gradient-to-br from-indigo-500 to-purple-500 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1" data-testid="quick-workouts">
                <span className="text-4xl mb-3 block">🧩</span>
                <h3 className="text-xl font-bold mb-2">Logic Workouts</h3>
                <p className="text-indigo-100 text-sm">Train your brain with interactive logic puzzles</p>
              </a>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center text-gray-800">
                <span className="mr-3">⚡</span>
                Quick Actions
              </h2>
              <div className="space-y-4">
                {isStudent && (
                  <>
                    <a href="/learning-path" className="block p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl hover:from-purple-100 hover:to-indigo-100 transition-colors border-2 border-purple-100 hover:border-purple-200">
                      <div className="flex items-center">
                        <span className="text-3xl mr-4">🛤️</span>
                        <div>
                          <p className="font-bold text-gray-800">My Learning Path</p>
                          <p className="text-sm text-purple-600">{levelInfo.name} Journey</p>
                        </div>
                      </div>
                    </a>
                    <a href="/courses" className="block p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl hover:from-blue-100 hover:to-cyan-100 transition-colors border-2 border-blue-100 hover:border-blue-200">
                      <div className="flex items-center">
                        <span className="text-3xl mr-4">📚</span>
                        <div>
                          <p className="font-bold text-gray-800">Browse All Courses</p>
                          <p className="text-sm text-blue-600">Explore future skills</p>
                        </div>
                      </div>
                    </a>
                    <a href="/workouts" className="block p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl hover:from-green-100 hover:to-emerald-100 transition-colors border-2 border-green-100 hover:border-green-200">
                      <div className="flex items-center">
                        <span className="text-3xl mr-4">🧩</span>
                        <div>
                          <p className="font-bold text-gray-800">Logic Workouts</p>
                          <p className="text-sm text-green-600">Interactive brain training</p>
                        </div>
                      </div>
                    </a>
                  </>
                )}
                {isTeacher && (
                  <>
                    <a href="/teacher" className="block p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl hover:from-green-100 hover:to-emerald-100 transition-colors border-2 border-green-100 hover:border-green-200">
                      <div className="flex items-center">
                        <span className="text-3xl mr-4">🎬</span>
                        <div>
                          <p className="font-bold text-gray-800">Create Content</p>
                          <p className="text-sm text-green-600">Build future-ready courses</p>
                        </div>
                      </div>
                    </a>
                    <a href="/analytics" className="block p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl hover:from-indigo-100 hover:to-purple-100 transition-colors border-2 border-indigo-100 hover:border-indigo-200">
                      <div className="flex items-center">
                        <span className="text-3xl mr-4">📊</span>
                        <div>
                          <p className="font-bold text-gray-800">Student Analytics</p>
                          <p className="text-sm text-indigo-600">Track future readiness</p>
                        </div>
                      </div>
                    </a>
                  </>
                )}
              </div>
            </div>

            {/* Current Level Skills */}
            {isStudent && currentFramework.core_skills && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center text-gray-800">
                  <span className="mr-2">{levelInfo.icon}</span>
                  Your {levelInfo.name} Skills
                </h3>
                <div className="space-y-3">
                  {currentFramework.core_skills.map((skill, index) => (
                    <div key={index} className="flex items-center p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                      <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mr-3"></div>
                      <span className="text-sm font-medium text-gray-700">{skill}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Featured Learning Areas */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center text-gray-800">
                <span className="mr-3">🌟</span>
                Future-Ready Learning Areas
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="group cursor-pointer">
                  <div className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white p-6 rounded-xl shadow-lg group-hover:shadow-xl transition-all group-hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-4xl">🤖</span>
                      <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">AI Literacy</span>
                    </div>
                    <h3 className="text-xl font-bold mb-2">Artificial Intelligence</h3>
                    <p className="text-blue-100 text-sm">
                      Understand AI tools, human-AI collaboration, and prepare for an AI-powered future.
                    </p>
                  </div>
                </div>
                
                <div className="group cursor-pointer">
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-6 rounded-xl shadow-lg group-hover:shadow-xl transition-all group-hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-4xl">🧩</span>
                      <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">Logic</span>
                    </div>
                    <h3 className="text-xl font-bold mb-2">Logical Thinking Workouts</h3>
                    <p className="text-green-100 text-sm">
                      Interactive puzzles, pattern recognition, and reasoning challenges to strengthen logical thinking.
                    </p>
                    <div className="mt-4">
                      <a href="/workouts" className="inline-block bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        Start Workout →
                      </a>
                    </div>
                  </div>
                </div>
                
                <div className="group cursor-pointer">
                  <div className="bg-gradient-to-br from-purple-500 to-pink-600 text-white p-6 rounded-xl shadow-lg group-hover:shadow-xl transition-all group-hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-4xl">🎨</span>
                      <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">Creative</span>
                    </div>
                    <h3 className="text-xl font-bold mb-2">Creative Problem Solving</h3>
                    <p className="text-purple-100 text-sm">
                      Design thinking, innovation methods, and creative solution development.
                    </p>
                  </div>
                </div>
                
                <div className="group cursor-pointer">
                  <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white p-6 rounded-xl shadow-lg group-hover:shadow-xl transition-all group-hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-4xl">💼</span>
                      <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">Career</span>
                    </div>
                    <h3 className="text-xl font-bold mb-2">Future Career Skills</h3>
                    <p className="text-orange-100 text-sm">
                      Adaptability, leadership, entrepreneurship, and tomorrow&apos;s workplace skills.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* TEC Legacy & Vision */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <span className="mr-3">🏆</span>
                TEC Legacy of Excellence
              </h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">🖥️</span>
                  <div>
                    <p className="font-semibold">1982: Computer Education Pioneer</p>
                    <p className="text-indigo-200 text-sm">First in Sri Lankan IT education</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-2xl mr-3">🤖</span>
                  <div>
                    <p className="font-semibold">2020: Robotics & AI Programs</p>
                    <p className="text-indigo-200 text-sm">Future-ready curriculum launched</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-2xl mr-3">🚀</span>
                  <div>
                    <p className="font-semibold">2024: Complete Digital Transformation</p>
                    <p className="text-indigo-200 text-sm">Global online learning platform</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
