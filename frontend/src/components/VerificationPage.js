import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  CheckCircle, XCircle, AlertTriangle, Shield, User, Calendar, 
  MapPin, School, Phone, Clock, ExternalLink, Award
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

// Country flags
const COUNTRY_FLAGS = {
  'Sri Lanka': '🇱🇰', 'India': '🇮🇳', 'Malaysia': '🇲🇾', 'Bangladesh': '🇧🇩',
  'Pakistan': '🇵🇰', 'Indonesia': '🇮🇩', 'Singapore': '🇸🇬', 'UAE': '🇦🇪', 
  'Saudi Arabia': '🇸🇦', 'International': '🌍'
};

// Age group colors
const AGE_GROUP_COLORS = {
  '4-6': 'from-yellow-400 to-orange-500',
  '7-9': 'from-blue-400 to-cyan-500',
  '10-12': 'from-purple-400 to-pink-500',
  '13-15': 'from-green-400 to-teal-500',
  '16-18': 'from-red-400 to-rose-500'
};

// Avatar options
const AVATAR_EMOJIS = {
  'avatar_male': '👨‍🎓',
  'avatar_female': '👩‍🎓',
  'avatar_neutral': '🎓'
};

const VerificationPage = () => {
  const { studentIndex } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const verifyStudent = async () => {
      try {
        const response = await axios.get(`${API}/verify/${studentIndex}`);
        setData(response.data);
      } catch (err) {
        setError('Failed to verify student. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (studentIndex) {
      verifyStudent();
    }
  }, [studentIndex]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-white mx-auto mb-4"></div>
          <p className="text-xl">Verifying Student ID...</p>
          <p className="text-white/60 mt-2 font-mono">{studentIndex}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md text-center">
          <XCircle className="mx-auto text-red-500 mb-4" size={64} />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Verification Failed</h1>
          <p className="text-gray-600">{error}</p>
          <Link to="/" className="mt-6 inline-block bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700">
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  if (!data?.verified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md text-center">
          <XCircle className="mx-auto text-red-500 mb-4" size={64} />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Student Not Found</h1>
          <p className="text-gray-600 mb-2">{data?.message}</p>
          <p className="font-mono text-gray-500 bg-gray-100 px-4 py-2 rounded-lg">{studentIndex}</p>
          <div className="mt-6 p-4 bg-amber-50 rounded-lg text-left">
            <p className="text-amber-800 text-sm">
              <AlertTriangle className="inline mr-2" size={16} />
              If you believe this is an error, please contact TEC support.
            </p>
          </div>
          <Link to="/" className="mt-6 inline-block bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700">
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  const student = data.student;
  const org = data.organization;
  const ageColors = AGE_GROUP_COLORS[student.age_group] || 'from-purple-400 to-indigo-500';

  // Render student photo/initials/avatar
  const renderPhoto = () => {
    if (student.photo_type === 'initials' || (!student.photo_url && !student.photo_type?.startsWith('avatar'))) {
      return (
        <div className={`w-28 h-28 rounded-full bg-gradient-to-br ${ageColors} flex items-center justify-center text-white text-3xl font-bold shadow-lg border-4 border-white`}>
          {student.initials || 'ST'}
        </div>
      );
    }
    
    if (student.photo_type?.startsWith('avatar_')) {
      return (
        <div className={`w-28 h-28 rounded-full bg-gradient-to-br ${ageColors} flex items-center justify-center text-5xl shadow-lg border-4 border-white`}>
          {AVATAR_EMOJIS[student.photo_type] || '🎓'}
        </div>
      );
    }
    
    if (student.photo_url) {
      return (
        <img 
          src={`${process.env.REACT_APP_BACKEND_URL}${student.photo_url}`} 
          alt={student.full_name}
          className="w-28 h-28 rounded-full object-cover shadow-lg border-4 border-white"
        />
      );
    }
    
    return (
      <div className={`w-28 h-28 rounded-full bg-gradient-to-br ${ageColors} flex items-center justify-center text-white text-3xl font-bold shadow-lg border-4 border-white`}>
        {student.initials || 'ST'}
      </div>
    );
  };

  // Status styling
  const getStatusStyle = () => {
    switch (data.status) {
      case 'ACTIVE':
        return { bg: 'from-green-500 to-emerald-600', icon: CheckCircle, text: 'VERIFIED ACTIVE' };
      case 'EXPIRED':
        return { bg: 'from-amber-500 to-orange-600', icon: AlertTriangle, text: 'SUBSCRIPTION EXPIRED' };
      case 'INACTIVE':
        return { bg: 'from-red-500 to-rose-600', icon: XCircle, text: 'ACCOUNT INACTIVE' };
      default:
        return { bg: 'from-gray-500 to-gray-600', icon: AlertTriangle, text: 'UNKNOWN STATUS' };
    }
  };

  const statusStyle = getStatusStyle();
  const StatusIcon = statusStyle.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center text-white py-6">
          <Shield className="mx-auto mb-2" size={40} />
          <h1 className="text-2xl font-bold">Student Verification</h1>
          <p className="text-white/60">{org.name}</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Status Banner */}
          <div className={`bg-gradient-to-r ${statusStyle.bg} p-4 text-white text-center`}>
            <StatusIcon className="inline mr-2" size={24} />
            <span className="text-xl font-bold">{statusStyle.text}</span>
          </div>

          {/* Student Info */}
          <div className="p-6">
            {/* Photo & Basic Info */}
            <div className="flex items-center mb-6">
              {renderPhoto()}
              <div className="ml-5 flex-1">
                <h2 className="text-2xl font-bold text-gray-800">{student.full_name}</h2>
                <p className="font-mono text-purple-600 font-bold text-lg">{student.student_index}</p>
                <p className="text-gray-600 mt-1">{student.level_name}</p>
              </div>
            </div>

            {/* Status Message */}
            <div className={`p-4 rounded-xl mb-6 ${
              data.status === 'ACTIVE' ? 'bg-green-50 border border-green-200' : 
              data.status === 'EXPIRED' ? 'bg-amber-50 border border-amber-200' : 
              'bg-red-50 border border-red-200'
            }`}>
              <p className={`text-sm ${
                data.status === 'ACTIVE' ? 'text-green-700' : 
                data.status === 'EXPIRED' ? 'text-amber-700' : 
                'text-red-700'
              }`}>
                {data.status_message}
              </p>
            </div>

            {/* Details Grid */}
            <div className="space-y-3">
              {student.country && (
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <MapPin className="text-gray-400 mr-3" size={20} />
                  <div>
                    <div className="text-xs text-gray-500">Country</div>
                    <div className="font-medium">{COUNTRY_FLAGS[student.country]} {student.country}</div>
                  </div>
                </div>
              )}

              {student.school_name && (
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <School className="text-gray-400 mr-3" size={20} />
                  <div>
                    <div className="text-xs text-gray-500">School</div>
                    <div className="font-medium">{student.school_name}</div>
                  </div>
                </div>
              )}

              {student.guardian_name && (
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <User className="text-gray-400 mr-3" size={20} />
                  <div>
                    <div className="text-xs text-gray-500">Guardian</div>
                    <div className="font-medium">{student.guardian_name}</div>
                  </div>
                </div>
              )}

              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <Calendar className="text-gray-400 mr-3" size={20} />
                <div>
                  <div className="text-xs text-gray-500">Member Since</div>
                  <div className="font-medium">{student.member_since}</div>
                </div>
              </div>

              {student.id_card_issued && (
                <div className="flex items-center p-3 bg-purple-50 rounded-lg">
                  <Award className="text-purple-500 mr-3" size={20} />
                  <div>
                    <div className="text-xs text-gray-500">ID Card Issued</div>
                    <div className="font-medium text-purple-700">{student.id_card_issued_date}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 p-4 text-center border-t">
            <div className="flex items-center justify-center text-gray-600 text-sm mb-2">
              <Clock className="mr-2" size={14} />
              Verified at {new Date(data.verification_time).toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">
              {org.name} • Est. {org.established} • {org.tagline}
            </div>
          </div>
        </div>

        {/* TEC Branding */}
        <div className="text-center mt-6 text-white/60 text-sm">
          <a href={`https://${org.website}`} target="_blank" rel="noopener noreferrer" className="hover:text-white flex items-center justify-center">
            <ExternalLink size={14} className="mr-1" />
            {org.website}
          </a>
          <p className="mt-2">Powered by TEC Future-Ready Learning Platform</p>
        </div>
      </div>
    </div>
  );
};

export default VerificationPage;
