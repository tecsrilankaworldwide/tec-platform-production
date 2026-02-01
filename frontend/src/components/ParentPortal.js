import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './auth/AuthContext';
import { 
  Users, Plus, X, TrendingUp, Award, Calendar, CreditCard, 
  BookOpen, CheckCircle, XCircle, Clock, Trophy, Star, 
  FileText, Download, Eye, Unlink
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const COUNTRY_FLAGS = {
  sri_lanka: '🇱🇰', india: '🇮🇳', malaysia: '🇲🇾', bangladesh: '🇧🇩',
  pakistan: '🇵🇰', indonesia: '🇮🇩', singapore: '🇸🇬', uae: '🇦🇪', saudi: '🇸🇦', other: '🌍'
};

const AGE_GROUP_COLORS = {
  '4-6': 'from-yellow-400 to-orange-500',
  '7-9': 'from-blue-400 to-cyan-500',
  '10-12': 'from-purple-400 to-pink-500',
  '13-15': 'from-green-400 to-teal-500',
  '16-18': 'from-red-400 to-rose-500'
};

const ParentPortal = () => {
  const { token } = useAuth();
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [childProgress, setChildProgress] = useState(null);
  const [childPayments, setChildPayments] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [studentIndex, setStudentIndex] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [linkError, setLinkError] = useState('');

  const headers = { Authorization: `Bearer ${token}` };

  const fetchChildren = async () => {
    try {
      const response = await axios.get(`${API}/parent/children`, { headers });
      setChildren(response.data.children);
      if (response.data.children.length > 0 && !selectedChild) {
        setSelectedChild(response.data.children[0]);
      }
    } catch (error) {
      console.error('Failed to fetch children:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChildProgress = async (studentId) => {
    try {
      const response = await axios.get(`${API}/parent/child/${studentId}/progress`, { headers });
      setChildProgress(response.data);
    } catch (error) {
      console.error('Failed to fetch progress:', error);
    }
  };

  const fetchChildPayments = async (studentId) => {
    try {
      const response = await axios.get(`${API}/parent/child/${studentId}/payments`, { headers });
      setChildPayments(response.data);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    }
  };

  const handleLinkChild = async (e) => {
    e.preventDefault();
    setLinkError('');
    try {
      await axios.post(`${API}/parent/link-child`, { student_index: studentIndex }, { headers });
      setShowLinkModal(false);
      setStudentIndex('');
      fetchChildren();
    } catch (error) {
      setLinkError(error.response?.data?.detail || 'Failed to link child');
    }
  };

  const handleUnlinkChild = async (linkId) => {
    if (!window.confirm('Are you sure you want to unlink this child?')) return;
    try {
      await axios.delete(`${API}/parent/unlink-child/${linkId}`, { headers });
      fetchChildren();
      setSelectedChild(null);
    } catch (error) {
      alert('Failed to unlink child');
    }
  };

  useEffect(() => {
    fetchChildren();
  }, [token]);

  useEffect(() => {
    if (selectedChild) {
      fetchChildProgress(selectedChild.student.id);
      fetchChildPayments(selectedChild.student.id);
    }
  }, [selectedChild]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Parent Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold">👨‍👩‍👧‍👦 Parent Portal</h1>
          <p className="text-purple-200 mt-1">Track your children's learning progress</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {children.length === 0 ? (
          /* No Children Linked */
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Users className="mx-auto text-gray-300 mb-4" size={64} />
            <h2 className="text-2xl font-bold text-gray-700 mb-2">No Children Linked</h2>
            <p className="text-gray-500 mb-6">Link your child's account using their Student ID</p>
            <button
              onClick={() => setShowLinkModal(true)}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 flex items-center mx-auto"
            >
              <Plus size={20} className="mr-2" /> Link Child
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Children Sidebar */}
            <div className="lg:col-span-1 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-800">My Children</h2>
                <button
                  onClick={() => setShowLinkModal(true)}
                  className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200"
                >
                  <Plus size={18} />
                </button>
              </div>
              
              {children.map((child) => {
                const ageColors = AGE_GROUP_COLORS[child.student.age_group] || 'from-gray-400 to-gray-500';
                const isSelected = selectedChild?.student.id === child.student.id;
                
                return (
                  <div
                    key={child.link_id}
                    onClick={() => setSelectedChild(child)}
                    className={`bg-white rounded-xl shadow p-4 cursor-pointer transition-all ${
                      isSelected ? 'ring-2 ring-purple-500' : 'hover:shadow-lg'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${ageColors} flex items-center justify-center text-white font-bold`}>
                        {child.student.full_name?.charAt(0)}
                      </div>
                      <div className="ml-3 flex-1">
                        <h3 className="font-bold text-gray-800">{child.student.full_name}</h3>
                        <p className="text-xs text-gray-500 font-mono">{child.student.student_index}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-purple-600">Level {child.gamification?.level || 1}</span>
                      <span className="text-gray-500">{child.student.age_group} yrs</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Main Content */}
            {selectedChild && (
              <div className="lg:col-span-3 space-y-6">
                {/* Child Header */}
                <div className={`bg-gradient-to-r ${AGE_GROUP_COLORS[selectedChild.student.age_group] || 'from-purple-500 to-pink-500'} rounded-2xl p-6 text-white`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold">
                        {selectedChild.student.full_name?.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <h2 className="text-2xl font-bold">{selectedChild.student.full_name}</h2>
                        <p className="text-white/80 font-mono">{selectedChild.student.student_index}</p>
                        <p className="text-white/60 text-sm mt-1">
                          {COUNTRY_FLAGS[selectedChild.student.country]} {selectedChild.student.age_group} years
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-bold">{selectedChild.gamification?.xp || 0}</div>
                      <div className="text-white/80">Total XP</div>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow p-2 flex space-x-2">
                  {[
                    { id: 'overview', label: 'Overview', icon: TrendingUp },
                    { id: 'attendance', label: 'Attendance', icon: Calendar },
                    { id: 'certificates', label: 'Certificates', icon: Award },
                    { id: 'payments', label: 'Payments', icon: CreditCard }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all ${
                        activeTab === tab.id ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <tab.icon size={18} className="mr-2" />{tab.label}
                    </button>
                  ))}
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && childProgress && (
                  <div className="space-y-6">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white rounded-xl shadow p-4 text-center">
                        <Trophy className="mx-auto text-yellow-500 mb-2" size={28} />
                        <div className="text-2xl font-bold">{childProgress.gamification?.badges?.length || 0}</div>
                        <div className="text-gray-500 text-sm">Badges</div>
                      </div>
                      <div className="bg-white rounded-xl shadow p-4 text-center">
                        <Star className="mx-auto text-purple-500 mb-2" size={28} />
                        <div className="text-2xl font-bold">{childProgress.gamification?.streak_days || 0}</div>
                        <div className="text-gray-500 text-sm">Day Streak</div>
                      </div>
                      <div className="bg-white rounded-xl shadow p-4 text-center">
                        <BookOpen className="mx-auto text-blue-500 mb-2" size={28} />
                        <div className="text-2xl font-bold">{childProgress.recent_quizzes?.length || 0}</div>
                        <div className="text-gray-500 text-sm">Quizzes</div>
                      </div>
                      <div className="bg-white rounded-xl shadow p-4 text-center">
                        <CheckCircle className="mx-auto text-green-500 mb-2" size={28} />
                        <div className="text-2xl font-bold">{childProgress.attendance?.attendance_rate || 0}%</div>
                        <div className="text-gray-500 text-sm">Attendance</div>
                      </div>
                    </div>

                    {/* Recent Quizzes */}
                    <div className="bg-white rounded-xl shadow p-6">
                      <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Quiz Results</h3>
                      {childProgress.recent_quizzes?.length > 0 ? (
                        <div className="space-y-3">
                          {childProgress.recent_quizzes.slice(0, 5).map((quiz, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div>
                                <div className="font-medium">{quiz.quiz_title || 'Quiz'}</div>
                                <div className="text-sm text-gray-500">{quiz.completed_at?.split('T')[0]}</div>
                              </div>
                              <div className={`text-lg font-bold ${quiz.score >= 70 ? 'text-green-600' : 'text-orange-500'}`}>
                                {quiz.score}%
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-4">No quiz results yet</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Attendance Tab */}
                {activeTab === 'attendance' && childProgress && (
                  <div className="bg-white rounded-xl shadow p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold text-gray-800">Attendance Record</h3>
                      <div className={`px-4 py-2 rounded-lg ${
                        childProgress.attendance?.attendance_rate >= 80 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {childProgress.attendance?.attendance_rate || 0}% Attendance Rate
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 mb-6">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{childProgress.attendance?.total_classes || 0}</div>
                        <div className="text-sm text-gray-600">Total Classes</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{childProgress.attendance?.present_count || 0}</div>
                        <div className="text-sm text-gray-600">Present</div>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">
                          {(childProgress.attendance?.records || []).filter(r => r.status === 'late').length}
                        </div>
                        <div className="text-sm text-gray-600">Late</div>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">
                          {(childProgress.attendance?.records || []).filter(r => r.status === 'absent').length}
                        </div>
                        <div className="text-sm text-gray-600">Absent</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {childProgress.attendance?.records?.slice(0, 10).map((record, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            {record.status === 'present' && <CheckCircle className="text-green-500 mr-3" size={20} />}
                            {record.status === 'late' && <Clock className="text-yellow-500 mr-3" size={20} />}
                            {record.status === 'absent' && <XCircle className="text-red-500 mr-3" size={20} />}
                            <div>
                              <div className="font-medium">{record.session_title || 'Class'}</div>
                              <div className="text-sm text-gray-500">{record.date}</div>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm ${
                            record.status === 'present' ? 'bg-green-100 text-green-700' :
                            record.status === 'late' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {record.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Certificates Tab */}
                {activeTab === 'certificates' && childProgress && (
                  <div className="bg-white rounded-xl shadow p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Certificates Earned</h3>
                    {childProgress.certificates?.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {childProgress.certificates.map((cert, idx) => (
                          <div key={idx} className="border-2 border-purple-200 rounded-xl p-4 bg-purple-50">
                            <div className="flex items-center justify-between mb-2">
                              <Award className="text-purple-600" size={32} />
                              <span className="text-xs text-purple-600 font-mono">{cert.certificate_number}</span>
                            </div>
                            <h4 className="font-bold text-gray-800">{cert.course_name}</h4>
                            <p className="text-sm text-gray-600 capitalize">{cert.certificate_type} Certificate</p>
                            <p className="text-xs text-gray-500 mt-2">Issued: {cert.issued_date}</p>
                            <a
                              href={`${API}/certificates/${cert.id}/pdf`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-3 flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                            >
                              <Download size={16} className="mr-2" /> Download PDF
                            </a>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Award className="mx-auto text-gray-300 mb-4" size={48} />
                        <p>No certificates earned yet</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Payments Tab */}
                {activeTab === 'payments' && childPayments && (
                  <div className="bg-white rounded-xl shadow p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold text-gray-800">Payment History</h3>
                      <div className="text-lg font-bold text-green-600">
                        Total Paid: ${childPayments.total_paid?.toFixed(2) || '0.00'}
                      </div>
                    </div>
                    
                    {childPayments.payments?.length > 0 ? (
                      <div className="space-y-3">
                        {childPayments.payments.map((payment, idx) => (
                          <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                              <div className="font-medium">Order #{payment.order_id?.slice(0, 12)}...</div>
                              <div className="text-sm text-gray-500">{payment.created_at?.split('T')[0]}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-green-600">${payment.amount?.toFixed(2)}</div>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                payment.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {payment.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <CreditCard className="mx-auto text-gray-300 mb-4" size={48} />
                        <p>No payment records found</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Unlink Button */}
                <div className="text-center">
                  <button
                    onClick={() => handleUnlinkChild(selectedChild.link_id)}
                    className="text-red-500 hover:text-red-700 text-sm flex items-center mx-auto"
                  >
                    <Unlink size={16} className="mr-1" /> Unlink this child
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Link Child Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Link Child Account</h3>
              <button onClick={() => { setShowLinkModal(false); setLinkError(''); }} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleLinkChild} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                <input
                  type="text"
                  value={studentIndex}
                  onChange={(e) => setStudentIndex(e.target.value.toUpperCase())}
                  placeholder="e.g., SRI-F-1001"
                  className="w-full border rounded-lg px-4 py-3 text-center font-mono text-lg uppercase"
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  Enter your child's Student ID from their ID card or registration confirmation
                </p>
              </div>
              
              {linkError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {linkError}
                </div>
              )}
              
              <button
                type="submit"
                className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
              >
                Link Child
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentPortal;
