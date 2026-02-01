import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './auth/AuthContext';
import { 
  Calendar, Clock, Video, Users, Plus, Edit, Trash2, 
  Bell, Send, ChevronLeft, ChevronRight, X, Check,
  Link as LinkIcon, Copy, MessageCircle, Mail, Globe
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const AGE_GROUPS = ['4-6', '7-9', '10-12', '13-15', '16-18'];
const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', 
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
];

const ClassScheduler = () => {
  const { token, user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('week'); // week, month, list
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  const [classForm, setClassForm] = useState({
    title: '',
    description: '',
    age_group: '10-12',
    date: '',
    time: '10:00',
    duration: 60,
    zoom_link: '',
    zoom_meeting_id: '',
    zoom_password: '',
    recurring: false,
    recurring_days: [],
    max_students: 30
  });

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    loadClasses();
  }, [token, currentDate]);

  const loadClasses = async () => {
    setLoading(true);
    try {
      const startOfWeek = getStartOfWeek(currentDate);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 7);
      
      const response = await axios.get(`${API}/classes/schedule`, { headers });
      setClasses(response.data.classes || []);
    } catch (error) {
      console.error('Failed to load classes:', error);
      // Demo data
      setClasses([
        {
          id: '1', title: 'AI Basics for Beginners', age_group: '7-9',
          date: getTodayDate(), time: '10:00', duration: 60,
          zoom_link: 'https://zoom.us/j/123456789', teacher_name: 'Admin',
          enrolled_count: 12, max_students: 30, status: 'scheduled'
        },
        {
          id: '2', title: 'Creative Coding', age_group: '10-12',
          date: getTomorrowDate(), time: '14:00', duration: 45,
          zoom_link: 'https://zoom.us/j/987654321', teacher_name: 'Admin',
          enrolled_count: 8, max_students: 25, status: 'scheduled'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };

  const getWeekDates = () => {
    const start = getStartOfWeek(currentDate);
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const getClassesForDate = (date) => {
    const dateStr = formatDate(date);
    return classes.filter(c => c.date === dateStr);
  };

  const handleCreateClass = async () => {
    if (!classForm.title || !classForm.date || !classForm.time) return;
    
    try {
      await axios.post(`${API}/classes/create`, classForm, { headers });
      setShowCreateModal(false);
      setClassForm({
        title: '', description: '', age_group: '10-12', date: '', time: '10:00',
        duration: 60, zoom_link: '', zoom_meeting_id: '', zoom_password: '',
        recurring: false, recurring_days: [], max_students: 30
      });
      setSuccessMessage('Class scheduled successfully! 🎉');
      setTimeout(() => setSuccessMessage(null), 3000);
      loadClasses();
    } catch (error) {
      console.error('Failed to create class:', error);
      alert('Failed to schedule class. Please try again.');
    }
  };

  const handleDeleteClass = async (classId) => {
    if (!confirm('Are you sure you want to delete this class?')) return;
    
    try {
      await axios.delete(`${API}/classes/${classId}`, { headers });
      loadClasses();
    } catch (error) {
      console.error('Failed to delete class:', error);
    }
  };

  const handleSendReminder = async (reminderType) => {
    if (!selectedClass) return;
    
    try {
      await axios.post(`${API}/classes/${selectedClass.id}/remind`, {
        type: reminderType // 'whatsapp', 'email', 'both'
      }, { headers });
      
      setShowReminderModal(false);
      setSuccessMessage(`Reminder sent via ${reminderType}! 📬`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Failed to send reminder:', error);
      alert('Failed to send reminder. Please try again.');
    }
  };

  const copyZoomLink = (link) => {
    navigator.clipboard.writeText(link);
    setSuccessMessage('Zoom link copied! 📋');
    setTimeout(() => setSuccessMessage(null), 2000);
  };

  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
  };

  const isToday = (date) => {
    const today = new Date();
    return formatDate(date) === formatDate(today);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-6 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <Calendar className="mr-3" size={32} /> Class Scheduler
              </h1>
              <p className="text-blue-200 mt-1">Schedule and manage Zoom classes for all age groups</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-5 py-3 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-50 shadow-lg"
              data-testid="create-class-btn"
            >
              <Plus className="mr-2" size={20} /> Schedule Class
            </button>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="max-w-6xl mx-auto px-6 mt-4">
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-center">
            <Check className="mr-2" size={20} />{successMessage}
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto p-6">
        {/* Week Navigation */}
        <div className="bg-white rounded-xl shadow p-4 mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigateWeek(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft size={24} />
            </button>
            
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-800">
                {getWeekDates()[0].toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <p className="text-gray-500 text-sm">
                {getWeekDates()[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - 
                {getWeekDates()[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            </div>
            
            <button
              onClick={() => navigateWeek(1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>

        {/* Week View */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="grid grid-cols-7 border-b">
            {getWeekDates().map((date, idx) => (
              <div 
                key={idx}
                className={`p-4 text-center border-r last:border-r-0 ${isToday(date) ? 'bg-blue-50' : ''}`}
              >
                <div className="text-sm text-gray-500">{DAYS_OF_WEEK[date.getDay()]}</div>
                <div className={`text-2xl font-bold ${isToday(date) ? 'text-blue-600' : 'text-gray-800'}`}>
                  {date.getDate()}
                </div>
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 min-h-[400px]">
            {getWeekDates().map((date, idx) => {
              const dayClasses = getClassesForDate(date);
              return (
                <div 
                  key={idx}
                  className={`border-r last:border-r-0 p-2 ${isToday(date) ? 'bg-blue-50/50' : ''}`}
                >
                  {dayClasses.map((cls) => (
                    <div
                      key={cls.id}
                      onClick={() => { setSelectedClass(cls); setShowReminderModal(true); }}
                      className="mb-2 p-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg cursor-pointer hover:shadow-lg transition-all text-sm"
                    >
                      <div className="font-bold truncate">{cls.title}</div>
                      <div className="flex items-center text-blue-100 text-xs mt-1">
                        <Clock size={12} className="mr-1" />{cls.time}
                      </div>
                      <div className="flex items-center text-blue-100 text-xs">
                        <Users size={12} className="mr-1" />{cls.age_group} yrs
                      </div>
                    </div>
                  ))}
                  
                  {dayClasses.length === 0 && (
                    <div className="h-full flex items-center justify-center text-gray-300">
                      <span className="text-xs">No classes</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Classes List */}
        <div className="mt-6 bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <Video className="mr-2 text-blue-600" size={20} /> Upcoming Classes
          </h3>
          
          {classes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="mx-auto mb-3 text-gray-300" size={40} />
              <p>No classes scheduled yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {classes.slice(0, 5).map((cls) => (
                <div key={cls.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center text-white">
                      <Video size={20} />
                    </div>
                    <div className="ml-4">
                      <div className="font-bold text-gray-800">{cls.title}</div>
                      <div className="text-sm text-gray-500">
                        {cls.date} at {cls.time} • {cls.age_group} years • {cls.duration} min
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      {cls.enrolled_count || 0}/{cls.max_students} enrolled
                    </span>
                    <button
                      onClick={() => copyZoomLink(cls.zoom_link)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                      title="Copy Zoom link"
                    >
                      <Copy size={16} className="text-gray-500" />
                    </button>
                    <button
                      onClick={() => { setSelectedClass(cls); setShowReminderModal(true); }}
                      className="p-2 hover:bg-blue-100 rounded-lg"
                      title="Send reminder"
                    >
                      <Bell size={16} className="text-blue-600" />
                    </button>
                    <button
                      onClick={() => handleDeleteClass(cls.id)}
                      className="p-2 hover:bg-red-100 rounded-lg"
                      title="Delete class"
                    >
                      <Trash2 size={16} className="text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Class Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 flex items-center">
                <Calendar className="mr-2 text-blue-600" size={24} /> Schedule New Class
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Class Title *</label>
                  <input
                    type="text"
                    value={classForm.title}
                    onChange={(e) => setClassForm({ ...classForm, title: e.target.value })}
                    placeholder="e.g., AI Basics for Beginners"
                    className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
                    data-testid="class-title-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Age Group *</label>
                  <select
                    value={classForm.age_group}
                    onChange={(e) => setClassForm({ ...classForm, age_group: e.target.value })}
                    className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
                  >
                    {AGE_GROUPS.map(ag => (
                      <option key={ag} value={ag}>{ag} years</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Students</label>
                  <input
                    type="number"
                    value={classForm.max_students}
                    onChange={(e) => setClassForm({ ...classForm, max_students: parseInt(e.target.value) })}
                    className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                  <input
                    type="date"
                    value={classForm.date}
                    onChange={(e) => setClassForm({ ...classForm, date: e.target.value })}
                    className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
                    data-testid="class-date-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time *</label>
                  <select
                    value={classForm.time}
                    onChange={(e) => setClassForm({ ...classForm, time: e.target.value })}
                    className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
                  >
                    {TIME_SLOTS.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                  <select
                    value={classForm.duration}
                    onChange={(e) => setClassForm({ ...classForm, duration: parseInt(e.target.value) })}
                    className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                    <option value={90}>90 minutes</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={classForm.description}
                    onChange={(e) => setClassForm({ ...classForm, description: e.target.value })}
                    placeholder="Describe what students will learn..."
                    rows={3}
                    className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Zoom Details */}
              <div className="border-t pt-4 mt-4">
                <h4 className="font-bold text-gray-800 mb-3 flex items-center">
                  <Video className="mr-2 text-blue-600" size={18} /> Zoom Meeting Details
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Zoom Link</label>
                    <input
                      type="url"
                      value={classForm.zoom_link}
                      onChange={(e) => setClassForm({ ...classForm, zoom_link: e.target.value })}
                      placeholder="https://zoom.us/j/..."
                      className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Meeting ID</label>
                    <input
                      type="text"
                      value={classForm.zoom_meeting_id}
                      onChange={(e) => setClassForm({ ...classForm, zoom_meeting_id: e.target.value })}
                      placeholder="123 456 7890"
                      className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                    <input
                      type="text"
                      value={classForm.zoom_password}
                      onChange={(e) => setClassForm({ ...classForm, zoom_password: e.target.value })}
                      placeholder="abc123"
                      className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-3 border rounded-lg hover:bg-gray-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateClass}
                  disabled={!classForm.title || !classForm.date}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 flex items-center justify-center"
                  data-testid="save-class-btn"
                >
                  <Calendar className="mr-2" size={18} /> Schedule Class
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send Reminder Modal */}
      {showReminderModal && selectedClass && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">Send Class Reminder</h3>
              <button onClick={() => setShowReminderModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h4 className="font-bold text-gray-800">{selectedClass.title}</h4>
              <p className="text-sm text-gray-600 mt-1">
                {selectedClass.date} at {selectedClass.time} • {selectedClass.age_group} years
              </p>
            </div>

            <p className="text-gray-600 mb-4">Choose how to send the reminder:</p>

            <div className="space-y-3">
              <button
                onClick={() => handleSendReminder('whatsapp')}
                className="w-full p-4 border-2 border-green-200 rounded-xl hover:border-green-400 hover:bg-green-50 flex items-center"
              >
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white mr-4">
                  <MessageCircle size={24} />
                </div>
                <div className="text-left">
                  <div className="font-bold text-gray-800">WhatsApp</div>
                  <div className="text-sm text-gray-500">Send to enrolled students & parents</div>
                </div>
              </button>

              <button
                onClick={() => handleSendReminder('email')}
                className="w-full p-4 border-2 border-blue-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 flex items-center"
              >
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white mr-4">
                  <Mail size={24} />
                </div>
                <div className="text-left">
                  <div className="font-bold text-gray-800">Email</div>
                  <div className="text-sm text-gray-500">Send email reminder to all</div>
                </div>
              </button>

              <button
                onClick={() => handleSendReminder('both')}
                className="w-full p-4 border-2 border-purple-200 rounded-xl hover:border-purple-400 hover:bg-purple-50 flex items-center"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white mr-4">
                  <Globe size={24} />
                </div>
                <div className="text-left">
                  <div className="font-bold text-gray-800">Both Channels</div>
                  <div className="text-sm text-gray-500">WhatsApp + Email</div>
                </div>
              </button>
            </div>

            {selectedClass.zoom_link && (
              <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Zoom Link:</div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-600 truncate">{selectedClass.zoom_link}</span>
                  <button
                    onClick={() => copyZoomLink(selectedClass.zoom_link)}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassScheduler;
