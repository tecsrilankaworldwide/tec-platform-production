import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, TrendingUp, Clock, Trophy, BookOpen, Award, Calendar, ChevronRight, Eye } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const ParentDashboard = ({ token, user }) => {
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [childProgress, setChildProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [linkEmail, setLinkEmail] = useState('');
  const [linkMessage, setLinkMessage] = useState(null);

  useEffect(() => {
    loadChildren();
  }, [token]);

  const loadChildren = async () => {
    try {
      const response = await axios.get(`${API}/parent/children`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChildren(response.data.children || []);
    } catch (error) {
      console.error('Failed to load children:', error);
    } finally {
      setLoading(false);
    }
  };

  const linkChild = async () => {
    if (!linkEmail.trim()) return;
    
    try {
      const response = await axios.post(`${API}/parent/link-child`, {
        child_email: linkEmail
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLinkMessage({ type: 'success', text: `Successfully linked to ${response.data.child_name}!` });
      setLinkEmail('');
      loadChildren();
    } catch (error) {
      setLinkMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to link child' });
    }
  };

  const viewChildProgress = async (childId) => {
    try {
      const response = await axios.get(`${API}/parent/child/${childId}/progress`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChildProgress(response.data);
      setSelectedChild(childId);
    } catch (error) {
      console.error('Failed to load child progress:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse text-xl text-slate-600">Loading dashboard...</div>
      </div>
    );
  }

  // Child Progress Detail View
  if (selectedChild && childProgress) {
    const child = childProgress.child;
    const gamification = childProgress.gamification || {};
    const weekly = childProgress.weekly_progress || {};

    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4">
        <div className="max-w-5xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => { setSelectedChild(null); setChildProgress(null); }}
            className="mb-6 text-slate-600 hover:text-slate-800 flex items-center gap-2"
          >
            ← Back to Children
          </button>

          {/* Child Header */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-full flex items-center justify-center text-3xl">
                👧
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">{child?.full_name}</h2>
                <p className="text-slate-600">{child?.email}</p>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                  child?.learning_level === 'foundation' ? 'bg-green-100 text-green-700' :
                  child?.learning_level === 'development' ? 'bg-blue-100 text-blue-700' :
                  'bg-purple-100 text-purple-700'
                }`}>
                  {child?.learning_level} Level • Ages {child?.age_group}
                </span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-lg border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <Trophy className="w-6 h-6 text-yellow-500" />
              </div>
              <p className="text-2xl font-bold text-slate-800">{gamification.total_points || 0}</p>
              <p className="text-sm text-slate-500">Total Points</p>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-lg border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-6 h-6 text-purple-500" />
              </div>
              <p className="text-2xl font-bold text-slate-800">Level {gamification.level || 1}</p>
              <p className="text-sm text-slate-500">Current Level</p>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-lg border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">🔥</span>
              </div>
              <p className="text-2xl font-bold text-slate-800">{gamification.current_streak || 0}</p>
              <p className="text-sm text-slate-500">Day Streak</p>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-lg border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <Award className="w-6 h-6 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-slate-800">{gamification.badges_earned?.length || 0}</p>
              <p className="text-sm text-slate-500">Badges</p>
            </div>
          </div>

          {/* Weekly Progress */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-500" />
              This Week's Progress
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{weekly.videos_completed || 0}</p>
                <p className="text-sm text-green-700">Videos Completed</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{weekly.workouts_completed || 0}</p>
                <p className="text-sm text-blue-700">Workouts Done</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-purple-600">{weekly.total_activities || 0}</p>
                <p className="text-sm text-purple-700">Total Activities</p>
              </div>
              <div className="bg-orange-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-orange-600 capitalize">{weekly.engagement_level || 'low'}</p>
                <p className="text-sm text-orange-700">Engagement</p>
              </div>
            </div>
          </div>

          {/* Activity Stats */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Activity Summary */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Activity Summary</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-600 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" /> Lessons Completed
                  </span>
                  <span className="font-bold text-slate-800">{gamification.lessons_completed || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-600 flex items-center gap-2">
                    📝 Quizzes Completed
                  </span>
                  <span className="font-bold text-slate-800">{gamification.quizzes_completed || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-600 flex items-center gap-2">
                    🎬 Videos Watched
                  </span>
                  <span className="font-bold text-slate-800">{gamification.videos_watched || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-600 flex items-center gap-2">
                    🤖 AI Messages
                  </span>
                  <span className="font-bold text-slate-800">{gamification.ai_messages_sent || 0}</span>
                </div>
              </div>
            </div>

            {/* Certificates */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Certificates Earned</h3>
              {childProgress.certificates?.length > 0 ? (
                <div className="space-y-3">
                  {childProgress.certificates.map((cert) => (
                    <div key={cert.id} className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                      <div className="flex items-center gap-3">
                        <Award className="w-8 h-8 text-purple-500" />
                        <div>
                          <p className="font-bold text-slate-800">{cert.course_title}</p>
                          <p className="text-xs text-slate-500">
                            {new Date(cert.completion_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <span className="text-4xl">📜</span>
                  <p className="mt-2">No certificates yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activities */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Recent Activities</h3>
            {childProgress.recent_activities?.length > 0 ? (
              <div className="space-y-3">
                {childProgress.recent_activities.slice(0, 10).map((activity, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      {activity.activity_type === 'video_watched' ? '🎬' :
                       activity.activity_type === 'quiz_completed' ? '📝' :
                       activity.activity_type === 'login' ? '🔑' :
                       activity.activity_type === 'workout_completed' ? '🧩' : '📚'}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-800 capitalize">
                        {activity.activity_type.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-500 py-8">No recent activities</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Children List View
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 font-nunito mb-2">👨‍👩‍👧‍👦 Parent Dashboard</h1>
          <p className="text-slate-600">Monitor your children's learning progress</p>
        </div>

        {/* Link Child Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Link a Child's Account</h3>
          <div className="flex gap-4">
            <input
              type="email"
              value={linkEmail}
              onChange={(e) => setLinkEmail(e.target.value)}
              placeholder="Enter child's email address"
              className="flex-1 p-4 rounded-xl border-2 border-slate-200 focus:border-purple-500 focus:outline-none"
              data-testid="link-child-email"
            />
            <button
              onClick={linkChild}
              className="px-8 py-4 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-full font-bold hover:shadow-lg transition-all"
              data-testid="link-child-btn"
            >
              Link Child
            </button>
          </div>
          {linkMessage && (
            <div className={`mt-4 p-4 rounded-xl ${
              linkMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {linkMessage.text}
            </div>
          )}
        </div>

        {/* Children List */}
        {children.length > 0 ? (
          <div className="space-y-4">
            {children.map((child) => (
              <div
                key={child.id}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-full flex items-center justify-center text-3xl">
                      👧
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">{child.full_name}</h3>
                      <p className="text-slate-500">{child.email}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          child.learning_level === 'foundation' ? 'bg-green-100 text-green-700' :
                          child.learning_level === 'development' ? 'bg-blue-100 text-blue-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {child.learning_level || 'development'}
                        </span>
                        {child.gamification && (
                          <>
                            <span className="text-sm text-slate-500">
                              Level {child.gamification.level || 1}
                            </span>
                            <span className="text-sm text-slate-500">
                              {child.gamification.total_points || 0} pts
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => viewChildProgress(child.id)}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-full font-bold hover:shadow-lg transition-all"
                    data-testid={`view-progress-${child.id}`}
                  >
                    <Eye className="w-4 h-4" />
                    View Progress
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">👨‍👩‍👧</div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No Children Linked</h3>
            <p className="text-slate-600">Link your child's account above to start tracking their progress!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentDashboard;
