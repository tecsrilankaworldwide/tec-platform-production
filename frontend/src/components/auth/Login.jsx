import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'student',
    age_group: '9-12'
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isLogin) {
        const result = await login(formData.email, formData.password);
        if (result.success) {
          navigate('/dashboard');
        } else {
          setMessage(result.error);
        }
      } else {
        const result = await register(formData);
        if (result.success) {
          setMessage('Registration successful! Please login.');
          setIsLogin(true);
          setFormData({ ...formData, password: '' });
        } else {
          setMessage(result.error);
        }
      }
    } catch (error) {
      setMessage('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md border-2 border-purple-100">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🚀</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">TEC Future-Ready Learning</h1>
          <p className="text-purple-600 font-semibold text-lg">Preparing Tomorrow's Minds Today</p>
          <div className="mt-4 bg-gradient-to-r from-purple-100 to-blue-100 p-4 rounded-xl">
            <p className="text-sm font-bold text-purple-800">🏢 TEC Sri Lanka Worldwide (Pvt.) Ltd</p>
            <p className="text-xs text-gray-600 mt-1">42 Years of Educational Excellence • Est. 1982</p>
            <div className="flex justify-center space-x-2 mt-2 text-xs text-purple-700">
              <span>🖥️ Computers</span>
              <span>•</span>
              <span>🤖 Robotics</span>
              <span>•</span>
              <span>🚀 AI Future</span>
            </div>
          </div>
        </div>

        <div className="flex mb-6 bg-gray-100 rounded-xl p-1">
          <button
            type="button"
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-3 px-4 rounded-lg transition-all font-medium ${
              isLogin 
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg' 
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-3 px-4 rounded-lg transition-all font-medium ${
              !isLogin 
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg' 
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="relative">
              <input
                type="text"
                name="full_name"
                placeholder="Full Name"
                value={formData.full_name}
                onChange={handleChange}
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all"
                required
              />
              <span className="absolute right-4 top-4 text-gray-400">👤</span>
            </div>
          )}
          
          <div className="relative">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all"
              required
            />
            <span className="absolute right-4 top-4 text-gray-400">📧</span>
          </div>
          
          <div className="relative">
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all"
              required
            />
            <span className="absolute right-4 top-4 text-gray-400">🔒</span>
          </div>

          {!isLogin && (
            <>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 bg-white"
              >
                <option value="student">🎓 Student</option>
                <option value="teacher">👨‍🏫 Teacher / Educator</option>
              </select>

              {formData.role === 'student' && (
                <select
                  name="age_group"
                  value={formData.age_group}
                  onChange={handleChange}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 bg-white"
                >
                  <option value="5-8">🌱 Foundation Level (Ages 5-8)</option>
                  <option value="9-12">🧠 Development Level (Ages 9-12)</option>
                  <option value="13-16">🎯 Mastery Level (Ages 13-16)</option>
                </select>
              )}
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white p-4 rounded-xl hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 font-semibold text-lg shadow-lg"
            data-testid="login-submit-btn"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Please wait...
              </div>
            ) : (
              isLogin ? '🚀 Enter Learning Platform' : '⭐ Join TEC Community'
            )}
          </button>
        </form>

        {message && (
          <div className={`mt-4 p-4 rounded-xl text-center font-medium ${
            message.includes('successful') 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Join thousands of Sri Lankan students preparing for tomorrow's world
          </p>
          <div className="flex justify-center space-x-4 mt-3 text-xs text-gray-400">
            <span>🔒 Secure</span>
            <span>🌟 Trusted</span>
            <span>🚀 Future-Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
