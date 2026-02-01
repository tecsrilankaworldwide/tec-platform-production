import React, { useState, useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import "./App.css";
import "./pastel-theme.css"; // Soft pastel design system for kids & teens
import PublicLanding from "./PublicLanding";
import { LanguageProvider } from "./LanguageContext";
import ShareModal from "./components/ShareModal";

// Refactored Components
import { AuthProvider, useAuth, API } from "./components/auth/AuthContext";
import Login from "./components/auth/Login";
import Navigation from "./components/layout/Navigation";
import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import Dashboard from "./components/dashboard/Dashboard";
import TeacherDashboard from "./components/dashboard/TeacherDashboard";

// Lazy load heavy components for better performance
const AIChatPage = lazy(() => import("./components/AIChatPage"));
const GamificationPage = lazy(() => import("./components/GamificationPage"));
const QuizPage = lazy(() => import("./components/QuizPage"));
const CertificatesPage = lazy(() => import("./components/CertificatesPage"));
const LiveClassesPage = lazy(() => import("./components/LiveClassesPage"));
const ChallengesPage = lazy(() => import("./components/ChallengesPage"));
const AdminDashboard = lazy(() => import("./components/AdminDashboard"));
const StudentDashboard = lazy(() => import("./components/StudentDashboard"));
const VerificationPage = lazy(() => import("./components/VerificationPage"));
const ParentPortal = lazy(() => import("./components/ParentPortal"));
const AttendanceManager = lazy(() => import("./components/AttendanceManager"));
const TeacherCertificates = lazy(() => import("./components/TeacherCertificates"));
const LevelBasedLearning = lazy(() => import("./components/LevelBasedLearning"));
const StudentShowcase = lazy(() => import("./components/StudentShowcase"));
const TechAIMagazine = lazy(() => import("./components/TechAIMagazine"));
const ClassScheduler = lazy(() => import("./components/ClassScheduler"));
const ArticleEditor = lazy(() => import("./components/ArticleEditor"));
const WhatsAppAdmin = lazy(() => import("./components/WhatsAppAdmin"));
const ArticleReviewDashboard = lazy(() => import("./components/ArticleReviewDashboard"));
const Leaderboard = lazy(() => import("./components/Leaderboard"));
const BatchShowcase = lazy(() => import("./components/BatchShowcase"));
const InviteAndEarn = lazy(() => import("./components/InviteAndEarn"));

// Loading component for Suspense
const LoadingFallback = () => (
  <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-lg text-gray-600 font-medium">Loading...</p>
    </div>
  </div>
);

// Enrollment Success/Cancel Components
const EnrollmentSuccess = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-2xl text-center">
        <div className="text-6xl mb-6">🎉</div>
        <h1 className="text-4xl font-bold text-green-600 mb-4">Enrollment Successful!</h1>
        <p className="text-xl text-gray-700 mb-8">
          Welcome to TecaiKids! Your payment was processed successfully. 
          Check your email for login credentials and next steps.
        </p>
        <a 
          href="/login" 
          className="inline-block bg-purple-600 text-white px-8 py-4 rounded-lg font-bold hover:bg-purple-700 transition-colors"
        >
          Go to Learning Platform →
        </a>
      </div>
    </div>
  );
};

const EnrollmentCancelled = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-2xl text-center">
        <div className="text-6xl mb-6">❌</div>
        <h1 className="text-4xl font-bold text-orange-600 mb-4">Enrollment Cancelled</h1>
        <p className="text-xl text-gray-700 mb-8">
          Your enrollment was cancelled. No charges were made. 
          Feel free to try again when you're ready!
        </p>
        <a 
          href="/" 
          className="inline-block bg-purple-600 text-white px-8 py-4 rounded-lg font-bold hover:bg-purple-700 transition-colors"
        >
          ← Back to Programs
        </a>
      </div>
    </div>
  );
};

