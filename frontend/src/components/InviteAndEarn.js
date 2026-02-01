import React, { useState, useEffect } from 'react';
import { useAuth, API } from './auth/AuthContext';
import axios from 'axios';
import { Copy, Share2, MessageCircle, Facebook, Twitter, Linkedin, TrendingUp, Users, Gift, Sparkles } from 'lucide-react';

const InviteAndEarn = () => {
  const { user, token } = useAuth();
  const [referralData, setReferralData] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    try {
      setLoading(true);
      
      // Get or create referral code
      const codeResponse = await axios.post(
        `${API}/referrals/code`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReferralData(codeResponse.data);

      // Get referral stats
      const statsResponse = await axios.get(
        `${API}/referrals/stats`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStats(statsResponse.data);
    } catch (error) {
      console.error('Error loading referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (referralData?.referral_link) {
      navigator.clipboard.writeText(referralData.referral_link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareViaWhatsApp = () => {
    const message = `Hey! 🚀 Join me at TecaiKids - the best platform for future-ready learning! Sign up using my link and let's learn together: ${referralData?.referral_link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const shareViaFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralData?.referral_link)}`, '_blank');
  };

  const shareViaTwitter = () => {
    const text = `Join me at TecaiKids - Building future-ready kids! 🎓✨`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralData?.referral_link)}`, '_blank');
  };

  const shareViaLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralData?.referral_link)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-64 bg-gray-200 rounded-3xl"></div>
            <div className="h-48 bg-gray-200 rounded-3xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{background: 'linear-gradient(135deg, #E6E6FA 0%, #FFD6E8 50%, #D4F4E7 100%)'}}>
      <div className="max-w-6xl mx-auto p-6">
        
        {/* Floating Decorative Shapes */}
        <div className="floating-shapes">
          <div className="shape shape-circle shape-1" style={{background: 'var(--pastel-purple)'}}></div>
          <div className="shape shape-circle shape-2" style={{background: 'var(--pastel-pink)'}}></div>
          <div className="shape shape-circle shape-3" style={{background: 'var(--pastel-mint)'}}></div>
        </div>
        
        {/* Header */}
        <div className="text-center mb-12 relative z-10 fade-in-up">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-md text-purple-700 px-8 py-4 rounded-full mb-6 shadow-lg border-3" style={{borderColor: 'var(--pastel-purple)', borderWidth: '3px'}}>
            <Gift className="w-6 h-6" />
            <span className="font-extrabold text-lg" style={{fontFamily: 'var(--font-primary)'}}>Invite Friends & Earn Rewards</span>
          </div>
          <h1 className="text-6xl font-extrabold mb-6" style={{fontFamily: 'var(--font-primary)', color: 'var(--text-dark)'}}>
            Share the Magic of<br/>
            <span style={{background: 'linear-gradient(135deg, #A78BFA, #F472B6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
              Learning Together! ✨
            </span>
          </h1>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed">
            Invite your friends to join TecaiKids and earn amazing rewards! 
            The more friends who join, the more XP you collect! 🎁
          </p>
        </div>

        {/* Stats Cards - Soft Pastel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 relative z-10">
          <div className="bg-white rounded-3xl p-8 shadow-xl border-4 hover:shadow-2xl transition-all duration-300 hover:scale-105" style={{borderColor: 'var(--pastel-sky)'}} data-testid="referral-clicks-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{background: 'var(--pastel-sky)'}}>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{background: 'var(--pastel-sky)'}}>
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="text-5xl font-extrabold mb-2" style={{color: 'var(--text-dark)', fontFamily: 'var(--font-primary)'}}>{stats?.total_clicks || 0}</div>
            <div className="text-gray-600 font-semibold text-lg">Friends Who Clicked</div>
            <p className="text-sm text-gray-500 mt-2">People interested in joining! 👀</p>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-xl border-4 hover:shadow-2xl transition-all duration-300 hover:scale-105" style={{borderColor: 'var(--pastel-mint)'}} data-testid="referral-signups-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{background: 'var(--pastel-mint)'}}>
                <Sparkles className="w-8 h-8 text-green-600" />
              </div>
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{background: 'var(--pastel-mint)'}}>
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="text-5xl font-extrabold mb-2" style={{color: 'var(--text-dark)', fontFamily: 'var(--font-primary)'}}>{stats?.total_conversions || 0}</div>
            <div className="text-gray-600 font-semibold text-lg">Friends Joined!</div>
            <p className="text-sm text-gray-500 mt-2">New learners you helped! 🎓</p>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-xl border-4 hover:shadow-2xl transition-all duration-300 hover:scale-105" style={{borderColor: 'var(--pastel-peach)', background: 'linear-gradient(135deg, #FFE5D4, #FFD6E8)'}} data-testid="referral-rewards-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-white/60 backdrop-blur-sm">
                <Gift className="w-8 h-8 text-orange-600" />
              </div>
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white/60 backdrop-blur-sm">
                <Sparkles className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="text-5xl font-extrabold mb-2 text-orange-700" style={{fontFamily: 'var(--font-primary)'}}>{stats?.total_rewards || 0} XP</div>
            <div className="text-orange-800 font-semibold text-lg">Rewards Earned!</div>
            <p className="text-sm text-orange-700 mt-2">Keep sharing to earn more! 🌟</p>
          </div>
        </div>

        {/* Referral Link Card - Soft Pastel */}
        <div className="bg-white rounded-3xl shadow-2xl p-10 md:p-12 mb-12 border-4 relative z-10 fade-in-up" style={{borderColor: 'var(--pastel-purple)'}}>
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg" style={{background: 'linear-gradient(135deg, var(--vibrant-purple), var(--vibrant-pink))'}}>
              <Share2 className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-3xl font-extrabold" style={{color: 'var(--text-dark)', fontFamily: 'var(--font-primary)'}}>
              Your Magic Referral Link ✨
            </h2>
          </div>
          
          <div className="rounded-3xl p-8 mb-6" style={{background: 'var(--gradient-lavender-mint)'}}>
            <div className="flex flex-col md:flex-row items-stretch gap-4">
              <input
                type="text"
                value={referralData?.referral_link || ''}
                readOnly
                className="flex-1 px-6 py-5 bg-white/90 backdrop-blur-sm rounded-2xl font-mono text-sm shadow-md border-3 focus:outline-none"
                style={{borderColor: 'var(--pastel-purple)'}}
                data-testid="referral-link-input"
              />
              <button
                onClick={copyToClipboard}
                className="px-10 py-5 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center justify-center gap-3"
                style={{background: 'linear-gradient(135deg, var(--vibrant-purple), var(--vibrant-pink))', fontFamily: 'var(--font-primary)', fontSize: '18px'}}
                data-testid="copy-link-button"
              >
                <Copy className="w-5 h-5" />
                {copied ? '✓ Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-xl font-bold mb-6" style={{color: 'var(--text-dark)', fontFamily: 'var(--font-primary)'}}>
              Share with Friends 💌
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={shareViaWhatsApp}
                className="flex items-center justify-center gap-2 px-6 py-5 text-white font-bold rounded-2xl transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg"
                style={{background: 'linear-gradient(135deg, #25D366, #128C7E)', fontFamily: 'var(--font-primary)'}}
                data-testid="share-whatsapp-button"
              >
                <MessageCircle className="w-5 h-5" />
                WhatsApp
              </button>
              
              <button
                onClick={shareViaFacebook}
                className="flex items-center justify-center gap-2 px-6 py-5 text-white font-bold rounded-2xl transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg"
                style={{background: 'linear-gradient(135deg, #4267B2, #1877F2)', fontFamily: 'var(--font-primary)'}}
                data-testid="share-facebook-button"
              >
                <Facebook className="w-5 h-5" />
                Facebook
              </button>
              
              <button
                onClick={shareViaTwitter}
                className="flex items-center justify-center gap-2 px-6 py-5 text-white font-bold rounded-2xl transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg"
                style={{background: 'linear-gradient(135deg, #1DA1F2, #0A7CBA)', fontFamily: 'var(--font-primary)'}}
                data-testid="share-twitter-button"
              >
                <Twitter className="w-5 h-5" />
                Twitter
              </button>
              
              <button
                onClick={shareViaLinkedIn}
                className="flex items-center justify-center gap-2 px-6 py-5 text-white font-bold rounded-2xl transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg"
                style={{background: 'linear-gradient(135deg, #0077B5, #005582)', fontFamily: 'var(--font-primary)'}}
                data-testid="share-linkedin-button"
              >
                <Linkedin className="w-5 h-5" />
                LinkedIn
              </button>
            </div>
          </div>
        </div>

        {/* How It Works - Soft Pastel */}
        <div className="bg-white rounded-3xl shadow-xl p-10 md:p-12 border-4 mb-12 relative z-10 fade-in-up" style={{borderColor: 'var(--pastel-pink)'}}>
          <h2 className="text-4xl font-extrabold text-center mb-12" style={{color: 'var(--text-dark)', fontFamily: 'var(--font-primary)'}}>
            How It Works 🌈
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="text-center">
              <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg" style={{background: 'var(--pastel-sky)'}}>
                <span className="text-5xl">📤</span>
              </div>
              <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-extrabold shadow-md" style={{background: 'var(--vibrant-sky)', fontFamily: 'var(--font-primary)'}}>1</div>
              <h3 className="text-2xl font-extrabold mb-4" style={{color: 'var(--text-dark)', fontFamily: 'var(--font-primary)'}}>Share Your Link</h3>
              <p className="text-gray-600 leading-relaxed text-base">Copy your special referral link and share it with friends on WhatsApp, Facebook, or any social media! 💌</p>
            </div>
            
            <div className="text-center">
              <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg" style={{background: 'var(--pastel-mint)'}}>
                <span className="text-5xl">🎓</span>
              </div>
              <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-extrabold shadow-md" style={{background: 'var(--vibrant-mint)', fontFamily: 'var(--font-primary)'}}>2</div>
              <h3 className="text-2xl font-extrabold mb-4" style={{color: 'var(--text-dark)', fontFamily: 'var(--font-primary)'}}>Friends Join!</h3>
              <p className="text-gray-600 leading-relaxed text-base">When your friends sign up using your link, they start their learning journey and you both win! 🚀</p>
            </div>
            
            <div className="text-center">
              <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg" style={{background: 'var(--pastel-peach)'}}>
                <span className="text-5xl">🎁</span>
              </div>
              <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-extrabold shadow-md" style={{background: 'var(--vibrant-coral)', fontFamily: 'var(--font-primary)'}}>3</div>
              <h3 className="text-2xl font-extrabold mb-4" style={{color: 'var(--text-dark)', fontFamily: 'var(--font-primary)'}}>Earn Rewards!</h3>
              <p className="text-gray-600 leading-relaxed text-base">Get 100 XP instantly for each friend who joins! Unlock badges and climb the leaderboard! 🏆</p>
            </div>
          </div>
        </div>

        {/* Referral Code Badge - Cute Design */}
        <div className="text-center relative z-10 bounce-in">
          <div className="inline-flex items-center gap-4 bg-white rounded-3xl px-10 py-6 shadow-xl border-4" style={{borderColor: 'var(--pastel-purple)'}}>
            <span className="text-gray-600 font-semibold text-lg" style={{fontFamily: 'var(--font-secondary)'}}>Your Code:</span>
            <span className="text-4xl font-extrabold px-6 py-2 rounded-2xl" style={{background: 'var(--pastel-purple)', color: '#6B46C1', fontFamily: 'var(--font-primary)'}} data-testid="referral-code-display">
              {referralData?.referral_code}
            </span>
            <span className="text-3xl">✨</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteAndEarn;
