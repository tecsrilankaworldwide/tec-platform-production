import React, { useState, useEffect } from 'react';
import { useAuth, API } from '../AuthContext';
import axios from 'axios';
import { Edit, Save, Image as ImageIcon } from 'lucide-react';

const Paper2Marking = ({ submission, onMarked }) => {
  const { token } = useAuth();
  const [marks, setMarks] = useState({
    essay_marks: 0,
    short_answer_marks: Array(10).fill(0),
    comments: ''
  });

  const handleMark = async () => {
    try {
      await axios.put(
        `${API}/paper2/${submission.id}/mark`,
        marks,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Paper 2 marked successfully!');
      onMarked && onMarked();
    } catch (error) {
      alert('Failed to save marks: ' + (error.response?.data?.detail || error.message));
    }
  };

  const total = marks.essay_marks + marks.short_answer_marks.reduce((sum, m) => sum + m, 0);

  return (
    <div className="bg-white rounded-2xl p-6 border-3 border-yellow-300 shadow-lg">
      <h3 className="text-xl font-bold mb-4" style={{color: '#92400E'}}>Mark Paper 2</h3>
      <p className="text-sm text-gray-600 mb-4">Student: {submission.student_name || submission.student_id}</p>
      
      {submission.whatsapp_reference && (
        <div className="mb-4 p-3 bg-green-50 border-2 border-green-200 rounded-lg">
          <p className="text-sm font-semibold text-green-800">
            <ImageIcon className="inline w-4 h-4 mr-1" />
            WhatsApp Reference: {submission.whatsapp_reference}
          </p>
        </div>
      )}

      {/* Essay Marks */}
      <div className="mb-6">
        <label className="block text-sm font-bold text-gray-700 mb-2">Essay Marks (out of 20)</label>
        <input
          type="number"
          min="0"
          max="20"
          value={marks.essay_marks}
          onChange={(e) => setMarks({...marks, essay_marks: parseInt(e.target.value) || 0})}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl"
        />
      </div>

      {/* Short Answer Marks */}
      <div className="mb-6">
        <label className="block text-sm font-bold text-gray-700 mb-2">Short Answer Marks (each out of 2)</label>
        <div className="grid grid-cols-5 gap-3">
          {marks.short_answer_marks.map((mark, idx) => (
            <div key={idx}>
              <label className="text-xs text-gray-600">Q{idx + 1}</label>
              <input
                type="number"
                min="0"
                max="2"
                value={mark}
                onChange={(e) => {
                  const newMarks = [...marks.short_answer_marks];
                  newMarks[idx] = parseInt(e.target.value) || 0;
                  setMarks({...marks, short_answer_marks: newMarks});
                }}
                className="w-full px-2 py-2 border-2 border-gray-300 rounded-lg text-center font-bold"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Comments */}
      <div className="mb-6">
        <label className="block text-sm font-bold text-gray-700 mb-2">Teacher Comments</label>
        <textarea
          value={marks.comments}
          onChange={(e) => setMarks({...marks, comments: e.target.value})}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl"
          rows={3}
          placeholder="Feedback for student..."
        />
      </div>

      {/* Total */}
      <div className="mb-6 p-4 bg-yellow-50 rounded-xl border-3" style={{borderColor: '#F59E0B'}}>
        <p className="text-lg font-bold" style={{color: '#92400E'}}>Total Marks: {total} / 40</p>
      </div>

      <button
        onClick={handleMark}
        className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl"
      >
        <Save className="inline w-5 h-5 mr-2" />
        Save Marks
      </button>
    </div>
  );
};

export default Paper2Marking;
