import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Download, Plus, Trash2, BookOpen, Calendar, Target, Loader2 } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const CurriculumGenerator = ({ token }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState(null);
  
  const [formData, setFormData] = useState({
    course_id: '',
    title: 'TEC Curriculum',
    include_lessons: true,
    include_schedule: true,
    include_objectives: true,
    custom_sections: [],
    language: 'en'
  });

  const [newSection, setNewSection] = useState({ title: '', content: '' });

  useEffect(() => {
    loadCourses();
  }, [token]);

  const loadCourses = async () => {
    try {
      const response = await axios.get(`${API}/curriculum/courses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourses(response.data.courses || []);
    } catch (error) {
      console.error('Failed to load courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const addCustomSection = () => {
    if (newSection.title && newSection.content) {
      setFormData({
        ...formData,
        custom_sections: [...formData.custom_sections, { ...newSection }]
      });
      setNewSection({ title: '', content: '' });
    }
  };

  const removeCustomSection = (index) => {
    const updated = formData.custom_sections.filter((_, i) => i !== index);
    setFormData({ ...formData, custom_sections: updated });
  };

  const generatePDF = async () => {
    setGenerating(true);
    setMessage(null);

    try {
      const response = await axios.post(
        `${API}/curriculum/generate-pdf`,
        formData,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          responseType: 'blob'
        }
      );

      // Download the PDF
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `TEC_Curriculum_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      setMessage({ type: 'success', text: 'Curriculum PDF generated and downloaded!' });
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      setMessage({ type: 'error', text: 'Failed to generate PDF. Please try again.' });
    } finally {
      setGenerating(false);
    }
  };

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'si', name: 'සිංහල (Sinhala)' },
    { code: 'ta', name: 'தமிழ் (Tamil)' },
    { code: 'zh-CN', name: '中文 (Chinese)' },
    { code: 'hi', name: 'हिंदी (Hindi)' },
    { code: 'ar', name: 'العربية (Arabic)' },
    { code: 'id', name: 'Bahasa Indonesia' },
    { code: 'ms', name: 'Bahasa Melayu' },
    { code: 'bn', name: 'বাংলা (Bengali)' },
    { code: 'ur', name: 'اردو (Urdu)' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
          <FileText className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Curriculum PDF Generator</h2>
          <p className="text-sm text-slate-500">Create professional curriculum PDFs for parents</p>
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-xl ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        {/* PDF Title */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            PDF Title
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:outline-none"
            placeholder="e.g., AI Course Curriculum for Kids"
            data-testid="curriculum-title-input"
          />
        </div>

        {/* Course Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <BookOpen className="w-4 h-4 inline mr-1" />
            Select Course (Optional)
          </label>
          <select
            value={formData.course_id}
            onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
            className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:outline-none"
            data-testid="curriculum-course-select"
          >
            <option value="">-- No specific course (General curriculum) --</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title} ({course.learning_level} - {course.age_group})
              </option>
            ))}
          </select>
        </div>

        {/* Language Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Language
          </label>
          <select
            value={formData.language}
            onChange={(e) => setFormData({ ...formData, language: e.target.value })}
            className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:outline-none"
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>{lang.name}</option>
            ))}
          </select>
        </div>

        {/* Include Options */}
        <div className="grid grid-cols-3 gap-4">
          <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100">
            <input
              type="checkbox"
              checked={formData.include_lessons}
              onChange={(e) => setFormData({ ...formData, include_lessons: e.target.checked })}
              className="w-5 h-5 rounded text-purple-600"
            />
            <span className="text-sm font-medium text-slate-700">📹 Include Lessons</span>
          </label>

          <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100">
            <input
              type="checkbox"
              checked={formData.include_schedule}
              onChange={(e) => setFormData({ ...formData, include_schedule: e.target.checked })}
              className="w-5 h-5 rounded text-purple-600"
            />
            <span className="text-sm font-medium text-slate-700">📅 Include Schedule</span>
          </label>

          <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100">
            <input
              type="checkbox"
              checked={formData.include_objectives}
              onChange={(e) => setFormData({ ...formData, include_objectives: e.target.checked })}
              className="w-5 h-5 rounded text-purple-600"
            />
            <span className="text-sm font-medium text-slate-700">🎯 Include Objectives</span>
          </label>
        </div>

        {/* Custom Sections */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <Plus className="w-4 h-4 inline mr-1" />
            Custom Sections
          </label>
          
          {/* Existing custom sections */}
          {formData.custom_sections.length > 0 && (
            <div className="space-y-2 mb-4">
              {formData.custom_sections.map((section, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-purple-50 rounded-xl">
                  <div className="flex-1">
                    <p className="font-medium text-purple-700">{section.title}</p>
                    <p className="text-sm text-purple-600 truncate">{section.content}</p>
                  </div>
                  <button
                    onClick={() => removeCustomSection(index)}
                    className="p-2 text-red-500 hover:bg-red-100 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add new section form */}
          <div className="p-4 bg-slate-50 rounded-xl space-y-3">
            <input
              type="text"
              value={newSection.title}
              onChange={(e) => setNewSection({ ...newSection, title: e.target.value })}
              placeholder="Section Title (e.g., Weekly Schedule)"
              className="w-full p-2 border border-slate-200 rounded-lg focus:border-purple-500 focus:outline-none"
            />
            <textarea
              value={newSection.content}
              onChange={(e) => setNewSection({ ...newSection, content: e.target.value })}
              placeholder="Section Content..."
              rows="2"
              className="w-full p-2 border border-slate-200 rounded-lg focus:border-purple-500 focus:outline-none"
            />
            <button
              onClick={addCustomSection}
              disabled={!newSection.title || !newSection.content}
              className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-medium hover:bg-purple-200 disabled:opacity-50"
            >
              <Plus className="w-4 h-4 inline mr-1" />
              Add Section
            </button>
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={generatePDF}
          disabled={generating || !formData.title}
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          data-testid="generate-curriculum-btn"
        >
          {generating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating PDF...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Generate & Download PDF
            </>
          )}
        </button>
      </div>

      {/* Pre-built Parent Guides */}
      <div className="mt-8 pt-6 border-t border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4">📚 Pre-built Parent Guides</h3>
        <p className="text-sm text-slate-500 mb-4">Download ready-made parent guides for each age group</p>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { age: 'foundation', label: 'Ages 5-8', emoji: '🌱' },
            { age: 'explorers', label: 'Ages 7-9', emoji: '🔍' },
            { age: 'smart', label: 'Ages 10-12', emoji: '🧠' },
            { age: 'teens', label: 'Ages 13-15', emoji: '🚀' },
            { age: 'leaders', label: 'Ages 16-18', emoji: '👑' }
          ].map((guide) => (
            <a
              key={guide.age}
              href={`${API}/parent-guides/${guide.age}/${formData.language}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl text-center hover:shadow-md transition-all"
            >
              <span className="text-2xl block mb-1">{guide.emoji}</span>
              <span className="text-xs font-medium text-slate-700">{guide.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CurriculumGenerator;
