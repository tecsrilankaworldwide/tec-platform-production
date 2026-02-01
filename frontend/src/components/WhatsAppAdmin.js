import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const WhatsAppAdmin = ({ token }) => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('enrollment');
  const [formData, setFormData] = useState({
    phone_number: '',
    parent_name: '',
    student_name: '',
    course_name: '',
    age_group: '',
    lesson_title: '',
    scheduled_time: '',
    plan_name: '',
    amount: ''
  });
  const [customMessage, setCustomMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [showCustom, setShowCustom] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await axios.get(`${API}/whatsapp/templates`);
      setTemplates(response.data.templates);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    setSending(true);
    setResult(null);

    try {
      const response = await axios.post(
        `${API}/whatsapp/send-notification`,
        {
          ...formData,
          message_type: selectedTemplate
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult({ success: true, data: response.data });
    } catch (error) {
      setResult({ 
        success: false, 
        error: error.response?.data?.detail || error.message 
      });
    } finally {
      setSending(false);
    }
  };

  const handleSendCustom = async (e) => {
    e.preventDefault();
    setSending(true);
    setResult(null);

    try {
      const response = await axios.post(
        `${API}/whatsapp/send-custom`,
        {
          phone_number: formData.phone_number,
          message: customMessage
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult({ success: true, data: response.data });
    } catch (error) {
      setResult({ 
        success: false, 
        error: error.response?.data?.detail || error.message 
      });
    } finally {
      setSending(false);
    }
  };

  const getRequiredFields = () => {
    const template = templates.find(t => t.type === selectedTemplate);
    return template?.required_fields || [];
  };

  const templateIcons = {
    enrollment: '🎓',
    welcome: '👋',
    reminder: '⏰',
    subscription: '💎'
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden" data-testid="whatsapp-admin-container">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6">
        <h2 className="text-2xl font-bold flex items-center" data-testid="whatsapp-admin-title">
          <svg className="w-8 h-8 mr-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          WhatsApp Notifications
        </h2>
        <p className="text-green-100 mt-1">Send automated notifications to parents</p>
      </div>

      <div className="p-6">
        {/* Result Message */}
        {result && (
          <div 
            className={`mb-6 p-4 rounded-xl ${
              result.success 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}
            data-testid="whatsapp-result"
          >
            {result.success ? (
              <>
                <span className="font-bold">✅ Message Sent!</span>
                {result.data?.mock && (
                  <p className="text-sm mt-1">⚠️ Note: Running in mock mode (Twilio not configured)</p>
                )}
              </>
            ) : (
              <>
                <span className="font-bold">❌ Failed to send</span>
                <p className="text-sm mt-1">{result.error}</p>
              </>
            )}
          </div>
        )}

        {/* Mode Toggle */}
        <div className="flex gap-4 mb-6">
          <button
            type="button"
            onClick={() => setShowCustom(false)}
            className={`flex-1 py-3 rounded-xl font-medium transition-all ${
              !showCustom 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            data-testid="template-mode-btn"
          >
            📋 Use Templates
          </button>
          <button
            type="button"
            onClick={() => setShowCustom(true)}
            className={`flex-1 py-3 rounded-xl font-medium transition-all ${
              showCustom 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            data-testid="custom-mode-btn"
          >
            ✏️ Custom Message
          </button>
        </div>

        {!showCustom ? (
          /* Template Mode */
          <form onSubmit={handleSendNotification}>
            {/* Template Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Notification Type
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {templates.map(template => (
                  <button
                    key={template.type}
                    type="button"
                    onClick={() => setSelectedTemplate(template.type)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      selectedTemplate === template.type
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                    data-testid={`template-${template.type}`}
                  >
                    <span className="text-2xl block mb-1">{templateIcons[template.type]}</span>
                    <span className="font-medium text-sm text-gray-800">{template.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Phone Number - Always Required */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parent&apos;s Phone Number *
              </label>
              <input
                type="tel"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleInputChange}
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500"
                placeholder="+94 77 123 4567"
                required
                data-testid="phone-input"
              />
              <p className="text-xs text-gray-500 mt-1">Include country code (e.g., +94 for Sri Lanka)</p>
            </div>

            {/* Parent Name - Always Required */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parent&apos;s Name *
              </label>
              <input
                type="text"
                name="parent_name"
                value={formData.parent_name}
                onChange={handleInputChange}
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500"
                placeholder="Mr./Mrs. Name"
                required
                data-testid="parent-name-input"
              />
            </div>

            {/* Conditional Fields based on Template */}
            {getRequiredFields().includes('student_name') && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Student&apos;s Name *
                </label>
                <input
                  type="text"
                  name="student_name"
                  value={formData.student_name}
                  onChange={handleInputChange}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500"
                  placeholder="Student Name"
                  required
                  data-testid="student-name-input"
                />
              </div>
            )}

            {getRequiredFields().includes('course_name') && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course Name *
                </label>
                <input
                  type="text"
                  name="course_name"
                  value={formData.course_name}
                  onChange={handleInputChange}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500"
                  placeholder="e.g., AI Fundamentals"
                  required
                  data-testid="course-name-input"
                />
              </div>
            )}

            {getRequiredFields().includes('age_group') && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Age Group
                </label>
                <select
                  name="age_group"
                  value={formData.age_group}
                  onChange={handleInputChange}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500"
                  data-testid="age-group-select"
                >
                  <option value="">Select Age Group</option>
                  <option value="4-6">Foundation (Ages 4-6)</option>
                  <option value="7-9">Explorers (Ages 7-9)</option>
                  <option value="10-12">Smart Kids (Ages 10-12)</option>
                  <option value="13-15">Teens (Ages 13-15)</option>
                  <option value="16-18">Leaders (Ages 16-18)</option>
                </select>
              </div>
            )}

            {getRequiredFields().includes('lesson_title') && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lesson Title *
                </label>
                <input
                  type="text"
                  name="lesson_title"
                  value={formData.lesson_title}
                  onChange={handleInputChange}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500"
                  placeholder="e.g., Introduction to AI"
                  required
                  data-testid="lesson-title-input"
                />
              </div>
            )}

            {selectedTemplate === 'reminder' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scheduled Time (Optional)
                </label>
                <input
                  type="text"
                  name="scheduled_time"
                  value={formData.scheduled_time}
                  onChange={handleInputChange}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500"
                  placeholder="e.g., Tomorrow at 3:00 PM"
                  data-testid="scheduled-time-input"
                />
              </div>
            )}

            {getRequiredFields().includes('plan_name') && (
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plan Name *
                  </label>
                  <input
                    type="text"
                    name="plan_name"
                    value={formData.plan_name}
                    onChange={handleInputChange}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500"
                    placeholder="e.g., Premium Monthly"
                    required
                    data-testid="plan-name-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount *
                  </label>
                  <input
                    type="text"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500"
                    placeholder="e.g., LKR 1,500"
                    required
                    data-testid="amount-input"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={sending}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all font-medium disabled:opacity-50"
              data-testid="send-notification-btn"
            >
              {sending ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Sending...
                </span>
              ) : (
                '📤 Send WhatsApp Notification'
              )}
            </button>
          </form>
        ) : (
          /* Custom Message Mode */
          <form onSubmit={handleSendCustom}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleInputChange}
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500"
                placeholder="+94 77 123 4567"
                required
                data-testid="custom-phone-input"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Custom Message *
              </label>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500"
                rows={6}
                placeholder="Type your custom message here..."
                required
                data-testid="custom-message-input"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use *text* for bold, _text_ for italic
              </p>
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all font-medium disabled:opacity-50"
              data-testid="send-custom-btn"
            >
              {sending ? 'Sending...' : '📤 Send Custom Message'}
            </button>
          </form>
        )}

        {/* Setup Instructions */}
        <div className="mt-8 bg-blue-50 p-6 rounded-xl border border-blue-200">
          <h4 className="font-bold text-blue-800 mb-3 flex items-center">
            <span className="mr-2">⚙️</span>
            Twilio WhatsApp Setup
          </h4>
          <ol className="list-decimal list-inside space-y-2 text-blue-700 text-sm">
            <li>Create a Twilio account at <a href="https://www.twilio.com" target="_blank" rel="noopener noreferrer" className="underline">twilio.com</a></li>
            <li>Enable WhatsApp in your Twilio console</li>
            <li>Add your Twilio credentials to backend/.env:
              <pre className="bg-blue-100 p-2 rounded mt-1 text-xs overflow-x-auto">
{`TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886`}
              </pre>
            </li>
            <li>For testing, use Twilio&apos;s sandbox (join code required)</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppAdmin;
