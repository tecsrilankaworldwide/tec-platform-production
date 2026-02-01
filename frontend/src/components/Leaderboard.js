import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './auth/AuthContext';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const Leaderboard = () => {
  const { token, user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [period, setPeriod] = useState('weekly');
  const [ageGroup, setAgeGroup] = useState('');
  const [loading, setLoading] = useState(true);
  const [totalStudents, setTotalStudents] = useState(0);

  useEffect(() => {
    loadLeaderboard();
  }, [period, ageGroup, token]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const params = { period, limit: 20 };
      if (ageGroup) params.age_group = ageGroup;
      
      const response = await axios.get(`${API}/leaderboard`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      
      setLeaderboard(response.data.leaderboard || []);
      setMyRank(response.data.my_rank);
      setTotalStudents(response.data.total_students || 0);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getRankStyle = (rank) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white';
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800';
    if (rank === 3) return 'bg-gradient-to-r from-orange-400 to-amber-600 text-white';
    return 'bg-white';
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getLevelIcon = (level) => {
    const icons = {
      1: '🌱', 2: '🌿', 3: '🌳', 4: '⭐', 5: '🌟',
      6: '💫', 7: '🔥', 8: '💎', 9: '👑', 10: '🏆'
    };
    return icons[level] || '🌱';
  };

  const getAgeGroupLabel = (ag) => {
    const labels = {
      '4-6': 'Little Learners',
      '7-9': 'Young Explorers',
      '10-12': 'Smart Kids',
      '13-15': 'Tech Teens',
      '16-18': 'Future Leaders'
    };
    return labels[ag] || ag;
  };

  const getCountryFlag = (country) => {
    const flags = {
      'Sri Lanka': '🇱🇰',
      'India': '🇮🇳',
      'Malaysia': '🇲🇾',
      'Bangladesh': '🇧🇩',
      'Pakistan': '🇵🇰',
      'Indonesia': '🇮🇩',
      'Singapore': '🇸🇬',
      'UAE': '🇦🇪',
      'Saudi Arabia': '🇸🇦',
      'International': '🌍'
    };
    return flags[country] || '🌍';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 p-6" data-testid="leaderboard-page">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2" data-testid="leaderboard-title">
            🏆 Leaderboard
          </h1>
          <p className="text-gray-600">
            Top performers ranked by combined score (XP + Badges + Activity)
          </p>
        </div>

        {/* My Rank Card (for students) */}
        {myRank && user?.role === 'student' && (
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl shadow-xl p-6 mb-8 text-white" data-testid="my-rank-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                  {myRank.photo_url ? (
                    <img src={myRank.photo_url} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    getInitials(myRank.student_name)
                  )}
                </div>
                <div>
                  <div className="text-sm text-purple-200">Your Rank</div>
                  <div className="text-3xl font-bold">#{myRank.rank}</div>
                  <div className="text-sm text-purple-200">out of {totalStudents} students</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold">{myRank.combined_score.toLocaleString()}</div>
                <div className="text-sm text-purple-200">Combined Score</div>
                <div className="flex gap-4 mt-2 text-sm">
                  <span>⭐ {myRank.xp} XP</span>
                  <span>🏅 {myRank.badges_count} Badges</span>
                  <span>🔥 {myRank.streak} Streak</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          {/* Period Filter */}
          <div className="flex bg-white rounded-xl shadow-md p-1">
            {['weekly', 'monthly', 'all_time'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  period === p
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                data-testid={`period-${p}`}
              >
                {p === 'weekly' && '📅 Weekly'}
                {p === 'monthly' && '📆 Monthly'}
                {p === 'all_time' && '🏆 All Time'}
              </button>
            ))}
          </div>

          {/* Age Group Filter */}
          <select
            value={ageGroup}
            onChange={(e) => setAgeGroup(e.target.value)}
            className="px-4 py-2 bg-white rounded-xl shadow-md border-0 focus:ring-2 focus:ring-purple-500"
            data-testid="age-group-filter"
          >
            <option value="">All Age Groups</option>
            <option value="4-6">🌟 Little Learners (4-6)</option>
            <option value="7-9">🔭 Young Explorers (7-9)</option>
            <option value="10-12">💡 Smart Kids (10-12)</option>
            <option value="13-15">🚀 Tech Teens (13-15)</option>
            <option value="16-18">👑 Future Leaders (16-18)</option>
          </select>
        </div>

        {/* Leaderboard Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-bounce text-5xl mb-4">🏆</div>
            <p className="text-gray-500">Loading leaderboard...</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No data yet</h3>
            <p className="text-gray-600">Start learning to appear on the leaderboard!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Top 3 Podium */}
            {leaderboard.length >= 3 && (
              <div className="grid grid-cols-3 gap-4 mb-8">
                {/* Second Place */}
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-4 text-center transform translate-y-4">
                  <div className="text-4xl mb-2">🥈</div>
                  <div className="w-16 h-16 mx-auto rounded-full bg-white shadow-lg flex items-center justify-center text-xl font-bold text-gray-700 mb-2">
                    {leaderboard[1]?.photo_url ? (
                      <img src={leaderboard[1].photo_url} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      getInitials(leaderboard[1]?.student_name || '')
                    )}
                  </div>
                  <div className="font-bold text-gray-800 truncate">{leaderboard[1]?.student_name}</div>
                  <div className="text-sm text-gray-600">{leaderboard[1]?.combined_score.toLocaleString()} pts</div>
                </div>

                {/* First Place */}
                <div className="bg-gradient-to-br from-yellow-300 to-amber-400 rounded-2xl p-4 text-center shadow-xl">
                  <div className="text-5xl mb-2">🥇</div>
                  <div className="w-20 h-20 mx-auto rounded-full bg-white shadow-lg flex items-center justify-center text-2xl font-bold text-yellow-600 mb-2 border-4 border-yellow-500">
                    {leaderboard[0]?.photo_url ? (
                      <img src={leaderboard[0].photo_url} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      getInitials(leaderboard[0]?.student_name || '')
                    )}
                  </div>
                  <div className="font-bold text-gray-800 truncate text-lg">{leaderboard[0]?.student_name}</div>
                  <div className="text-gray-700 font-semibold">{leaderboard[0]?.combined_score.toLocaleString()} pts</div>
                  <div className="text-xs text-gray-600">{getCountryFlag(leaderboard[0]?.country)} {leaderboard[0]?.country}</div>
                </div>

                {/* Third Place */}
                <div className="bg-gradient-to-br from-orange-200 to-amber-300 rounded-2xl p-4 text-center transform translate-y-6">
                  <div className="text-4xl mb-2">🥉</div>
                  <div className="w-16 h-16 mx-auto rounded-full bg-white shadow-lg flex items-center justify-center text-xl font-bold text-orange-600 mb-2">
                    {leaderboard[2]?.photo_url ? (
                      <img src={leaderboard[2].photo_url} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      getInitials(leaderboard[2]?.student_name || '')
                    )}
                  </div>
                  <div className="font-bold text-gray-800 truncate">{leaderboard[2]?.student_name}</div>
                  <div className="text-sm text-gray-600">{leaderboard[2]?.combined_score.toLocaleString()} pts</div>
                </div>
              </div>
            )}

            {/* Rest of Leaderboard */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Level</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">XP</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Badges</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Streak</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {leaderboard.slice(3).map((entry) => (
                    <tr
                      key={entry.student_id}
                      className={`hover:bg-purple-50 transition-colors ${
                        entry.student_id === user?.id ? 'bg-purple-100' : ''
                      }`}
                      data-testid={`leaderboard-row-${entry.rank}`}
                    >
                      <td className="px-4 py-4">
                        <span className="text-lg font-bold text-gray-700">#{entry.rank}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white font-bold">
                            {entry.photo_url ? (
                              <img src={entry.photo_url} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              getInitials(entry.student_name)
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-800">{entry.student_name}</div>
                            <div className="text-xs text-gray-500">
                              {getCountryFlag(entry.country)} {getAgeGroupLabel(entry.age_group)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-xl">{getLevelIcon(entry.level)}</span>
                        <span className="text-sm text-gray-600 ml-1">Lv.{entry.level}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="font-semibold text-purple-600">{entry.xp.toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                          🏅 {entry.badges_count}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                          🔥 {entry.streak}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="text-lg font-bold text-gray-800">{entry.combined_score.toLocaleString()}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Score Breakdown Info */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">📊 How Combined Score is Calculated</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div className="p-3 bg-purple-50 rounded-xl">
              <div className="text-2xl mb-1">⭐</div>
              <div className="text-sm font-medium text-purple-700">XP Points</div>
              <div className="text-xs text-gray-500">×1</div>
            </div>
            <div className="p-3 bg-yellow-50 rounded-xl">
              <div className="text-2xl mb-1">🏅</div>
              <div className="text-sm font-medium text-yellow-700">Badges</div>
              <div className="text-xs text-gray-500">×50 each</div>
            </div>
            <div className="p-3 bg-orange-50 rounded-xl">
              <div className="text-2xl mb-1">🔥</div>
              <div className="text-sm font-medium text-orange-700">Streak Days</div>
              <div className="text-xs text-gray-500">×10</div>
            </div>
            <div className="p-3 bg-pink-50 rounded-xl">
              <div className="text-2xl mb-1">❤️</div>
              <div className="text-sm font-medium text-pink-700">Showcase Likes</div>
              <div className="text-xs text-gray-500">×5</div>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <div className="text-2xl mb-1">📝</div>
              <div className="text-sm font-medium text-blue-700">Articles</div>
              <div className="text-xs text-gray-500">×30</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
