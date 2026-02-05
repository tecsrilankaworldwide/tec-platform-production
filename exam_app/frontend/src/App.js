import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// Auth Context
import { AuthProvider, useAuth } from './AuthContext';

// Pages
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import ParentDashboard from './pages/ParentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ExamInterface from './pages/ExamInterface';
import ProgressReport from './pages/ProgressReport';

const API = `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8002'}/api`;

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, token } = useAuth();
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function AppContent() {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen" style={{background: '#FFFBF0'}}>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              {user?.role === 'student' && <StudentDashboard />}
              {user?.role === 'parent' && <ParentDashboard />}
              {user?.role === 'teacher' && <TeacherDashboard />}
              {user?.role === 'admin' && <AdminDashboard />}
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/exam/:examId" 
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <ExamInterface />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/progress/:studentId" 
          element={
            <ProtectedRoute allowedRoles={['parent', 'teacher', 'admin']}>
              <ProgressReport />
            </ProtectedRoute>
          } 
        />
        
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
