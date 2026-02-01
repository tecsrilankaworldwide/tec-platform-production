import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, CheckCircle, XCircle, HelpCircle, ChevronRight, Trophy, BookOpen } from 'lucide-react';
import { triggerConfettiBurst, triggerStars, triggerFireworks, triggerSideCannons } from './ConfettiEffects';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const QuizPage = ({ token, user }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startTime, setStartTime] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    loadQuizzes();
  }, [token]);

  // Trigger celebration effects when quiz result comes in
  useEffect(() => {
    if (quizResult) {
      if (quizResult.percentage === 100) {
        // Perfect score - massive celebration!
        triggerStars();
        setTimeout(() => triggerFireworks(), 500);
        setTimeout(() => triggerSideCannons(), 1000);
      } else if (quizResult.passed) {
        // Passed - regular celebration
        triggerConfettiBurst({ particleCount: 100, spread: 90 });
      }
    }
  }, [quizResult]);

  const loadQuizzes = async () => {
    try {
      const response = await axios.get(`${API}/quizzes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuizzes(response.data.quizzes || []);
    } catch (error) {
      console.error('Failed to load quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = async (quiz) => {
    try {
      const response = await axios.post(`${API}/quizzes/${quiz.id}/start`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAttemptId(response.data.attempt_id);
      setSelectedQuiz(quiz);
      setCurrentQuestion(0);
      setAnswers({});
      setQuizResult(null);
      setStartTime(Date.now());
    } catch (error) {
      console.error('Failed to start quiz:', error);
    }
  };

  const handleAnswer = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const submitQuiz = async () => {
    try {
      const timeTaken = Math.floor((Date.now() - startTime) / 1000);
      const response = await axios.post(`${API}/quizzes/${selectedQuiz.id}/submit`, {
        attempt_id: attemptId,
        answers: answers,
        time_taken_seconds: timeTaken
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuizResult(response.data);
    } catch (error) {
      console.error('Failed to submit quiz:', error);
    }
  };

  const resetQuiz = () => {
    setSelectedQuiz(null);
    setCurrentQuestion(0);
    setAnswers({});
    setQuizResult(null);
    setAttemptId(null);
    setStartTime(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse text-xl text-slate-600">Loading quizzes...</div>
      </div>
    );
  }

  // Quiz Results View
  if (quizResult) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            {quizResult.passed ? (
              <>
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-3xl font-bold text-green-600 mb-2">Congratulations!</h2>
                <p className="text-slate-600 mb-6">You passed the quiz!</p>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">📚</div>
                <h2 className="text-3xl font-bold text-orange-600 mb-2">Keep Learning!</h2>
                <p className="text-slate-600 mb-6">You need a bit more practice</p>
              </>
            )}

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-3xl font-bold text-purple-600">{Math.round(quizResult.percentage)}%</p>
                <p className="text-sm text-slate-500">Score</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-3xl font-bold text-blue-600">{quizResult.score}/{quizResult.total_points}</p>
                <p className="text-sm text-slate-500">Points</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-3xl font-bold text-green-600">{quizResult.passing_score}%</p>
                <p className="text-sm text-slate-500">To Pass</p>
              </div>
            </div>

            {/* Question Results */}
            <div className="text-left mb-6">
              <h3 className="font-bold text-slate-800 mb-4">Question Results</h3>
              <div className="space-y-3">
                {quizResult.results?.map((result, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border-2 ${
                      result.is_correct
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {result.is_correct ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      <span className="font-medium text-slate-800">Question {idx + 1}</span>
                      <span className={`ml-auto text-sm ${result.is_correct ? 'text-green-600' : 'text-red-600'}`}>
                        {result.points_earned}/{result.max_points} pts
                      </span>
                    </div>
                    {!result.is_correct && result.explanation && (
                      <p className="text-sm text-slate-600 mt-2">
                        <span className="font-medium">Explanation:</span> {result.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={resetQuiz}
              className="w-full py-4 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-full font-bold hover:shadow-lg transition-all"
              data-testid="back-to-quizzes-btn"
            >
              Back to Quizzes
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active Quiz View
  if (selectedQuiz) {
    const questions = selectedQuiz.questions || [];
    const question = questions[currentQuestion];
    const totalQuestions = questions.length;
    const progress = ((currentQuestion + 1) / totalQuestions) * 100;

    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4">
        <div className="max-w-2xl mx-auto">
          {/* Quiz Header */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800">{selectedQuiz.title}</h2>
              <button
                onClick={resetQuiz}
                className="text-slate-500 hover:text-slate-700"
              >
                Exit Quiz
              </button>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <span className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                Question {currentQuestion + 1} of {totalQuestions}
              </span>
              {selectedQuiz.time_limit_minutes && (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {selectedQuiz.time_limit_minutes} min limit
                </span>
              )}
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 mt-4">
              <div
                className="h-full bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="mb-6">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-4 ${
                question?.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                question?.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {question?.difficulty || 'medium'}
              </span>
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                {question?.question_text}
              </h3>
              {question?.hint && (
                <p className="text-sm text-slate-500 flex items-center gap-1">
                  <HelpCircle className="w-4 h-4" />
                  Hint: {question.hint}
                </p>
              )}
            </div>

            {/* Answer Options */}
            <div className="space-y-3 mb-8">
              {question?.question_type === 'multiple_choice' && question.options?.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswer(question.id, option)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    answers[question.id] === option
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                  data-testid={`option-${idx}`}
                >
                  <span className={`font-medium ${answers[question.id] === option ? 'text-purple-700' : 'text-slate-700'}`}>
                    {option}
                  </span>
                </button>
              ))}

              {question?.question_type === 'true_false' && (
                <>
                  <button
                    onClick={() => handleAnswer(question.id, true)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      answers[question.id] === true
                        ? 'border-green-500 bg-green-50'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                    data-testid="option-true"
                  >
                    <span className={`font-medium ${answers[question.id] === true ? 'text-green-700' : 'text-slate-700'}`}>
                      ✅ True
                    </span>
                  </button>
                  <button
                    onClick={() => handleAnswer(question.id, false)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      answers[question.id] === false
                        ? 'border-red-500 bg-red-50'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                    data-testid="option-false"
                  >
                    <span className={`font-medium ${answers[question.id] === false ? 'text-red-700' : 'text-slate-700'}`}>
                      ❌ False
                    </span>
                  </button>
                </>
              )}

              {question?.question_type === 'fill_blank' && (
                <input
                  type="text"
                  value={answers[question.id] || ''}
                  onChange={(e) => handleAnswer(question.id, e.target.value)}
                  placeholder="Type your answer..."
                  className="w-full p-4 rounded-xl border-2 border-slate-200 focus:border-purple-500 focus:outline-none"
                  data-testid="fill-blank-input"
                />
              )}
            </div>

            {/* Navigation */}
            <div className="flex gap-4">
              {currentQuestion > 0 && (
                <button
                  onClick={() => setCurrentQuestion(prev => prev - 1)}
                  className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-full font-bold hover:bg-slate-200 transition-all"
                >
                  Previous
                </button>
              )}
              {currentQuestion < totalQuestions - 1 ? (
                <button
                  onClick={() => setCurrentQuestion(prev => prev + 1)}
                  disabled={!answers[question?.id]}
                  className="flex-1 py-4 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-full font-bold hover:shadow-lg transition-all disabled:opacity-50"
                  data-testid="next-question-btn"
                >
                  Next Question <ChevronRight className="inline w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={submitQuiz}
                  disabled={Object.keys(answers).length < totalQuestions}
                  className="flex-1 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full font-bold hover:shadow-lg transition-all disabled:opacity-50"
                  data-testid="submit-quiz-btn"
                >
                  Submit Quiz 🎯
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Quiz List View
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 font-nunito mb-2">📝 Quizzes & Assessments</h1>
          <p className="text-slate-600">Test your knowledge and earn points!</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id || quiz.title}
              className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100 hover:shadow-xl transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-2 ${
                    quiz.learning_level === 'foundation' ? 'bg-green-100 text-green-700' :
                    quiz.learning_level === 'development' ? 'bg-blue-100 text-blue-700' :
                    'bg-purple-100 text-purple-700'
                  }`}>
                    {quiz.learning_level}
                  </span>
                  <h3 className="text-xl font-bold text-slate-800">{quiz.title}</h3>
                </div>
                <Trophy className="w-8 h-8 text-yellow-500" />
              </div>

              <p className="text-slate-600 text-sm mb-4">{quiz.description}</p>

              <div className="flex items-center gap-4 text-sm text-slate-500 mb-6">
                <span>{quiz.questions?.length || 0} questions</span>
                {quiz.time_limit_minutes && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {quiz.time_limit_minutes} min
                  </span>
                )}
                <span>Pass: {quiz.passing_score}%</span>
              </div>

              <button
                onClick={() => startQuiz(quiz)}
                className="w-full py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-full font-bold hover:shadow-lg transition-all"
                data-testid={`start-quiz-${quiz.id || quiz.title}`}
              >
                Start Quiz
              </button>
            </div>
          ))}
        </div>

        {quizzes.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No Quizzes Available</h3>
            <p className="text-slate-600">Check back later for new quizzes!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizPage;
