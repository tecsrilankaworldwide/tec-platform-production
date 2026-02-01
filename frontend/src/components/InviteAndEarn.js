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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-full mb-4">
            <Gift className="w-5 h-5" />
            <span className="font-bold">Invite & Earn Rewards</span>
          </div>
          <h1 className="text-5xl font-extrabold text-gray-800 mb-4">
            Share the <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Gift of Learning</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Invite your friends to TecaiKids and earn rewards when they join! Help build a community of future-ready learners.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-purple-100" data-testid="referral-clicks-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center">
                <Users className="w-7 h-7 text-blue-600" />
              </div>
              <TrendingUp className="w-6 h-6 text-blue-500" />
            </div>
            <div className="text-4xl font-extrabold text-gray-800 mb-2">{stats?.total_clicks || 0}</div>
            <div className="text-gray-600 font-medium">Total Clicks</div>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-green-100" data-testid="referral-signups-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-green-600" />
              </div>
              <TrendingUp className="w-6 h-6 text-green-500" />
            </div>
            <div className="text-4xl font-extrabold text-gray-800 mb-2">{stats?.total_conversions || 0}</div>
            <div className="text-gray-600 font-medium">Successful Signups</div>
          </div>

          <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl p-8 shadow-xl text-white" data-testid="referral-rewards-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                <Gift className="w-7 h-7 text-white" />
              </div>
              <Sparkles className="w-6 h-6 text-white/80" />
            </div>
            <div className="text-4xl font-extrabold mb-2">{stats?.total_rewards || 0} XP</div>
            <div className="text-white/90 font-medium">Total Rewards Earned</div>
          </div>
        </div>

        {/* Referral Link Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 mb-8 border-2 border-purple-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center">
              <Share2 className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Your Referral Link</h2>
          </div>
          
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 mb-6">
            <div className="flex flex-col md:flex-row items-stretch gap-4">
              <input
                type="text"
                value={referralData?.referral_link || ''}
                readOnly
                className="flex-1 px-6 py-4 bg-white border-2 border-purple-200 rounded-xl font-mono text-sm focus:outline-none focus:border-purple-400"
                data-testid="referral-link-input"
              />
              <button
                onClick={copyToClipboard}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2"
                data-testid="copy-link-button"
              >
                <Copy className="w-5 h-5" />
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Share via Social Media</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={shareViaWhatsApp}
                className="flex items-center justify-center gap-2 px-6 py-4 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-all duration-200 hover:scale-105"
                data-testid="share-whatsapp-button"
              >
                <MessageCircle className="w-5 h-5" />
                WhatsApp
              </button>
              
              <button
                onClick={shareViaFacebook}
                className="flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all duration-200 hover:scale-105"
                data-testid="share-facebook-button"
              >
                <Facebook className="w-5 h-5" />
                Facebook
              </button>
              
              <button
                onClick={shareViaTwitter}
                className="flex items-center justify-center gap-2 px-6 py-4 bg-sky-500 text-white font-bold rounded-xl hover:bg-sky-600 transition-all duration-200 hover:scale-105"
                data-testid="share-twitter-button"
              >
                <Twitter className="w-5 h-5" />
                Twitter
              </button>
              
              <button
                onClick={shareViaLinkedIn}
                className="flex items-center justify-center gap-2 px-6 py-4 bg-blue-700 text-white font-bold rounded-xl hover:bg-blue-800 transition-all duration-200 hover:scale-105"
                data-testid="share-linkedin-button"
              >
                <Linkedin className="w-5 h-5" />
                LinkedIn
              </button>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border-2 border-purple-100">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">📤</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">1. Share Your Link</h3>
              <p className="text-gray-600">Copy your unique referral link and share it with friends via social media or messaging apps.</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🎓</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">2. Friends Join</h3>
              <p className="text-gray-600">When your friends sign up using your link, they get access to quality education and you get credit!</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🎁</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">3. Earn Rewards</h3>
              <p className="text-gray-600">Get 100 XP for each successful signup! Use your XP to unlock badges and climb the leaderboard.</p>
            </div>
          </div>
        </div>

        {/* Referral Code Badge */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-3 bg-white rounded-2xl px-8 py-4 shadow-lg border-2 border-purple-100">
            <span className="text-gray-600 font-medium">Your Referral Code:</span>
            <span className="text-2xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent" data-testid="referral-code-display">
              {referralData?.referral_code}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteAndEarn;
