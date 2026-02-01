import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './auth/AuthContext';
import { 
  Award, Search, Users, CheckCircle, Download, 
  FileText, Star, Trophy, Medal, X, ChevronDown
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const CERTIFICATE_TYPES = [
  { id: 'completion', label: 'Completion', icon: CheckCircle, color: 'from-green-500 to-emerald-600', description: 'For completing a course or program' },
  { id: 'achievement', label: 'Achievement', icon: Trophy, color: 'from-yellow-500 to-orange-500', description: 'For outstanding performance' },
  { id: 'participation', label: 'Participation', icon: Star, color: 'from-blue-500 to-cyan-500', description: 'For active participation' },
  { id: 'excellence', label: 'Excellence', icon: Medal, color: 'from-purple-500 to-pink-500', description: 'For exceptional work' }
];

const AGE_GROUPS = ['4-6', '7-9', '10-12', '13-15', '16-18'];

const TeacherCertificates = () => {
  const { token, user } = useAuth();
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [recentCertificates, setRecentCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [ageGroupFilter, setAgeGroupFilter] = useState('');
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [certificateForm, setCertificateForm] = useState({
    type: 'completion',
    courseName: '',
    customMessage: ''
  });
  const [successMessage, setSuccessMessage] = useState(null);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchStudents = async () => {
    try {
      const response = await axios.get(`${API}/admin/students?limit=200`, { headers });
      setStudents(response.data.students || []);
      setFilteredStudents(response.data.students || []);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentCertificates = async () => {
    try {
      const response = await axios.get(`${API}/certificates?limit=10`, { headers });
      setRecentCertificates(response.data.certificates || []);
    } catch (error) {
      console.error('Failed to fetch certificates:', error);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchRecentCertificates();
  }, [token]);

  useEffect(() => {
    let filtered = students;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s => 
        s.full_name?.toLowerCase().includes(term) ||
        s.student_index?.toLowerCase().includes(term) ||
        s.email?.toLowerCase().includes(term)
      );
    }
    
    if (ageGroupFilter) {
      filtered = filtered.filter(s => s.age_group === ageGroupFilter);
    }
    
    setFilteredStudents(filtered);
  }, [searchTerm, ageGroupFilter, students]);

  const toggleStudentSelection = (studentId) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const selectAllFiltered = () => {
    const allIds = filteredStudents.map(s => s.id);
    setSelectedStudents(allIds);
  };

  const clearSelection = () => {
    setSelectedStudents([]);
  };

  const handleIssueCertificates = async () => {
    if (selectedStudents.length === 0 || !certificateForm.courseName) return;
    
    setGenerating(true);
    let successCount = 0;
    let failCount = 0;

    for (const studentId of selectedStudents) {
      try {
        await axios.post(`${API}/certificates/generate`, {
          student_id: studentId,
          type: certificateForm.type,
          course_name: certificateForm.courseName
        }, { headers });
        successCount++;
      } catch (error) {
        console.error(`Failed to generate certificate for ${studentId}:`, error);
        failCount++;
      }
    }

    setGenerating(false);
    setShowIssueModal(false);
    setSelectedStudents([]);
    setCertificateForm({ type: 'completion', courseName: '', customMessage: '' });
    
    setSuccessMessage(`Successfully issued ${successCount} certificate${successCount !== 1 ? 's' : ''}${failCount > 0 ? ` (${failCount} failed)` : ''}`);
    setTimeout(() => setSuccessMessage(null), 5000);
    
    fetchRecentCertificates();
  };

  const downloadCertificate = (certId) => {
    window.open(`${API}/certificates/${certId}/pdf`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white p-6 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold flex items-center">
            <Award className="mr-3" size={32} /> Certificate Issuance
          </h1>
          <p className="text-purple-200 mt-1">Issue certificates to recognize student achievements</p>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="max-w-6xl mx-auto px-6 mt-4">
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-center">
            <CheckCircle className="mr-2" size={20} />
            {successMessage}
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Student Selection Panel */}
          <div className="lg:col-span-2 space-y-4">
            {/* Filters */}
            <div className="bg-white rounded-xl shadow p-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Search by name, ID, or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      data-testid="student-search-input"
                    />
                  </div>
                </div>
                
                <select
                  value={ageGroupFilter}
                  onChange={(e) => setAgeGroupFilter(e.target.value)}
                  className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                  data-testid="age-group-filter"
                >
                  <option value="">All Age Groups</option>
                  {AGE_GROUPS.map(ag => (
                    <option key={ag} value={ag}>{ag} years</option>
                  ))}
                </select>
                
                <div className="flex gap-2">
                  <button
                    onClick={selectAllFiltered}
                    className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-sm font-medium"
                    data-testid="select-all-btn"
                  >
                    Select All ({filteredStudents.length})
                  </button>
                  {selectedStudents.length > 0 && (
                    <button
                      onClick={clearSelection}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                      data-testid="clear-selection-btn"
                    >
                      Clear ({selectedStudents.length})
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Students List */}
            <div className="bg-white rounded-xl shadow">
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="font-bold text-gray-800 flex items-center">
                  <Users className="mr-2 text-purple-600" size={20} />
                  Students ({filteredStudents.length})
                </h2>
                {selectedStudents.length > 0 && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                    {selectedStudents.length} selected
                  </span>
                )}
              </div>
              
              <div className="max-h-[500px] overflow-y-auto">
                {filteredStudents.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Users className="mx-auto mb-3 text-gray-300" size={40} />
                    <p>No students found</p>
                  </div>
                ) : (
                  filteredStudents.map((student) => {
                    const isSelected = selectedStudents.includes(student.id);
                    return (
                      <div
                        key={student.id}
                        onClick={() => toggleStudentSelection(student.id)}
                        className={`flex items-center justify-between p-4 border-b cursor-pointer transition-all ${
                          isSelected ? 'bg-purple-50' : 'hover:bg-gray-50'
                        }`}
                        data-testid={`student-row-${student.id}`}
                      >
                        <div className="flex items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                            isSelected ? 'bg-purple-600' : 'bg-gradient-to-br from-blue-400 to-cyan-500'
                          }`}>
                            {isSelected ? <CheckCircle size={20} /> : student.full_name?.charAt(0)}
                          </div>
                          <div className="ml-3">
                            <div className="font-medium text-gray-800">{student.full_name}</div>
                            <div className="text-sm text-gray-500 font-mono">{student.student_index}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                            {student.age_group} yrs
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Issue Button */}
            {selectedStudents.length > 0 && (
              <button
                onClick={() => setShowIssueModal(true)}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold text-lg hover:from-purple-700 hover:to-indigo-700 shadow-lg flex items-center justify-center"
                data-testid="issue-certificates-btn"
              >
                <Award className="mr-2" size={24} />
                Issue Certificates to {selectedStudents.length} Student{selectedStudents.length !== 1 ? 's' : ''}
              </button>
            )}
          </div>

          {/* Recent Certificates Panel */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow">
              <div className="p-4 border-b">
                <h2 className="font-bold text-gray-800 flex items-center">
                  <FileText className="mr-2 text-green-600" size={20} />
                  Recent Certificates
                </h2>
              </div>
              
              <div className="max-h-[400px] overflow-y-auto">
                {recentCertificates.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <Award className="mx-auto mb-3 text-gray-300" size={32} />
                    <p className="text-sm">No certificates issued yet</p>
                  </div>
                ) : (
                  recentCertificates.map((cert) => (
                    <div key={cert.id} className="p-4 border-b hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono text-purple-600">{cert.certificate_number}</span>
                        <span className="text-xs text-gray-500">{cert.issued_date}</span>
                      </div>
                      <div className="font-medium text-gray-800 text-sm">{cert.student_name}</div>
                      <div className="text-xs text-gray-500 mt-1">{cert.course_name}</div>
                      <button
                        onClick={() => downloadCertificate(cert.id)}
                        className="mt-2 flex items-center text-xs text-blue-600 hover:text-blue-800"
                        data-testid={`download-cert-${cert.id}`}
                      >
                        <Download size={14} className="mr-1" /> Download PDF
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow p-6 text-white">
              <h3 className="font-bold mb-4 flex items-center">
                <Trophy className="mr-2" size={20} /> Quick Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-purple-200">Total Students</span>
                  <span className="font-bold">{students.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-200">Certificates Issued</span>
                  <span className="font-bold">{recentCertificates.length}+</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-200">Selected Now</span>
                  <span className="font-bold">{selectedStudents.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Issue Certificate Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">Issue Certificates</h3>
              <button 
                onClick={() => setShowIssueModal(false)} 
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Certificate Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Certificate Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {CERTIFICATE_TYPES.map((type) => {
                    const Icon = type.icon;
                    const isSelected = certificateForm.type === type.id;
                    return (
                      <button
                        key={type.id}
                        onClick={() => setCertificateForm({ ...certificateForm, type: type.id })}
                        className={`p-3 rounded-lg border-2 transition-all text-left ${
                          isSelected 
                            ? 'border-purple-500 bg-purple-50' 
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                        data-testid={`cert-type-${type.id}`}
                      >
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${type.color} flex items-center justify-center text-white mb-2`}>
                          <Icon size={16} />
                        </div>
                        <div className="font-medium text-gray-800">{type.label}</div>
                        <div className="text-xs text-gray-500">{type.description}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Course Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Course / Program Name *</label>
                <input
                  type="text"
                  value={certificateForm.courseName}
                  onChange={(e) => setCertificateForm({ ...certificateForm, courseName: e.target.value })}
                  placeholder="e.g., AI Fundamentals for Young Minds"
                  className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  data-testid="course-name-input"
                />
              </div>

              {/* Preview */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-2">Preview</div>
                <div className="text-center">
                  <Award className="mx-auto text-purple-600 mb-2" size={32} />
                  <div className="font-bold text-gray-800">Certificate of {certificateForm.type.charAt(0).toUpperCase() + certificateForm.type.slice(1)}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {certificateForm.courseName || 'Course Name'}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Will be issued to {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowIssueModal(false)}
                  className="flex-1 px-4 py-3 border rounded-lg hover:bg-gray-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleIssueCertificates}
                  disabled={!certificateForm.courseName || generating}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  data-testid="confirm-issue-btn"
                >
                  {generating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Award className="mr-2" size={18} />
                      Issue Certificates
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherCertificates;
