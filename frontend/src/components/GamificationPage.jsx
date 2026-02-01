import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trophy, Star, Zap, Medal, Crown, Flame, Target, Award } from 'lucide-react';
import { 
  BadgeEarnedModal, 
  LevelUpModal, 
  triggerConfettiBurst,
  triggerSideCannons 
} from './ConfettiEffects';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const GamificationPage = ({ token, user }) => {
  const [stats, setStats] = useState(null);
  const [badges, setBadges] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [newBadge, setNewBadge] = useState(null);
  const [levelUp, setLevelUp] = useState(null);
  const [previousLevel, setPreviousLevel] = useState(null);

  useEffect(() => {
    loadData();
  }, [token]);

  const loadData = async () => {
    try {
      const [statsRes, badgesRes, leaderboardRes] = await Promise.all([
        axios.get(`${API}/gamification/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/gamification/badges`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/gamification/leaderboard`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      // Check for new badges
      if (statsRes.data.new_badges && statsRes.data.new_badges.length > 0) {
        // Show badge modal for first new badge
        setNewBadge(statsRes.data.new_badges[0]);
      }
      
      // Check for level up
      if (previousLevel && statsRes.data.level > previousLevel) {
        setLevelUp(statsRes.data.level);
      }
      setPreviousLevel(statsRes.data.level);
      
      setStats(statsRes.data);
      setBadges(badgesRes.data.badges || []);
      setLeaderboard(leaderboardRes.data.leaderboard || []);
    } catch (error) {
      console.error('Failed to load gamification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBadgeClick = (badge) => {
    if (badge.earned) {
      // Trigger celebration for earned badges
      triggerConfettiBurst({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    }
  };

  const getRarityColor = (rarity) => {
    const colors = {
      common: 'from-gray-400 to-gray-500',
      rare: 'from-blue-400 to-blue-600',
      epic: 'from-purple-500 to-pink-500',
      legendary: 'from-yellow-400 to-orange-500'
    };
    return colors[rarity] || colors.common;
  };

  const getRarityBorder = (rarity) => {
    const borders = {
      common: 'border-gray-300',
      rare: 'border-blue-400',
      epic: 'border-purple-400',
      legendary: 'border-yellow-400'
    };
    return borders[rarity] || borders.common;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse text-xl text-slate-600">Loading your achievements...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Badge earned modal */}
      <BadgeEarnedModal 
        badge={newBadge} 
        onClose={() => setNewBadge(null)} 
      />
      
      {/* Level up modal */}
      <LevelUpModal 
        newLevel={levelUp} 
        onClose={() => setLevelUp(null)} 
      />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 font-nunito mb-2">
            🏆 Your Achievements
          </h1>
          <p className="text-slate-600">Track your progress and earn rewards!</p>
          
          {/* Celebration Demo Button */}
          <button
            onClick={() => {
              triggerSideCannons();
              setTimeout(() => setNewBadge({
                badge_type: 'demo',
                name: 'Super Star',
                description: 'You discovered the celebration!',
                icon: '⭐',
                rarity: 'legendary',
                points_reward: 100
              }), 1000);
            }}
            className="mt-4 px-6 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full font-bold hover:shadow-lg transition-all transform hover:scale-105"
            data-testid="demo-celebration-btn"
          >
            🎉 Demo Celebration
          </button>
        </div>

        {/* Stats Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <Star className="w-8 h-8 text-yellow-500" />
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">Points</span>
            </div>
            <p className="text-3xl font-bold text-slate-800">{stats?.total_points || 0}</p>
            <p className="text-sm text-slate-500">Total Points</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <Zap className="w-8 h-8 text-purple-500" />
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">Level</span>
            </div>
            <p className="text-3xl font-bold text-slate-800">{stats?.level || 1}</p>
            <p className="text-sm text-slate-500">Current Level</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <Flame className="w-8 h-8 text-orange-500" />
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">Streak</span>
            </div>
            <p className="text-3xl font-bold text-slate-800">{stats?.current_streak || 0}</p>
            <p className="text-sm text-slate-500">Day Streak 🔥</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <Medal className="w-8 h-8 text-blue-500" />
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">Badges</span>
            </div>
            <p className="text-3xl font-bold text-slate-800">{stats?.badges_earned?.length || 0}</p>
            <p className="text-sm text-slate-500">Badges Earned</p>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-8 border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Level Progress</h3>
              <p className="text-sm text-slate-500">
                {stats?.total_xp || 0} / {stats?.xp_for_next_level || 100} XP to Level {(stats?.level || 1) + 1}
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-purple-600">Level {stats?.level || 1}</span>
            </div>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
              style={{ width: `${stats?.xp_progress_percentage || 0}%` }}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white rounded-full p-1 shadow-md w-fit">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-2 rounded-full font-medium transition-all ${
              activeTab === 'overview'
                ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
            data-testid="tab-overview"
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('badges')}
            className={`px-6 py-2 rounded-full font-medium transition-all ${
              activeTab === 'badges'
                ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
            data-testid="tab-badges"
          >
            Badges
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-6 py-2 rounded-full font-medium transition-all ${
              activeTab === 'leaderboard'
                ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
            data-testid="tab-leaderboard"
          >
            Leaderboard
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Activity Stats */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-500" />
                Activity Stats
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-600">Lessons Completed</span>
                  <span className="font-bold text-slate-800">{stats?.lessons_completed || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-600">Quizzes Completed</span>
                  <span className="font-bold text-slate-800">{stats?.quizzes_completed || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-600">Videos Watched</span>
                  <span className="font-bold text-slate-800">{stats?.videos_watched || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-600">AI Messages Sent</span>
                  <span className="font-bold text-slate-800">{stats?.ai_messages_sent || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-600">Workouts Completed</span>
                  <span className="font-bold text-slate-800">{stats?.workouts_completed || 0}</span>
                </div>
              </div>
            </div>

            {/* Streak Info */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                Streak Information
              </h3>
              <div className="text-center py-6">
                <div className="text-6xl mb-4">🔥</div>
                <p className="text-4xl font-bold text-orange-500 mb-2">{stats?.current_streak || 0} Days</p>
                <p className="text-slate-500">Current Streak</p>
                <div className="mt-6 p-4 bg-orange-50 rounded-xl">
                  <p className="text-sm text-orange-700">
                    <span className="font-bold">Longest Streak:</span> {stats?.longest_streak || 0} days
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'badges' && (
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-6">All Badges</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {badges.map((badge) => (
                <div
                  key={badge.badge_type}
                  onClick={() => handleBadgeClick(badge)}
                  className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer transform hover:scale-105 ${
                    badge.earned
                      ? `${getRarityBorder(badge.rarity)} bg-white hover:shadow-lg`
                      : 'border-slate-200 bg-slate-50 opacity-60'
                  }`}
                >
                  {badge.earned && (
                    <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-r ${getRarityColor(badge.rarity)} flex items-center justify-center animate-pulse`}>
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                  <div className="text-center">
                    <div className={`text-4xl mb-2 ${badge.earned ? 'animate-bounce-subtle' : 'grayscale'}`}>
                      {badge.icon}
                    </div>
                    <p className="font-bold text-slate-800 text-sm">{badge.name}</p>
                    <p className="text-xs text-slate-500 mt-1">{badge.description}</p>
                    <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r ${getRarityColor(badge.rarity)} text-white`}>
                      {badge.rarity}
                    </span>
                    {badge.earned && (
                      <p className="text-xs text-green-600 mt-1 font-medium">+{badge.points_reward} pts</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center text-slate-400 text-sm mt-4">Click on earned badges to celebrate! 🎉</p>
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              Top Learners
            </h3>
            <div className="space-y-3">
              {leaderboard.map((entry, index) => (
                <div
                  key={entry.student_id}
                  className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                    entry.is_current_user
                      ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200'
                      : 'bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  {/* Rank */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    index === 0 ? 'bg-yellow-400 text-white' :
                    index === 1 ? 'bg-slate-400 text-white' :
                    index === 2 ? 'bg-orange-400 text-white' :
                    'bg-slate-200 text-slate-600'
                  }`}>
                    {index < 3 ? ['🥇', '🥈', '🥉'][index] : entry.rank}
                  </div>

                  {/* Avatar & Name */}
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-2xl">{entry.avatar_emoji}</span>
                    <div>
                      <p className="font-bold text-slate-800">
                        {entry.student_name}
                        {entry.is_current_user && <span className="ml-2 text-purple-600">(You)</span>}
                      </p>
                      <p className="text-xs text-slate-500">Level {entry.level} • {entry.badges_count} badges</p>
                    </div>
                  </div>

                  {/* Points */}
                  <div className="text-right">
                    <p className="font-bold text-lg text-slate-800">{entry.total_points.toLocaleString()}</p>
                    <p className="text-xs text-slate-500">points</p>
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

export default GamificationPage;
