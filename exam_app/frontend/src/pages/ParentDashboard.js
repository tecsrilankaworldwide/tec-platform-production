import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, API } from '../AuthContext';
import axios from 'axios';
import { Users, TrendingUp, Award, LogOut, BarChart3 } from 'lucide-react';

const ParentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChildren();
  }, []);

  const loadChildren = async () => {
    try {
      // This would load children linked to parent - mock for now
      setChildren([
        { id: 'student1', name: 'Sample Student', grade: 'grade_5' }
      ]);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load children:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center" style={{background: '#FFFBF0'}}><div className="spinner"></div></div>;
  }

  return (
    <div className="min-h-screen" style={{background: 'linear-gradient(135deg, #FFF9E6, #FFFACD)'}}>
      <div className="bg-white shadow-md border-b-4" style={{borderColor: '#F59E0B'}}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-extrabold" style={{color: '#92400E', fontFamily: 'Nunito'}}>Parent Portal</h1>
              <p className="text-gray-600">Welcome, {user.full_name}!</p>
            </div>
            <button onClick={logout} className="px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200">
              <LogOut className="inline w-4 h-4 mr-1" />Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-3xl shadow-xl p-8 border-4" style={{borderColor: '#F59E0B'}}>
          <h2 className="text-2xl font-extrabold mb-6" style={{color: '#92400E', fontFamily: 'Nunito'}}>
            <Users className="inline w-6 h-6 mr-2" />
            Your Children's Progress
          </h2>

          {children.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-gray-600">No children linked to your account yet.</p>
              <p className="text-sm text-gray-500 mt-2">Contact administrator to link your child's account.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {children.map(child => (
                <div key={child.id} className="bg-gradient-to-br from-yellow-50 to-white rounded-2xl p-6 border-3 border-yellow-200 shadow-md card-hover">
                  <h3 className="text-xl font-extrabold mb-2" style={{color: '#92400E'}}>{child.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">{child.grade.replace('_', ' ').toUpperCase()}</p>
                  
                  <button
                    onClick={() => navigate(`/progress/${child.id}`)}
                    className="w-full py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg"
                  >
                    <BarChart3 className="inline w-5 h-5 mr-2" />
                    View Blood Report 🩺
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

export default ParentDashboard;
