import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ProgressReports = ({ token }) => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [weeklyProgress, setWeeklyProgress] = useState(null);
  const [allTimeProgress, setAllTimeProgress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState(null);
  const [scheduleInfo, setScheduleInfo] = useState(null);

  useEffect(() => {
    loadStudents();
    loadScheduleInfo();
  }, []);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/progress/students-list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(response.data.students || []);
    } catch (error) {
      console.error('Failed to load students:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadScheduleInfo = async () => {
    try {
      const response = await axios.get(`${API}/progress/report-schedule`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setScheduleInfo(response.data);
    } catch (error) {
      console.error('Failed to load schedule info:', error);
    }
  };

  const loadStudentProgress = async (student) => {
    setSelectedStudent(student);
    setLoading(true);
    try {
      const [weeklyRes, allTimeRes] = await Promise.all([
        axios.get(`${API}/progress/weekly/${student.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/progress/all-time/${student.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setWeeklyProgress(weeklyRes.data);
      setAllTimeProgress(allTimeRes.data);
    } catch (error) {
      console.error('Failed to load progress:', error);
      setMessage({ type: 'error', text: 'Failed to load progress data' });
    } finally {
      setLoading(false);
    }
  };

  const sendProgressReport = async (studentId) => {
    setSending(true);
    setMessage(null);
    try {
      const response = await axios.post(
        `${API}/progress/send-report/${studentId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setMessage({ 
          type: 'success', 
          text: `Progress report sent! ${response.data.notification_result?.mock ? '(Mock mode - Twilio not configured)' : ''}`
        });
      } else {
        setMessage({ type: 'error', text: response.data.error || 'Failed to send report' });
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to send progress report'
      });
    } finally {
      setSending(false);
    }
  };

  const getEngagementColor = (level) => {
    switch (level) {
      case 'Excellent': return 'text-green-600 bg-green-100';
      case 'Good': return 'text-blue-600 bg-blue-100';
      case 'Moderate': return 'text-yellow-600 bg-yellow-100';
      case 'Needs Attention': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden" data-testid="progress-reports-container">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
        <h2 className="text-2xl font-bold flex items-center" data-testid="progress-reports-title">
          <span className="mr-3">📊</span>
          Student Progress Reports
        </h2>
        <p className="text-purple-100 mt-1">Track learning achievements and send weekly summaries</p>
      </div>

      <div className="p-6">
        {/* Message Display */}
        {message && (
          <div 
            className={`mb-6 p-4 rounded-xl ${
              message.type === 'success' 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}
            data-testid="progress-message"
          >
            {message.type === 'success' ? '✅ ' : '❌ '}{message.text}
          </div>
        )}

        {/* Schedule Info */}
        {scheduleInfo && (
          <div className="mb-6 bg-indigo-50 p-4 rounded-xl border border-indigo-200">
            <h4 className="font-bold text-indigo-800 mb-2 flex items-center">
              <span className="mr-2">🗓️</span>
              Automatic Reports Schedule
            </h4>
            <p className="text-indigo-700 text-sm">{scheduleInfo.schedule}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {scheduleInfo.includes?.slice(0, 4).map((item, i) => (
                <span key={i} className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full">
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Students List */}
          <div>
            <h3 className="font-bold text-gray-800 mb-4 flex items-center">
              <span className="mr-2">👨‍🎓</span>
              Students ({students.length})
            </h3>
            
            {loading && !selectedStudent ? (
              <div className="text-center py-8 text-gray-500">Loading students...</div>
            ) : students.length === 0 ? (
              <div className="bg-gray-50 p-6 rounded-xl text-center text-gray-500">
                No students found
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {students.map((student) => (
                  <div 
                    key={student.id}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedStudent?.id === student.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300 bg-white'
                    }`}
                    onClick={() => loadStudentProgress(student)}
                    data-testid={`student-${student.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-800">{student.full_name}</h4>
                        <p className="text-sm text-gray-500">{student.email}</p>
                        {student.age_group && (
                          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                            Ages {student.age_group}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`text-xs px-2 py-1 rounded-full ${getEngagementColor(student.weekly_progress?.engagement_level)}`}>
                          {student.weekly_progress?.engagement_level || 'N/A'}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {student.weekly_progress?.total_activities || 0} activities
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Progress Details */}
          <div>
            {selectedStudent ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-800 flex items-center">
                    <span className="mr-2">📈</span>
                    {selectedStudent.full_name}&apos;s Progress
                  </h3>
                  <button
                    onClick={() => sendProgressReport(selectedStudent.id)}
                    disabled={sending || !selectedStudent.parent_phone}
                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all font-medium disabled:opacity-50 text-sm"
                    data-testid="send-report-btn"
                  >
                    {sending ? 'Sending...' : '📤 Send Report'}
                  </button>
                </div>

                {loading ? (
                  <div className="text-center py-8 text-gray-500">Loading progress...</div>
                ) : (
                  <>
                    {/* Weekly Progress */}
                    {weeklyProgress && (
                      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-xl border border-purple-200 mb-4">
                        <h4 className="font-bold text-purple-800 mb-3">This Week</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white p-3 rounded-lg text-center">
                            <div className="text-2xl font-bold text-blue-600">{weeklyProgress.videos_completed}</div>
                            <div className="text-xs text-gray-500">Videos Completed</div>
                          </div>
                          <div className="bg-white p-3 rounded-lg text-center">
                            <div className="text-2xl font-bold text-green-600">{weeklyProgress.workouts_completed}</div>
                            <div className="text-xs text-gray-500">Workouts Done</div>
                          </div>
                          <div className="bg-white p-3 rounded-lg text-center">
                            <div className="text-2xl font-bold text-purple-600">{weeklyProgress.total_watch_time_minutes}</div>
                            <div className="text-xs text-gray-500">Minutes Learning</div>
                          </div>
                          <div className="bg-white p-3 rounded-lg text-center">
                            <div className="text-2xl font-bold text-orange-600">{weeklyProgress.average_score}%</div>
                            <div className="text-xs text-gray-500">Avg Score</div>
                          </div>
                        </div>
                        
                        {weeklyProgress.achievements?.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs text-purple-700 font-medium mb-1">Achievements:</p>
                            <div className="flex flex-wrap gap-1">
                              {weeklyProgress.achievements.map((a, i) => (
                                <span key={i} className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full">
                                  🏆 {a}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* All-Time Progress */}
                    {allTimeProgress && (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-bold text-green-800">All-Time Stats</h4>
                          <span className="text-2xl">{allTimeProgress.rank_emoji} {allTimeProgress.rank}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <div className="text-xl font-bold text-green-600">{allTimeProgress.total_watch_time_hours}h</div>
                            <div className="text-xs text-gray-500">Total Learning</div>
                          </div>
                          <div>
                            <div className="text-xl font-bold text-blue-600">{allTimeProgress.total_videos_completed}</div>
                            <div className="text-xs text-gray-500">Videos Done</div>
                          </div>
                          <div>
                            <div className="text-xl font-bold text-purple-600">{allTimeProgress.total_workouts_completed}</div>
                            <div className="text-xs text-gray-500">Workouts Done</div>
                          </div>
                        </div>
                        <div className="mt-3 bg-green-100 p-2 rounded-lg text-center">
                          <span className="text-green-800 font-bold">{allTimeProgress.total_points}</span>
                          <span className="text-green-700 text-sm"> Total Points</span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 p-8 rounded-xl text-center text-gray-500">
                <span className="text-4xl mb-3 block">👈</span>
                Select a student to view their progress
              </div>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 p-6 rounded-xl border border-blue-200">
          <h4 className="font-bold text-blue-800 mb-3 flex items-center">
            <span className="mr-2">ℹ️</span>
            About Progress Reports
          </h4>
          <ul className="space-y-2 text-blue-700 text-sm">
            <li>• <strong>Automatic Reports:</strong> Sent every Sunday evening via WhatsApp</li>
            <li>• <strong>Manual Reports:</strong> Click &quot;Send Report&quot; to send immediately</li>
            <li>• <strong>Engagement Levels:</strong> Excellent (10+ activities), Good (5+), Moderate (1+)</li>
            <li>• <strong>Achievements:</strong> Earned based on videos completed, scores, and learning time</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProgressReports;