// Learning Path Component
const LearningPath = () => {
  const { user, token, getLearningLevel } = useAuth();
  const [learningPath, setLearningPath] = useState(null);
  const [framework, setFramework] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLearningPath = async () => {
      try {
        const [pathResponse, frameworkResponse] = await Promise.all([
          axios.get(`${API}/learning-path`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API}/learning-framework`)
        ]);
        
        setLearningPath(pathResponse.data);
        setFramework(frameworkResponse.data);
      } catch (error) {
        console.error('Failed to load learning path:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLearningPath();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-300 rounded w-1/3 mx-auto"></div>
            <div className="h-64 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const currentLevel = framework[user?.learning_level || 'foundation'] || {};

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">🛤️ Your Learning Path</h1>
          <p className="text-xl text-gray-600">Personalized journey to future readiness</p>
        </div>

        {/* Current Level Overview */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <span className="text-5xl mr-4">{currentLevel.icon}</span>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{currentLevel.level_name}</h2>
                <p className="text-gray-600">{currentLevel.description}</p>
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600">
                {Math.round(learningPath?.level_completion_percentage || 0)}%
              </div>
              <p className="text-sm text-gray-500">Complete</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-4 mb-6">
            <div 
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-4 rounded-full transition-all duration-1000" 
              style={{ width: `${learningPath?.level_completion_percentage || 0}%` }}
            ></div>
          </div>

          {/* Core Skills Progress */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-800">🎯 Core Skills</h3>
              <div className="space-y-3">
                {currentLevel.core_skills?.map((skill, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">{skill}</span>
                    <span className="text-xs text-purple-600 font-bold">
                      {Math.floor(Math.random() * 40 + 60)}% ✓
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-800">🚀 Future Readiness</h3>
              <div className="space-y-3">
                {currentLevel.future_readiness?.map((skill, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">{skill}</span>
                    <span className="text-xs text-blue-600 font-bold">
                      {Math.floor(Math.random() * 30 + 50)}% ↗️
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl p-8">
          <h3 className="text-2xl font-bold mb-4">🎯 Continue Your Journey</h3>
          <p className="text-purple-100 mb-6">
            Keep building the skills that will make you successful in tomorrow's world.
          </p>
          <div className="flex space-x-4">
            <button className="bg-white text-purple-600 font-bold px-6 py-3 rounded-xl hover:bg-gray-100 transition-colors">
              Continue Learning →
            </button>
            <button className="border-2 border-white text-white font-bold px-6 py-3 rounded-xl hover:bg-white/10 transition-colors">
              View All Courses
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Courses Page
const CoursesPage = () => {
  const { user, token, hasSubscription, getLearningLevel } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ level: '', skill: '', language: '' });
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedCourseForShare, setSelectedCourseForShare] = useState(null);
  const [supportedLanguages, setSupportedLanguages] = useState([]);

  // Fetch supported languages on mount
  useEffect(() => {
    const loadLanguages = async () => {
      try {
        const response = await axios.get(`${API}/supported-languages`);
        setSupportedLanguages(response.data.languages || []);
      } catch (error) {
        console.error('Failed to load languages:', error);
        // Fallback languages
        setSupportedLanguages([
          { code: 'en', name: 'English' },
          { code: 'si', name: 'සිංහල (Sinhala)' },
          { code: 'ta', name: 'தமிழ் (Tamil)' },
          { code: 'zh-CN', name: '中文 (Chinese)' }
        ]);
      }
    };
    loadLanguages();
  }, []);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const response = await axios.get(`${API}/courses`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCourses(response.data);
      } catch (error) {
        console.error('Failed to load courses:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, [token]);

  const handleShareClick = (course) => {
    setSelectedCourseForShare(course);
    setShareModalOpen(true);
  };

  // Demo courses for the unified platform
  const demoFutureCourses = [
    {
      id: 'demo-1',
      title: 'AI Fundamentals for Young Minds',
      description: 'Understanding artificial intelligence through fun activities and real-world examples.',
      learning_level: 'foundation',
      skill_areas: ['ai_literacy', 'logical_thinking'],
      age_group: '5-8',
      difficulty_level: 1,
      estimated_hours: 8,
      is_premium: false,
      icon: '🤖'
    },
    {
      id: 'demo-2', 
      title: 'Creative Logic Adventures',
      description: 'Building logical thinking through creative challenges and interactive problem-solving.',
      learning_level: 'development',
      skill_areas: ['logical_thinking', 'creative_problem_solving'],
      age_group: '9-12',
      difficulty_level: 3,
      estimated_hours: 12,
      is_premium: true,
      icon: '🧩'
    },
    {
      id: 'demo-3',
      title: 'Future Career Navigator',
      description: 'Exploring tomorrow\'s job market and developing essential future workplace skills.',
      learning_level: 'mastery',
      skill_areas: ['future_career_skills', 'systems_thinking'],
      age_group: '13-16',
      difficulty_level: 5,
      estimated_hours: 20,
      is_premium: true,
      icon: '🚀'
    },
    {
      id: 'demo-4',
      title: 'Innovation Design Thinking',
      description: 'Master the design thinking process and innovation methodologies used by global leaders.',
      learning_level: 'mastery',
      skill_areas: ['creative_problem_solving', 'innovation_methods'],
      age_group: '13-16',
      difficulty_level: 4,
      estimated_hours: 16,
      is_premium: true,
      icon: '💡'
    }
  ];

  const allCourses = [...courses, ...demoFutureCourses];

  // Filter courses by language
  const filteredCourses = filter.language 
    ? allCourses.filter(course => course.language === filter.language || !course.language)
    : allCourses;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">📚 Complete Course Catalog</h1>
          <p className="text-xl text-gray-600">Future-ready skills for every learning level</p>
        </div>

        {/* Language Filter Pills */}
        <div className="mb-8" data-testid="language-filter-section">
          <div className="flex items-center justify-center flex-wrap gap-2">
            <span className="text-gray-600 font-medium mr-2">🌍 Language:</span>
            <button
              onClick={() => setFilter({...filter, language: ''})}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filter.language === '' 
                  ? 'bg-purple-600 text-white shadow-md' 
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
              data-testid="language-filter-all"
            >
              All Languages
            </button>
            {supportedLanguages.map(lang => (
              <button
                key={lang.code}
                onClick={() => setFilter({...filter, language: lang.code})}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  filter.language === lang.code 
                    ? 'bg-purple-600 text-white shadow-md' 
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
                data-testid={`language-filter-${lang.code}`}
              >
                {lang.name}
              </button>
            ))}
          </div>
          {filter.language && (
            <p className="text-center text-sm text-purple-600 mt-3">
              Showing courses in: <strong>{supportedLanguages.find(l => l.code === filter.language)?.name || filter.language}</strong>
            </p>
          )}
        </div>

        {/* Course Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCourses.map(course => (
            <div key={course.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-gray-100" data-testid={`course-card-${course.id}`}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl">{course.icon || '📚'}</span>
                  <div className="flex items-center space-x-2">
                    {course.is_premium && <span className="text-purple-600 text-xl">💎</span>}
                    <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium">
                      Level {course.difficulty_level || 1}
                    </span>
                    {/* Share Button */}
                    <button
                      onClick={() => handleShareClick(course)}
                      className="p-2 bg-purple-100 hover:bg-purple-200 rounded-full transition-colors"
                      title="Share Course"
                      data-testid={`share-btn-${course.id}`}
                    >
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-gray-800 mb-2">{course.title}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{course.description}</p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Age Group:</span>
                    <span className="font-medium text-blue-600">{course.age_group}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Duration:</span>
                    <span className="font-medium text-green-600">{course.estimated_hours || 8} hours</span>
                  </div>
                  {course.language && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Language:</span>
                      <span className="font-medium text-purple-600">
                        {supportedLanguages.find(l => l.code === course.language)?.name || course.language}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <button className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors ${
                    course.is_premium && !hasSubscription
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
                  }`} data-testid={`start-learning-btn-${course.id}`}>
                    {course.is_premium && !hasSubscription ? '💎 Premium' : '🚀 Start'}
                  </button>
                  <button
                    onClick={() => handleShareClick(course)}
                    className="py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-600 transition-colors"
                    data-testid={`share-course-btn-${course.id}`}
                  >
                    📤 Share
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal 
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        course={selectedCourseForShare}
        siteUrl="https://www.tecaikids.com"
      />
    </div>
  );
};

// Logical Thinking Workouts Page
const WorkoutsPage = () => {
  const { user, token, hasSubscription, getLearningLevel } = useAuth();
  const [workouts, setWorkouts] = useState([]);
  const [progress, setProgress] = useState({ progress_by_type: [], recent_attempts: [], total_attempts: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ difficulty: '', workout_type: '' });

  useEffect(() => {
    const loadWorkoutsData = async () => {
      try {
        // Filter out empty string values to avoid backend validation errors
        const cleanFilter = Object.fromEntries(
          Object.entries(filter).filter(([key, value]) => value !== '')
        );
        
        const [workoutsResponse, progressResponse] = await Promise.all([
          axios.get(`${API}/workouts`, {
            headers: { Authorization: `Bearer ${token}` },
            params: {
              learning_level: user?.learning_level,
              age_group: user?.age_group,
              ...cleanFilter
            }
          }),
          axios.get(`${API}/workouts/progress`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        
        setWorkouts(workoutsResponse.data);
        setProgress(progressResponse.data);
      } catch (error) {
        console.error('Failed to load workouts data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadWorkoutsData();
    }
  }, [token, user, filter]);

  const handleStartWorkout = async (workoutId) => {
    try {
      const response = await axios.post(`${API}/workouts/${workoutId}/attempt`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Navigate to workout interface (for now, just show alert)
      alert(`Workout started! Attempt ID: ${response.data.attempt_id}`);
      
      // Reload data to update progress
      window.location.reload();
    } catch (error) {
      console.error('Failed to start workout:', error);
      alert('Failed to start workout. Please try again.');
    }
  };

  const getWorkoutIcon = (workoutType) => {
    const icons = {
      pattern_recognition: '🔍',
      logical_sequences: '🔢',
      puzzle_solving: '🧩',
      reasoning_chains: '🧠',
      critical_thinking: '💭',
      problem_decomposition: '📊'
    };
    return icons[workoutType] || '🧩';
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      beginner: 'from-green-500 to-emerald-600',
      intermediate: 'from-blue-500 to-cyan-600',
      advanced: 'from-purple-500 to-indigo-600',
      expert: 'from-red-500 to-pink-600'
    };
    return colors[difficulty] || 'from-gray-500 to-gray-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-300 rounded w-1/3 mx-auto"></div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="h-64 bg-gray-300 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">🧩 Logical Thinking Workouts</h1>
          <p className="text-xl text-gray-600">Strengthen your logical reasoning with interactive challenges</p>
        </div>

        {/* Progress Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 font-medium text-sm">TOTAL ATTEMPTS</p>
                <p className="text-3xl font-bold text-gray-800">{progress.total_attempts}</p>
              </div>
              <span className="text-4xl text-blue-500">🎯</span>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 font-medium text-sm">WORKOUT TYPES</p>
                <p className="text-3xl font-bold text-gray-800">{progress.progress_by_type.length}</p>
              </div>
              <span className="text-4xl text-green-500">🧩</span>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 font-medium text-sm">RECENT ACTIVITY</p>
                <p className="text-3xl font-bold text-gray-800">{progress.recent_attempts.length}</p>
              </div>
              <span className="text-4xl text-purple-500">⚡</span>
            </div>
          </div>
        </div>

        {/* Workouts Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Available Workouts</h2>
            <div className="flex space-x-4">
              <select
                value={filter.difficulty}
                onChange={(e) => setFilter({...filter, difficulty: e.target.value})}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Difficulties</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
              </select>
              <select
                value={filter.workout_type}
                onChange={(e) => setFilter({...filter, workout_type: e.target.value})}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Types</option>
                <option value="pattern_recognition">Pattern Recognition</option>
                <option value="logical_sequences">Logical Sequences</option>
                <option value="puzzle_solving">Puzzle Solving</option>
                <option value="reasoning_chains">Reasoning Chains</option>
                <option value="critical_thinking">Critical Thinking</option>
                <option value="problem_decomposition">Problem Decomposition</option>
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {workouts.map(workout => (
              <div key={workout.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-gray-100">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-4xl">{getWorkoutIcon(workout.workout_type)}</span>
                    <div className="flex items-center space-x-2">
                      <span className={`bg-gradient-to-r ${getDifficultyColor(workout.difficulty)} text-white px-3 py-1 rounded-full text-xs font-medium`}>
                        {workout.difficulty}
                      </span>
                      <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium">
                        {workout.estimated_time_minutes}min
                      </span>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{workout.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{workout.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Type:</span>
                      <span className="font-medium text-blue-600 capitalize">
                        {workout.workout_type.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Level:</span>
                      <span className="font-medium text-green-600 capitalize">
                        {workout.learning_level}
                      </span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleStartWorkout(workout.id)}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-4 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-colors font-semibold"
                  >
                    🚀 Start Workout
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        {progress.recent_attempts.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-800">📈 Recent Activity</h3>
            <div className="space-y-3">
              {progress.recent_attempts.slice(0, 5).map((attempt, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">🧩</span>
                    <div>
                      <p className="font-medium text-gray-800">Workout Attempt</p>
                      <p className="text-xs text-gray-500">
                        {new Date(attempt.started_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {attempt.is_correct !== null && (
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        attempt.is_correct ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {attempt.is_correct ? '✅ Correct' : '❌ Incorrect'}
                      </span>
                    )}
                    {attempt.score !== null && (
                      <p className="text-sm font-bold text-purple-600 mt-1">
                        Score: {attempt.score}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const AnalyticsDashboard = () => (
  <AppLayout>
    <div className="text-center">
      <div className="bg-white rounded-2xl p-12 shadow-lg">
        <div className="text-6xl mb-6">📊</div>
        <h1 className="text-3xl font-bold mb-4">Future-Ready Analytics</h1>
        <p className="text-xl text-gray-600 mb-8">Advanced learning analytics dashboard coming soon!</p>
        <div className="bg-gradient-to-r from-blue-100 to-indigo-100 p-6 rounded-xl">
          <p className="text-blue-800 font-medium">Tracking student progress toward future readiness.</p>
        </div>
      </div>
    </div>
  </AppLayout>
);

const SubscriptionPage = () => (
  <AppLayout>
    <div className="text-center">
      <div className="bg-white rounded-2xl p-12 shadow-lg">
        <div className="text-6xl mb-6">💎</div>
        <h1 className="text-3xl font-bold mb-4">Premium Future-Ready Plans</h1>
        <p className="text-xl text-gray-600 mb-8">Age-based pricing with physical materials coming soon!</p>
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-6 rounded-xl">
          <p className="text-purple-800 font-medium">Complete learning ecosystem with quarterly materials delivery.</p>
        </div>
      </div>
    </div>
  </AppLayout>
);

// Footer Component
const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-12 mt-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="col-span-2">
            <h3 className="text-2xl font-bold mb-4">🚀 TEC Future-Ready Learning Platform</h3>
            <p className="text-gray-300 mb-6">
              Preparing Sri Lankan children for tomorrow's world since 1982. Complete educational ecosystem for ages 5-16 with AI, Logical Thinking, Creative Problem Solving, and Future Career Skills.
            </p>
            <div className="bg-gradient-to-r from-purple-800 to-blue-800 p-6 rounded-xl">
              <h4 className="font-semibold mb-3">42 Years of Educational Excellence:</h4>
              <p className="text-xl font-bold text-purple-300">TEC Sri Lanka Worldwide (Pvt.) Ltd</p>
              <p className="text-sm text-gray-300 mt-2">Pioneer in Future-Ready Education Technology</p>
              <div className="text-sm text-gray-400 mt-3 space-y-1">
                <p>🖥️ 1982: Computer Education Pioneer</p>
                <p>🤖 2004: Robotics with LEGO Dacta Denmark</p>
                <p>🚀 2024: AI Future-Ready Learning Platform</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Learning Levels</h4>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-center">
                <span className="text-2xl mr-3">🌱</span>
                <div>
                  <p className="font-semibold text-green-400">Foundation (5-8)</p>
                  <p className="text-xs">Basic AI & Logic</p>
                </div>
              </li>
              <li className="flex items-center">
                <span className="text-2xl mr-3">🧠</span>
                <div>
                  <p className="font-semibold text-blue-400">Development (9-12)</p>
                  <p className="text-xs">Advanced Thinking</p>
                </div>
              </li>
              <li className="flex items-center">
                <span className="text-2xl mr-3">🎯</span>
                <div>
                  <p className="font-semibold text-purple-400">Mastery (13-16)</p>
                  <p className="text-xs">Future Career Skills</p>
                </div>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contact & Support</h4>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>🏢 TEC Sri Lanka Worldwide (Pvt.) Ltd</li>
              <li>📧 info@tecfutureready.lk</li>
              <li>🌐 Sri Lanka Nationwide Delivery</li>
              <li>📱 Future-Ready Education Since 1982</li>
              <li>🔒 Secure Stripe Payments</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-300 mb-2">
            © 2024 <span className="font-semibold">TEC Sri Lanka Worldwide (Pvt.) Ltd</span>. All rights reserved.
          </p>
          <p className="text-sm text-gray-400 mb-4">
            TEC Future-Ready Learning Platform • Preparing minds for tomorrow since 1982
          </p>
          <div className="flex justify-center space-x-8 text-sm text-gray-400">
            <span>🔒 Secure Payments</span>
            <span>🚀 Future-Ready Skills</span>
            <span>🇱🇰 Made in Sri Lanka</span>
            <span>💎 42 Years Excellence</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

// Wrapper Components for New Features
const AIChatPageWrapper = () => {
  const { user, token } = useAuth();
  return (
    <AppLayout>
      <AIChatPage token={token} user={user} />
    </AppLayout>
  );
};

const GamificationPageWrapper = () => {
  const { user, token } = useAuth();
  return (
    <AppLayout>
      <GamificationPage token={token} user={user} />
    </AppLayout>
  );
};

const QuizPageWrapper = () => {
  const { user, token } = useAuth();
  return (
    <AppLayout>
      <QuizPage token={token} user={user} />
    </AppLayout>
  );
};

const CertificatesPageWrapper = () => {
  const { user, token } = useAuth();
  return (
    <AppLayout>
      <CertificatesPage token={token} user={user} />
    </AppLayout>
  );
};

const LiveClassesPageWrapper = () => {
  const { user, token } = useAuth();
  return (
    <AppLayout>
      <LiveClassesPage token={token} user={user} />
    </AppLayout>
  );
};

const ParentPortalWrapper = () => {
  return (
    <AppLayout>
      <ParentPortal />
    </AppLayout>
  );
};

const AttendanceManagerWrapper = () => {
  return (
    <AppLayout>
      <AttendanceManager />
    </AppLayout>
  );
};

const TeacherCertificatesWrapper = () => {
  return (
    <AppLayout>
      <TeacherCertificates />
    </AppLayout>
  );
};

const LevelBasedLearningWrapper = () => {
  return (
    <AppLayout>
      <LevelBasedLearning />
    </AppLayout>
  );
};

const StudentShowcaseWrapper = () => {
  return (
    <AppLayout>
      <StudentShowcase />
    </AppLayout>
  );
};

const TechAIMagazineWrapper = () => {
  return (
    <AppLayout>
      <TechAIMagazine />
    </AppLayout>
  );
};

const ClassSchedulerWrapper = () => {
  return (
    <AppLayout>
      <ClassScheduler />
    </AppLayout>
  );
};

const ArticleEditorWrapper = () => {
  return (
    <AppLayout>
      <ArticleEditor />
    </AppLayout>
  );
};

const WhatsAppAdminWrapper = () => {
  const { token } = useAuth();
  return (
    <AppLayout>
      <WhatsAppAdmin token={token} />
    </AppLayout>
  );
};

const ArticleReviewWrapper = () => {
  return (
    <AppLayout>
      <ArticleReviewDashboard />
    </AppLayout>
  );
};

const LeaderboardWrapper = () => {
  return (
    <AppLayout>
      <Leaderboard />
    </AppLayout>
  );
};

const ChallengesPageWrapper = () => {
  const { token } = useAuth();
  return (
    <AppLayout>
      <ChallengesPage token={token} />
    </AppLayout>
  );
};

const BatchShowcaseWrapper = () => {
  return (
    <AppLayout>
      <BatchShowcase />
    </AppLayout>
  );
};

const ReferralSystemWrapper = () => {
  return (
    <AppLayout>
      <Suspense fallback={<LoadingFallback />}>
        <InviteAndEarn />
      </Suspense>
    </AppLayout>
  );
};

// Main App Component
function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <div className="App min-h-screen bg-gray-50">
          <BrowserRouter>
            <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/learning-path" element={
              <ProtectedRoute requireRole="student">
                <LearningPath />
              </ProtectedRoute>
            } />
            <Route path="/courses" element={
              <ProtectedRoute requireRole="student">
                <CoursesPage />
              </ProtectedRoute>
            } />
            <Route path="/workouts" element={
              <ProtectedRoute requireRole="student">
                <WorkoutsPage />
              </ProtectedRoute>
            } />
            <Route path="/subscription" element={
              <ProtectedRoute requireRole="student">
                <SubscriptionPage />
              </ProtectedRoute>
            } />
            <Route path="/teacher" element={
              <ProtectedRoute requireRole="teacher">
                <TeacherDashboard />
              </ProtectedRoute>
            } />
            <Route path="/analytics" element={
              <ProtectedRoute requireRole="teacher">
                <AnalyticsDashboard />
              </ProtectedRoute>
            } />
            
            {/* New Feature Routes */}
            <Route path="/ai-chat" element={
              <ProtectedRoute requireRole="student">
                <AIChatPageWrapper />
              </ProtectedRoute>
            } />
            <Route path="/gamification" element={
              <ProtectedRoute requireRole="student">
                <GamificationPageWrapper />
              </ProtectedRoute>
            } />
            <Route path="/quizzes" element={
              <ProtectedRoute requireRole="student">
                <QuizPageWrapper />
              </ProtectedRoute>
            } />
            <Route path="/certificates" element={
              <ProtectedRoute requireRole="student">
                <CertificatesPageWrapper />
              </ProtectedRoute>
            } />
            <Route path="/live-classes" element={
              <ProtectedRoute>
                <LiveClassesPageWrapper />
              </ProtectedRoute>
            } />
            <Route path="/parent-portal" element={
              <ProtectedRoute>
                <ParentPortalWrapper />
              </ProtectedRoute>
            } />
            <Route path="/parent-dashboard" element={
              <ProtectedRoute>
                <ParentPortalWrapper />
              </ProtectedRoute>
            } />
            <Route path="/attendance" element={
              <ProtectedRoute>
                <AttendanceManagerWrapper />
              </ProtectedRoute>
            } />
            <Route path="/teacher-certificates" element={
              <ProtectedRoute>
                <TeacherCertificatesWrapper />
              </ProtectedRoute>
            } />
            <Route path="/challenges" element={
              <ProtectedRoute>
                <ChallengesPageWrapper />
              </ProtectedRoute>
            } />
            
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/student-dashboard" element={
              <ProtectedRoute>
                <StudentDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/my-learning" element={
              <ProtectedRoute>
                <LevelBasedLearningWrapper />
              </ProtectedRoute>
            } />
            
            <Route path="/showcase" element={
              <ProtectedRoute>
                <StudentShowcaseWrapper />
              </ProtectedRoute>
            } />
            
            <Route path="/magazine" element={
              <ProtectedRoute>
                <TechAIMagazineWrapper />
              </ProtectedRoute>
            } />
            
            <Route path="/class-scheduler" element={
              <ProtectedRoute>
                <ClassSchedulerWrapper />
              </ProtectedRoute>
            } />
            
            <Route path="/write-article" element={
              <ProtectedRoute>
                <ArticleEditorWrapper />
              </ProtectedRoute>
            } />
            
            <Route path="/whatsapp-admin" element={
              <ProtectedRoute>
                <WhatsAppAdminWrapper />
              </ProtectedRoute>
            } />
            
            <Route path="/article-reviews" element={
              <ProtectedRoute>
                <ArticleReviewWrapper />
              </ProtectedRoute>
            } />
            
            <Route path="/leaderboard" element={
              <ProtectedRoute>
                <LeaderboardWrapper />
              </ProtectedRoute>
            } />
            
            <Route path="/batch-showcase" element={
              <ProtectedRoute>
                <BatchShowcaseWrapper />
              </ProtectedRoute>
            } />
            
            <Route path="/referrals" element={
              <ProtectedRoute>
                <ReferralSystemWrapper />
              </ProtectedRoute>
            } />
            
            {/* Public Verification Page - No auth required */}
            <Route path="/verify/:studentIndex" element={<VerificationPage />} />
            <Route path="/v/:studentIndex" element={<VerificationPage />} />
            
            <Route path="/" element={<PublicLanding />} />
            <Route path="/home" element={<PublicLanding />} />
            <Route path="/enrollment-success" element={<EnrollmentSuccess />} />
            <Route path="/enrollment-cancelled" element={<EnrollmentCancelled />} />
          </Routes>
        </BrowserRouter>
      </div>
    </AuthProvider>
    </LanguageProvider>
  );
}

export default App;