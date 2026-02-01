import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Award, Download, ExternalLink, CheckCircle, Calendar, Share2, MessageCircle, Facebook, Twitter, Linkedin, Copy } from 'lucide-react';
import { triggerFireworks, triggerSchoolPride, triggerConfettiBurst } from './ConfettiEffects';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const CertificatesPage = ({ token, user }) => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);
  const [expandedShare, setExpandedShare] = useState(null);
  const [copiedCert, setCopiedCert] = useState(null);

  useEffect(() => {
    loadCertificates();
  }, [token]);

  const loadCertificates = async () => {
    try {
      const response = await axios.get(`${API}/certificates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCertificates(response.data.certificates || []);
    } catch (error) {
      console.error('Failed to load certificates:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadCertificate = async (certId) => {
    // Celebrate when downloading!
    triggerSchoolPride();
    setTimeout(() => triggerConfettiBurst({ particleCount: 80, spread: 70 }), 500);
    try {
      const response = await axios.get(`${API}/certificates/${certId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `TEC_Certificate_${certId.substring(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to download certificate:', error);
    }
  };

  const verifyCertificate = async () => {
    if (!verifyCode.trim()) return;
    
    try {
      const response = await axios.get(`${API}/certificates/verify/${verifyCode}`);
      setVerifyResult(response.data);
    } catch (error) {
      setVerifyResult({ valid: false, message: 'Certificate not found' });
    }
  };

  const getShareUrl = (certNumber) => {
    const baseUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;
    return `${baseUrl}/certificates/share/${certNumber}`;
  };

  const copyShareLink = (certNumber) => {
    const shareUrl = getShareUrl(certNumber);
    navigator.clipboard.writeText(shareUrl);
    setCopiedCert(certNumber);
    setTimeout(() => setCopiedCert(null), 2000);
  };

  const shareViaWhatsApp = (cert) => {
    const certNumber = cert.certificate_number || cert.verification_code;
    const shareUrl = getShareUrl(certNumber);
    const message = `🎓 I just earned a TEC Certificate! Check it out: ${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const shareViaFacebook = (cert) => {
    const certNumber = cert.certificate_number || cert.verification_code;
    const shareUrl = getShareUrl(certNumber);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const shareViaTwitter = (cert) => {
    const certNumber = cert.certificate_number || cert.verification_code;
    const shareUrl = getShareUrl(certNumber);
    const text = `🎓 I just earned my TEC Certificate! #TecaiKids #FutureReady`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const shareViaLinkedIn = (cert) => {
    const certNumber = cert.certificate_number || cert.verification_code;
    const shareUrl = getShareUrl(certNumber);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse text-xl text-slate-600">Loading certificates...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 font-nunito mb-2">🏆 My Certificates</h1>
          <p className="text-slate-600">Your achievements and accomplishments</p>
        </div>

        {/* Certificates Grid */}
        {certificates.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-100 hover:shadow-xl transition-all"
              >
                {/* Certificate Preview Header */}
                <div className="bg-gradient-to-r from-[#667eea] to-[#764ba2] p-6 text-white">
                  <div className="flex items-center justify-between">
                    <Award className="w-10 h-10" />
                    {cert.grade && (
                      <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                        Grade: {cert.grade}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold mt-4">{cert.course_title || cert.course_name}</h3>
                  <p className="text-purple-100 text-sm mt-1">Certificate of Completion</p>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-2 text-slate-600 mb-4">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">
                      Issued: {(() => {
                        const dateStr = cert.issued_date || cert.completion_date;
                        if (!dateStr) return 'N/A';
                        const date = new Date(dateStr);
                        return isNaN(date.getTime()) ? dateStr : date.toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        });
                      })()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-600 mb-4">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">
                      Verification Code: <code className="bg-slate-100 px-2 py-1 rounded">{cert.certificate_number || cert.verification_code || 'N/A'}</code>
                    </span>
                  </div>

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => downloadCertificate(cert.id)}
                      className="flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-full font-bold hover:shadow-lg transition-all"
                      data-testid={`download-cert-${cert.id}`}
                    >
                      <Download className="w-4 h-4" />
                      Download PDF
                    </button>
                    
                    {/* Share Button */}
                    <button
                      onClick={() => setExpandedShare(expandedShare === cert.id ? null : cert.id)}
                      className="flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full font-bold hover:shadow-lg transition-all"
                      data-testid={`share-cert-${cert.id}`}
                    >
                      <Share2 className="w-4 h-4" />
                      Share Certificate
                    </button>
                    
                    {/* Share Options */}
                    {expandedShare === cert.id && (
                      <div className="mt-2 p-4 bg-gray-50 rounded-xl space-y-2 animate-in fade-in slide-in-from-top duration-200">
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => shareViaWhatsApp(cert)}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all text-sm font-medium"
                            data-testid={`share-whatsapp-${cert.id}`}
                          >
                            <MessageCircle className="w-4 h-4" />
                            WhatsApp
                          </button>
                          
                          <button
                            onClick={() => shareViaFacebook(cert)}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-medium"
                            data-testid={`share-facebook-${cert.id}`}
                          >
                            <Facebook className="w-4 h-4" />
                            Facebook
                          </button>
                          
                          <button
                            onClick={() => shareViaTwitter(cert)}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-all text-sm font-medium"
                            data-testid={`share-twitter-${cert.id}`}
                          >
                            <Twitter className="w-4 h-4" />
                            Twitter
                          </button>
                          
                          <button
                            onClick={() => shareViaLinkedIn(cert)}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-all text-sm font-medium"
                            data-testid={`share-linkedin-${cert.id}`}
                          >
                            <Linkedin className="w-4 h-4" />
                            LinkedIn
                          </button>
                        </div>
                        
                        <button
                          onClick={() => copyShareLink(cert.certificate_number || cert.verification_code)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all text-sm font-medium"
                          data-testid={`copy-link-${cert.id}`}
                        >
                          <Copy className="w-4 h-4" />
                          {copiedCert === (cert.certificate_number || cert.verification_code) ? 'Link Copied!' : 'Copy Share Link'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center mb-12">
            <div className="text-6xl mb-4">📜</div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No Certificates Yet</h3>
            <p className="text-slate-600 mb-6">Complete courses to earn your first certificate!</p>
            <a
              href="/courses"
              className="inline-block py-3 px-8 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-full font-bold hover:shadow-lg transition-all"
            >
              Browse Courses
            </a>
          </div>
        )}

        {/* Certificate Verification */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-500" />
            Verify a Certificate
          </h3>

          <div className="flex gap-4 mb-6">
            <input
              type="text"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value.toUpperCase())}
              placeholder="Enter verification code"
              className="flex-1 p-4 rounded-xl border-2 border-slate-200 focus:border-purple-500 focus:outline-none font-mono uppercase"
              data-testid="verify-code-input"
            />
            <button
              onClick={verifyCertificate}
              className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full font-bold hover:shadow-lg transition-all"
              data-testid="verify-cert-btn"
            >
              Verify
            </button>
          </div>

          {verifyResult && (
            <div className={`p-6 rounded-xl ${
              verifyResult.valid
                ? 'bg-green-50 border-2 border-green-200'
                : 'bg-red-50 border-2 border-red-200'
            }`}>
              {verifyResult.valid ? (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <span className="font-bold text-green-800">Certificate Verified!</span>
                  </div>
                  <div className="space-y-2 text-sm text-green-700">
                    <p><span className="font-medium">Student:</span> {verifyResult.student_name}</p>
                    <p><span className="font-medium">Course:</span> {verifyResult.course_title || verifyResult.course_name}</p>
                    <p><span className="font-medium">Completed:</span> {(() => {
                      const dateStr = verifyResult.issued_date || verifyResult.completion_date;
                      if (!dateStr) return 'N/A';
                      const date = new Date(dateStr);
                      return isNaN(date.getTime()) ? dateStr : date.toLocaleDateString();
                    })()}</p>
                    {verifyResult.grade && <p><span className="font-medium">Grade:</span> {verifyResult.grade}</p>}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-red-600">❌</span>
                  <span className="text-red-800">{verifyResult.message || 'Certificate not found'}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CertificatesPage;
