import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { Shield, Users, FileText, Settings, LogOut } from 'lucide-react';

const AdminDashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen" style={{background: 'linear-gradient(135deg, #FFF9E6, #FFFACD)'}}>
      <div className="bg-white shadow-md border-b-4" style={{borderColor: '#F59E0B'}}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-extrabold" style={{color: '#92400E', fontFamily: 'Nunito'}}>Admin Dashboard</h1>
              <p className="text-gray-600">Welcome, {user.full_name}!</p>
            </div>
            <button onClick={logout} className="px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200">
              <LogOut className="inline w-4 h-4 mr-1" />Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-lg border-3 card-hover" style={{borderColor: '#3B82F6'}}>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-3xl font-extrabold mb-1" style={{color: '#2563EB'}}>-</div>
            <div className="text-sm font-semibold text-gray-600">Total Students</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border-3 card-hover" style={{borderColor: '#10B981'}}>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-3xl font-extrabold mb-1" style={{color: '#059669'}}>-</div>
            <div className="text-sm font-semibold text-gray-600">Active Exams</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border-3 card-hover" style={{borderColor: '#F59E0B'}}>
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="text-3xl font-extrabold mb-1" style={{color: '#D97706'}}>-</div>
            <div className="text-sm font-semibold text-gray-600">Teachers</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border-3 card-hover" style={{borderColor: '#8B5CF6'}}>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
              <Settings className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-3xl font-extrabold mb-1" style={{color: '#7C3AED'}}>4</div>
            <div className="text-sm font-semibold text-gray-600">Grades (2-5)</div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-3xl shadow-xl p-8 border-4" style={{borderColor: '#F59E0B'}}>
          <h2 className="text-2xl font-extrabold mb-6" style={{color: '#92400E', fontFamily: 'Nunito'}}>System Management</h2>
          <p className="text-gray-600">Admin features coming soon: User management, Exam scheduling, Reports export</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
