import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LessonScheduler = ({ token }) => {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [upcomingLessons, setUpcomingLessons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  
  const [formData, setFormData] = useState({
    student_id: '',
    course_id: '',
    lesson_title: '',
    scheduled_date: '',
    scheduled_time: '',
    parent_phone: '',
    parent_name: ''
  });

  // Quick schedule for testing
  const [quickSchedule, setQuickSchedule] = useState({
    student_email: '',
    minutes_from_now: 65,
    course_name: '',
    lesson_title: '',
    parent_phone: '',
    parent_name: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load courses
      const coursesRes = await axios.get(`${API}/courses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourses(coursesRes.data);
      
      // Load upcoming lessons
      const lessonsRes = await axios.get(`${API}/lessons/upcoming`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUpcomingLessons(lessonsRes.data.lessons || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleQuickInputChange = (e) => {
    setQuickSchedule({ ...quickSchedule, [e.target.name]: e.target.value });
  };

  const handleScheduleLesson = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Combine date and time
      const scheduledTime = new Date(`${formData.scheduled_date}T${formData.scheduled_time}`);
      
      const response = await axios.post(
        `${API}/lessons/schedule`,
        {
          student_id: formData.student_id,
          course_id: formData.course_id,
          lesson_title: formData.lesson_title,
          scheduled_time: scheduledTime.toISOString(),
          parent_phone: formData.parent_phone,
          parent_name: formData.parent_name
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setMessage({ type: 'success', text: response.data.message });
      loadData(); // Refresh upcoming lessons
      
      // Reset form
      setFormData({
        student_id: '',
        course_id: '',
        lesson_title: '',
        scheduled_date: '',
        scheduled_time: '',
        parent_phone: '',
        parent_name: ''
      });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to schedule lesson'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSchedule = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await axios.post(
        `${API}/lessons/quick-schedule`,
        quickSchedule,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setMessage({ 
        type: 'success', 
        text: `Lesson scheduled! Reminder will send at: ${response.data.reminder_will_send_at}`
      });
      loadData();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to schedule lesson'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelLesson = async (lessonId) => {
    if (!window.confirm('Are you sure you want to cancel this lesson?')) return;
    
    try {
      await axios.delete(`${API}/lessons/${lessonId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({ type: 'success', text: 'Lesson cancelled' });
      loadData();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to cancel lesson' });
    }
  };

  const formatDateTime = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden" data-testid="lesson-scheduler-container">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
        <h2 className="text-2xl font-bold flex items-center" data-testid="lesson-scheduler-title">
          <span className="mr-3">📅</span>
          Class Scheduler
        </h2>
        <p className="text-blue-100 mt-1">Schedule lessons with automatic WhatsApp reminders</p>
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
            data-testid="scheduler-message"
          >
            {message.type === 'success' ? '✅ ' : '❌ '}{message.text}
          </div>
        )}

        {/* Quick Schedule (Testing) */}
        <div className="mb-8 bg-yellow-50 p-6 rounded-xl border border-yellow-200">
          <h3 className="font-bold text-yellow-800 mb-4 flex items-center">
            <span className="mr-2">⚡</span>
            Quick Schedule (For Testing)
          </h3>
          <form onSubmit={handleQuickSchedule} className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student Email *
              </label>
              <input
                type="email"
                name="student_email"
                value={quickSchedule.student_email}
                onChange={handleQuickInputChange}
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-yellow-500"
                placeholder="student@tec.com"
                required
                data-testid="quick-student-email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minutes From Now *
              </label>
              <input
                type="number"
                name="minutes_from_now"
                value={quickSchedule.minutes_from_now}
                onChange={handleQuickInputChange}
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-yellow-500"
                min="1"
                required
                data-testid="quick-minutes"
              />
              <p className="text-xs text-gray-500 mt-1">Set to 65 for reminder to trigger (1 hour check)</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course Name
              </label>
              <input
                type="text"
                name="course_name"
                value={quickSchedule.course_name}
                onChange={handleQuickInputChange}
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-yellow-500"
                placeholder="AI Fundamentals"
                data-testid="quick-course"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lesson Title
              </label>
              <input
                type="text"
                name="lesson_title"
                value={quickSchedule.lesson_title}
                onChange={handleQuickInputChange}
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-yellow-500"
                placeholder="Introduction to AI"
                data-testid="quick-lesson"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parent Phone (for reminder)
              </label>
              <input
                type="tel"
                name="parent_phone"
                value={quickSchedule.parent_phone}
                onChange={handleQuickInputChange}
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-yellow-500"
                placeholder="+94771234567"
                data-testid="quick-phone"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parent Name
              </label>
              <input
                type="text"
                name="parent_name"
                value={quickSchedule.parent_name}
                onChange={handleQuickInputChange}
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-yellow-500"
                placeholder="Mr. Silva"
                data-testid="quick-parent-name"
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all font-medium disabled:opacity-50"
                data-testid="quick-schedule-btn"
              >
                {loading ? 'Scheduling...' : '⚡ Quick Schedule'}
              </button>
            </div>
          </form>
        </div>

        {/* Upcoming Lessons */}
        <div className="mb-8">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center">
            <span className="mr-2">📋</span>
            Upcoming Lessons ({upcomingLessons.length})
          </h3>
          
          {upcomingLessons.length === 0 ? (
            <div className="bg-gray-50 p-6 rounded-xl text-center text-gray-500">
              No upcoming lessons scheduled
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingLessons.map((lesson) => (
                <div 
                  key={lesson.id}
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100 flex items-center justify-between"
                  data-testid={`lesson-${lesson.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">📚</span>
                      <span className="font-medium text-gray-800">{lesson.lesson_title}</span>
                      {lesson.reminder_sent && (
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                          Reminder Sent ✓
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      <span className="mr-4">🕐 {formatDateTime(lesson.scheduled_time)}</span>
                      {lesson.parent_phone && (
                        <span>📱 {lesson.parent_phone}</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleCancelLesson(lesson.id)}
                    className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                    data-testid={`cancel-lesson-${lesson.id}`}
                  >
                    Cancel
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* How It Works */}
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
          <h4 className="font-bold text-blue-800 mb-3 flex items-center">
            <span className="mr-2">ℹ️</span>
            How Automated Reminders Work
          </h4>
          <ol className="list-decimal list-inside space-y-2 text-blue-700 text-sm">
            <li><strong>Schedule a lesson</strong> with a specific date/time and parent&apos;s phone number</li>
            <li><strong>System checks</strong> every 5 minutes for lessons starting in ~1 hour</li>
            <li><strong>WhatsApp reminder</strong> is automatically sent to the parent</li>
            <li><strong>Lesson marked</strong> as reminded to prevent duplicate notifications</li>
          </ol>
          <div className="mt-4 p-3 bg-blue-100 rounded-lg">
            <p className="text-blue-800 text-sm">
              <strong>💡 Tip:</strong> For testing, use &quot;Quick Schedule&quot; with 65 minutes. 
              The reminder will trigger within the next 5-minute check cycle.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonScheduler;
