import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, API } from '../AuthContext';
import axios from 'axios';
import { BookOpen, Clock, Award, TrendingUp, LogOut, FileText } from 'lucide-react';

const StudentDashboard = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Get published exams for student's grade
      const examsRes = await axios.get(`${API}/exams?grade=${user.grade}&status=published`);
      setExams(examsRes.data.exams || []);
      
      // Get student's past attempts (you can add this endpoint)
      // For now, using mock data
      setAttempts([]);
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      setLoading(false);
    }
  };

  const getGradeDisplay = (grade) => {
    const gradeMap = {
      'grade_2': 'Grade 2',
      'grade_3': 'Grade 3',
      'grade_4': 'Grade 4',
      'grade_5': 'Grade 5'
    };
    return gradeMap[grade] || grade;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{background: '#FFFBF0'}}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{background: 'linear-gradient(135deg, #FFF9E6, #FFFACD)'}}>
      {/* Header */}
      <div className="bg-white shadow-md border-b-4" style={{borderColor: '#F59E0B'}}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-extrabold" style={{color: '#92400E', fontFamily: 'Nunito'}}>Student Dashboard</h1>
              <p className="text-gray-600">Welcome, {user.full_name}!</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="px-4 py-2 bg-yellow-100 rounded-xl border-2" style={{borderColor: '#F59E0B'}}>
                <span className="font-bold" style={{color: '#92400E'}}>{getGradeDisplay(user.grade)}</span>
              </div>
              <button
                onClick={logout}
                className="px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200"
              >
                <LogOut className="inline w-4 h-4 mr-1" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border-3" style={{borderColor: '#FCD34D'}}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <div className="text-3xl font-extrabold" style={{color: '#92400E'}}>{exams.length}</div>
                <div className="text-sm font-semibold text-gray-600">Available Exams</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border-3" style={{borderColor: '#10B981'}}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Award className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-3xl font-extrabold" style={{color: '#059669'}}>{attempts.length}</div>
                <div className="text-sm font-semibold text-gray-600">Exams Completed</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border-3" style={{borderColor: '#3B82F6'}}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-3xl font-extrabold" style={{color: '#2563EB'}}>-</div>
                <div className="text-sm font-semibold text-gray-600">Avg Performance</div>
              </div>
            </div>
          </div>
        </div>

        {/* Available Exams */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border-3" style={{borderColor: '#F59E0B'}}>
          <h2 className="text-2xl font-extrabold mb-6" style={{color: '#92400E', fontFamily: 'Nunito'}}>
            <BookOpen className="inline w-6 h-6 mr-2" />
            Available Monthly Exams
          </h2>

          {exams.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📚</div>
              <p className="text-lg text-gray-600">No exams available yet.</p>
              <p className="text-sm text-gray-500 mt-2">Check back later or contact your teacher.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {exams.map(exam => (
                <div key={exam.id} className="bg-gradient-to-br from-yellow-50 to-white rounded-2xl p-6 border-3 border-yellow-200 shadow-md hover:shadow-xl transition-all hover:scale-105">
                  <h3 className="text-xl font-extrabold mb-2" style={{color: '#92400E'}}>{exam.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">Month: {exam.month}</p>
                  
                  <div className="flex gap-4 text-sm text-gray-700 mb-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-yellow-600" />
                      {exam.duration_minutes} mins
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-yellow-600" />
                      {exam.paper1_questions?.length || 60} questions
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/exam/${exam.id}`)}
                    className="w-full py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg"
                  >
                    Start Exam →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
