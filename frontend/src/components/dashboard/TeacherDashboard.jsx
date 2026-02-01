import React, { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import Navigation from "../layout/Navigation";
import LessonUpload from "../LessonUpload";
import BulkLessonUpload from "../BulkLessonUpload";
import CurriculumGenerator from "../CurriculumGenerator";
import LessonScheduler from "../LessonScheduler";
import ProgressReports from "../ProgressReports";
import WhatsAppAdmin from "../WhatsAppAdmin";
import ClassReminders from "../ClassReminders";

const TeacherDashboard = () => {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState('lessons');
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4" data-testid="teacher-dashboard-title">🎬 Content Creation Studio</h1>
          <p className="text-xl text-gray-600">Create and manage your courses and lessons</p>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex justify-center flex-wrap gap-2 mb-8">
          <button
            onClick={() => setActiveTab('lessons')}
            className={`px-4 py-2.5 rounded-xl font-medium transition-all flex items-center text-sm ${
              activeTab === 'lessons'
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
            data-testid="tab-lessons"
          >
            <span className="mr-1.5">📤</span> Single Upload
          </button>
          <button
            onClick={() => setActiveTab('bulk')}
            className={`px-4 py-2.5 rounded-xl font-medium transition-all flex items-center text-sm ${
              activeTab === 'bulk'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
            data-testid="tab-bulk"
          >
            <span className="mr-1.5">📦</span> Bulk Upload
          </button>
          <button
            onClick={() => setActiveTab('curriculum')}
            className={`px-4 py-2.5 rounded-xl font-medium transition-all flex items-center text-sm ${
              activeTab === 'curriculum'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
            data-testid="tab-curriculum"
          >
            <span className="mr-1.5">📄</span> Curriculum PDF
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-4 py-2.5 rounded-xl font-medium transition-all flex items-center text-sm ${
              activeTab === 'schedule'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
            data-testid="tab-schedule"
          >
            <span className="mr-1.5">📅</span> Schedule
          </button>
          <button
            onClick={() => setActiveTab('progress')}
            className={`px-4 py-2.5 rounded-xl font-medium transition-all flex items-center text-sm ${
              activeTab === 'progress'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
            data-testid="tab-progress"
          >
            <span className="mr-1.5">📊</span> Progress
          </button>
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`px-4 py-2.5 rounded-xl font-medium transition-all flex items-center text-sm ${
              activeTab === 'whatsapp'
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
            data-testid="tab-whatsapp"
          >
            <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp
          </button>
          <button
            onClick={() => setActiveTab('reminders')}
            className={`px-4 py-2.5 rounded-xl font-medium transition-all flex items-center text-sm ${
              activeTab === 'reminders'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
            data-testid="tab-reminders"
          >
            <span className="mr-1.5">🔔</span> Reminders
          </button>
        </div>
        
        {/* Tab Content */}
        {activeTab === 'lessons' && (
          <LessonUpload 
            token={token} 
            onSuccess={(data) => console.log('Lesson uploaded:', data)} 
          />
        )}
        
        {activeTab === 'bulk' && (
          <BulkLessonUpload 
            token={token} 
            onSuccess={() => console.log('Bulk upload completed')} 
          />
        )}
        
        {activeTab === 'curriculum' && (
          <CurriculumGenerator token={token} />
        )}
        
        {activeTab === 'schedule' && (
          <LessonScheduler token={token} />
        )}
        
        {activeTab === 'progress' && (
          <ProgressReports token={token} />
        )}
        
        {activeTab === 'whatsapp' && (
          <WhatsAppAdmin token={token} />
        )}
        
        {activeTab === 'reminders' && (
          <ClassReminders token={token} />
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
