import React, { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ClassReminders = ({ token }) => {
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [className, setClassName] = useState('');
  const [classTime, setClassTime] = useState('');
  const [zoomLink, setZoomLink] = useState('');
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState(null);
  const [scheduledReminders, setScheduledReminders] = useState([]);

  useEffect(() => {
    fetchStudents();
    fetchScheduledReminders();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/students`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || []);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchScheduledReminders = async () => {
    try {
      const response = await fetch(`${API_URL}/api/reminders/scheduled`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setScheduledReminders(data.scheduled_reminders || []);
      }
    } catch (error) {
      console.error('Error fetching scheduled reminders:', error);
    }
  };

  const handleSendReminders = async (e) => {
    e.preventDefault();
    
    if (!className || !classTime) {
      alert('Please enter class name and time');
      return;
    }

    setSending(true);
    setResults(null);

    try {
      const response = await fetch(`${API_URL}/api/reminders/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          class_id: 'manual-' + Date.now(),
          class_name: className,
          class_time: new Date(classTime).toISOString(),
          zoom_link: zoomLink || null,
          student_ids: selectedStudents.length > 0 ? selectedStudents : null
        })
      });

      const data = await response.json();
      setResults(data);
      
      if (data.status === 'success') {
        // Clear form
        setClassName('');
        setClassTime('');
        setZoomLink('');
        setSelectedStudents([]);
      }
    } catch (error) {
      console.error('Error sending reminders:', error);
      setResults({ status: 'error', message: 'Failed to send reminders' });
    } finally {
      setSending(false);
    }
  };

  const toggleStudentSelection = (studentId) => {
    setSelectedStudents(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const selectAllStudents = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(s => s.user_id));
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6" data-testid="class-reminders">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
          <span className="text-2xl">🔔</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Class Reminders</h2>
          <p className="text-gray-500">Send email & WhatsApp reminders to parents</p>
        </div>
      </div>

      {/* Manual Reminder Form */}
      <form onSubmit={handleSendReminders} className="space-y-4 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Class Name *
            </label>
            <input
              type="text"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="e.g., Python Basics - Week 3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
              data-testid="class-name-input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Class Date & Time *
            </label>
            <input
              type="datetime-local"
              value={classTime}
              onChange={(e) => setClassTime(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
              data-testid="class-time-input"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Zoom Link (optional)
          </label>
          <input
            type="url"
            value={zoomLink}
            onChange={(e) => setZoomLink(e.target.value)}
            placeholder="https://zoom.us/j/..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            data-testid="zoom-link-input"
          />
        </div>

        {/* Student Selection */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Select Students (leave empty to send to all)
            </label>
            <button
              type="button"
              onClick={selectAllStudents}
              className="text-sm text-green-600 hover:text-green-700"
            >
              {selectedStudents.length === students.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2">
            {students.length > 0 ? (
              students.map(student => (
                <label
                  key={student.user_id}
                  className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(student.user_id)}
                    onChange={() => toggleStudentSelection(student.user_id)}
                    className="w-4 h-4 text-green-600 rounded"
                  />
                  <span className="text-gray-700">{student.full_name || student.name}</span>
                  <span className="text-gray-400 text-sm">({student.email})</span>
                </label>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No students found</p>
            )}
          </div>
          {selectedStudents.length > 0 && (
            <p className="text-sm text-green-600 mt-1">
              {selectedStudents.length} student(s) selected
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={sending}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          data-testid="send-reminders-btn"
        >
          {sending ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Sending...
            </>
          ) : (
            <>
              📧 Send Reminders (Email + WhatsApp)
            </>
          )}
        </button>
      </form>

      {/* Results */}
      {results && (
        <div className={`p-4 rounded-lg mb-6 ${
          results.status === 'success' ? 'bg-green-50 border border-green-200' : 
          results.status === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
          'bg-red-50 border border-red-200'
        }`}>
          <h4 className={`font-semibold ${
            results.status === 'success' ? 'text-green-800' :
            results.status === 'warning' ? 'text-yellow-800' :
            'text-red-800'
          }`}>
            {results.status === 'success' ? '✅ ' : results.status === 'warning' ? '⚠️ ' : '❌ '}
            {results.message}
          </h4>
          
          {results.results && (
            <div className="mt-3 text-sm">
              <p>📧 Emails sent: {results.results.email_sent}</p>
              {results.results.email_failed > 0 && (
                <p className="text-red-600">Failed: {results.results.email_failed}</p>
              )}
              
              {results.results.whatsapp_links && results.results.whatsapp_links.length > 0 && (
                <div className="mt-3">
                  <p className="font-medium mb-2">📱 WhatsApp Links (click to send):</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {results.results.whatsapp_links.map((link, idx) => (
                      <a
                        key={idx}
                        href={link.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 bg-green-100 rounded hover:bg-green-200 transition-colors"
                      >
                        <span className="text-green-600">💬</span>
                        <span className="text-green-800">{link.student}</span>
                        <span className="text-green-600 text-xs">({link.parent_phone})</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Scheduled Reminders */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          ⏰ Automatic Reminders (24h before class)
        </h3>
        
        {scheduledReminders.length > 0 ? (
          <div className="space-y-3">
            {scheduledReminders.map((reminder, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">{reminder.class_name}</p>
                  <p className="text-sm text-gray-500">
                    Class: {new Date(reminder.class_time).toLocaleString()}
                  </p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                  {reminder.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">
            No upcoming classes scheduled. Reminders will be sent automatically 24 hours before each class.
          </p>
        )}
      </div>
    </div>
  );
};

export default ClassReminders;
