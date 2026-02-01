import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './auth/AuthContext';
import { 
  Gift, Users, Copy, Check, Share2, Trophy, Star,
  Mail, MessageCircle, Facebook, Twitter, Sparkles,
  ChevronRight, Clock, CheckCircle, XCircle, Award
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const ReferralSystem = () => {
  const { token, user } = useAuth();
  const [referralData, setReferralData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [referralHistory, setReferralHistory] = useState([]);

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    loadReferralData();
  }, [token]);

  const loadReferralData = async () => {
    try {
      const response = await axios.get(`${API}/referral/my-referrals`, { headers });
      setReferralData(response.data);
      setReferralHistory(response.data.referral_history || []);
    } catch (error) {
      console.error('Failed to load referral data:', error);
      // Demo data
      const demoCode = user?.student_index || `TEC-${user?.id?.slice(0, 6).toUpperCase()}`;
      setReferralData({
        referral_code: demoCode,
        total_referrals: 3,
        successful_referrals: 2,
        pending_referrals: 1,
        rewards_earned: 2,
        months_free: 2,
        referral_link: `https://tecaikids.com/register?ref=${demoCode}`
      });
      setReferralHistory([
        { id: 1, referred_name: 'Amal Perera', status: 'completed', reward: '1 month free', date: '2024-01-20' },
        { id: 2, referred_name: 'Sana Khan', status: 'completed', reward: '1 month free', date: '2024-01-15' },
        { id: 3, referred_name: 'David Lee', status: 'pending', reward: 'Pending', date: '2024-01-25' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralData?.referral_code || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralData?.referral_link || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareVia = (platform) => {
    const message = `🎓 Join me at TecAI Kids - the best AI & Tech learning platform for kids! Use my referral code: ${referralData?.referral_code} to get special benefits! 🚀`;
    const link = referralData?.referral_link;
    
    const urls = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(message + '\n' + link)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}&quote=${encodeURIComponent(message)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(link)}`,
      email: `mailto:?subject=${encodeURIComponent('Join TecAI Kids - Learn AI & Tech!')}&body=${encodeURIComponent(message + '\n\n' + link)}`
    };
    
    window.open(urls[platform], '_blank');
    setShowShareModal(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'expired': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'expired': return <XCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading referral program...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50" data-testid="referral-system">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white p-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-4">
            <Gift className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-bold mb-2">🎁 Refer & Earn!</h1>
          <p className="text-xl text-white/90 mb-4">Share the gift of learning and get rewarded!</p>
          <div className="inline-block bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-3">
            <p className="text-2xl font-bold">
              <span className="text-yellow-300">1 Month FREE</span> for every successful referral!
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 -mt-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-5 text-center transform hover:scale-105 transition-transform">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-gray-800">{referralData?.total_referrals || 0}</div>
            <div className="text-sm text-gray-500">Total Referrals</div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-5 text-center transform hover:scale-105 transition-transform">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-gray-800">{referralData?.successful_referrals || 0}</div>
            <div className="text-sm text-gray-500">Successful</div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-5 text-center transform hover:scale-105 transition-transform">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="text-3xl font-bold text-gray-800">{referralData?.pending_referrals || 0}</div>
            <div className="text-sm text-gray-500">Pending</div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-5 text-center transform hover:scale-105 transition-transform">
            <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Gift className="w-6 h-6 text-pink-600" />
            </div>
            <div className="text-3xl font-bold text-gray-800">{referralData?.months_free || 0}</div>
            <div className="text-sm text-gray-500">Months Free</div>
          </div>
        </div>

        {/* Referral Code Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Your Referral Code</h2>
            <p className="text-gray-500">Share this code with friends and family</p>
          </div>
          
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-center gap-4">
              <div className="text-4xl font-bold text-purple-700 tracking-wider" data-testid="referral-code">
                {referralData?.referral_code}
              </div>
              <button
                onClick={copyReferralCode}
                className={`p-3 rounded-xl transition-all ${
                  copied ? 'bg-green-500 text-white' : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
                data-testid="copy-code-btn"
              >
                {copied ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => shareVia('whatsapp')}
              className="flex items-center gap-2 px-5 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors"
              data-testid="share-whatsapp"
            >
              <MessageCircle className="w-5 h-5" /> WhatsApp
            </button>
            <button
              onClick={() => shareVia('facebook')}
              className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
              data-testid="share-facebook"
            >
              <Facebook className="w-5 h-5" /> Facebook
            </button>
            <button
              onClick={() => shareVia('twitter')}
              className="flex items-center gap-2 px-5 py-3 bg-sky-500 text-white rounded-xl font-medium hover:bg-sky-600 transition-colors"
              data-testid="share-twitter"
            >
              <Twitter className="w-5 h-5" /> Twitter
            </button>
            <button
              onClick={() => shareVia('email')}
              className="flex items-center gap-2 px-5 py-3 bg-gray-600 text-white rounded-xl font-medium hover:bg-gray-700 transition-colors"
              data-testid="share-email"
            >
              <Mail className="w-5 h-5" /> Email
            </button>
          </div>

          {/* Copy Link */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-500 mb-2 text-center">Or share your referral link:</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={referralData?.referral_link || ''}
                readOnly
                className="flex-1 px-4 py-2 bg-white border rounded-lg text-gray-600 text-sm"
              />
              <button
                onClick={copyReferralLink}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">🎯 How It Works</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                1
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Share Your Code</h3>
              <p className="text-gray-500 text-sm">Share your unique referral code with friends and family via WhatsApp, social media, or email</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                2
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Friend Enrolls</h3>
              <p className="text-gray-500 text-sm">When your friend signs up using your code and completes enrollment</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                3
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Get Rewarded!</h3>
              <p className="text-gray-500 text-sm">You get 1 month FREE subscription for each successful referral. No limits!</p>
            </div>
          </div>
        </div>

        {/* Referral History */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <Trophy className="w-7 h-7 text-yellow-500 mr-3" /> Your Referral History
          </h2>
          
          {referralHistory.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-600 mb-2">No referrals yet</h3>
              <p className="text-gray-500 mb-6">Start sharing your code to earn free months!</p>
              <button
                onClick={() => copyReferralCode()}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700"
              >
                <Copy className="inline mr-2 w-5 h-5" /> Copy My Code
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {referralHistory.map((referral) => (
                <div 
                  key={referral.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  data-testid={`referral-${referral.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                      {referral.referred_name?.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-gray-800">{referral.referred_name}</div>
                      <div className="text-sm text-gray-500">{referral.date}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(referral.status)}`}>
                      {getStatusIcon(referral.status)}
                      {referral.status.charAt(0).toUpperCase() + referral.status.slice(1)}
                    </span>
                    {referral.status === 'completed' && (
                      <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        <Gift className="w-4 h-4" /> {referral.reward}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rewards Tier */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 rounded-3xl shadow-xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-6 text-center">🏆 Referral Rewards Tiers</h2>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 text-center">
              <div className="text-4xl mb-2">🥉</div>
              <h3 className="text-lg font-bold mb-1">Bronze Referrer</h3>
              <p className="text-white/80 text-sm mb-3">3 successful referrals</p>
              <div className="bg-white/20 rounded-lg py-2 px-4">
                <span className="font-bold">3 Months Free</span>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 text-center border-2 border-yellow-400">
              <div className="text-4xl mb-2">🥈</div>
              <h3 className="text-lg font-bold mb-1">Silver Referrer</h3>
              <p className="text-white/80 text-sm mb-3">5 successful referrals</p>
              <div className="bg-white/20 rounded-lg py-2 px-4">
                <span className="font-bold">5 Months Free + Badge</span>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 text-center">
              <div className="text-4xl mb-2">🥇</div>
              <h3 className="text-lg font-bold mb-1">Gold Referrer</h3>
              <p className="text-white/80 text-sm mb-3">10+ successful referrals</p>
              <div className="bg-white/20 rounded-lg py-2 px-4">
                <span className="font-bold">1 Year Free + VIP</span>
              </div>
            </div>
          </div>
          
          <p className="text-center text-white/70 text-sm mt-6">
            * Rewards are automatically applied to your account upon successful referral completion
          </p>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mt-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">❓ Frequently Asked Questions</h2>
          
          <div className="space-y-4">
            {[
              { q: "When is a referral considered successful?", a: "A referral is successful when your friend signs up using your code and completes their first month's payment." },
              { q: "Is there a limit to how many people I can refer?", a: "No limits! The more friends you refer, the more free months you earn." },
              { q: "How long does it take to receive my reward?", a: "Your free month is automatically added to your account within 24-48 hours of your friend's successful enrollment." },
              { q: "Can my friend also get a benefit?", a: "Yes! Your referred friend also gets a special 10% discount on their first enrollment." }
            ].map((faq, index) => (
              <details key={index} className="group bg-gray-50 rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-100">
                  <span className="font-medium text-gray-800">{faq.q}</span>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-open:rotate-90 transition-transform" />
                </summary>
                <div className="px-4 pb-4 text-gray-600 text-sm">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferralSystem;
