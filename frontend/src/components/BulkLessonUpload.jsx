import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Upload, X, CheckCircle, AlertCircle, FileVideo, Loader2, Plus, Trash2 } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const BulkLessonUpload = ({ token, onSuccess }) => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('en');  // Default language for bulk upload
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState([]);
  const [message, setMessage] = useState(null);
  const fileInputRef = useRef(null);

  // Supported languages
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'si', name: 'සිංහල (Sinhala)' },
    { code: 'ta', name: 'தமிழ் (Tamil)' },
    { code: 'zh-CN', name: '中文 (Chinese)' },
    { code: 'hi', name: 'हिन्दी (Hindi)' },
    { code: 'ar', name: 'العربية (Arabic)' },
    { code: 'id', name: 'Bahasa Indonesia' },
    { code: 'ms', name: 'Bahasa Melayu' },
    { code: 'bn', name: 'বাংলা (Bengali)' },
    { code: 'ur', name: 'اردو (Urdu)' }
  ];

  const loadCourses = async () => {
    try {
      const response = await axios.get(`${API}/courses?published_only=false`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourses(response.data || []);
    } catch (error) {
      console.error('Failed to load courses:', error);
    }
  };

  useEffect(() => {
    loadCourses();
  }, [token]);

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const videoFiles = selectedFiles.filter(file => 
      file.type.startsWith('video/') || 
      ['mp4', 'webm', 'mov', 'avi'].some(ext => file.name.toLowerCase().endsWith(ext))
    );

    const newFiles = videoFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
      description: '',
      language: selectedLanguage,  // Use selected language
      status: 'pending', // pending, uploading, success, error
      progress: 0,
      error: null
    }));

    setFiles(prev => [...prev, ...newFiles]);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const updateFileData = (id, updates) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const removeFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const uploadSingleFile = async (fileData) => {
    updateFileData(fileData.id, { status: 'uploading', progress: 0 });

    try {
      const formData = new FormData();
      formData.append('video', fileData.file);
      formData.append('title', fileData.title);
      formData.append('description', fileData.description);
      formData.append('language', fileData.language || selectedLanguage);  // Send language

      await axios.post(
        `${API}/courses/${selectedCourse}/videos`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            updateFileData(fileData.id, { progress });
          }
        }
      );

      updateFileData(fileData.id, { status: 'success', progress: 100 });
      return { success: true, id: fileData.id };
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Upload failed';
      updateFileData(fileData.id, { status: 'error', error: errorMsg });
      return { success: false, id: fileData.id, error: errorMsg };
    }
  };

  const uploadAllFiles = async () => {
    if (!selectedCourse) {
      setMessage({ type: 'error', text: 'Please select a course first' });
      return;
    }

    if (files.length === 0) {
      setMessage({ type: 'error', text: 'Please add at least one video file' });
      return;
    }

    setUploading(true);
    setMessage(null);
    setUploadResults([]);

    const pendingFiles = files.filter(f => f.status === 'pending' || f.status === 'error');
    const results = [];

    for (const fileData of pendingFiles) {
      const result = await uploadSingleFile(fileData);
      results.push(result);
    }

    setUploadResults(results);
    setUploading(false);

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    if (failCount === 0) {
      setMessage({ type: 'success', text: `All ${successCount} lessons uploaded successfully!` });
      if (onSuccess) onSuccess();
    } else if (successCount > 0) {
      setMessage({ type: 'warning', text: `${successCount} uploaded, ${failCount} failed. You can retry failed uploads.` });
    } else {
      setMessage({ type: 'error', text: `All uploads failed. Please check your files and try again.` });
    }
  };

  const retryFailed = () => {
    setFiles(prev => prev.map(f => f.status === 'error' ? { ...f, status: 'pending', error: null } : f));
  };

  const clearCompleted = () => {
    setFiles(prev => prev.filter(f => f.status !== 'success'));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'uploading':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <FileVideo className="w-5 h-5 text-slate-400" />;
    }
  };

  const pendingCount = files.filter(f => f.status === 'pending').length;
  const successCount = files.filter(f => f.status === 'success').length;
  const errorCount = files.filter(f => f.status === 'error').length;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
          <Upload className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Bulk Lesson Upload</h2>
          <p className="text-sm text-slate-500">Upload multiple video lessons at once</p>
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-xl ${
          message.type === 'success' ? 'bg-green-50 text-green-700' :
          message.type === 'warning' ? 'bg-yellow-50 text-yellow-700' :
          'bg-red-50 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* Course Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Select Course *
        </label>
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none"
          disabled={uploading}
          data-testid="bulk-course-select"
        >
          <option value="">-- Select a course --</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title} ({course.learning_level})
            </option>
          ))}
        </select>
      </div>

      {/* Language Selection for Bulk Upload */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Video Language * <span className="text-xs text-slate-400">(applies to all videos in this batch)</span>
        </label>
        <select
          value={selectedLanguage}
          onChange={(e) => {
            setSelectedLanguage(e.target.value);
            // Update language for all pending files
            setFiles(prev => prev.map(f => f.status === 'pending' ? { ...f, language: e.target.value } : f));
          }}
          className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none"
          disabled={uploading}
          data-testid="bulk-language-select"
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
      </div>

      {/* File Drop Zone */}
      <div
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          uploading 
            ? 'border-slate-200 bg-slate-50 cursor-not-allowed' 
            : 'border-blue-300 hover:border-blue-500 hover:bg-blue-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="video/*,.mp4,.webm,.mov,.avi"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
          data-testid="bulk-file-input"
        />
        <Upload className={`w-12 h-12 mx-auto mb-3 ${uploading ? 'text-slate-300' : 'text-blue-400'}`} />
        <p className="text-slate-600 font-medium">
          {uploading ? 'Upload in progress...' : 'Click or drag videos here'}
        </p>
        <p className="text-sm text-slate-400 mt-1">
          Supports MP4, WebM, MOV, AVI
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800">
              Files ({files.length})
              {successCount > 0 && <span className="text-green-600 ml-2">✓ {successCount}</span>}
              {errorCount > 0 && <span className="text-red-600 ml-2">✗ {errorCount}</span>}
            </h3>
            <div className="flex gap-2">
              {errorCount > 0 && (
                <button
                  onClick={retryFailed}
                  disabled={uploading}
                  className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 disabled:opacity-50"
                >
                  Retry Failed
                </button>
              )}
              {successCount > 0 && (
                <button
                  onClick={clearCompleted}
                  disabled={uploading}
                  className="px-3 py-1 text-sm bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 disabled:opacity-50"
                >
                  Clear Completed
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {files.map((fileData) => (
              <div
                key={fileData.id}
                className={`p-4 rounded-xl border-2 transition-all ${
                  fileData.status === 'success' ? 'border-green-200 bg-green-50' :
                  fileData.status === 'error' ? 'border-red-200 bg-red-50' :
                  fileData.status === 'uploading' ? 'border-blue-200 bg-blue-50' :
                  'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-start gap-3">
                  {getStatusIcon(fileData.status)}
                  
                  <div className="flex-1 min-w-0">
                    {/* Editable title */}
                    <input
                      type="text"
                      value={fileData.title}
                      onChange={(e) => updateFileData(fileData.id, { title: e.target.value })}
                      disabled={fileData.status === 'uploading' || fileData.status === 'success'}
                      className="w-full font-medium text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none disabled:hover:border-transparent"
                      placeholder="Lesson Title"
                    />
                    
                    {/* File info */}
                    <p className="text-xs text-slate-500 mt-1">
                      {fileData.file.name} • {(fileData.file.size / 1024 / 1024).toFixed(1)} MB
                    </p>

                    {/* Description input */}
                    <input
                      type="text"
                      value={fileData.description}
                      onChange={(e) => updateFileData(fileData.id, { description: e.target.value })}
                      disabled={fileData.status === 'uploading' || fileData.status === 'success'}
                      className="w-full text-sm text-slate-600 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none mt-2 disabled:hover:border-transparent"
                      placeholder="Add description (optional)"
                    />

                    {/* Progress bar */}
                    {fileData.status === 'uploading' && (
                      <div className="mt-2">
                        <div className="w-full bg-blue-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${fileData.progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-blue-600 mt-1">{fileData.progress}% uploaded</p>
                      </div>
                    )}

                    {/* Error message */}
                    {fileData.error && (
                      <p className="text-xs text-red-600 mt-2">{fileData.error}</p>
                    )}
                  </div>

                  {/* Remove button */}
                  {fileData.status !== 'uploading' && (
                    <button
                      onClick={() => removeFile(fileData.id)}
                      className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-100 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Button */}
      {files.length > 0 && (
        <button
          onClick={uploadAllFiles}
          disabled={uploading || !selectedCourse || pendingCount === 0}
          className="w-full mt-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-bold text-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          data-testid="bulk-upload-btn"
        >
          {uploading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Uploading {files.filter(f => f.status === 'uploading').length} of {pendingCount}...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              Upload {pendingCount} Lesson{pendingCount !== 1 ? 's' : ''}
            </>
          )}
        </button>
      )}

      {/* Tips */}
      <div className="mt-6 p-4 bg-slate-50 rounded-xl">
        <h4 className="font-medium text-slate-700 mb-2">💡 Tips for bulk upload:</h4>
        <ul className="text-sm text-slate-500 space-y-1">
          <li>• Name your files clearly - they will become lesson titles</li>
          <li>• Supported formats: MP4, WebM, MOV, AVI</li>
          <li>• You can edit titles before uploading</li>
          <li>• Failed uploads can be retried without losing progress</li>
        </ul>
      </div>
    </div>
  );
};

export default BulkLessonUpload;
