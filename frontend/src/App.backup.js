import React, { useState, useEffect, createContext, useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import "./App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider Component
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      if (token) {
        try {
          const response = await axios.get(`${API}/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser(response.data);
        } catch (error) {
          console.error('Auth initialization failed:', error);
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API}/login`, { email, password });
      const { access_token, user: userData } = response.data;
      
      setToken(access_token);
      setUser(userData);
      localStorage.setItem('token', access_token);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Login failed' };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post(`${API}/register`, userData);
      return { success: true, user: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Registration failed' };
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API}/logout`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  const getLearningLevel = (ageGroup) => {
    const levels = {
      '5-8': 'Foundation',
      '9-12': 'Development', 
      '13-16': 'Mastery'
    };
    return levels[ageGroup] || 'Foundation';
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    getLearningLevel,
    isAuthenticated: !!user,
    isTeacher: user?.role === 'teacher' || user?.role === 'admin',
    isStudent: user?.role === 'student',
    isAdmin: user?.role === 'admin',
    hasSubscription: user?.subscription_type && (!user?.subscription_expires || new Date(user.subscription_expires) > new Date())
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Protected Route Component
const ProtectedRoute = ({ children, requireRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
        <p className="text-purple-600 font-medium">Loading TEC Platform...</p>
      </div>
    </div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireRole && user.role !== requireRole && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Navigation Component
const Navigation = () => {
  const { user, logout, isTeacher, isStudent, hasSubscription, getLearningLevel } = useAuth();

  return (
    <nav className="bg-gradient-to-r from-purple-700 via-blue-600 to-indigo-700 text-white shadow-xl">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-6">
            <div>
              <h1 className="text-2xl font-bold flex items-center">
                <span className="mr-2">🚀</span>
                TEC Future-Ready Learning
              </h1>
              <div className="text-xs text-purple-100">Building Tomorrow's Minds Since 1982</div>
            </div>
            <div className="hidden md:flex text-sm text-purple-100 bg-white/10 px-4 py-2 rounded-full">
              AI • Logic • Creative • Problem Solving • Future Skills
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <a href="/dashboard" className="hover:text-purple-200 transition-colors font-medium">Dashboard</a>
            {isTeacher && (
              <>
                <a href="/teacher" className="hover:text-purple-200 transition-colors">Create Content</a>
                <a href="/analytics" className="hover:text-purple-200 transition-colors">Analytics</a>
              </>
            )}
            {isStudent && (
              <>
                <a href="/learning-path" className="hover:text-purple-200 transition-colors">My Learning Path</a>
                <a href="/courses" className="hover:text-purple-200 transition-colors">All Courses</a>
                <a href="/workouts" className="hover:text-purple-200 transition-colors">🧩 Logic Workouts</a>
                <a href="/subscription" className="hover:text-purple-200 transition-colors">
                  {hasSubscription ? '💎 Premium' : '⭐ Subscribe'}
                </a>
              </>
            )}
            
            {user && (
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-sm font-medium">👋 {user.full_name}</div>
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="px-2 py-1 bg-white/20 rounded-full">
                      {user.role}
                    </span>
                    {user.age_group && (
                      <span className="px-2 py-1 bg-purple-500/30 rounded-full">
                        {getLearningLevel(user.age_group)} Level
                      </span>
                    )}
                    {hasSubscription && isStudent && <span className="text-yellow-300">💎</span>}
                  </div>
                </div>
                <button 
                  onClick={logout}
                  className="bg-red-500 hover:bg-red-600 px-3 py-2 rounded-lg transition-colors text-sm font-medium"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

// Login Component
const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'student',
    age_group: '9-12'
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isLogin) {
        const result = await login(formData.email, formData.password);
        if (result.success) {
          navigate('/dashboard');
        } else {
          setMessage(result.error);
        }
      } else {
        const result = await register(formData);
        if (result.success) {
          setMessage('Registration successful! Please login.');
          setIsLogin(true);
          setFormData({ ...formData, password: '' });
        } else {
          setMessage(result.error);
        }
      }
    } catch (error) {
      setMessage('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md border-2 border-purple-100">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🚀</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">TEC Future-Ready Learning</h1>
          <p className="text-purple-600 font-semibold text-lg">Preparing Tomorrow's Minds Today</p>
          <div className="mt-4 bg-gradient-to-r from-purple-100 to-blue-100 p-4 rounded-xl">
            <p className="text-sm font-bold text-purple-800">🏢 TEC Sri Lanka Worldwide (Pvt.) Ltd</p>
            <p className="text-xs text-gray-600 mt-1">42 Years of Educational Excellence • Est. 1982</p>
            <div className="flex justify-center space-x-2 mt-2 text-xs text-purple-700">
              <span>🖥️ Computers</span>
              <span>•</span>
              <span>🤖 Robotics</span>
              <span>•</span>
              <span>🚀 AI Future</span>
            </div>
          </div>
        </div>

        <div className="flex mb-6 bg-gray-100 rounded-xl p-1">
          <button
            type="button"
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-3 px-4 rounded-lg transition-all font-medium ${
              isLogin 
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg' 
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-3 px-4 rounded-lg transition-all font-medium ${
              !isLogin 
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg' 
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="relative">
              <input
                type="text"
                name="full_name"
                placeholder="Full Name"
                value={formData.full_name}
                onChange={handleChange}
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all"
                required
              />
              <span className="absolute right-4 top-4 text-gray-400">👤</span>
            </div>
          )}
          
          <div className="relative">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all"
              required
            />
            <span className="absolute right-4 top-4 text-gray-400">📧</span>
          </div>
          
          <div className="relative">
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all"
              required
            />
            <span className="absolute right-4 top-4 text-gray-400">🔒</span>
          </div>

          {!isLogin && (
            <>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 bg-white"
              >
                <option value="student">🎓 Student</option>
                <option value="teacher">👨‍🏫 Teacher / Educator</option>
              </select>

              {formData.role === 'student' && (
                <select
                  name="age_group"
                  value={formData.age_group}
                  onChange={handleChange}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 bg-white"
                >
                  <option value="5-8">🌱 Foundation Level (Ages 5-8)</option>
                  <option value="9-12">🧠 Development Level (Ages 9-12)</option>
                  <option value="13-16">🎯 Mastery Level (Ages 13-16)</option>
                </select>
              )}
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white p-4 rounded-xl hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 font-semibold text-lg shadow-lg"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Please wait...
              </div>
            ) : (
              isLogin ? '🚀 Enter Learning Platform' : '⭐ Join TEC Community'
            )}
          </button>
        </form>

        {message && (
          <div className={`mt-4 p-4 rounded-xl text-center font-medium ${
            message.includes('successful') 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Join thousands of Sri Lankan students preparing for tomorrow's world
          </p>
          <div className="flex justify-center space-x-4 mt-3 text-xs text-gray-400">
            <span>🔒 Secure</span>
            <span>🌟 Trusted</span>
            <span>🚀 Future-Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Dashboard Component
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
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Hero Welcome Section */}
      <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-3 gap-8 items-center">
            <div className="lg:col-span-2">
              <h1 className="text-4xl lg:text-5xl font-bold mb-4">
                Welcome back, {user.full_name}! 👋
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
                      Adaptability, leadership, entrepreneurship, and tomorrow's workplace skills.
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
                    <p className="font-semibold">2004: Robotics with LEGO Dacta</p>
                    <p className="text-indigo-200 text-sm">International partnership excellence</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-2xl mr-3">🚀</span>
                  <div>
                    <p className="font-semibold">2024: AI Future-Ready Platform</p>
                    <p className="text-indigo-200 text-sm">Preparing minds for tomorrow</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-indigo-400">
                <p className="text-center text-indigo-100 text-sm italic">
                  "Always a step ahead in futuristic knowledge dissemination"
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
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
  const [filter, setFilter] = useState({ level: '', skill: '' });

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">📚 Complete Course Catalog</h1>
          <p className="text-xl text-gray-600">Future-ready skills for every learning level</p>
        </div>

        {/* Course Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {allCourses.map(course => (
            <div key={course.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-gray-100">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl">{course.icon || '📚'}</span>
                  <div className="flex items-center space-x-2">
                    {course.is_premium && <span className="text-purple-600 text-xl">💎</span>}
                    <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium">
                      Level {course.difficulty_level || 1}
                    </span>
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
                </div>
                
                <button className={`w-full py-3 px-4 rounded-xl font-semibold transition-colors ${
                  course.is_premium && !hasSubscription
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
                }`}>
                  {course.is_premium && !hasSubscription ? '💎 Premium Access Required' : '🚀 Start Learning'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
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

// Simple placeholder components for other routes
const TeacherDashboard = () => (
  <div className="min-h-screen bg-gray-50">
    <Navigation />
    <div className="container mx-auto px-4 py-8 text-center">
      <div className="bg-white rounded-2xl p-12 shadow-lg">
        <div className="text-6xl mb-6">🎬</div>
        <h1 className="text-3xl font-bold mb-4">Content Creation Studio</h1>
        <p className="text-xl text-gray-600 mb-8">Advanced course creation tools coming soon!</p>
        <div className="bg-gradient-to-r from-purple-100 to-blue-100 p-6 rounded-xl">
          <p className="text-purple-800 font-medium">Building the future of educational content creation for TEC.</p>
        </div>
      </div>
    </div>
  </div>
);

const AnalyticsDashboard = () => (
  <div className="min-h-screen bg-gray-50">
    <Navigation />
    <div className="container mx-auto px-4 py-8 text-center">
      <div className="bg-white rounded-2xl p-12 shadow-lg">
        <div className="text-6xl mb-6">📊</div>
        <h1 className="text-3xl font-bold mb-4">Future-Ready Analytics</h1>
        <p className="text-xl text-gray-600 mb-8">Advanced learning analytics dashboard coming soon!</p>
        <div className="bg-gradient-to-r from-blue-100 to-indigo-100 p-6 rounded-xl">
          <p className="text-blue-800 font-medium">Tracking student progress toward future readiness.</p>
        </div>
      </div>
    </div>
  </div>
);

const SubscriptionPage = () => (
  <div className="min-h-screen bg-gray-50">
    <Navigation />
    <div className="container mx-auto px-4 py-8 text-center">
      <div className="bg-white rounded-2xl p-12 shadow-lg">
        <div className="text-6xl mb-6">💎</div>
        <h1 className="text-3xl font-bold mb-4">Premium Future-Ready Plans</h1>
        <p className="text-xl text-gray-600 mb-8">Age-based pricing with physical materials coming soon!</p>
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-6 rounded-xl">
          <p className="text-purple-800 font-medium">Complete learning ecosystem with quarterly materials delivery.</p>
        </div>
      </div>
    </div>
  </div>
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

// Main App Component
function App() {
  return (
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
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </div>
    </AuthProvider>
  );
}

export default App;