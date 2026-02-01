import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const ChallengesPage = ({ token }) => {
  const [challenges, setChallenges] = useState({ daily: null, weekly: null });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('daily');
  const [completingTask, setCompletingTask] = useState(null);

  useEffect(() => {
    loadChallenges();
  }, [token]);

  const loadChallenges = async () => {
    try {
      const response = await axios.get(`${API}/challenges`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChallenges(response.data);
    } catch (error) {
      console.error('Failed to load challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const startChallenge = async (challengeId) => {
    try {
      await axios.post(`${API}/challenges/${challengeId}/start`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadChallenges();
    } catch (error) {
      console.error('Failed to start challenge:', error);
    }
  };

  const completeTask = async (challengeId, taskId) => {
    setCompletingTask(taskId);
    try {
      await axios.post(`${API}/challenges/${challengeId}/complete-task`, 
        { task_id: taskId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      loadChallenges();
    } catch (error) {
      console.error('Failed to complete task:', error);
    } finally {
      setCompletingTask(null);
    }
  };

  const claimRewards = async (challengeId) => {
    try {
      const response = await axios.post(`${API}/challenges/${challengeId}/complete`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`🎉 ${response.data.message}\n\nRewards:\n+${response.data.rewards.points} Points\n+${response.data.rewards.xp} XP${response.data.rewards.badge ? `\n🏅 Badge: ${response.data.rewards.badge}` : ''}`);
      loadChallenges();
    } catch (error) {
      alert(error.response?.data?.message || 'Complete all tasks first!');
    }
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      easy: 'bg-green-100 text-green-700',
      medium: 'bg-yellow-100 text-yellow-700',
      hard: 'bg-red-100 text-red-700'
    };
    return colors[difficulty] || colors.medium;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      logic: '🧩',
      coding: '💻',
      creativity: '🎨',
      ai_literacy: '🤖',
      problem_solving: '🔧',
      quiz: '📝'
    };
    return icons[category] || '⭐';
  };

  const renderChallenge = (challenge, type) => {
    if (!challenge) return null;

    const progress = challenge.user_progress;
    const tasksCompleted = progress?.tasks_completed || [];
    const allTasksCompleted = challenge.tasks.every(t => tasksCompleted.includes(t.id));
    const isStarted = !!progress;
    const isCompleted = progress?.is_completed;
    const timeRemaining = challenge.time_remaining;

    return (
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden" data-testid={`${type}-challenge-card`}>
        {/* Header */}
        <div className={`p-6 ${type === 'daily' ? 'bg-gradient-to-r from-orange-500 to-amber-500' : 'bg-gradient-to-r from-purple-600 to-indigo-600'} text-white`}>
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-3xl">{getCategoryIcon(challenge.category)}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${type === 'daily' ? 'bg-white/20' : 'bg-white/20'}`}>
                  {type === 'daily' ? '📅 Daily Challenge' : '📆 Weekly Challenge'}
                </span>
              </div>
              <h3 className="text-2xl font-bold">{challenge.title}</h3>
              <p className="text-white/80 mt-1">{challenge.description}</p>
            </div>
            <div className="text-right">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(challenge.difficulty)}`}>
                {challenge.difficulty.charAt(0).toUpperCase() + challenge.difficulty.slice(1)}
              </div>
            </div>
          </div>

          {/* Time Remaining */}
          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span>⏱️</span>
              <span className="font-medium">
                {timeRemaining.expired ? 'Expired' : `${timeRemaining.formatted} remaining`}
              </span>
            </div>
            {challenge.time_limit_minutes && (
              <div className="flex items-center gap-2">
                <span>⏰</span>
                <span>{challenge.time_limit_minutes} min time limit</span>
              </div>
            )}
          </div>
        </div>

        {/* Rewards */}
        <div className="px-6 py-4 bg-gray-50 border-b flex justify-around">
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-500">+{challenge.points_reward}</p>
            <p className="text-xs text-gray-500">Points</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-500">+{challenge.xp_reward}</p>
            <p className="text-xs text-gray-500">XP</p>
          </div>
          {challenge.badge_reward && (
            <div className="text-center">
              <p className="text-2xl">🏅</p>
              <p className="text-xs text-gray-500">Badge</p>
            </div>
          )}
        </div>

        {/* Tasks */}
        <div className="p-6">
          <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>📋</span> Tasks ({tasksCompleted.length}/{challenge.tasks.length})
          </h4>
          <div className="space-y-3">
            {challenge.tasks.map((task, idx) => {
              const isTaskCompleted = tasksCompleted.includes(task.id);
              return (
                <div 
                  key={task.id}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                    isTaskCompleted 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      isTaskCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {isTaskCompleted ? '✓' : idx + 1}
                    </div>
                    <span className={isTaskCompleted ? 'text-green-700 line-through' : 'text-gray-700'}>
                      {task.title}
                    </span>
                  </div>
                  {isStarted && !isTaskCompleted && !isCompleted && (
                    <button
                      onClick={() => completeTask(challenge.id, task.id)}
                      disabled={completingTask === task.id}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50"
                    >
                      {completingTask === task.id ? '...' : 'Complete'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        <div className="px-6 pb-6">
          {isCompleted ? (
            <div className="w-full py-4 bg-green-100 text-green-700 rounded-xl text-center font-bold flex items-center justify-center gap-2">
              <span>✅</span> Challenge Completed!
            </div>
          ) : !isStarted ? (
            <button
              onClick={() => startChallenge(challenge.id)}
              className={`w-full py-4 ${type === 'daily' ? 'bg-gradient-to-r from-orange-500 to-amber-500' : 'bg-gradient-to-r from-purple-600 to-indigo-600'} text-white rounded-xl font-bold text-lg hover:opacity-90 transition-all`}
              data-testid={`start-${type}-challenge-btn`}
            >
              🚀 Start Challenge
            </button>
          ) : allTasksCompleted ? (
            <button
              onClick={() => claimRewards(challenge.id)}
              className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold text-lg hover:opacity-90 transition-all animate-pulse"
              data-testid={`claim-${type}-rewards-btn`}
            >
              🎁 Claim Rewards!
            </button>
          ) : (
            <div className="w-full py-4 bg-gray-100 text-gray-500 rounded-xl text-center font-medium">
              Complete all tasks to claim rewards
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading challenges...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2" data-testid="challenges-title">
            🏆 Daily & Weekly Challenges
          </h1>
          <p className="text-gray-600">Complete challenges to earn points, XP, and exclusive badges!</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-xl p-1 shadow-md">
            <button
              onClick={() => setActiveTab('daily')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'daily'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              data-testid="daily-tab-btn"
            >
              📅 Daily Challenge
            </button>
            <button
              onClick={() => setActiveTab('weekly')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'weekly'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              data-testid="weekly-tab-btn"
            >
              📆 Weekly Challenge
            </button>
          </div>
        </div>

        {/* Challenge Cards */}
        {activeTab === 'daily' && renderChallenge(challenges.daily, 'daily')}
        {activeTab === 'weekly' && renderChallenge(challenges.weekly, 'weekly')}

        {/* Tips */}
        <div className="mt-8 bg-white rounded-xl p-6 shadow-md">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span>💡</span> Challenge Tips
          </h3>
          <ul className="space-y-2 text-gray-600 text-sm">
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>Daily challenges reset at midnight - complete them before they expire!</span>
            </li>
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>Weekly challenges run Monday to Sunday with bigger rewards.</span>
            </li>
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>Complete all tasks in a challenge to claim your rewards.</span>
            </li>
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>Some challenges award exclusive badges - collect them all!</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ChallengesPage;
