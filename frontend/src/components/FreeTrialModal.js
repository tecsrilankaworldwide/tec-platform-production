import React, { useState } from 'react';
import axios from 'axios';
import { X, Sparkles, Check } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const FreeTrialModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1); // 1: form, 2: success
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    parent_name: '',
    parent_phone: '',
    age_group: '4-6',
    country: 'sri_lanka',
    language: 'en'
  });
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [error, setError] = useState('');
  const [countries, setCountries] = useState([]);
  const [pricing, setPricing] = useState(null);
  const [photoWarning, setPhotoWarning] = useState(null);

  const ageGroups = [
    { value: '4-6', label: '🌟 Ages 4-6 (Little Learners)' },
    { value: '7-9', label: '🚀 Ages 7-9 (Young Explorers)' },
    { value: '10-12', label: '⚡ Ages 10-12 (Smart Kids)' },
    { value: '13-15', label: '💻 Ages 13-15 (Tech Teens)' },
    { value: '16-18', label: '🎯 Ages 16-18 (Future Leaders)' }
  ];

  // Load countries on mount
  React.useEffect(() => {
    const loadCountries = async () => {
      try {
        const response = await axios.get(`${API}/countries`);
        setCountries(response.data.countries || []);
      } catch (err) {
        console.error('Failed to load countries:', err);
      }
    };
    if (isOpen) {
      loadCountries();
    }
  }, [isOpen]);

  // Load pricing when country or age group changes
  React.useEffect(() => {
    const loadPricing = async () => {
      try {
        const response = await axios.get(`${API}/pricing/${formData.country}/${formData.age_group}`);
        setPricing(response.data);
        
        if (response.data.photo_alternative_recommended) {
          setPhotoWarning(response.data.photo_message);
        } else {
          setPhotoWarning(null);
        }
      } catch (err) {
        console.error('Failed to load pricing:', err);
      }
    };
    
    if (formData.country && formData.age_group) {
      loadPricing();
    }
  }, [formData.country, formData.age_group]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API}/trial/enroll`, formData);
      setCredentials(response.data);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to start free trial. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-8 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
            data-testid="close-trial-modal"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8" />
            <h2 className="text-3xl font-extrabold">Start Your Free Trial!</h2>
          </div>
          <p className="text-purple-100 text-lg">
            {step === 1 ? 'Try 1 FREE class. No credit card required!' : 'Welcome to TecaiKids! 🎉'}
          </p>
        </div>

        {/* Content */}
        <div className="p-8">
          {step === 1 ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-red-700">
                  {error}
                </div>
              )}

              {photoWarning && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 text-blue-800">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">ℹ️</span>
                    <div>
                      <p className="font-bold mb-1">Cultural Privacy Notice</p>
                      <p className="text-sm">{photoWarning}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Country *
                  </label>
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
                    data-testid="trial-country"
                  >
                    {countries.map(country => (
                      <option key={country.key} value={country.key}>
                        {country.name} ({country.currency})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Preferred Language *
                  </label>
                  <select
                    name="language"
                    value={formData.language}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
                    data-testid="trial-language"
                  >
                    {countries.find(c => c.key === formData.country)?.languages.map(lang => (
                      <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                    )) || <option value="en">EN</option>}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Student's Full Name *
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
                  placeholder="Enter student's name"
                  data-testid="trial-student-name"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
                  placeholder="your@email.com"
                  data-testid="trial-email"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Parent/Guardian Name
                </label>
                <input
                  type="text"
                  name="parent_name"
                  value={formData.parent_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
                  placeholder="Parent's name"
                  data-testid="trial-parent-name"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Parent Phone (Optional)
                </label>
                <input
                  type="tel"
                  name="parent_phone"
                  value={formData.parent_phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
                  placeholder="+94 77 123 4567"
                  data-testid="trial-phone"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Select Age Group *
                </label>
                <select
                  name="age_group"
                  value={formData.age_group}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
                  data-testid="trial-age-group"
                >
                  {ageGroups.map(group => (
                    <option key={group.value} value={group.value}>
                      {group.label} {pricing ? `- ${pricing.monthly.formatted}/mo` : ''}
                    </option>
                  ))}
                </select>
                {pricing && (
                  <p className="text-sm text-gray-600 mt-2">
                    Regular Price: {pricing.monthly.formatted}/month or {pricing.quarterly.formatted}/quarter
                  </p>
                )}
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6">
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  What You Get:
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span> 1 FREE trial class{pricing && ` (worth ${pricing.monthly.formatted}+)`}
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span> Full access to platform features
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span> AI-powered learning experience
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span> No credit card required
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span> Cancel anytime after trial
                  </li>
                  {photoWarning && (
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span> Privacy-friendly ID options (initials/avatar)
                    </li>
                  )}
                </ul>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="start-trial-button"
              >
                {loading ? 'Creating Your Trial...' : '🎉 Start Free Trial Now!'}
              </button>

              <p className="text-center text-sm text-gray-500">
                By starting the trial, you agree to our Terms of Service
              </p>
            </form>
          ) : (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-green-600" />
              </div>
              
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Welcome to TecaiKids! 🎉
              </h3>
              
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6 text-left">
                <p className="font-bold text-gray-800 mb-3">Your Login Credentials:</p>
                <div className="space-y-2 font-mono text-sm">
                  <div>
                    <span className="text-gray-600">Email:</span>{' '}
                    <span className="font-bold text-gray-800">{credentials?.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Password:</span>{' '}
                    <span className="font-bold text-purple-600">{credentials?.temporary_password}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-3">
                  ⚠️ Please save this password! You can change it after logging in.
                </p>
              </div>

              <div className="space-y-3">
                <a
                  href="/login"
                  className="block w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-xl transition-all"
                  data-testid="go-to-login"
                >
                  Login & Start Learning →
                </a>
                
                <button
                  onClick={onClose}
                  className="block w-full py-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FreeTrialModal;
