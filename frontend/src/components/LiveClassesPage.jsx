import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Video, Calendar, Clock, Users, ExternalLink, Plus, Play } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const LiveClassesPage = ({ token, user }) => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClass, setNewClass] = useState({
    title: '',
    description: '',
    scheduled_time: '',
    duration_minutes: 60,
    meeting_link: '',
    meeting_password: '',
    age_group: '9-12',
    learning_level: 'development',
    max_students: 30
  });

  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

  useEffect(() => {
    loadClasses();
  }, [token]);

  const loadClasses = async () => {
    try {
      const response = await axios.get(`${API}/live-classes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClasses(response.data.classes || []);
    } catch (error) {
      console.error('Failed to load classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const createClass = async () => {
    try {
      await axios.post(`${API}/live-classes`, newClass, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowCreateModal(false);
      setNewClass({
        title: '',
        description: '',
        scheduled_time: '',
        duration_minutes: 60,
        meeting_link: '',
        meeting_password: '',
        age_group: '9-12',
        learning_level: 'development',
        max_students: 30
      });
      loadClasses();
    } catch (error) {
      console.error('Failed to create class:', error);
    }
  };

  const enrollInClass = async (classId) => {
    try {
      const response = await axios.post(`${API}/live-classes/${classId}/enroll`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(response.data.message);
      loadClasses();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to enroll');
    }
  };

  const joinClass = async (classId) => {
    try {
      const response = await axios.get(`${API}/live-classes/${classId}/join`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.meeting_link) {
        window.open(response.data.meeting_link, '_blank');
      }
    } catch (error) {
      alert(error.response?.data?.detail || 'Cannot join class');
    }
  };

  const isEnrolled = (classItem) => {
    return classItem.enrolled_students?.includes(user?.id);
  };

  const isClassTime = (classItem) => {
    const now = new Date();
    const startTime = new Date(classItem.scheduled_time);
    const endTime = new Date(startTime.getTime() + classItem.duration_minutes * 60000);
    // Allow joining 10 minutes before
    const allowJoin = new Date(startTime.getTime() - 10 * 60000);
    return now >= allowJoin && now <= endTime;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse text-xl text-slate-600">Loading classes...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-800 font-nunito">📹 Live Classes</h1>
            <p className="text-slate-600 mt-1">Join interactive online sessions with teachers</p>
          </div>
          {isTeacher && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-full font-bold hover:shadow-lg transition-all"
              data-testid="create-class-btn"
            >
              <Plus className="w-5 h-5" />
              Create Class
            </button>
          )}
        </div>

        {/* Classes Grid */}
        {classes.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6">
            {classes.map((classItem) => (
              <div
                key={classItem.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-100 hover:shadow-xl transition-all"
              >
                {/* Header */}
                <div className={`p-4 ${
                  classItem.status === 'live'
                    ? 'bg-gradient-to-r from-red-500 to-pink-500'
                    : 'bg-gradient-to-r from-[#667eea] to-[#764ba2]'
                } text-white`}>
                  <div className="flex items-center justify-between">
                    <Video className="w-6 h-6" />
                    {classItem.status === 'live' && (
                      <span className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-sm">
                        <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        LIVE NOW
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold mt-3">{classItem.title}</h3>
                  <p className="text-white/80 text-sm mt-1">By {classItem.teacher_name}</p>
                </div>

                {/* Content */}
                <div className="p-6">
                  {classItem.description && (
                    <p className="text-slate-600 text-sm mb-4">{classItem.description}</p>
                  )}

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-slate-600">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">
                        {new Date(classItem.scheduled_time).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{classItem.duration_minutes} minutes</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">
                        {classItem.enrolled_students?.length || 0} / {classItem.max_students} enrolled
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      classItem.learning_level === 'foundation' ? 'bg-green-100 text-green-700' :
                      classItem.learning_level === 'development' ? 'bg-blue-100 text-blue-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {classItem.learning_level}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                      Ages {classItem.age_group}
                    </span>
                  </div>

                  {/* Actions */}
                  {!isTeacher && (
                    <>
                      {isEnrolled(classItem) ? (
                        <button
                          onClick={() => joinClass(classItem.id)}
                          disabled={!isClassTime(classItem)}
                          className={`w-full flex items-center justify-center gap-2 py-3 rounded-full font-bold transition-all ${
                            isClassTime(classItem)
                              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg'
                              : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                          }`}
                          data-testid={`join-class-${classItem.id}`}
                        >
                          <Play className="w-4 h-4" />
                          {isClassTime(classItem) ? 'Join Class' : 'Not Yet Time'}
                        </button>
                      ) : (
                        <button
                          onClick={() => enrollInClass(classItem.id)}
                          className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-full font-bold hover:shadow-lg transition-all"
                          data-testid={`enroll-class-${classItem.id}`}
                        >
                          Enroll Now
                        </button>
                      )}
                    </>
                  )}

                  {isTeacher && classItem.teacher_id === user?.id && (
                    <button
                      onClick={() => joinClass(classItem.id)}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full font-bold hover:shadow-lg transition-all"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Start Class
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📹</div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No Upcoming Classes</h3>
            <p className="text-slate-600">Check back later for scheduled live sessions!</p>
          </div>
        )}

        {/* Create Class Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-slate-800 mb-6">Create New Live Class</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={newClass.title}
                    onChange={(e) => setNewClass({...newClass, title: e.target.value})}
                    className="w-full p-3 rounded-xl border-2 border-slate-200 focus:border-purple-500 focus:outline-none"
                    placeholder="e.g., Introduction to AI"
                    data-testid="class-title-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea
                    value={newClass.description}
                    onChange={(e) => setNewClass({...newClass, description: e.target.value})}
                    className="w-full p-3 rounded-xl border-2 border-slate-200 focus:border-purple-500 focus:outline-none"
                    rows="3"
                    placeholder="What will students learn?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Scheduled Time</label>
                  <input
                    type="datetime-local"
                    value={newClass.scheduled_time}
                    onChange={(e) => setNewClass({...newClass, scheduled_time: e.target.value})}
                    className="w-full p-3 rounded-xl border-2 border-slate-200 focus:border-purple-500 focus:outline-none"
                    data-testid="class-time-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Zoom Meeting Link</label>
                  <input
                    type="url"
                    value={newClass.meeting_link}
                    onChange={(e) => setNewClass({...newClass, meeting_link: e.target.value})}
                    className="w-full p-3 rounded-xl border-2 border-slate-200 focus:border-purple-500 focus:outline-none"
                    placeholder="https://zoom.us/j/..."
                    data-testid="class-link-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Meeting Password (optional)</label>
                  <input
                    type="text"
                    value={newClass.meeting_password}
                    onChange={(e) => setNewClass({...newClass, meeting_password: e.target.value})}
                    className="w-full p-3 rounded-xl border-2 border-slate-200 focus:border-purple-500 focus:outline-none"
                    placeholder="Optional password"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Age Group</label>
                    <select
                      value={newClass.age_group}
                      onChange={(e) => setNewClass({...newClass, age_group: e.target.value})}
                      className="w-full p-3 rounded-xl border-2 border-slate-200 focus:border-purple-500 focus:outline-none"
                    >
                      <option value="5-8">5-8 years</option>
                      <option value="9-12">9-12 years</option>
                      <option value="13-16">13-16 years</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Duration</label>
                    <select
                      value={newClass.duration_minutes}
                      onChange={(e) => setNewClass({...newClass, duration_minutes: parseInt(e.target.value)})}
                      className="w-full p-3 rounded-xl border-2 border-slate-200 focus:border-purple-500 focus:outline-none"
                    >
                      <option value="30">30 minutes</option>
                      <option value="45">45 minutes</option>
                      <option value="60">60 minutes</option>
                      <option value="90">90 minutes</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 bg-slate-200 text-slate-700 rounded-full font-bold hover:bg-slate-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={createClass}
                  disabled={!newClass.title || !newClass.scheduled_time}
                  className="flex-1 py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-full font-bold hover:shadow-lg transition-all disabled:opacity-50"
                  data-testid="submit-create-class"
                >
                  Create Class
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveClassesPage;
