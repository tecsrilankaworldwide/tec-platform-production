import React, { useState } from 'react';
import axios from 'axios';
import { useLanguage } from './LanguageContext';
import { translations } from './translations';
import LanguageSwitcher from './LanguageSwitcher';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PublicLanding = () => {
  const { language } = useLanguage();
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
  const [paymentMethod, setPaymentMethod] = useState('stripe'); // 'stripe' or 'bank'
  const [isProcessing, setIsProcessing] = useState(false);
  const [showBankDetails, setShowBankDetails] = useState(false);

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
      name: 'Young Explorers Discovery',
      ageRange: 'Ages 7-9',
      subtitle: 'Discovery Excellence',
      monthly: 1200,
      quarterly: 4200,
      savings: 900,
      features: [
        'Advanced Mathematics & Statistics',
        'Virtual Science Laboratory',
        'Critical Reading & Analysis',
        'Intermediate Logical Thinking',
        'Digital Art & Design',
        'AI-Powered Progress Tracking',
        'Peer Learning Networks'
      ]
    },
    {
      id: 'smart',
      emoji: '⚡',
      name: 'Smart Kids Mastery',
      ageRange: 'Ages 10-12',
      subtitle: 'Mastery Excellence',
      monthly: 1500,
      quarterly: 5250,
      savings: 1250,
      features: [
        'Higher Mathematics & Calculus Prep',
        'Professional Coding Fundamentals',
        'Real-World STEM Projects',
        'Advanced Logical Reasoning',
        'Algorithmic Thinking Mastery',
        'Critical Problem-Solving',
        'Mentor-Guided Learning'
      ]
    },
    {
      id: 'teens',
      emoji: '💻',
      name: 'Tech Teens Professional',
      ageRange: 'Ages 13-15',
      subtitle: 'Professional Excellence',
      monthly: 2000,
      quarterly: 7000,
      savings: 1500,
      features: [
        'Professional Programming Languages',
        'Full-Stack Web Development',
        'Mobile App Development',
        'Advanced Algorithmic Design',
        'Industry-Level Projects',
        'Tech Career Preparation',
        '1-on-1 Industry Mentorship'
      ]
    },
    {
      id: 'leaders',
      emoji: '🎯',
      name: 'Future Leaders Mastery',
      ageRange: 'Ages 16-18',
      subtitle: 'Leadership Excellence',
      monthly: 2500,
      quarterly: 8750,
      savings: 2250,
      features: [
        'AI & Machine Learning Mastery',
        'Enterprise App Development',
        'Advanced Data Science',
        'Complex Algorithmic Systems',
        'Leadership & Entrepreneurship',
        'Global Career Preparation',
        'Executive Mentorship Program'
      ]
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
      {/* Hero Section */}
      <header className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="inline-flex items-center bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full mb-6">
              <span className="text-2xl mr-2">🏆</span>
              <span className="font-semibold">Sri Lanka's Premier Educational Platform</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Empowering <span className="text-yellow-300">Future Leaders</span>
              <br />
              Professional Education Ages 4-18
            </h1>
            <p className="text-xl text-blue-100 max-w-4xl mx-auto mb-8">
              World-class education platform featuring logical thinking, algorithmic reasoning, 
              coding, AI, and career preparation. Designed specifically for Sri Lankan excellence 
              with expert curriculum and cutting-edge technology.
            </p>
            <div className="flex justify-center space-x-4">
              <button 
                onClick={() => document.getElementById('programs').scrollIntoView({ behavior: 'smooth' })}
                className="bg-yellow-400 text-purple-900 px-8 py-4 rounded-lg font-bold text-lg hover:bg-yellow-300 transition-all transform hover:scale-105"
                data-testid="start-excellence-btn"
              >
                Start Excellence Journey 🚀
              </button>
              <button 
                onClick={() => document.getElementById('programs').scrollIntoView({ behavior: 'smooth' })}
                className="bg-white text-purple-700 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-all"
              >
                Explore Programs
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
            {[
              { number: '10,000+', label: 'Students Enrolled' },
              { number: '99%', label: 'Success Rate' },
              { number: '25+', label: 'Expert Educators' },
              { number: '24/7', label: 'Learning Support' }
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
                  {selectedProgram.emoji} Enroll in {selectedProgram.name}
                </h3>
                <p className="text-gray-600">{selectedProgram.ageRange}</p>
              </div>
              <button 
                onClick={() => setShowEnrollment(false)}
                className="text-gray-400 hover:text-gray-600 text-3xl"
                data-testid="close-enrollment-btn"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleEnrollSubmit} className="space-y-4">
              {/* Payment Method Selection */}
              {!showBankDetails && (
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
                        <div className="font-bold text-gray-800">💳 Credit/Debit Card</div>
                        <div className="text-sm text-gray-600">Instant payment via Stripe (Visa, Mastercard, Amex)</div>
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
                        <div className="font-bold text-gray-800">🏦 Bank Transfer</div>
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

              {/* Billing Cycle Selection */}
              {!showBankDetails && (
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
              {!showBankDetails && (
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

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-lg font-bold text-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="proceed-payment-btn"
                >
                  {isProcessing ? 'Processing...' : paymentMethod === 'bank' ? 'Get Bank Transfer Details' : `Proceed to Secure Payment - LKR ${billingCycle === 'monthly' ? selectedProgram.monthly : selectedProgram.quarterly}`}
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
                ⚡ Quick Payment Option
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                Pay Now, Register Later
              </h2>
              <p className="text-gray-600 text-lg">
                Perfect for outstation customers! Pay first, complete registration via WhatsApp
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Bank Details */}
              <div className="bg-blue-50 p-6 rounded-xl">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  🏦 Bank Transfer Details
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-700">Bank:</span>
                    <span className="text-gray-900">Bank of Ceylon</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-700">Account Name:</span>
                    <span className="text-gray-900 text-right">TEC Sri Lanka Worldwide</span>
                  </div>
                  <div className="flex justify-between items-center bg-white p-3 rounded-lg">
                    <span className="font-semibold text-gray-700">Account Number:</span>
                    <span className="text-2xl font-bold text-blue-700">0075715067</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-700">Branch:</span>
                    <span className="text-gray-900">Nugegoda</span>
                  </div>
                </div>
              </div>

              {/* QR Code Section */}
              <div className="bg-purple-50 p-6 rounded-xl text-center">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  📱 Scan & Pay (LankaQR)
                </h3>
                <div className="bg-white p-6 rounded-lg mb-4 min-h-[200px] flex items-center justify-center">
                  <div className="text-gray-400 text-center">
                    <div className="text-6xl mb-2">🏦</div>
                    <div className="text-sm">QR Code Coming Soon!</div>
                    <div className="text-xs mt-1">Available Tomorrow</div>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Scan with any Sri Lankan banking app for instant payment
                </p>
              </div>
            </div>

            {/* Pricing Quick Reference */}
            <div className="mt-8 bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-xl">
              <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">💰 Program Pricing</h3>
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
                💚 Quarterly plans: Save 25%
              </div>
            </div>

            {/* Instructions */}
            <div className="mt-8 bg-yellow-50 border-2 border-yellow-300 p-6 rounded-xl">
              <h3 className="text-lg font-bold text-gray-800 mb-3">📋 How It Works:</h3>
              <ol className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="bg-yellow-400 text-yellow-900 rounded-full w-6 h-6 flex items-center justify-center font-bold mr-3 flex-shrink-0">1</span>
                  <span><strong>Make Payment:</strong> Transfer to account 0075715067 or use QR code</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-yellow-400 text-yellow-900 rounded-full w-6 h-6 flex items-center justify-center font-bold mr-3 flex-shrink-0">2</span>
                  <span><strong>Take Photo:</strong> Screenshot/photo of bank receipt or online transfer confirmation</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-yellow-400 text-yellow-900 rounded-full w-6 h-6 flex items-center justify-center font-bold mr-3 flex-shrink-0">3</span>
                  <span><strong>WhatsApp Us:</strong> Send receipt + student details (name, age, parent contact)</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-yellow-400 text-yellow-900 rounded-full w-6 h-6 flex items-center justify-center font-bold mr-3 flex-shrink-0">4</span>
                  <span><strong>Get Registered:</strong> We'll complete registration and send login details!</span>
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
                WhatsApp Payment Receipt: +94 77 977 9668
              </a>
              <p className="text-sm text-gray-600 mt-3">
                💬 Available 9 AM - 6 PM (Mon-Sat)
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section id="programs" className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="inline-block bg-purple-100 text-purple-700 px-6 py-2 rounded-full font-semibold mb-4">
            Professional Learning Tracks
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Excellence Programs <span className="text-purple-600">Ages 4-18</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Scientifically-designed curriculum that evolves with your child, ensuring mastery at every stage 
            and preparing them for global opportunities.
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
                <h3 className="text-2xl font-bold mb-2">{program.name}</h3>
                <div className="text-blue-100">{program.ageRange} | {program.subtitle}</div>
              </div>

              <div className="p-6">
                <div className="mb-6">
                  <div className="text-3xl font-bold text-purple-700 mb-1">
                    LKR {program.monthly.toLocaleString()}/month
                  </div>
                  <div className="text-lg text-green-600 font-semibold">
                    LKR {program.quarterly.toLocaleString()}/quarterly
                  </div>
                  <div className="text-sm text-gray-600">
                    Save LKR {program.savings.toLocaleString()} ({Math.round((program.savings / (program.monthly * 3)) * 100)}% savings)
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {program.features.map((feature, idx) => (
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
                  Enroll Now →
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
              World-Class Excellence
            </div>
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Why <span className="text-purple-600">TecaiKids</span> Leads Sri Lanka
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: '🧠',
                title: 'AI-Powered Personalization',
                description: 'Advanced machine learning algorithms customize every lesson to your child\'s learning style.'
              },
              {
                icon: '🎓',
                title: 'Expert Curriculum Design',
                description: 'Content developed by NIE-trained educators and international experts.'
              },
              {
                icon: '🌍',
                title: 'Global Career Readiness',
                description: 'Preparing students for international opportunities while strengthening Sri Lankan identity.'
              },
              {
                icon: '💎',
                title: 'Premium Learning Experience',
                description: 'High-quality interactive content and immersive experiences that inspire excellence.'
              },
              {
                icon: '📊',
                title: 'Advanced Analytics',
                description: 'Comprehensive progress tracking and detailed analytics for optimal learning outcomes.'
              },
              {
                icon: '🤝',
                title: 'Expert Mentorship',
                description: 'Connect with industry professionals through our exclusive learning community.'
              }
            ].map((feature, idx) => (
              <div key={idx} className="text-center p-6">
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="text-2xl font-bold mb-2">🏫 TEC Sri Lanka Worldwide (Pvt.) Ltd</div>
          <div className="text-gray-400 mb-4">42 Years of Educational Excellence • Est. 1982</div>
          <div className="text-purple-300">Computers • Robotics • AI Future</div>
          <div className="mt-8 text-sm text-gray-500">
            © 2025 TEC Sri Lanka Worldwide. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLanding;
