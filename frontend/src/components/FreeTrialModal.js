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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border-4" style={{borderColor: 'var(--pastel-purple)'}}>
        {/* Header - Soft Gradient */}
        <div className="p-8 text-white relative" style={{background: 'linear-gradient(135deg, #A78BFA 0%, #F472B6 100%)'}}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-all hover:scale-110"
            data-testid="close-trial-modal"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Sparkles className="w-7 h-7" />
            </div>
            <h2 className="text-4xl font-extrabold" style={{fontFamily: 'var(--font-primary)'}}>
              {step === 1 ? 'Start Your Free Trial! 🎁' : 'Welcome Aboard! 🎉'}
            </h2>
          </div>
          <p className="text-purple-100 text-lg ml-15">
            {step === 1 ? 'Try 1 FREE class. No credit card required! Zero risk, 100% learning fun!' : 'Your learning adventure begins now!'}
          </p>
        </div>

        {/* Content */}
        <div className="p-8" style={{background: 'var(--cream)'}}>
          {step === 1 ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-2xl p-5 text-red-700 border-3 shadow-sm" style={{background: 'var(--error-soft)', borderColor: 'var(--error)'}}>
                  <span className="text-2xl mr-2">⚠️</span>{error}
                </div>
              )}

              {photoWarning && (
                <div className="rounded-2xl p-5 text-blue-800 border-3 shadow-sm" style={{background: 'var(--info-soft)', borderColor: 'var(--pastel-sky)'}}>
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">🕌</span>
                    <div>
                      <p className="font-bold mb-1" style={{fontFamily: 'var(--font-primary)'}}>Cultural Privacy Notice</p>
                      <p className="text-sm leading-relaxed">{photoWarning}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2" style={{color: 'var(--text-dark)', fontFamily: 'var(--font-primary)'}}>
                    Country *
                  </label>
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    required
                    className="pastel-select"
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
                  <label className="block text-sm font-bold mb-2" style={{color: 'var(--text-dark)', fontFamily: 'var(--font-primary)'}}>
                    Preferred Language *
                  </label>
                  <select
                    name="language"
                    value={formData.language}
                    onChange={handleChange}
                    required
                    className="pastel-select"
                    data-testid="trial-language"
                  >
                    {countries.find(c => c.key === formData.country)?.languages.map(lang => (
                      <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                    )) || <option value="en">EN</option>}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2" style={{color: 'var(--text-dark)', fontFamily: 'var(--font-primary)'}}>
                  Student's Full Name *
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                  className="pastel-input"
                  placeholder="Enter student's name"
                  data-testid="trial-student-name"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2" style={{color: 'var(--text-dark)', fontFamily: 'var(--font-primary)'}}>
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="pastel-input"
                  placeholder="your@email.com"
                  data-testid="trial-email"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2" style={{color: 'var(--text-dark)', fontFamily: 'var(--font-primary)'}}>
                  Parent/Guardian Name
                </label>
                <input
                  type="text"
                  name="parent_name"
                  value={formData.parent_name}
                  onChange={handleChange}
                  className="pastel-input"
                  placeholder="Parent's name"
                  data-testid="trial-parent-name"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2" style={{color: 'var(--text-dark)', fontFamily: 'var(--font-primary)'}}>
                  Parent Phone (Optional)
                </label>
                <input
                  type="tel"
                  name="parent_phone"
                  value={formData.parent_phone}
                  onChange={handleChange}
                  className="pastel-input"
                  placeholder="+94 77 123 4567"
                  data-testid="trial-phone"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2" style={{color: 'var(--text-dark)', fontFamily: 'var(--font-primary)'}}>
                  Select Age Group *
                </label>
                <select
                  name="age_group"
                  value={formData.age_group}
                  onChange={handleChange}
                  required
                  className="pastel-select"
                  data-testid="trial-age-group"
                >
                  {ageGroups.map(group => (
                    <option key={group.value} value={group.value}>
                      {group.label} {pricing ? `- ${pricing.monthly.formatted}/mo` : ''}
                    </option>
                  ))}
                </select>
                {pricing && (
                  <p className="text-sm mt-3 px-4 py-2 rounded-lg" style={{background: 'var(--pastel-lavender)', color: 'var(--text-medium)'}}>
                    💰 Regular Price: <strong>{pricing.monthly.formatted}/month</strong> or <strong>{pricing.quarterly.formatted}/quarter</strong>
                  </p>
                )}
              </div>

              <div className="rounded-2xl p-6 border-3 shadow-md" style={{background: 'var(--gradient-mint-sky)', borderColor: 'var(--pastel-mint)'}}>
                <h3 className="font-extrabold mb-4 flex items-center gap-2" style={{color: 'var(--text-dark)', fontFamily: 'var(--font-primary)', fontSize: '18px'}}>
                  <Check className="w-6 h-6" style={{color: 'var(--vibrant-mint)'}} />
                  What You Get FREE:
                </h3>
                <ul className="space-y-3" style={{color: 'var(--text-dark)'}}>
                  <li className="flex items-center gap-3 text-base">
                    <span className="text-2xl">✨</span> 
                    <span><strong>1 FREE trial class</strong>{pricing && ` (worth ${pricing.monthly.formatted}+)`}</span>
                  </li>
                  <li className="flex items-center gap-3 text-base">
                    <span className="text-2xl">🎮</span> Full access to games & activities
                  </li>
                  <li className="flex items-center gap-3 text-base">
                    <span className="text-2xl">🤖</span> AI-powered learning fun
                  </li>
                  <li className="flex items-center gap-3 text-base">
                    <span className="text-2xl">💳</span> No credit card needed
                  </li>
                  <li className="flex items-center gap-3 text-base">
                    <span className="text-2xl">🚪</span> Cancel anytime, no strings attached
                  </li>
                  {photoWarning && (
                    <li className="flex items-center gap-3 text-base">
                      <span className="text-2xl">🕌</span> Privacy-friendly options (initials/avatar)
                    </li>
                  )}
                </ul>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-pastel-primary w-full text-lg py-5 disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="start-trial-button"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating Your Free Trial...
                  </span>
                ) : (
                  '🎉 Start My FREE Trial Now!'
                )}
              </button>

              <p className="text-center text-sm" style={{color: 'var(--text-light)'}}>
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
