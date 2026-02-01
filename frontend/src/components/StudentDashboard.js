import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from './auth/AuthContext';
import WeeklyQuote from './WeeklyQuote';
import { 
  User, Camera, Award, BookOpen, Clock, Trophy, Star, Calendar,
  Upload, CheckCircle, Shield, Download, Printer, Edit2, X,
  Zap, Target, Brain, Sparkles, Medal, QrCode
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

// Avatar options for those who prefer not to use photos
const AVATAR_OPTIONS = [
  { type: 'male', emoji: '👨‍🎓', label: 'Male Student' },
  { type: 'female', emoji: '👩‍🎓', label: 'Female Student' },
  { type: 'neutral', emoji: '🎓', label: 'Neutral' }
];

// Country flags
const COUNTRY_FLAGS = {
  sri_lanka: '🇱🇰', india: '🇮🇳', malaysia: '🇲🇾', bangladesh: '🇧🇩',
  pakistan: '🇵🇰', indonesia: '🇮🇩', singapore: '🇸🇬', uae: '🇦🇪', saudi: '🇸🇦', other: '🌍'
};

// Age group colors
const AGE_GROUP_COLORS = {
  '4-6': { bg: 'from-yellow-400 to-orange-500', text: 'text-yellow-600', light: 'bg-yellow-100' },
  '7-9': { bg: 'from-blue-400 to-cyan-500', text: 'text-blue-600', light: 'bg-blue-100' },
  '10-12': { bg: 'from-purple-400 to-pink-500', text: 'text-purple-600', light: 'bg-purple-100' },
  '13-15': { bg: 'from-green-400 to-teal-500', text: 'text-green-600', light: 'bg-green-100' },
  '16-18': { bg: 'from-red-400 to-rose-500', text: 'text-red-600', light: 'bg-red-100' }
};

const StudentDashboard = () => {
  const { token, user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [idCardData, setIdCardData] = useState(null);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profileForm, setProfileForm] = useState({});
  const [nfcData, setNfcData] = useState(null);
  const [showNfcInfo, setShowNfcInfo] = useState(false);
  const fileInputRef = useRef(null);

  const headers = { Authorization: `Bearer ${token}` };

  // Fetch dashboard data
  const fetchDashboard = async () => {
    try {
      const response = await axios.get(`${API}/student/dashboard`, { headers });
      setDashboardData(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    }
  };

  // Fetch ID card data
  const fetchIdCard = async () => {
    try {
      const response = await axios.get(`${API}/student/id-card`, { headers });
      setIdCardData(response.data.id_card);
    } catch (error) {
      console.error('Failed to fetch ID card:', error);
    }
  };

  // Fetch QR code
  const fetchQrCode = async () => {
    try {
      const response = await axios.get(`${API}/student/qr-code`, { headers });
      setQrCodeData(response.data);
    } catch (error) {
      console.error('Failed to fetch QR code:', error);
    }
  };

  // Fetch NFC data
  const fetchNfcData = async () => {
    try {
      const response = await axios.get(`${API}/student/nfc-data`, { headers });
      setNfcData(response.data);
    } catch (error) {
      console.error('Failed to fetch NFC data:', error);
    }
  };

  // Upload photo
  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post(`${API}/student/photo/upload`, formData, {
        headers: { ...headers, 'Content-Type': 'multipart/form-data' }
      });
      fetchDashboard();
      fetchIdCard();
      setShowPhotoOptions(false);
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  // Use initials instead
  const handleUseInitials = async () => {
    try {
      await axios.post(`${API}/student/photo/use-initials`, {}, { headers });
      fetchDashboard();
      fetchIdCard();
      setShowPhotoOptions(false);
    } catch (error) {
      alert('Failed to update preference');
    }
  };

  // Use avatar
  const handleUseAvatar = async (avatarType) => {
    try {
      await axios.post(`${API}/student/photo/use-avatar`, { avatar_type: avatarType }, { headers });
      fetchDashboard();
      fetchIdCard();
      setShowPhotoOptions(false);
    } catch (error) {
      alert('Failed to update preference');
    }
  };

  // Update profile
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/student/profile`, profileForm, { headers });
      fetchDashboard();
      fetchIdCard();
      setShowProfileEdit(false);
    } catch (error) {
      alert('Failed to update profile');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchDashboard(), fetchIdCard(), fetchQrCode(), fetchNfcData()]);
      setLoading(false);
    };
    loadData();
  }, [token]);

  useEffect(() => {
    if (idCardData) {
      setProfileForm({
        date_of_birth: idCardData.date_of_birth || '',
        school_name: idCardData.school_name || '',
        guardian_name: idCardData.guardian_name || '',
        emergency_contact: idCardData.emergency_contact || '',
        blood_group: idCardData.blood_group || ''
      });
    }
  }, [idCardData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const student = dashboardData?.student;
  const progress = dashboardData?.progress;
  const gamification = dashboardData?.gamification;
  const ageColors = AGE_GROUP_COLORS[student?.age_group] || AGE_GROUP_COLORS['7-9'];

  // Get display for photo/avatar/initials
  const renderStudentPhoto = (size = 'large') => {
    const sizeClasses = size === 'large' ? 'w-32 h-32 text-4xl' : 'w-20 h-20 text-2xl';
    
    if (student?.photo_type === 'initials' || (!student?.photo_url && !student?.photo_type?.startsWith('avatar'))) {
      const initials = student?.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'ST';
      return (
        <div className={`${sizeClasses} rounded-full bg-gradient-to-br ${ageColors.bg} flex items-center justify-center text-white font-bold shadow-lg`}>
          {initials}
        </div>
      );
    }
    
    if (student?.photo_type?.startsWith('avatar_')) {
      const avatarType = student.photo_type.replace('avatar_', '');
      const avatar = AVATAR_OPTIONS.find(a => a.type === avatarType) || AVATAR_OPTIONS[2];
      return (
        <div className={`${sizeClasses} rounded-full bg-gradient-to-br ${ageColors.bg} flex items-center justify-center shadow-lg`}>
          {avatar.emoji}
        </div>
      );
    }
    
    if (student?.photo_url) {
      return (
        <img 
          src={`${process.env.REACT_APP_BACKEND_URL}${student.photo_url}`} 
          alt={student.full_name}
          className={`${sizeClasses} rounded-full object-cover shadow-lg border-4 border-white`}
        />
      );
    }
    
    // Default to initials
    const initials = student?.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'ST';
    return (
      <div className={`${sizeClasses} rounded-full bg-gradient-to-br ${ageColors.bg} flex items-center justify-center text-white font-bold shadow-lg`}>
        {initials}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className={`bg-gradient-to-r ${ageColors.bg} text-white p-6 shadow-lg`}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <div className="relative">
              {renderStudentPhoto('large')}
              <button
                onClick={() => setShowPhotoOptions(true)}
                className="absolute bottom-0 right-0 bg-white text-gray-700 p-2 rounded-full shadow-lg hover:bg-gray-100"
              >
                <Camera size={16} />
              </button>
            </div>
            <div className="ml-6">
              <h1 className="text-3xl font-bold">{student?.full_name}</h1>
              <p className="text-white/80 font-mono">{student?.student_index}</p>
              <div className="flex items-center mt-2 space-x-3">
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                  {COUNTRY_FLAGS[student?.country]} {student?.age_group} years
                </span>
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm flex items-center">
                  <Zap size={14} className="mr-1" /> Level {gamification?.level || 1}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold">{gamification?.xp || 0}</div>
            <div className="text-white/80">Total XP</div>
            <div className="flex items-center justify-end mt-2">
              <Star className="text-yellow-300 mr-1" size={18} />
              <span>{gamification?.streak_days || 0} day streak</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow">
        <div className="max-w-6xl mx-auto flex space-x-1 p-2">
          {[
            { id: 'overview', label: 'Overview', icon: Target },
            { id: 'idcard', label: 'ID Card', icon: Shield },
            { id: 'progress', label: 'Progress', icon: Brain },
            { id: 'badges', label: 'Badges', icon: Medal },
            { id: 'schedule', label: 'Schedule', icon: Calendar }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-3 rounded-lg font-medium transition-all ${
                activeTab === tab.id ? `${ageColors.light} ${ageColors.text}` : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <tab.icon size={18} className="mr-2" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow p-6 text-center">
                <Trophy className="mx-auto text-yellow-500 mb-2" size={32} />
                <div className="text-2xl font-bold">{gamification?.badges?.length || 0}</div>
                <div className="text-gray-500 text-sm">Badges Earned</div>
              </div>
              <div className="bg-white rounded-xl shadow p-6 text-center">
                <Clock className="mx-auto text-blue-500 mb-2" size={32} />
                <div className="text-2xl font-bold">{progress?.total_watch_time || 0}</div>
                <div className="text-gray-500 text-sm">Minutes Learned</div>
              </div>
              <div className="bg-white rounded-xl shadow p-6 text-center">
                <Award className="mx-auto text-purple-500 mb-2" size={32} />
                <div className="text-2xl font-bold">{dashboardData?.certificates?.length || 0}</div>
                <div className="text-gray-500 text-sm">Certificates</div>
              </div>
              <div className="bg-white rounded-xl shadow p-6 text-center">
                <BookOpen className="mx-auto text-green-500 mb-2" size={32} />
                <div className="text-2xl font-bold">{dashboardData?.recent_quizzes?.length || 0}</div>
                <div className="text-gray-500 text-sm">Quizzes Completed</div>
              </div>
            </div>

            {/* Skill Progress */}
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <Brain className="mr-2 text-purple-500" /> Skill Progress
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(progress?.skill_progress || {}).map(([skill, percent]) => (
                  <div key={skill} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 capitalize">{skill.replace(/_/g, ' ')}</span>
                      <span className="font-bold">{percent}%</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${ageColors.bg} rounded-full transition-all`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Photo/ID Reminder */}
            {!student?.photo_url && student?.photo_type !== 'initials' && !student?.photo_type?.startsWith('avatar') && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6">
                <div className="flex items-center">
                  <Camera className="text-amber-600 mr-4" size={32} />
                  <div className="flex-1">
                    <h3 className="font-bold text-amber-800">Complete Your Profile!</h3>
                    <p className="text-amber-700 text-sm">
                      Add your photo for your student ID card and workbooks. 
                      {student?.recommend_photo_alternative && (
                        <span className="block mt-1">
                          You can also choose to use initials or an avatar instead.
                        </span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowPhotoOptions(true)}
                    className="bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600"
                  >
                    Add Photo
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ID Card Tab */}
        {activeTab === 'idcard' && idCardData && (
          <div className="space-y-6">
            {/* ID Card Preview */}
            <div className="flex justify-center">
              <div className="w-[400px] bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Card Header */}
                <div className={`bg-gradient-to-r ${ageColors.bg} p-4 text-white text-center`}>
                  <div className="text-sm font-medium opacity-90">TEC FUTURE-READY LEARNING</div>
                  <div className="text-xl font-bold">STUDENT ID CARD</div>
                </div>
                
                {/* Card Body */}
                <div className="p-6">
                  <div className="flex">
                    {/* Photo Section */}
                    <div className="w-1/3">
                      <div className="w-24 h-28 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200 flex items-center justify-center">
                        {idCardData.photo_type === 'initials' ? (
                          <div className={`w-full h-full bg-gradient-to-br ${ageColors.bg} flex items-center justify-center text-white text-3xl font-bold`}>
                            {idCardData.initials}
                          </div>
                        ) : idCardData.photo_type?.startsWith('avatar_') ? (
                          <div className={`w-full h-full bg-gradient-to-br ${ageColors.bg} flex items-center justify-center text-4xl`}>
                            {AVATAR_OPTIONS.find(a => a.type === idCardData.photo_type?.replace('avatar_', ''))?.emoji || '🎓'}
                          </div>
                        ) : idCardData.photo_url ? (
                          <img 
                            src={`${process.env.REACT_APP_BACKEND_URL}${idCardData.photo_url}`}
                            alt={idCardData.full_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className={`w-full h-full bg-gradient-to-br ${ageColors.bg} flex items-center justify-center text-white text-3xl font-bold`}>
                            {idCardData.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Info Section */}
                    <div className="w-2/3 pl-4 space-y-1 text-sm">
                      <div>
                        <div className="text-gray-500 text-xs">NAME</div>
                        <div className="font-bold text-gray-800">{idCardData.full_name}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs">STUDENT ID</div>
                        <div className="font-mono font-bold text-purple-600">{idCardData.student_index}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs">LEVEL</div>
                        <div className="font-medium">{idCardData.level_name}</div>
                      </div>
                      {idCardData.school_name && (
                        <div>
                          <div className="text-gray-500 text-xs">SCHOOL</div>
                          <div className="font-medium text-xs">{idCardData.school_name}</div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Additional Info */}
                  <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-2 text-xs">
                    {idCardData.date_of_birth && (
                      <div>
                        <span className="text-gray-500">DOB:</span> {idCardData.date_of_birth}
                      </div>
                    )}
                    {idCardData.blood_group && (
                      <div>
                        <span className="text-gray-500">Blood:</span> {idCardData.blood_group}
                      </div>
                    )}
                    <div>
                      <span className="text-gray-500">Valid:</span> {idCardData.valid_until}
                    </div>
                    <div>
                      <span className="text-gray-500">Country:</span> {COUNTRY_FLAGS[idCardData.country]} {idCardData.country}
                    </div>
                  </div>
                  
                  {/* Emergency Contact */}
                  {idCardData.emergency_contact && (
                    <div className="mt-3 p-2 bg-red-50 rounded text-xs">
                      <span className="text-red-600 font-medium">Emergency:</span> {idCardData.emergency_contact}
                    </div>
                  )}
                </div>
                
                {/* QR Code Section */}
                {qrCodeData && (
                  <div className="mt-4 pt-4 border-t flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      <QrCode size={14} className="inline mr-1" />
                      Scan to verify
                    </div>
                    <img 
                      src={qrCodeData.qr_code} 
                      alt="Verification QR Code" 
                      className="w-16 h-16"
                    />
                  </div>
                )}
                
                {/* Card Footer */}
                <div className="bg-gray-100 px-4 py-2 text-center text-xs text-gray-500">
                  {idCardData.organization} • {idCardData.tagline}
                </div>
              </div>
            </div>

            {/* QR Code Full Display */}
            {qrCodeData && (
              <div className="bg-white rounded-xl shadow p-6 text-center">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center justify-center">
                  <QrCode className="mr-2 text-purple-500" /> Verification QR Code
                </h3>
                <img 
                  src={qrCodeData.qr_code} 
                  alt="Verification QR Code" 
                  className="w-48 h-48 mx-auto mb-4"
                />
                <p className="text-sm text-gray-600 mb-2">
                  Anyone can scan this QR code to verify your student status
                </p>
                <p className="font-mono text-xs text-purple-600 bg-purple-50 px-3 py-2 rounded-lg break-all">
                  {qrCodeData.verification_url}
                </p>
                <a 
                  href={`${API}/student/qr-code/image`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center mt-4 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
                >
                  <Download size={16} className="mr-2" /> Download QR Code
                </a>
              </div>
            )}

            {/* NFC Tag Section */}
            {nfcData && (
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-indigo-800 flex items-center">
                    📱 NFC Tap-to-Verify
                  </h3>
                  <button
                    onClick={() => setShowNfcInfo(true)}
                    className="text-indigo-600 text-sm hover:underline"
                  >
                    How to set up?
                  </button>
                </div>
                <p className="text-sm text-indigo-700 mb-3">
                  Add an NFC tag to your physical ID card for instant tap verification!
                </p>
                <div className="bg-white rounded-lg p-3 font-mono text-sm text-center">
                  <span className="text-gray-500">NFC URL:</span>
                  <br />
                  <span className="text-indigo-600 font-bold">{nfcData.nfc_data?.url_short}</span>
                </div>
                <div className="mt-3 flex items-center justify-center space-x-2 text-xs text-indigo-600">
                  <span className="bg-indigo-100 px-2 py-1 rounded">Recommended: NTAG213</span>
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded">Cost: ~$0.15</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => setShowProfileEdit(true)}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <Edit2 size={18} className="mr-2" /> Edit Details
              </button>
              <button
                onClick={() => setShowPhotoOptions(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Camera size={18} className="mr-2" /> Change Photo
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Printer size={18} className="mr-2" /> Print Card
              </button>
              <button
                onClick={() => setShowNfcInfo(true)}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                📱 NFC Setup
              </button>
            </div>

            {/* Info Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center text-sm text-blue-700">
              <Shield className="inline mr-2" size={16} />
              This ID card can be used for field work, research activities, and course verification.
              <br />
              <span className="text-xs text-blue-500 mt-1 block">
                QR code + NFC tag link to live verification page showing your current student status.
              </span>
            </div>
          </div>
        )}

        {/* Progress Tab */}
        {activeTab === 'progress' && (
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-xl font-bold mb-4">Learning Progress</h3>
            <p className="text-gray-500">Detailed progress tracking coming soon...</p>
          </div>
        )}

        {/* Badges Tab */}
        {activeTab === 'badges' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold">Your Badges</h3>
            {gamification?.badges?.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {gamification.badges.map((badge, idx) => (
                  <div key={idx} className="bg-white rounded-xl shadow p-4 text-center">
                    <div className="text-4xl mb-2">{badge.icon || '🏆'}</div>
                    <div className="font-bold text-gray-800">{badge.name}</div>
                    <div className="text-xs text-gray-500">{badge.earned_date}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
                <Medal size={48} className="mx-auto mb-4 text-gray-300" />
                <p>No badges earned yet. Keep learning to earn your first badge!</p>
              </div>
            )}
          </div>
        )}

        {/* Schedule Tab */}
        {activeTab === 'schedule' && (
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-xl font-bold mb-4">Upcoming Classes</h3>
            {dashboardData?.upcoming_classes?.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.upcoming_classes.map((cls, idx) => (
                  <div key={idx} className="flex items-center p-4 bg-gray-50 rounded-lg">
                    <Calendar className="text-purple-500 mr-4" size={24} />
                    <div>
                      <div className="font-bold">{cls.title}</div>
                      <div className="text-sm text-gray-500">{cls.date} at {cls.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No upcoming classes scheduled</p>
            )}
          </div>
        )}
      </div>

      {/* Photo Options Modal */}
      {showPhotoOptions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Choose Your Display</h3>
              <button onClick={() => setShowPhotoOptions(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Upload Photo */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all"
              >
                <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                <div className="font-medium text-gray-700">Upload Photo</div>
                <div className="text-sm text-gray-500">For ID card & workbooks</div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>

              {uploading && (
                <div className="text-center text-purple-600">Uploading...</div>
              )}

              <div className="text-center text-gray-500 text-sm">— OR —</div>

              {/* Use Initials */}
              <button
                onClick={handleUseInitials}
                className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                  {student?.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>
                <div className="text-left">
                  <div className="font-medium">Use My Initials</div>
                  <div className="text-sm text-gray-500">Display initials instead of photo</div>
                </div>
              </button>

              {/* Avatar Options */}
              <div className="text-sm text-gray-600 font-medium">Or choose an avatar:</div>
              <div className="grid grid-cols-3 gap-3">
                {AVATAR_OPTIONS.map((avatar) => (
                  <button
                    key={avatar.type}
                    onClick={() => handleUseAvatar(avatar.type)}
                    className="p-4 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all text-center"
                  >
                    <div className="text-4xl mb-1">{avatar.emoji}</div>
                    <div className="text-xs text-gray-600">{avatar.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Edit Modal */}
      {showProfileEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Edit Profile Details</h3>
              <button onClick={() => setShowProfileEdit(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={profileForm.date_of_birth || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, date_of_birth: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
                <input
                  type="text"
                  value={profileForm.school_name || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, school_name: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2"
                  placeholder="Enter school name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Guardian Name</label>
                <input
                  type="text"
                  value={profileForm.guardian_name || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, guardian_name: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2"
                  placeholder="Parent/Guardian name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
                <input
                  type="text"
                  value={profileForm.emergency_contact || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, emergency_contact: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2"
                  placeholder="Emergency phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                <select
                  value={profileForm.blood_group || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, blood_group: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2"
                >
                  <option value="">Select blood group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowProfileEdit(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NFC Setup Info Modal */}
      {showNfcInfo && nfcData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold flex items-center">📱 NFC Tag Setup Guide</h3>
              <button onClick={() => setShowNfcInfo(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {/* What is NFC */}
              <div className="bg-indigo-50 rounded-lg p-4">
                <h4 className="font-bold text-indigo-800 mb-2">What is NFC?</h4>
                <p className="text-sm text-indigo-700">
                  NFC (Near Field Communication) lets anyone verify your student ID by simply tapping their smartphone on your ID card - no app needed!
                </p>
              </div>

              {/* Your NFC URL */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-bold text-gray-800 mb-2">Your NFC URL</h4>
                <div className="bg-white border rounded p-3 font-mono text-sm break-all text-center">
                  {nfcData.nfc_data?.url_short}
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  This short URL will be programmed into your NFC tag
                </p>
              </div>

              {/* Recommended Tags */}
              <div>
                <h4 className="font-bold text-gray-800 mb-2">Recommended NFC Tags</h4>
                <div className="space-y-2">
                  {nfcData.nfc_data?.tag_types && Object.entries(nfcData.nfc_data.tag_types)
                    .filter(([_, info]) => info.suitable)
                    .map(([tag, info]) => (
                      <div key={tag} className={`flex justify-between items-center p-3 rounded-lg border ${tag === 'NTAG213' ? 'bg-green-50 border-green-300' : 'bg-gray-50'}`}>
                        <div>
                          <span className="font-medium">{tag}</span>
                          {tag === 'NTAG213' && <span className="ml-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded">Recommended</span>}
                        </div>
                        <span className="text-sm text-gray-600">{info.cost}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Setup Steps */}
              <div>
                <h4 className="font-bold text-gray-800 mb-2">Setup Steps</h4>
                <ol className="space-y-2">
                  {nfcData.instructions && Object.entries(nfcData.instructions).map(([step, instruction]) => (
                    <li key={step} className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm mr-3">
                        {step.replace('step', '')}
                      </span>
                      <span className="text-sm text-gray-700">{instruction}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Recommended Apps */}
              <div>
                <h4 className="font-bold text-gray-800 mb-2">Free NFC Writing Apps</h4>
                <div className="grid grid-cols-1 gap-2">
                  {nfcData.apps_recommended?.map((app, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-medium">{app.name}</span>
                        <span className="text-xs text-gray-500 ml-2">({app.platform})</span>
                      </div>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">FREE</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Where to Buy */}
              <div className="bg-amber-50 rounded-lg p-4">
                <h4 className="font-bold text-amber-800 mb-2">Where to Buy NFC Tags?</h4>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• Amazon, AliExpress, eBay</li>
                  <li>• Local electronics stores</li>
                  <li>• Search: "NTAG213 NFC stickers"</li>
                  <li>• Cost: $0.10-0.30 per tag</li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => setShowNfcInfo(false)}
              className="w-full mt-6 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
