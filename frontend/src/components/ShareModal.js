import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

const ShareModal = ({ isOpen, onClose, course, siteUrl = 'https://www.tecaikids.com' }) => {
  const [copied, setCopied] = useState(false);
  
  if (!isOpen) return null;

  // Generate course-specific URL
  const courseUrl = course?.id 
    ? `${siteUrl}/courses/${course.id}` 
    : siteUrl;
  
  const shareTitle = course?.title || 'TEC Future-Ready Learning';
  const shareDescription = course?.description || 'Prepare for tomorrow\'s world with TEC AI Kids';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(courseUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleWhatsAppShare = () => {
    const text = `Check out "${shareTitle}" on TEC AI Kids! ${courseUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleFacebookShare = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(courseUrl)}`, '_blank');
  };

  const handleTwitterShare = () => {
    const text = `Check out "${shareTitle}" on @TECAIKids!`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(courseUrl)}`, '_blank');
  };

  const handleEmailShare = () => {
    const subject = `Check out this course: ${shareTitle}`;
    const body = `I found this amazing course on TEC AI Kids:\n\n${shareTitle}\n${shareDescription}\n\nLearn more: ${courseUrl}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
      data-testid="share-modal-overlay"
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        data-testid="share-modal-content"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold" data-testid="share-modal-title">Share Course</h2>
              <p className="text-purple-100 text-sm mt-1">Spread the knowledge!</p>
            </div>
            <button 
              onClick={onClose}
              className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors"
              data-testid="share-modal-close-btn"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Course Info */}
          {course && (
            <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-100">
              <div className="flex items-center">
                <span className="text-3xl mr-3">{course.icon || '📚'}</span>
                <div>
                  <h3 className="font-bold text-gray-800 line-clamp-1" data-testid="share-course-title">
                    {course.title}
                  </h3>
                  <p className="text-sm text-gray-600">Ages {course.age_group}</p>
                </div>
              </div>
            </div>
          )}

          {/* QR Code */}
          <div className="flex flex-col items-center mb-6">
            <div className="bg-white p-4 rounded-2xl shadow-lg border-2 border-purple-100" data-testid="qr-code-container">
              <QRCodeSVG 
                value={courseUrl}
                size={180}
                level="H"
                includeMargin={true}
                bgColor="#ffffff"
                fgColor="#4c1d95"
                imageSettings={{
                  src: "https://avatars.githubusercontent.com/u/233532814",
                  x: undefined,
                  y: undefined,
                  height: 35,
                  width: 35,
                  excavate: true,
                }}
              />
            </div>
            <p className="text-gray-500 text-sm mt-3 text-center">
              Scan QR code to access the course
            </p>
          </div>

          {/* Copy Link */}
          <div className="mb-6">
            <div className="flex items-center bg-gray-100 rounded-xl overflow-hidden">
              <input 
                type="text" 
                value={courseUrl}
                readOnly
                className="flex-1 bg-transparent px-4 py-3 text-sm text-gray-700 outline-none"
                data-testid="share-url-input"
              />
              <button
                onClick={handleCopyLink}
                className={`px-4 py-3 font-medium transition-all ${
                  copied 
                    ? 'bg-green-500 text-white' 
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
                data-testid="copy-link-btn"
              >
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div className="grid grid-cols-4 gap-3">
            <button
              onClick={handleWhatsAppShare}
              className="flex flex-col items-center p-3 bg-green-50 hover:bg-green-100 rounded-xl transition-colors group"
              data-testid="share-whatsapp-btn"
            >
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <span className="text-xs font-medium text-gray-700">WhatsApp</span>
            </button>

            <button
              onClick={handleFacebookShare}
              className="flex flex-col items-center p-3 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors group"
              data-testid="share-facebook-btn"
            >
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </div>
              <span className="text-xs font-medium text-gray-700">Facebook</span>
            </button>

            <button
              onClick={handleTwitterShare}
              className="flex flex-col items-center p-3 bg-sky-50 hover:bg-sky-100 rounded-xl transition-colors group"
              data-testid="share-twitter-btn"
            >
              <div className="w-10 h-10 bg-sky-500 rounded-full flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </div>
              <span className="text-xs font-medium text-gray-700">Twitter</span>
            </button>

            <button
              onClick={handleEmailShare}
              className="flex flex-col items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors group"
              data-testid="share-email-btn"
            >
              <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
              </div>
              <span className="text-xs font-medium text-gray-700">Email</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t">
          <p className="text-center text-sm text-gray-500">
            Share TEC AI Kids with friends and family!
          </p>
        </div>
      </div>

      <style>{`
        @keyframes scale-in {
          0% {
            opacity: 0;
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ShareModal;
