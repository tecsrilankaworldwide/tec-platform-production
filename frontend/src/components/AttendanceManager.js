import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './auth/AuthContext';
import { 
  Calendar, Plus, Users, CheckCircle, XCircle, Clock, 
  Save, X, Video, ChevronDown, ChevronUp
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const AGE_GROUPS = ['4-6', '7-9', '10-12', '13-15', '16-18'];

const AttendanceManager = () => {
  const { token } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionAttendance, setSessionAttendance] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newSession, setNewSession] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    time: '16:00',
    age_group: '7-9',
    zoom_link: '',
    duration_minutes: 60
  });
  const [attendanceMarks, setAttendanceMarks] = useState({});

  const headers = { Authorization: `Bearer ${token}` };

  const fetchSessions = async () => {
    try {
      const response = await axios.get(`${API}/attendance/classes`, { headers });
      setSessions(response.data.sessions);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionAttendance = async (sessionId) => {
    try {
      const response = await axios.get(`${API}/attendance/session/${sessionId}`, { headers });
      setSessionAttendance(response.data);
      
      // Pre-fill attendance marks
      const marks = {};
      response.data.attendance.forEach(a => {
        marks[a.student_id] = a.status;
      });
      setAttendanceMarks(marks);
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/attendance/class`, newSession, { headers });
      setShowCreateModal(false);
      setNewSession({
        title: '',
        date: new Date().toISOString().split('T')[0],
        time: '16:00',
        age_group: '7-9',
        zoom_link: '',
        duration_minutes: 60
      });
      fetchSessions();
    } catch (error) {
      alert('Failed to create session');
    }
  };

  const handleMarkAttendance = (studentId, status) => {
    setAttendanceMarks(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSaveAttendance = async () => {
    if (!selectedSession) return;
    setSaving(true);
    
    try {
      const attendanceList = Object.entries(attendanceMarks).map(([student_id, status]) => ({
        student_id,
        status
      }));
      
      await axios.post(`${API}/attendance/mark-bulk`, {
        session_id: selectedSession.id,
        attendance: attendanceList
      }, { headers });
      
      alert('Attendance saved successfully!');
      fetchSessions();
      fetchSessionAttendance(selectedSession.id);
    } catch (error) {
      alert('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      fetchSessionAttendance(selectedSession.id);
    }
  }, [selectedSession]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6 shadow-lg">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <Calendar className="mr-3" /> Attendance Manager
            </h1>
            <p className="text-blue-200 mt-1">Track class attendance for Zoom sessions</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 flex items-center font-medium"
          >
            <Plus size={20} className="mr-2" /> New Session
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sessions List */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-lg font-bold text-gray-800">Class Sessions</h2>
            
            {sessions.length === 0 ? (
              <div className="bg-white rounded-xl shadow p-6 text-center text-gray-500">
                <Calendar className="mx-auto mb-3 text-gray-300" size={40} />
                <p>No sessions yet</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-3 text-blue-600 hover:underline"
                >
                  Create first session
                </button>
              </div>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => setSelectedSession(session)}
                  className={`bg-white rounded-xl shadow p-4 cursor-pointer transition-all ${
                    selectedSession?.id === session.id ? 'ring-2 ring-blue-500' : 'hover:shadow-lg'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      session.status === 'completed' ? 'bg-green-100 text-green-700' :
                      session.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {session.status}
                    </span>
                    <span className="text-xs text-gray-500">{session.age_group} yrs</span>
                  </div>
                  <h3 className="font-bold text-gray-800">{session.title}</h3>
                  <div className="flex items-center text-sm text-gray-500 mt-2">
                    <Calendar size={14} className="mr-1" />
                    {session.date} at {session.time}
                  </div>
                  {session.zoom_link && (
                    <div className="flex items-center text-sm text-blue-600 mt-1">
                      <Video size={14} className="mr-1" />
                      Zoom link attached
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Attendance Panel */}
          <div className="lg:col-span-2">
            {selectedSession ? (
              <div className="bg-white rounded-xl shadow">
                {/* Session Header */}
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">{selectedSession.title}</h2>
                      <p className="text-gray-500">{selectedSession.date} at {selectedSession.time}</p>
                    </div>
                    {sessionAttendance && (
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Attendance Summary</div>
                        <div className="flex gap-2 mt-1">
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm">
                            ✓ {sessionAttendance.summary.present}
                          </span>
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-sm">
                            ⏰ {sessionAttendance.summary.late}
                          </span>
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm">
                            ✗ {sessionAttendance.summary.absent}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Students List */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-700">
                      Students ({sessionAttendance?.all_students?.length || 0})
                    </h3>
                    <button
                      onClick={handleSaveAttendance}
                      disabled={saving}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      <Save size={18} className="mr-2" />
                      {saving ? 'Saving...' : 'Save Attendance'}
                    </button>
                  </div>

                  {sessionAttendance?.all_students?.length > 0 ? (
                    <div className="space-y-2">
                      {sessionAttendance.all_students.map((student) => {
                        const currentStatus = attendanceMarks[student.id];
                        
                        return (
                          <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                                {student.full_name?.charAt(0)}
                              </div>
                              <div className="ml-3">
                                <div className="font-medium text-gray-800">{student.full_name}</div>
                                <div className="text-xs text-gray-500 font-mono">{student.student_index}</div>
                              </div>
                            </div>
                            
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleMarkAttendance(student.id, 'present')}
                                className={`p-2 rounded-lg transition-all ${
                                  currentStatus === 'present' 
                                    ? 'bg-green-500 text-white' 
                                    : 'bg-gray-200 text-gray-600 hover:bg-green-100'
                                }`}
                              >
                                <CheckCircle size={20} />
                              </button>
                              <button
                                onClick={() => handleMarkAttendance(student.id, 'late')}
                                className={`p-2 rounded-lg transition-all ${
                                  currentStatus === 'late' 
                                    ? 'bg-yellow-500 text-white' 
                                    : 'bg-gray-200 text-gray-600 hover:bg-yellow-100'
                                }`}
                              >
                                <Clock size={20} />
                              </button>
                              <button
                                onClick={() => handleMarkAttendance(student.id, 'absent')}
                                className={`p-2 rounded-lg transition-all ${
                                  currentStatus === 'absent' 
                                    ? 'bg-red-500 text-white' 
                                    : 'bg-gray-200 text-gray-600 hover:bg-red-100'
                                }`}
                              >
                                <XCircle size={20} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="mx-auto mb-3 text-gray-300" size={40} />
                      <p>No students in this age group</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow p-12 text-center text-gray-500">
                <Calendar className="mx-auto mb-4 text-gray-300" size={48} />
                <h3 className="text-lg font-medium">Select a Session</h3>
                <p className="mt-2">Choose a class session from the left to mark attendance</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Session Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Create Class Session</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleCreateSession} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Session Title</label>
                <input
                  type="text"
                  required
                  value={newSession.title}
                  onChange={(e) => setNewSession({ ...newSession, title: e.target.value })}
                  placeholder="e.g., Math Fun Friday"
                  className="w-full border rounded-lg px-4 py-2"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={newSession.date}
                    onChange={(e) => setNewSession({ ...newSession, date: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input
                    type="time"
                    required
                    value={newSession.time}
                    onChange={(e) => setNewSession({ ...newSession, time: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age Group</label>
                <select
                  value={newSession.age_group}
                  onChange={(e) => setNewSession({ ...newSession, age_group: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2"
                >
                  {AGE_GROUPS.map(ag => (
                    <option key={ag} value={ag}>{ag} years</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zoom Link (optional)</label>
                <input
                  type="url"
                  value={newSession.zoom_link}
                  onChange={(e) => setNewSession({ ...newSession, zoom_link: e.target.value })}
                  placeholder="https://zoom.us/j/..."
                  className="w-full border rounded-lg px-4 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  value={newSession.duration_minutes}
                  onChange={(e) => setNewSession({ ...newSession, duration_minutes: parseInt(e.target.value) })}
                  className="w-full border rounded-lg px-4 py-2"
                />
              </div>
              
              <button
                type="submit"
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Create Session
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceManager;
