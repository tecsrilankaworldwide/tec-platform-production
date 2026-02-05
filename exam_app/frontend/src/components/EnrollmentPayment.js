import React, { useState } from 'react';
import { QrCode, Building2, CreditCard, CheckCircle } from 'lucide-react';

const EnrollmentPayment = ({ grade, onEnrollmentComplete }) => {
  const [enrollmentData, setEnrollmentData] = useState({
    student_name: '',
    parent_name: '',
    email: '',
    phone: '',
    grade: grade || 'grade_5',
    medium: 'sinhala'
  });
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setPaymentConfirmed(true);
    // In production, this would create the account after payment verification
  };

  const monthlyPricing = {
    'grade_2': 500,
    'grade_3': 600,
    'grade_4': 700,
    'grade_5': 800
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-3xl shadow-2xl p-8 border-4" style={{borderColor: '#F59E0B'}}>
        <h2 className="text-3xl font-extrabold mb-6 text-center" style={{color: '#92400E', fontFamily: 'Nunito'}}>
          📚 Enroll for Monthly Scholarship Exams
        </h2>

        {!paymentConfirmed ? (
          <>
            {/* Student Info Form */}
            <form onSubmit={handleSubmit} className="space-y-5 mb-8">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Student Name *</label>
                  <input
                    type="text"
                    value={enrollmentData.student_name}
                    onChange={(e) => setEnrollmentData({...enrollmentData, student_name: e.target.value})}
                    required
                    className="w-full px-4 py-3 border-3 border-yellow-300 rounded-xl focus:border-yellow-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Parent Name *</label>
                  <input
                    type="text"
                    value={enrollmentData.parent_name}
                    onChange={(e) => setEnrollmentData({...enrollmentData, parent_name: e.target.value})}
                    required
                    className="w-full px-4 py-3 border-3 border-yellow-300 rounded-xl focus:border-yellow-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    value={enrollmentData.email}
                    onChange={(e) => setEnrollmentData({...enrollmentData, email: e.target.value})}
                    required
                    className="w-full px-4 py-3 border-3 border-yellow-300 rounded-xl focus:border-yellow-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Phone *</label>
                  <input
                    type="tel"
                    value={enrollmentData.phone}
                    onChange={(e) => setEnrollmentData({...enrollmentData, phone: e.target.value})}
                    required
                    className="w-full px-4 py-3 border-3 border-yellow-300 rounded-xl focus:border-yellow-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Grade *</label>
                  <select
                    value={enrollmentData.grade}
                    onChange={(e) => setEnrollmentData({...enrollmentData, grade: e.target.value})}
                    className="w-full px-4 py-3 border-3 border-yellow-300 rounded-xl focus:border-yellow-500 focus:outline-none"
                  >
                    <option value="grade_2">Grade 2 - LKR {monthlyPricing.grade_2}/month</option>
                    <option value="grade_3">Grade 3 - LKR {monthlyPricing.grade_3}/month</option>
                    <option value="grade_4">Grade 4 - LKR {monthlyPricing.grade_4}/month</option>
                    <option value="grade_5">Grade 5 - LKR {monthlyPricing.grade_5}/month</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Medium *</label>
                  <select
                    value={enrollmentData.medium}
                    onChange={(e) => setEnrollmentData({...enrollmentData, medium: e.target.value})}
                    className="w-full px-4 py-3 border-3 border-yellow-300 rounded-xl focus:border-yellow-500 focus:outline-none"
                  >
                    <option value="sinhala">Sinhala (සිංහල)</option>
                    <option value="tamil">Tamil (தமிழ்)</option>
                  </select>
                </div>
              </div>

              {/* Pricing Display */}
              <div className="p-6 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl border-3" style={{borderColor: '#F59E0B'}}>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Monthly Subscription Fee:</p>
                  <p className="text-4xl font-extrabold mb-1" style={{color: '#92400E', fontFamily: 'Nunito'}}>LKR {monthlyPricing[enrollmentData.grade]}</p>
                  <p className="text-sm text-gray-600">Includes: Monthly exam + Progress reports + Teacher feedback</p>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-extrabold rounded-xl shadow-lg hover:shadow-xl text-lg"
                style={{fontFamily: 'Nunito'}}
              >
                Continue to Payment →
              </button>
            </form>
          </>
        ) : (
          <>
            {/* Payment Details */}
            <div className="space-y-6">
              <div className="bg-green-50 border-3 border-green-300 rounded-2xl p-6 text-center">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-green-800 mb-2">Enrollment Details Confirmed!</h3>
                <p className="text-green-700">Please complete payment to activate your account</p>
              </div>

              <div className="bg-white border-3 border-yellow-300 rounded-2xl p-6">
                <h3 className="text-xl font-bold mb-4" style={{color: '#92400E'}}>
                  <Building2 className="inline w-5 h-5 mr-2" />
                  Bank Transfer Details
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="font-semibold text-gray-700">Account Name:</span>
                    <span className="font-bold text-gray-900">TEC Sri Lanka Worldwide (Pvt.) Ltd</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="font-semibold text-gray-700">Bank:</span>
                    <span className="font-bold text-gray-900">Bank of Ceylon</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="font-semibold text-gray-700">Account Number:</span>
                    <span className="font-bold text-gray-900">0075715067</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="font-semibold text-gray-700">Branch:</span>
                    <span className="font-bold text-gray-900">Nugegoda</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="font-semibold text-gray-700">Amount:</span>
                    <span className="text-2xl font-extrabold" style={{color: '#F59E0B'}}>LKR {monthlyPricing[enrollmentData.grade]}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="font-semibold text-gray-700">Reference:</span>
                    <span className="font-bold text-gray-900">{enrollmentData.student_name} - {enrollmentData.grade.replace('_', ' ').toUpperCase()}</span>
                  </div>
                </div>
              </div>

              {/* QR Code Placeholder */}
              <div className="bg-white border-3 border-yellow-300 rounded-2xl p-6 text-center">
                <h3 className="text-xl font-bold mb-4" style={{color: '#92400E'}}>
                  <QrCode className="inline w-5 h-5 mr-2" />
                  Scan to Pay (LankaQR)
                </h3>
                <div className="w-64 h-64 bg-yellow-50 border-3 border-yellow-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <div className="text-center">
                    <QrCode className="w-20 h-20 text-yellow-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">QR Code Here</p>
                    <p className="text-xs text-gray-500">(TEC Worldwide QR)</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">Use any banking app to scan and pay</p>
              </div>

              <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-4">
                <p className="text-sm text-blue-800">
                  <strong>After Payment:</strong> WhatsApp payment slip to <strong>+94 77 XXX XXXX</strong> with student name. We'll activate your account within 24 hours!
                </p>
              </div>

              <button
                onClick={() => window.location.href = '/login'}
                className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-xl shadow-lg"
              >
                I've Made Payment → Go to Login
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EnrollmentPayment;
