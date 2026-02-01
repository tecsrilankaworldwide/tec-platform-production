import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LessonUpload = ({ token, onSuccess }) => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // New course form
  const [showNewCourseForm, setShowNewCourseForm] = useState(false);
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    learning_level: 'foundation',
    skill_areas: ['ai_literacy'],
    age_group: '5-8',
    is_premium: false,
    difficulty_level: 1,
    estimated_hours: 4
  });

  // Lesson/Video form
  const [lessonData, setLessonData] = useState({
    title: '',
    description: '',
    language: 'en',  // Language code matching backend
    video_file: null,
    duration_minutes: 0
  });

  const loadCourses = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/courses?published_only=false`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourses(response.data);
    } catch (error) {
      console.error('Failed to load courses:', error);
      setMessage({ type: 'error', text: 'Failed to load courses' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API}/courses`, newCourse, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourses([...courses, response.data]);
      setSelectedCourse(response.data.id);
      setShowNewCourseForm(false);
      setMessage({ type: 'success', text: 'Course created successfully!' });
      setNewCourse({
        title: '',
        description: '',
        learning_level: 'foundation',
        skill_areas: ['ai_literacy'],
        age_group: '5-8',
        is_premium: false,
        difficulty_level: 1,
        estimated_hours: 4
      });
    } catch (error) {
      console.error('Failed to create course:', error);
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to create course' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLessonData({ ...lessonData, video_file: file });
    }
  };

  const handleUploadLesson = async (e) => {
    e.preventDefault();
    
    if (!selectedCourse) {
      setMessage({ type: 'error', text: 'Please select a course first' });
      return;
    }

    if (!lessonData.video_file) {
      setMessage({ type: 'error', text: 'Please select a video file to upload' });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('video', lessonData.video_file);
      formData.append('title', lessonData.title);
      formData.append('description', lessonData.description);
      formData.append('language', lessonData.language);  // Send language to backend

      const response = await axios.post(
        `${API}/courses/${selectedCourse}/videos`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        }
      );

      setMessage({ type: 'success', text: `Lesson uploaded successfully in ${getLanguageName(lessonData.language)}!` });
      setLessonData({
        title: '',
        description: '',
        language: 'en',
        video_file: null,
        duration_minutes: 0
      });
      
      // Reset file input
      const fileInput = document.getElementById('video-file-input');
      if (fileInput) fileInput.value = '';
      
      if (onSuccess) onSuccess(response.data);
      
      // Reload courses to show updated video count
      loadCourses();
    } catch (error) {
      console.error('Failed to upload lesson:', error);
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to upload lesson' });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const skillAreaOptions = [
    { value: 'ai_literacy', label: 'AI Literacy' },
    { value: 'logical_thinking', label: 'Logical Thinking' },
    { value: 'creative_problem_solving', label: 'Creative Problem Solving' },
    { value: 'future_career_skills', label: 'Future Career Skills' },
    { value: 'systems_thinking', label: 'Systems Thinking' },
    { value: 'innovation_methods', label: 'Innovation Methods' }
  ];

  // Helper to get language name from code
  const getLanguageName = (code) => {
    const names = {
      'en': 'English',
      'si': 'Sinhala',
      'ta': 'Tamil',
      'zh-CN': 'Chinese',
      'hi': 'Hindi',
      'ar': 'Arabic',
      'id': 'Indonesian',
      'ms': 'Malay',
      'bn': 'Bengali',
      'ur': 'Urdu'
    };
    return names[code] || 'English';
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden" data-testid="lesson-upload-container">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6">
        <h2 className="text-2xl font-bold flex items-center" data-testid="lesson-upload-title">
          <span className="mr-3">📤</span>
          Upload Multi-Language Lessons
        </h2>
        <p className="text-green-100 mt-1">Add video lessons in any supported language to your courses</p>
      </div>

      <div className="p-6">
        {/* Message Display */}
        {message.text && (
          <div 
            className={`mb-6 p-4 rounded-xl ${
              message.type === 'success' 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}
            data-testid="upload-message"
          >
            {message.type === 'success' ? '✅ ' : '❌ '}{message.text}
          </div>
        )}

        {/* Step 1: Select or Create Course */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <span className="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">1</span>
            Select or Create a Course
          </h3>

          <div className="flex gap-4 mb-4">
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="flex-1 p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500"
              data-testid="course-select"
            >
              <option value="">-- Select a Course --</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.title} ({course.age_group}) - {course.videos?.length || 0} videos
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowNewCourseForm(!showNewCourseForm)}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all font-medium"
              data-testid="create-course-toggle-btn"
            >
              {showNewCourseForm ? '✕ Cancel' : '+ New Course'}
            </button>
          </div>

          {/* New Course Form */}
          {showNewCourseForm && (
            <form onSubmit={handleCreateCourse} className="bg-purple-50 p-6 rounded-xl border border-purple-200" data-testid="new-course-form">
              <h4 className="font-bold text-purple-800 mb-4">Create New Course</h4>
              
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course Title *</label>
                  <input
                    type="text"
                    value={newCourse.title}
                    onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500"
                    placeholder="e.g., Introduction to AI"
                    required
                    data-testid="new-course-title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age Group *</label>
                  <select
                    value={newCourse.age_group}
                    onChange={(e) => setNewCourse({ ...newCourse, age_group: e.target.value })}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500"
                    data-testid="new-course-age-group"
                  >
                    <option value="5-8">Foundation (Ages 5-8)</option>
                    <option value="9-12">Development (Ages 9-12)</option>
                    <option value="13-16">Mastery (Ages 13-16)</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500"
                  rows={3}
                  placeholder="Describe what students will learn..."
                  required
                  data-testid="new-course-description"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Learning Level</label>
                  <select
                    value={newCourse.learning_level}
                    onChange={(e) => setNewCourse({ ...newCourse, learning_level: e.target.value })}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500"
                    data-testid="new-course-level"
                  >
                    <option value="foundation">Foundation</option>
                    <option value="development">Development</option>
                    <option value="mastery">Mastery</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={newCourse.difficulty_level}
                    onChange={(e) => setNewCourse({ ...newCourse, difficulty_level: parseInt(e.target.value) })}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500"
                    data-testid="new-course-difficulty"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Est. Hours</label>
                  <input
                    type="number"
                    min="1"
                    value={newCourse.estimated_hours}
                    onChange={(e) => setNewCourse({ ...newCourse, estimated_hours: parseInt(e.target.value) })}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500"
                    data-testid="new-course-hours"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Skill Areas</label>
                <div className="flex flex-wrap gap-2">
                  {skillAreaOptions.map(skill => (
                    <label key={skill.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newCourse.skill_areas.includes(skill.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewCourse({ ...newCourse, skill_areas: [...newCourse.skill_areas, skill.value] });
                          } else {
                            setNewCourse({ ...newCourse, skill_areas: newCourse.skill_areas.filter(s => s !== skill.value) });
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">{skill.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="is-premium"
                  checked={newCourse.is_premium}
                  onChange={(e) => setNewCourse({ ...newCourse, is_premium: e.target.checked })}
                  className="mr-2"
                  data-testid="new-course-premium"
                />
                <label htmlFor="is-premium" className="text-sm text-gray-700">Premium Course (requires subscription)</label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all font-medium disabled:opacity-50"
                data-testid="create-course-submit-btn"
              >
                {loading ? 'Creating...' : '✨ Create Course'}
              </button>
            </form>
          )}
        </div>

        {/* Step 2: Upload Lesson */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <span className="bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">2</span>
            Upload Video Lesson
          </h3>

          <form onSubmit={handleUploadLesson} className="bg-green-50 p-6 rounded-xl border border-green-200" data-testid="lesson-upload-form">
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lesson Title *</label>
                <input
                  type="text"
                  value={lessonData.title}
                  onChange={(e) => setLessonData({ ...lessonData, title: e.target.value })}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500"
                  placeholder="e.g., Lesson 1: What is AI?"
                  required
                  data-testid="lesson-title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Video Language *</label>
                <select
                  value={lessonData.language}
                  onChange={(e) => setLessonData({ ...lessonData, language: e.target.value })}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500"
                  data-testid="lesson-language"
                >
                  <option value="en">English</option>
                  <option value="si">සිංහල (Sinhala)</option>
                  <option value="ta">தமிழ் (Tamil)</option>
                  <option value="zh-CN">中文 (Chinese)</option>
                  <option value="hi">हिन्दी (Hindi)</option>
                  <option value="ar">العربية (Arabic)</option>
                  <option value="id">Bahasa Indonesia</option>
                  <option value="ms">Bahasa Melayu</option>
                  <option value="bn">বাংলা (Bengali)</option>
                  <option value="ur">اردو (Urdu)</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Lesson Description</label>
              <textarea
                value={lessonData.description}
                onChange={(e) => setLessonData({ ...lessonData, description: e.target.value })}
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500"
                rows={2}
                placeholder="Brief description of this lesson..."
                data-testid="lesson-description"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Video File *</label>
              <div className="border-2 border-dashed border-green-300 rounded-xl p-6 text-center bg-white">
                <input
                  type="file"
                  id="video-file-input"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="hidden"
                  data-testid="video-file-input"
                />
                <label 
                  htmlFor="video-file-input" 
                  className="cursor-pointer"
                >
                  {lessonData.video_file ? (
                    <div className="text-green-600">
                      <span className="text-4xl mb-2 block">🎬</span>
                      <p className="font-medium">{lessonData.video_file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(lessonData.video_file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                      <p className="text-sm text-green-500 mt-2">Click to change file</p>
                    </div>
                  ) : (
                    <div className="text-gray-500">
                      <span className="text-4xl mb-2 block">📁</span>
                      <p className="font-medium">Click to select video file</p>
                      <p className="text-sm">MP4, MOV, AVI (max 500MB)</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div className="mb-4">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-green-700">Uploading...</span>
                  <span className="text-sm font-medium text-green-700">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={uploading || !selectedCourse || !lessonData.video_file}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="upload-lesson-btn"
            >
              {uploading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Uploading Lesson...
                </span>
              ) : (
                '📤 Upload Lesson'
              )}
            </button>
          </form>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
          <h4 className="font-bold text-blue-800 mb-3 flex items-center">
            <span className="mr-2">ℹ️</span>
            How to Upload English Medium Lessons
          </h4>
          <ol className="list-decimal list-inside space-y-2 text-blue-700 text-sm">
            <li><strong>Select or Create a Course:</strong> Choose an existing course or create a new one for your lessons.</li>
            <li><strong>Prepare Your Video:</strong> Record your lesson in English. Supported formats: MP4, MOV, AVI.</li>
            <li><strong>Add Lesson Details:</strong> Enter a clear title and description for the lesson.</li>
            <li><strong>Upload:</strong> Click &quot;Upload Lesson&quot; and wait for the upload to complete.</li>
            <li><strong>Publish:</strong> Once uploaded, the lesson will be available to enrolled students.</li>
          </ol>
          <div className="mt-4 p-3 bg-blue-100 rounded-lg">
            <p className="text-blue-800 text-sm">
              <strong>💡 Tip:</strong> For best results, use clear audio, good lighting, and keep videos under 500MB. Consider adding captions for accessibility.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonUpload;
