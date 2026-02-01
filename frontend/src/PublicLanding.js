import React, { useState } from 'react';
import axios from 'axios';
import { useLanguage } from './LanguageContext';
import { translations } from './translations';
import PayPalPayment from './components/PayPalPayment';
import FreeTrialModal from './components/FreeTrialModal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PublicLanding = () => {
  const { language, changeLanguage } = useLanguage();
  const t = translations[language];
  
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [showEnrollment, setShowEnrollment] = useState(false);
  const [enrollmentData, setEnrollmentData] = useState({
    studentName: '',
    parentName: '',
    email: '',
    phone: '',
    address: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('stripe'); // 'stripe', 'paypal', or 'bank'
  const [isProcessing, setIsProcessing] = useState(false);
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [showPayPal, setShowPayPal] = useState(false);
  const [paypalSuccess, setPaypalSuccess] = useState(false);
  const [showFreeTrialModal, setShowFreeTrialModal] = useState(false);

  const programs = [
    {
      id: 'foundation',
      emoji: '🌟',
      monthly: 800,
      quarterly: 2800,
      savings: 600,
    },
    {
      id: 'explorers',
      emoji: '🚀',
      monthly: 1200,
      quarterly: 4200,
      savings: 900,
    },
    {
      id: 'smart',
      emoji: '⚡',
      monthly: 1500,
      quarterly: 5250,
      savings: 1250,
    },
    {
      id: 'teens',
      emoji: '💻',
      monthly: 2000,
      quarterly: 7000,
      savings: 1500,
    },
    {
      id: 'leaders',
      emoji: '🎯',
      monthly: 2500,
      quarterly: 8750,
      savings: 2250,
    }
  ];

  const handleEnrollClick = (program) => {
    setSelectedProgram(program);
    setShowEnrollment(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleInputChange = (e) => {
    setEnrollmentData({
      ...enrollmentData,
      [e.target.name]: e.target.value
    });
  };

  const handleEnrollSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const price = billingCycle === 'monthly' ? selectedProgram.monthly : selectedProgram.quarterly;
      
      if (paymentMethod === 'bank') {
        // Bank Transfer - Show bank details
        setShowBankDetails(true);
        setIsProcessing(false);
        
        // Save enrollment as pending
        await axios.post(`${API}/enrollment/bank-transfer`, {
          subscription_type: billingCycle,
          age_group: selectedProgram.ageRange,
          student_name: enrollmentData.studentName,
          parent_name: enrollmentData.parentName,
          email: enrollmentData.email,
          phone: enrollmentData.phone,
          address: enrollmentData.address,
          program_id: selectedProgram.id,
          amount: price
        });
      } else if (paymentMethod === 'paypal') {
        // PayPal Payment - Show PayPal component
        // First register the user, then show PayPal
        try {
          await axios.post(`${API}/register`, {
            full_name: enrollmentData.studentName,
            email: enrollmentData.email,
            password: enrollmentData.phone.slice(-6) + 'Tec!', // Auto-generate password
            role: 'student',
            age_group: selectedProgram.ageRange || '9-12',
            parent_name: enrollmentData.parentName,
            phone: enrollmentData.phone,
            address: enrollmentData.address
          });
          
          // Login the user
          const loginRes = await axios.post(`${API}/login`, {
            email: enrollmentData.email,
            password: enrollmentData.phone.slice(-6) + 'Tec!'
          });
          
          localStorage.setItem('token', loginRes.data.access_token);
          setShowPayPal(true);
          setIsProcessing(false);
        } catch (regError) {
          // User might already exist, try to login
          try {
            const loginRes = await axios.post(`${API}/login`, {
              email: enrollmentData.email,
              password: enrollmentData.phone.slice(-6) + 'Tec!'
            });
            localStorage.setItem('token', loginRes.data.access_token);
            setShowPayPal(true);
            setIsProcessing(false);
          } catch (loginError) {
            alert('Please login first or use a different email address');
            setIsProcessing(false);
          }
        }
      } else {
        // Stripe Payment
        const response = await axios.post(`${API}/enrollment/checkout`, {
          subscription_type: billingCycle,
          age_group: selectedProgram.ageRange,
          student_name: enrollmentData.studentName,
          parent_name: enrollmentData.parentName,
          email: enrollmentData.email,
          phone: enrollmentData.phone,
          address: enrollmentData.address,
          program_id: selectedProgram.id,
          success_url: `${window.location.origin}/enrollment-success`,
          cancel_url: `${window.location.origin}/enrollment-cancelled`
        });

        // Redirect to Stripe checkout
        if (response.data.checkout_url) {
          window.location.href = response.data.checkout_url;
        }
      }
    } catch (error) {
      console.error('Enrollment error:', error);
      alert('Error processing enrollment. Please try again or contact support.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm sticky top-0 z-[60]">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎓</span>
            <span className="font-bold text-purple-700 text-lg">TecAI Kids</span>
          </div>
          <a 
            href="/login"
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
            data-testid="staff-login-btn"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Staff Login
          </a>
        </div>
      </nav>

      {/* Language Switcher - All languages */}
      <div className="bg-gray-50 border-b py-2 overflow-x-auto">
        <div className="container mx-auto px-4 flex gap-2 justify-center flex-wrap">
          {[
            { code: 'en', name: 'English', flag: '🇬🇧' },
            { code: 'si', name: 'සිංහල', flag: '🇱🇰' },
            { code: 'ta', name: 'தமிழ்', flag: '🇱🇰' },
            { code: 'zh-CN', name: '中文', flag: '🇨🇳' },
            { code: 'id', name: 'Indonesia', flag: '🇮🇩' },
            { code: 'ar', name: 'العربية', flag: '🇸🇦' },
            { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
            { code: 'ms', name: 'Melayu', flag: '🇲🇾' },
            { code: 'bn', name: 'বাংলা', flag: '🇧🇩' },
            { code: 'ur', name: 'اردو', flag: '🇵🇰' },
          ].map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1 ${
                language === lang.code 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-white border hover:bg-purple-50'
              }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.name}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Hero Section */}
      <header className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="inline-flex items-center bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full mb-6">
              <span className="text-2xl mr-2">🏆</span>
              <span className="font-semibold">{t.badge}</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              {t.hero.title.split(' ').slice(0, 2).join(' ')} <span className="text-yellow-300">{t.hero.title.split(' ').slice(2).join(' ')}</span>
              <br />
              {t.hero.subtitle}
            </h1>
            <p className="text-xl text-blue-100 max-w-4xl mx-auto mb-8">
              {t.hero.description}
            </p>
            <div className="flex justify-center space-x-4 flex-wrap gap-4">
              <button 
                onClick={() => setShowFreeTrialModal(true)}
                className="bg-green-500 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-green-600 transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
                data-testid="free-trial-hero-btn"
              >
                <span className="text-2xl">🎁</span>
                Try 1 FREE Class!
              </button>
              <button 
                onClick={() => document.getElementById('programs').scrollIntoView({ behavior: 'smooth' })}
                className="bg-yellow-400 text-purple-900 px-8 py-4 rounded-lg font-bold text-lg hover:bg-yellow-300 transition-all transform hover:scale-105"
                data-testid="start-excellence-btn"
              >
                {t.hero.ctaPrimary}
              </button>
              <button 
                onClick={() => document.getElementById('programs').scrollIntoView({ behavior: 'smooth' })}
                className="bg-white text-purple-700 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-all"
              >
                {t.hero.ctaSecondary}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
            {[
              { number: '10,000+', label: t.stats.students },
              { number: '99%', label: t.stats.success },
              { number: '25+', label: t.stats.educators },
              { number: '24/7', label: t.stats.support }
            ].map((stat, idx) => (
              <div key={idx} className="text-center bg-white/10 backdrop-blur-sm rounded-lg py-4">
                <div className="text-3xl font-bold text-yellow-300">{stat.number}</div>
                <div className="text-blue-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Enrollment Modal */}
      {showEnrollment && selectedProgram && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 my-8" data-testid="enrollment-modal">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-800">
                  {selectedProgram.emoji} {t.programs.enrollBtn.replace(' →', '')} {t.programsList[selectedProgram.id].name}
                </h3>
                <p className="text-gray-600">{t.programsList[selectedProgram.id].ageRange}</p>
              </div>
              {/* Always allow users to exit - it's their freedom */}
              <button 
                onClick={() => setShowEnrollment(false)}
                className="text-gray-400 hover:text-gray-600 text-3xl p-2 rounded-full hover:bg-gray-100"
                data-testid="close-enrollment-btn"
                title="Close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleEnrollSubmit} className="space-y-4">
              {/* Payment Method Selection */}
              {!showBankDetails && !showPayPal && (
                <div className="bg-purple-50 p-4 rounded-lg mb-6">
                  <div className="font-semibold text-gray-700 mb-3">Select Payment Method:</div>
                  <div className="space-y-2">
                    <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-purple-100 transition-colors" 
                           style={{borderColor: paymentMethod === 'stripe' ? '#9333ea' : '#d1d5db'}}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="stripe"
                        checked={paymentMethod === 'stripe'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-bold text-gray-800">💳 Credit/Debit Card (LKR)</div>
                        <div className="text-sm text-gray-600">Instant payment via Stripe (Visa, Mastercard, Amex)</div>
                      </div>
                    </label>
                    <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors"
                           style={{borderColor: paymentMethod === 'paypal' ? '#0070ba' : '#d1d5db'}}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="paypal"
                        checked={paymentMethod === 'paypal'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-bold text-gray-800 flex items-center">
                          <svg className="w-5 h-5 mr-2 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106z"/>
                          </svg>
                          PayPal (USD - International)
                        </div>
                        <div className="text-sm text-gray-600">Pay with PayPal, credit card, or bank account</div>
                        <div className="text-xs text-blue-600 mt-1">
                          ~${billingCycle === 'monthly' ? '15-22' : '40-58'} USD (≈ LKR {billingCycle === 'monthly' ? '4,800-7,000' : '12,800-18,500'})
                        </div>
                      </div>
                    </label>
                    <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-purple-100 transition-colors"
                           style={{borderColor: paymentMethod === 'bank' ? '#9333ea' : '#d1d5db'}}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="bank"
                        checked={paymentMethod === 'bank'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-bold text-gray-800">🏦 Bank Transfer (LKR)</div>
                        <div className="text-sm text-gray-600">Direct transfer to Bank of Ceylon</div>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Bank Details Display */}
              {showBankDetails && (
                <div className="bg-green-50 border-2 border-green-500 p-6 rounded-lg mb-6">
                  <div className="text-center mb-4">
                    <div className="text-4xl mb-2">✅</div>
                    <h4 className="text-xl font-bold text-green-700">Enrollment Submitted!</h4>
                    <p className="text-gray-700 mt-2">Please complete payment via bank transfer</p>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg space-y-2">
                    <div className="text-center text-2xl font-bold text-purple-700 mb-4">
                      Amount: LKR {billingCycle === 'monthly' ? selectedProgram.monthly : selectedProgram.quarterly}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="font-semibold text-gray-700">Bank:</div>
                      <div className="text-gray-900">Bank of Ceylon</div>
                      
                      <div className="font-semibold text-gray-700">Account Name:</div>
                      <div className="text-gray-900">TEC Sri Lanka Worldwide (Pvt.) Ltd</div>
                      
                      <div className="font-semibold text-gray-700">Account Number:</div>
                      <div className="text-gray-900 font-mono text-lg font-bold">0075715067</div>
                      
                      <div className="font-semibold text-gray-700">Branch:</div>
                      <div className="text-gray-900">Nugegoda</div>
                      
                      <div className="font-semibold text-gray-700">Reference:</div>
                      <div className="text-gray-900 font-mono">{enrollmentData.email.split('@')[0].toUpperCase()}-{Date.now().toString().slice(-6)}</div>
                    </div>
                  </div>

                  <div className="mt-4 text-sm text-gray-700 space-y-2">
                    <p>📧 <strong>Confirmation email sent to:</strong> {enrollmentData.email}</p>
                    <p>⚠️ <strong>Important:</strong> Use the reference code when transferring</p>
                    <p>📱 <strong>After payment, WhatsApp payment slip to:</strong> <a href="https://wa.me/94779779668" target="_blank" rel="noopener noreferrer" className="text-green-600 font-bold hover:underline">+94 77 977 9668</a></p>
                  </div>

                  <button
                    onClick={() => window.location.href = '/'}
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-all mt-4"
                  >
                    Done - Go to Home
                  </button>
                </div>
              )}

              {/* PayPal Payment Section */}
              {showPayPal && !paypalSuccess && (
                <div className="mb-6">
                  <PayPalPayment
                    subscriptionType={billingCycle}
                    ageGroup={selectedProgram.ageRange || '9-12'}
                    onSuccess={(data) => {
                      setPaypalSuccess(true);
                      setShowPayPal(false);
                    }}
                    onCancel={() => {
                      setShowPayPal(false);
                    }}
                    onError={(error) => {
                      console.error('PayPal error:', error);
                      alert('Payment failed. Please try again.');
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPayPal(false)}
                    className="w-full mt-4 text-gray-500 hover:text-gray-700 text-sm"
                  >
                    ← Back to payment options
                  </button>
                </div>
              )}

              {/* PayPal Success Message */}
              {paypalSuccess && (
                <div className="bg-green-50 border-2 border-green-500 p-6 rounded-lg mb-6">
                  <div className="text-center">
                    <div className="text-5xl mb-3">🎉</div>
                    <h4 className="text-2xl font-bold text-green-700">Payment Successful!</h4>
                    <p className="text-gray-700 mt-2">Thank you for your PayPal payment.</p>
                    <p className="text-gray-600 mt-1">Your subscription is now active.</p>
                    <div className="mt-4 p-3 bg-white rounded-lg">
                      <p className="text-sm text-gray-600">Login credentials sent to:</p>
                      <p className="font-bold text-purple-700">{enrollmentData.email}</p>
                    </div>
                    <button
                      onClick={() => window.location.href = '/login'}
                      className="mt-4 bg-purple-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-purple-700 transition-all"
                    >
                      Go to Login →
                    </button>
                  </div>
                </div>
              )}

              {/* Billing Cycle Selection */}
              {!showBankDetails && !showPayPal && !paypalSuccess && (
                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-gray-700">Payment Plan:</span>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => setBillingCycle('monthly')}
                        className={`px-4 py-2 rounded-lg font-medium ${
                          billingCycle === 'monthly'
                            ? 'bg-purple-600 text-white'
                            : 'bg-white text-gray-700'
                        }`}
                        data-testid="monthly-plan-btn"
                      >
                        Monthly
                      </button>
                      <button
                        type="button"
                        onClick={() => setBillingCycle('quarterly')}
                        className={`px-4 py-2 rounded-lg font-medium ${
                          billingCycle === 'quarterly'
                            ? 'bg-purple-600 text-white'
                            : 'bg-white text-gray-700'
                        }`}
                        data-testid="quarterly-plan-btn"
                      >
                        Quarterly (Save {Math.round((selectedProgram.savings / (selectedProgram.monthly * 3)) * 100)}%)
                      </button>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-purple-700 text-center mt-4">
                    LKR {billingCycle === 'monthly' ? selectedProgram.monthly : selectedProgram.quarterly}
                    <span className="text-lg font-normal text-gray-600">/{billingCycle}</span>
                  </div>
                  {billingCycle === 'quarterly' && (
                    <div className="text-center text-green-600 font-medium mt-2">
                      Save LKR {selectedProgram.savings}!
                    </div>
                  )}
                </div>
              )}

              {/* Student Information Form */}
              {!showBankDetails && !showPayPal && !paypalSuccess && (
                <div className="space-y-4">

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Student's Full Name *</label>
                <input
                  type="text"
                  name="studentName"
                  value={enrollmentData.studentName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter student's complete name"
                  data-testid="student-name-input"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Parent/Guardian Name *</label>
                <input
                  type="text"
                  name="parentName"
                  value={enrollmentData.parentName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter parent's complete name"
                  data-testid="parent-name-input"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={enrollmentData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="primary.email@example.com"
                  data-testid="email-input"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  value={enrollmentData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="+94 77 123 4567"
                  data-testid="phone-input"
                />
              </div>

              {billingCycle === 'quarterly' && (
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Delivery Address for Workbooks *</label>
                  <textarea
                    name="address"
                    value={enrollmentData.address}
                    onChange={handleInputChange}
                    required
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter complete postal address for physical workbook delivery"
                    data-testid="address-input"
                  />
                </div>
              )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-lg font-bold text-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="proceed-payment-btn"
                >
                  {isProcessing ? 'Processing...' : 
                   paymentMethod === 'bank' ? 'Get Bank Transfer Details' : 
                   paymentMethod === 'paypal' ? 'Continue with PayPal' :
                   `PAY AND REGISTER - LKR ${billingCycle === 'monthly' ? selectedProgram.monthly : selectedProgram.quarterly}`}
                </button>

                {/* Cancel / Pay Later Button */}
                <button
                  type="button"
                  onClick={() => setShowEnrollment(false)}
                  className="w-full mt-3 bg-gray-100 text-gray-600 py-3 rounded-lg font-medium hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                  data-testid="cancel-payment-btn"
                >
                  <span>✕</span> Cancel / Pay Later
                </button>

                <div className="text-center text-sm text-gray-600 mt-4">
                  🔒 256-bit SSL encryption • Guaranteed satisfaction • 30-day money-back guarantee
                </div>
              </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Quick Payment Section - For Outstation/Walk-in Customers */}
      <section className="bg-gradient-to-r from-green-500 to-emerald-600 py-12">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-4xl mx-auto">
            <div className="text-center mb-6">
              <div className="inline-block bg-green-100 text-green-700 px-6 py-2 rounded-full font-semibold mb-4">
                {t.quickPay.title}
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                {t.quickPay.subtitle}
              </h2>
              <p className="text-gray-600 text-lg">
                {t.quickPay.description}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Bank Details */}
              <div className="bg-blue-50 p-6 rounded-xl">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  {t.quickPay.bankTitle}
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-700">{t.quickPay.bank}</span>
                    <span className="text-gray-900">{t.quickPay.bankName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-700">{t.quickPay.accountName}</span>
                    <span className="text-gray-900 text-right">{t.quickPay.accountHolder}</span>
                  </div>
                  <div className="flex justify-between items-center bg-white p-3 rounded-lg">
                    <span className="font-semibold text-gray-700">{t.quickPay.accountNumber}</span>
                    <span className="text-2xl font-bold text-blue-700">0075715067</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-700">{t.quickPay.branch}</span>
                    <span className="text-gray-900">{t.quickPay.branchName}</span>
                  </div>
                </div>
              </div>

              {/* QR Code Section */}
              <div className="bg-purple-50 p-6 rounded-xl text-center">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  {t.quickPay.qrTitle}
                </h3>
                <div className="bg-white p-4 rounded-lg mb-4 flex items-center justify-center">
                  <div className="text-center">
                    <img 
                      src="/lankaqr.png" 
                      alt="LankaQR Payment Code - TEC Sri Lanka" 
                      className="w-full max-w-3xl h-auto mx-auto rounded-lg shadow-md"
                    />
                    <div className="mt-3 text-xs text-gray-600">
                      <div className="font-semibold text-gray-800">TEC SRI LANKA WORLD WIDE (PRI)</div>
                      <div>Ref: 005000189991653</div>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  {t.quickPay.qrDescription}
                </p>
              </div>
            </div>

            {/* Pricing Quick Reference */}
            <div className="mt-8 bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-xl">
              <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">{t.quickPay.pricingTitle}</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                <div>
                  <div className="text-2xl mb-1">🌟</div>
                  <div className="font-bold text-gray-800">Ages 4-6</div>
                  <div className="text-sm text-purple-700 font-semibold">LKR 800/mo</div>
                </div>
                <div>
                  <div className="text-2xl mb-1">🚀</div>
                  <div className="font-bold text-gray-800">Ages 7-9</div>
                  <div className="text-sm text-purple-700 font-semibold">LKR 1,200/mo</div>
                </div>
                <div>
                  <div className="text-2xl mb-1">⚡</div>
                  <div className="font-bold text-gray-800">Ages 10-12</div>
                  <div className="text-sm text-purple-700 font-semibold">LKR 1,500/mo</div>
                </div>
                <div>
                  <div className="text-2xl mb-1">💻</div>
                  <div className="font-bold text-gray-800">Ages 13-15</div>
                  <div className="text-sm text-purple-700 font-semibold">LKR 2,000/mo</div>
                </div>
                <div>
                  <div className="text-2xl mb-1">🎯</div>
                  <div className="font-bold text-gray-800">Ages 16-18</div>
                  <div className="text-sm text-purple-700 font-semibold">LKR 2,500/mo</div>
                </div>
              </div>
              <div className="text-center mt-4 text-sm text-gray-600">
                💚 {t.quickPay.quarterly}
              </div>
            </div>

            {/* Instructions */}
            <div className="mt-8 bg-yellow-50 border-2 border-yellow-300 p-6 rounded-xl">
              <h3 className="text-lg font-bold text-gray-800 mb-3">{t.quickPay.howItWorks}</h3>
              <ol className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="bg-yellow-400 text-yellow-900 rounded-full w-6 h-6 flex items-center justify-center font-bold mr-3 flex-shrink-0">1</span>
                  <span><strong>{t.quickPay.step1}</strong> {t.quickPay.step1Desc}</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-yellow-400 text-yellow-900 rounded-full w-6 h-6 flex items-center justify-center font-bold mr-3 flex-shrink-0">2</span>
                  <span><strong>{t.quickPay.step2}</strong> {t.quickPay.step2Desc}</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-yellow-400 text-yellow-900 rounded-full w-6 h-6 flex items-center justify-center font-bold mr-3 flex-shrink-0">3</span>
                  <span><strong>{t.quickPay.step3}</strong> {t.quickPay.step3Desc}</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-yellow-400 text-yellow-900 rounded-full w-6 h-6 flex items-center justify-center font-bold mr-3 flex-shrink-0">4</span>
                  <span><strong>{t.quickPay.step4}</strong> {t.quickPay.step4Desc}</span>
                </li>
              </ol>
            </div>

            {/* WhatsApp CTA */}
            <div className="mt-6 text-center">
              <a 
                href="https://wa.me/94779779668?text=Hi%2C%20I%20want%20to%20enroll%20in%20TecaiKids.%20I%20have%20made%20the%20payment." 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center bg-green-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-green-700 transition-all transform hover:scale-105"
              >
                <span className="text-2xl mr-2">📱</span>
                {t.quickPay.whatsappBtn}
              </a>
              <p className="text-sm text-gray-600 mt-3">
                {t.quickPay.availability}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section id="programs" className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="inline-block bg-purple-100 text-purple-700 px-6 py-2 rounded-full font-semibold mb-4">
            {t.programs.badge}
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            {t.programs.title} <span className="text-purple-600">{t.programs.ageRange}</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t.programs.description}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {programs.map((program) => (
            <div 
              key={program.id}
              className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all transform hover:-translate-y-2"
              data-testid={`program-card-${program.id}`}
            >
              <div className="bg-gradient-to-br from-purple-500 to-blue-600 p-6 text-white">
                <div className="text-5xl mb-3">{program.emoji}</div>
                <h3 className="text-2xl font-bold mb-2">{t.programsList[program.id].name}</h3>
                <div className="text-blue-100">{t.programsList[program.id].ageRange} | {t.programsList[program.id].subtitle}</div>
              </div>

              <div className="p-6">
                <div className="mb-6">
                  <div className="text-3xl font-bold text-purple-700 mb-1">
                    LKR {program.monthly.toLocaleString()}{t.programs.monthly}
                  </div>
                  <div className="text-lg text-green-600 font-semibold">
                    LKR {program.quarterly.toLocaleString()}{t.programs.quarterly}
                  </div>
                  <div className="text-sm text-gray-600">
                    {t.programs.save} LKR {program.savings.toLocaleString()} ({Math.round((program.savings / (program.monthly * 3)) * 100)}% {t.programs.savings})
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {t.programsList[program.id].features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-green-500 mr-2 text-xl">✓</span>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleEnrollClick(program)}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-bold hover:from-purple-700 hover:to-blue-700 transition-all"
                  data-testid={`enroll-btn-${program.id}`}
                >
                  {t.programs.enrollBtn}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-block bg-blue-100 text-blue-700 px-6 py-2 rounded-full font-semibold mb-4">
              {t.features.badge}
            </div>
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              {t.features.title}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: '🧠' },
              { icon: '🎓' },
              { icon: '🌍' },
              { icon: '💎' },
              { icon: '📊' },
              { icon: '🤝' }
            ].map((feature, idx) => (
              <div key={idx} className="text-center p-6">
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">{t.features.list[idx].title}</h3>
                <p className="text-gray-600">{t.features.list[idx].description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Parent Guides Section */}
      <section id="parent-guides" className="py-16 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-block bg-green-100 text-green-700 px-6 py-2 rounded-full font-semibold mb-4">
              {t.parentGuides?.badge || "📚 Essential Resources"}
            </div>
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              {t.parentGuides?.title || "Parent Support Guides"}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-4">
              {t.parentGuides?.subtitle || "Everything you need to support your child's online learning journey"}
            </p>
            <p className="text-gray-500 max-w-4xl mx-auto">
              {t.parentGuides?.description || "Download comprehensive PDF guides designed to help parents and guardians support their children during our online Zoom classes."}
            </p>
          </div>

          {/* Features List */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-12 max-w-4xl mx-auto">
            <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">
              📋 {language === 'en' ? "What's Included in Each Guide" : t.parentGuides?.title}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(t.parentGuides?.features || [
                "Step-by-step Zoom class participation guide",
                "Weekly activity schedules and homework tips",
                "Communication guidelines with instructors",
                "Technical setup and troubleshooting help",
                "Progress tracking worksheets",
                "Parent-child learning activities"
              ]).map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Age Group Guides Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              { key: 'foundation', icon: '🌟', color: 'from-pink-400 to-purple-400' },
              { key: 'explorers', icon: '🚀', color: 'from-blue-400 to-cyan-400' },
              { key: 'smart', icon: '⚡', color: 'from-yellow-400 to-orange-400' },
              { key: 'teens', icon: '💻', color: 'from-green-400 to-teal-400' },
              { key: 'leaders', icon: '🎯', color: 'from-purple-400 to-indigo-400' }
            ].map((guide) => {
              const guideData = t.parentGuides?.ageGroups?.[guide.key] || {
                title: `${guide.key} Guide`,
                ageRange: "Ages 4-18",
                description: "Comprehensive parent support guide"
              };
              return (
                <div key={guide.key} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className={`bg-gradient-to-r ${guide.color} p-6 text-white text-center`}>
                    <div className="text-5xl mb-2">{guide.icon}</div>
                    <h3 className="text-xl font-bold">{guideData.title}</h3>
                    <div className="text-white/90 font-medium">{guideData.ageRange}</div>
                  </div>
                  <div className="p-6">
                    <p className="text-gray-600 text-sm mb-4 min-h-[60px]">
                      {guideData.description}
                    </p>
                    <a
                      href={`${API}/parent-guides/${guide.key}/${language}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all text-center"
                      data-testid={`download-guide-${guide.key}`}
                    >
                      📥 {t.parentGuides?.downloadBtn || "Download Guide"} ({t.parentGuides?.fileSize || "PDF"})
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Note */}
          <div className="text-center mt-8">
            <p className="text-gray-500 text-sm italic max-w-2xl mx-auto">
              💡 {t.parentGuides?.note || "Guides are regularly updated to match our curriculum. Check back for the latest versions."}
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="text-2xl font-bold mb-2">{t.footer.company}</div>
          <div className="text-gray-400 mb-4">{t.footer.tagline}</div>
          <div className="text-purple-300">{t.footer.focus}</div>
          <div className="mt-8 text-sm text-gray-500">
            {t.footer.copyright}
          </div>
        </div>
      </footer>

      {/* Free Trial Modal */}
      <FreeTrialModal 
        isOpen={showFreeTrialModal} 
        onClose={() => setShowFreeTrialModal(false)} 
      />
    </div>
  );
};

export default PublicLanding;
