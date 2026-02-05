import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { BookOpen, Mail, Lock, User, Award } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{background: 'linear-gradient(135deg, #FFF9E6 0%, #FFFACD 50%, #FFEAA7 100%)'}}>
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-3xl shadow-lg flex items-center justify-center mx-auto mb-4" style={{border: '4px solid #F59E0B'}}>
            <Award className="w-10 h-10 text-yellow-600" />
          </div>
          <h1 className="text-4xl font-extrabold mb-2" style={{color: '#92400E', fontFamily: 'Nunito, sans-serif'}}>Examination Bureau</h1>
          <p className="text-lg font-semibold text-yellow-800">Grade 5 Scholarship Exam Portal</p>
          <p className="text-sm text-yellow-700 mt-2">Excellence in Education Since 1982</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 border-4" style={{borderColor: '#FCD34D'}}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Sign In</h2>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border-3 border-red-300 rounded-xl text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                <Mail className="inline w-4 h-4 mr-1" />
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border-3 border-yellow-300 rounded-xl focus:border-yellow-500 focus:outline-none"
                placeholder="your@email.com"
                style={{fontSize: '16px'}}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                <Lock className="inline w-4 h-4 mr-1" />
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border-3 border-yellow-300 rounded-xl focus:border-yellow-500 focus:outline-none"
                placeholder="Enter password"
                style={{fontSize: '16px'}}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 disabled:opacity-50"
              style={{background: 'linear-gradient(135deg, #F59E0B, #D97706)', fontSize: '18px', fontFamily: 'Nunito, sans-serif'}}
            >
              {loading ? 'Signing In...' : 'Sign In →'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Need help? Contact your administrator
          </p>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-yellow-800">
          <p className="text-sm font-semibold">Examination Evaluation Bureau (Pvt.) Ltd</p>
          <p className="text-xs mt-1">Building Future Scholars</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
