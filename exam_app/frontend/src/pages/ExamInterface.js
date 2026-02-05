import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth, API } from '../AuthContext';
import axios from 'axios';
import { Clock, Flag, CheckCircle, AlertCircle } from 'lucide-react';

const ExamInterface = () => {
  const { examId } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  
  const [exam, setExam] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(3600); // 60 minutes in seconds
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [flagged, setFlagged] = useState(new Set());

  useEffect(() => {
    startOrResumeExam();
  }, []);

  // Timer countdown
  useEffect(() => {
    if (!exam || result) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmit(); // Auto-submit when time runs out
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [exam, result]);

  const startOrResumeExam = async () => {
    try {
      const response = await axios.post(
        `${API}/exams/${examId}/start`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setExam(response.data.exam);
      setAttempt(response.data.attempt);
      setAnswers(response.data.attempt.answers || {});
      
      if (response.data.resume) {
        // Calculate remaining time if resuming
        const elapsed = (new Date() - new Date(response.data.attempt.started_at)) / 1000;
        const remaining = Math.max(0, response.data.exam.duration_minutes * 60 - elapsed);
        setTimeLeft(Math.floor(remaining));
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to start exam:', error);
      alert('Failed to load exam. Please try again.');
      navigate('/dashboard');
    }
  };

  const handleAnswer = async (questionId, optionId) => {
    const newAnswers = { ...answers, [questionId]: optionId };
    setAnswers(newAnswers);

    // Auto-save
    try {
      await axios.post(
        `${API}/attempts/${attempt.id}/save`,
        { question_id: questionId, selected_option: optionId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('Failed to save answer:', error);
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;
    
    const unanswered = exam.questions.filter(q => !answers[q.id]).length;
    
    if (unanswered > 0) {
      const confirm = window.confirm(`You have ${unanswered} unanswered questions. Submit anyway?`);
      if (!confirm) return;
    }

    setSubmitting(true);
    
    try {
      const response = await axios.post(
        `${API}/attempts/${attempt.id}/submit`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setResult(response.data);
    } catch (error) {
      console.error('Failed to submit:', error);
      alert('Submission failed. Please try again.');
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleFlag = (questionId) => {
    const newFlagged = new Set(flagged);
    if (newFlagged.has(questionId)) {
      newFlagged.delete(questionId);
    } else {
      newFlagged.add(questionId);
    }
    setFlagged(newFlagged);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{background: '#FFFBF0'}}>
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-yellow-800">Loading Exam...</p>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="min-h-screen p-6" style={{background: 'linear-gradient(135deg, #FFF9E6, #FFFACD)'}}>
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-10 border-4" style={{borderColor: '#10B981'}}>
            <div className="text-center mb-8">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h1 className="text-4xl font-extrabold mb-2" style={{color: '#059669', fontFamily: 'Nunito'}}>Exam Submitted!</h1>
              <p className="text-lg text-gray-600">Great job completing the exam!</p>
            </div>

            {/* Score Card */}
            <div className="bg-gradient-to-r from-yellow-50 to-green-50 rounded-2xl p-8 mb-6 border-3" style={{borderColor: '#FCD34D'}}>
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-5xl font-extrabold mb-2" style={{color: '#059669', fontFamily: 'Nunito'}}>{result.score}</div>
                  <div className="text-sm font-semibold text-gray-600">Your Score</div>
                </div>
                <div>
                  <div className="text-5xl font-extrabold mb-2" style={{color: '#92400E', fontFamily: 'Nunito'}}>{result.total}</div>
                  <div className="text-sm font-semibold text-gray-600">Total Marks</div>
                </div>
                <div>
                  <div className="text-5xl font-extrabold mb-2" style={{color: '#F59E0B', fontFamily: 'Nunito'}}>{result.percentage}%</div>
                  <div className="text-sm font-semibold text-gray-600">Percentage</div>
                </div>
              </div>
            </div>

            {/* Skill Breakdown */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold mb-4" style={{color: '#92400E'}}>Performance by Skill</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(result.skill_percentages || {}).map(([skill, percentage]) => (
                  <div key={skill} className="bg-white border-2 border-yellow-200 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-gray-700 capitalize">
                        {skill.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xl font-bold" style={{color: percentage >= 70 ? '#059669' : percentage >= 50 ? '#F59E0B' : '#DC2626'}}>
                        {percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full" 
                        style={{
                          width: `${percentage}%`,
                          background: percentage >= 70 ? '#10B981' : percentage >= 50 ? '#F59E0B' : '#EF4444'
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl"
              style={{fontSize: '18px'}}
            >
              Back to Dashboard →
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = exam.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / exam.questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen" style={{background: '#FFFBF0'}}>
      {/* Header with Timer */}
      <div className="bg-white shadow-md border-b-4" style={{borderColor: '#F59E0B'}}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold" style={{color: '#92400E'}}>{exam.title}</h1>
              <p className="text-sm text-gray-600">Question {currentQuestionIndex + 1} of {exam.questions.length}</p>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-sm text-gray-600">Answered</div>
                <div className="text-2xl font-bold" style={{color: '#059669'}}>{answeredCount}/{exam.questions.length}</div>
              </div>
              
              <div className="text-center px-6 py-3 bg-yellow-50 rounded-xl border-3" style={{borderColor: timeLeft < 300 ? '#EF4444' : '#F59E0B'}}>
                <Clock className="inline w-5 h-5 mb-1" style={{color: timeLeft < 300 ? '#DC2626' : '#F59E0B'}} />
                <div className="text-3xl font-extrabold" style={{color: timeLeft < 300 ? '#DC2626' : '#92400E', fontFamily: 'monospace'}}>
                  {formatTime(timeLeft)}
                </div>
                <div className="text-xs" style={{color: '#78350F'}}>Time Remaining</div>
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="h-2 rounded-full bg-gradient-to-r from-yellow-400 to-green-500" style={{width: `${progress}%`}}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Question Area */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-3xl shadow-xl p-8 border-3 mb-6" style={{borderColor: '#FCD34D'}}>
          {/* Question Number & Flag */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center font-extrabold text-xl" style={{color: '#92400E'}}>
                {currentQuestion.question_number}
              </div>
              <span className="text-sm font-semibold text-gray-600 capitalize">
                {currentQuestion.skill_area.replace(/_/g, ' ')}
              </span>
            </div>
            <button
              onClick={() => toggleFlag(currentQuestion.id)}
              className={`px-4 py-2 rounded-xl font-semibold transition-all ${flagged.has(currentQuestion.id) ? 'bg-red-100 text-red-700 border-2 border-red-300' : 'bg-gray-100 text-gray-600 border-2 border-gray-300'}`}
            >
              <Flag className="inline w-4 h-4 mr-1" />
              {flagged.has(currentQuestion.id) ? 'Flagged' : 'Flag for Review'}
            </button>
          </div>

          {/* Question Text */}
          <div className="mb-8">
            <p className="text-2xl font-bold leading-relaxed" style={{color: '#1F2937'}}>
              {currentQuestion.question_text}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-4">
            {currentQuestion.options.map((option, index) => {
              const isSelected = answers[currentQuestion.id] === option.option_id;
              const letter = String.fromCharCode(65 + index); // A, B, C, D, E
              
              return (
                <button
                  key={option.option_id}
                  onClick={() => handleAnswer(currentQuestion.id, option.option_id)}
                  className={`w-full p-5 rounded-2xl border-3 text-left transition-all hover:scale-102 ${
                    isSelected 
                      ? 'bg-yellow-50 border-yellow-500 shadow-lg' 
                      : 'bg-white border-gray-300 hover:border-yellow-400'
                  }`}
                  style={{fontFamily: 'Inter, sans-serif'}}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-lg ${
                      isSelected ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {letter}
                    </div>
                    <span className={`text-lg font-medium ${isSelected ? 'text-gray-900 font-semibold' : 'text-gray-700'}`}>
                      {option.text}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center gap-4">
          <button
            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
            disabled={currentQuestionIndex === 0}
            className="px-8 py-4 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Jump to Question:</p>
            <div className="flex gap-2 flex-wrap justify-center">
              {exam.questions.slice(0, 10).map((q, idx) => {
                const isAnswered = !!answers[q.id];
                const isCurrent = idx === currentQuestionIndex;
                const isFlagged = flagged.has(q.id);
                
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`w-10 h-10 rounded-lg font-bold text-sm ${
                      isCurrent ? 'bg-yellow-500 text-white' :
                      isFlagged ? 'bg-red-100 text-red-700 border-2 border-red-300' :
                      isAnswered ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
              {exam.questions.length > 10 && <span className="text-gray-500">...</span>}
            </div>
          </div>

          <button
            onClick={() => setCurrentQuestionIndex(Math.min(exam.questions.length - 1, currentQuestionIndex + 1))}
            disabled={currentQuestionIndex === exam.questions.length - 1}
            className="px-8 py-4 bg-yellow-500 text-white font-bold rounded-xl hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>

        {/* Submit Button */}
        <div className="mt-8 text-center">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-16 py-5 bg-gradient-to-r from-green-500 to-green-600 text-white font-extrabold rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 disabled:opacity-50 text-xl"
            style={{fontFamily: 'Nunito'}}
          >
            {submitting ? 'Submitting...' : 'Submit Exam ✓'}
          </button>
          <p className="text-sm text-gray-600 mt-3">
            {answeredCount} of {exam.questions.length} questions answered
            {flagged.size > 0 && ` | ${flagged.size} flagged for review`}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExamInterface;
