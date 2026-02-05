import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth, API } from '../AuthContext';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { TrendingUp, TrendingDown, Award, AlertCircle } from 'lucide-react';

const ProgressReport = () => {
  const { studentId } = useParams();
  const { token } = useAuth();
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const response = await axios.get(
        `${API}/students/${studentId}/progress`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProgress(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load progress:', error);
      setLoading(false);
    }
  };

  const getSkillLabel = (skill) => {
    const labels = {
      'mathematical_reasoning': 'Math Reasoning',
      'language_proficiency': 'Language',
      'general_knowledge': 'General Knowledge',
      'comprehension_skills': 'Comprehension',
      'problem_solving': 'Problem Solving',
      'logical_thinking': 'Logical Thinking',
      'spatial_reasoning': 'Spatial Reasoning',
      'memory_recall': 'Memory & Recall',
      'analytical_skills': 'Analytical Skills',
      'critical_thinking': 'Critical Thinking'
    };
    return labels[skill] || skill;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{background: '#FFFBF0'}}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!progress || progress.monthly_progress.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{background: '#FFFBF0'}}>
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-xl text-gray-700 font-bold">No exam data available yet</p>
          <p className="text-gray-600 mt-2">Student needs to complete exams first</p>
        </div>
      </div>
    );
  }

  // Prepare data for line chart (month-on-month progress per skill)
  const lineChartData = progress.monthly_progress.map(month => {
    const data = { month: month.month.substring(5) }; // Get MM from YYYY-MM
    Object.entries(month.skill_percentages || {}).forEach(([skill, percentage]) => {
      data[getSkillLabel(skill)] = percentage;
    });
    return data;
  });

  // Prepare data for radar chart (latest month snapshot)
  const latestMonth = progress.monthly_progress[progress.monthly_progress.length - 1];
  const radarData = Object.entries(latestMonth.skill_percentages || {}).map(([skill, percentage]) => ({
    skill: getSkillLabel(skill),
    percentage: percentage
  }));

  const skillColors = [
    '#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#8B5CF6',
    '#EC4899', '#14B8A6', '#F97316', '#06B6D4', '#84CC16'
  ];

  return (
    <div className="min-h-screen p-6" style={{background: 'linear-gradient(135deg, #FFF9E6, #FFFACD)'}}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8 border-4" style={{borderColor: '#F59E0B'}}>
          <h1 className="text-4xl font-extrabold mb-2" style={{color: '#92400E', fontFamily: 'Nunito'}}>
            🩺 Student Progress Report
          </h1>
          <p className="text-lg text-gray-700 font-semibold">Blood Report Style - Skill Analysis</p>
          <p className="text-sm text-gray-600 mt-1">Track strengths & areas for improvement across 10 key skills</p>
        </div>

        {/* Strengths & Weaknesses Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Strengths */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border-4" style={{borderColor: '#10B981'}}>
            <h2 className="text-2xl font-extrabold mb-6 flex items-center gap-2" style={{color: '#059669'}}>
              <TrendingUp className="w-6 h-6" />
              Top Strengths
            </h2>
            <div className="space-y-4">
              {progress.strengths.map(([skill, percentage], idx) => (
                <div key={skill} className="flex items-center justify-between p-4 bg-green-50 rounded-xl border-2 border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500 text-white rounded-lg flex items-center justify-center font-bold">
                      {idx + 1}
                    </div>
                    <span className="font-semibold text-gray-800">{getSkillLabel(skill)}</span>
                  </div>
                  <span className="text-2xl font-extrabold text-green-600">{percentage}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Weaknesses */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border-4" style={{borderColor: '#EF4444'}}>
            <h2 className="text-2xl font-extrabold mb-6 flex items-center gap-2" style={{color: '#DC2626'}}>
              <AlertCircle className="w-6 h-6" />
              Areas to Improve
            </h2>
            <div className="space-y-4">
              {progress.weaknesses.reverse().map(([skill, percentage], idx) => (
                <div key={skill} className="flex items-center justify-between p-4 bg-red-50 rounded-xl border-2 border-red-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-500 text-white rounded-lg flex items-center justify-center font-bold">
                      {idx + 1}
                    </div>
                    <span className="font-semibold text-gray-800">{getSkillLabel(skill)}</span>
                  </div>
                  <span className="text-2xl font-extrabold text-red-600">{percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Line Chart - Month-on-Month Progress */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8 border-4" style={{borderColor: '#3B82F6'}}>
          <h2 className="text-2xl font-extrabold mb-6" style={{color: '#1E40AF', fontFamily: 'Nunito'}}>
            📈 Month-on-Month Progress (All 10 Skills)
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={lineChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" stroke="#6B7280" style={{fontSize: '14px', fontWeight: '600'}} />
              <YAxis stroke="#6B7280" domain={[0, 100]} style={{fontSize: '14px', fontWeight: '600'}} />
              <Tooltip contentStyle={{borderRadius: '12px', border: '2px solid #FCD34D'}} />
              <Legend wrapperStyle={{paddingTop: '20px'}} />
              {Object.keys(latestMonth.skill_percentages || {}).map((skill, idx) => (
                <Line 
                  key={skill}
                  type="monotone" 
                  dataKey={getSkillLabel(skill)} 
                  stroke={skillColors[idx]} 
                  strokeWidth={3}
                  dot={{r: 5}}
                  activeDot={{r: 8}}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Radar Chart - Latest Snapshot */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border-4" style={{borderColor: '#8B5CF6'}}>
          <h2 className="text-2xl font-extrabold mb-6" style={{color: '#6D28D9', fontFamily: 'Nunito'}}>
            🎯 Current Skills Snapshot
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#E5E7EB" />
              <PolarAngleAxis dataKey="skill" style={{fontSize: '12px', fontWeight: '600'}} />
              <PolarRadiusAxis domain={[0, 100]} />
              <Radar name="Performance" dataKey="percentage" stroke="#8B5CF6" fill="#A78BFA" fillOpacity={0.6} strokeWidth={2} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ProgressReport;
