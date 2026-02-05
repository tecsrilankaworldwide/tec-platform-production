import React, { useState } from 'react';
import { useAuth, API } from '../AuthContext';
import axios from 'axios';
import { Upload, Plus, Trash2, Save, Eye } from 'lucide-react';

const ExamCreator = ({ onClose, onCreated }) => {
  const { token } = useAuth();
  const [examData, setExamData] = useState({
    title: '',
    grade: 'grade_5',
    month: new Date().toISOString().substring(0, 7),
    paper1_questions: [],
    paper2_essay_prompt: '',
    paper2_short_questions: Array(10).fill('')
  });
  const [currentQuestion, setCurrentQuestion] = useState({
    question_text: '',
    options: [
      { option_id: 'A', text: '', is_correct: false },
      { option_id: 'B', text: '', is_correct: false },
      { option_id: 'C', text: '', is_correct: false },
      { option_id: 'D', text: '', is_correct: false },
      { option_id: 'E', text: '', is_correct: false }
    ],
    skill_area: 'mathematical_reasoning'
  });

  const skills = [
    { value: 'mathematical_reasoning', label: 'Mathematical Reasoning' },
    { value: 'language_proficiency', label: 'Language Proficiency' },
    { value: 'general_knowledge', label: 'General Knowledge' },
    { value: 'comprehension_skills', label: 'Comprehension Skills' },
    { value: 'problem_solving', label: 'Problem Solving' },
    { value: 'logical_thinking', label: 'Logical Thinking' },
    { value: 'spatial_reasoning', label: 'Spatial Reasoning' },
    { value: 'memory_recall', label: 'Memory & Recall' },
    { value: 'analytical_skills', label: 'Analytical Skills' },
    { value: 'critical_thinking', label: 'Critical Thinking' }
  ];

  const addQuestion = () => {
    const correctOption = currentQuestion.options.find(o => o.is_correct);
    if (!correctOption) {
      alert('Please mark one option as correct!');
      return;
    }

    const question = {
      id: `q_${Date.now()}`,
      question_number: examData.paper1_questions.length + 1,
      question_text: currentQuestion.question_text,
      options: currentQuestion.options,
      correct_option_id: correctOption.option_id,
      skill_area: currentQuestion.skill_area,
      marks: 1
    };

    setExamData({
      ...examData,
      paper1_questions: [...examData.paper1_questions, question]
    });

    // Reset form
    setCurrentQuestion({
      question_text: '',
      options: [
        { option_id: 'A', text: '', is_correct: false },
        { option_id: 'B', text: '', is_correct: false },
        { option_id: 'C', text: '', is_correct: false },
        { option_id: 'D', text: '', is_correct: false },
        { option_id: 'E', text: '', is_correct: false }
      ],
      skill_area: 'mathematical_reasoning'
    });
  };

  const createExam = async () => {
    if (examData.paper1_questions.length < 60) {
      alert(`You have only ${examData.paper1_questions.length} questions. Need 60 for Paper 1!`);
      return;
    }

    try {
      await axios.post(
        `${API}/exams/create`,
        examData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Exam created successfully!');
      onCreated && onCreated();
      onClose && onClose();
    } catch (error) {
      alert('Failed to create exam: ' + (error.response?.data?.detail || error.message));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl border-4" style={{borderColor: '#F59E0B'}}>
        <div className="p-8">
          <h2 className="text-3xl font-extrabold mb-6" style={{color: '#92400E', fontFamily: 'Nunito'}}>Create New Exam</h2>
          
          {/* Basic Info */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <input
              type="text"
              placeholder="Exam Title"
              value={examData.title}
              onChange={(e) => setExamData({...examData, title: e.target.value})}
              className="px-4 py-3 border-3 border-yellow-300 rounded-xl"
            />
            <select
              value={examData.grade}
              onChange={(e) => setExamData({...examData, grade: e.target.value})}
              className="px-4 py-3 border-3 border-yellow-300 rounded-xl"
            >
              <option value="grade_2">Grade 2</option>
              <option value="grade_3">Grade 3</option>
              <option value="grade_4">Grade 4</option>
              <option value="grade_5">Grade 5</option>
            </select>
            <input
              type="month"
              value={examData.month}
              onChange={(e) => setExamData({...examData, month: e.target.value})}
              className="px-4 py-3 border-3 border-yellow-300 rounded-xl"
            />
          </div>

          {/* Question Counter */}
          <div className="mb-6 p-4 bg-yellow-50 rounded-xl border-2 border-yellow-300">
            <p className="font-bold" style={{color: '#92400E'}}>Paper 1 Questions: {examData.paper1_questions.length} / 60</p>
          </div>

          {/* Add Question Form */}
          <div className="mb-6 p-6 bg-gray-50 rounded-2xl border-2 border-gray-300">
            <h3 className="font-bold mb-4" style={{color: '#92400E'}}>Add Question #{examData.paper1_questions.length + 1}</h3>
            
            <textarea
              placeholder="Question text"
              value={currentQuestion.question_text}
              onChange={(e) => setCurrentQuestion({...currentQuestion, question_text: e.target.value})}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl mb-4"
              rows={3}
            />

            <select
              value={currentQuestion.skill_area}
              onChange={(e) => setCurrentQuestion({...currentQuestion, skill_area: e.target.value})}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl mb-4"
            >
              {skills.map(skill => (
                <option key={skill.value} value={skill.value}>{skill.label}</option>
              ))}
            </select>

            {/* Options */}
            {currentQuestion.options.map((option, idx) => (
              <div key={option.option_id} className="flex gap-3 mb-3">
                <input
                  type="radio"
                  name="correct_answer"
                  checked={option.is_correct}
                  onChange={() => {
                    const newOptions = currentQuestion.options.map(o => ({
                      ...o,
                      is_correct: o.option_id === option.option_id
                    }));
                    setCurrentQuestion({...currentQuestion, options: newOptions});
                  }}
                  className="w-5 h-5"
                />
                <span className="font-bold w-8">{option.option_id}.</span>
                <input
                  type="text"
                  placeholder={`Option ${option.option_id}`}
                  value={option.text}
                  onChange={(e) => {
                    const newOptions = [...currentQuestion.options];
                    newOptions[idx].text = e.target.value;
                    setCurrentQuestion({...currentQuestion, options: newOptions});
                  }}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg"
                />
              </div>
            ))}

            <button
              onClick={addQuestion}
              className="w-full mt-4 py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600"
            >
              <Plus className="inline w-5 h-5 mr-2" />
              Add Question
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={createExam}
              disabled={examData.paper1_questions.length < 60}
              className="flex-1 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              <Save className="inline w-5 h-5 mr-2" />
              Create Exam ({examData.paper1_questions.length}/60)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamCreator;
