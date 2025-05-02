import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import WelcomePage from './pages/welcomePage.jsx';
import LoginPage from './pages/loginPage.jsx';
import ForgotPasswordPage from './pages/forgotpasswordPage.jsx';
import SignUpPage from './pages/SignUpPage.jsx';
import CompleteProfile from './pages/roleSelectionPage.jsx';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AuthProtectRoute from './components/AuthProtectRoute';
import HomePage from './pages/HomePage.jsx';
import FundingTrackerPage from './pages/FundingTrackerPage.jsx';
import ProjectDetailsPage from './pages/ProjectDetailsPage.jsx';
import DocumentsPage from './pages/Documents.jsx';
import MyProjects from './pages/MyProjects.jsx';
import AdminHomePage from './pages/AdminHomePage.jsx';
import FundingManagementPage from './pages/FundingManagementPage.jsx';
import AdminUsersPage from './pages/AdminUsersPage.jsx';
import AdminProjectsPage from './pages/AdminProjectsPage.jsx';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/login" element={
            <AuthProtectRoute>
              <LoginPage />
            </AuthProtectRoute>
          } />
          <Route path="/forgotpassword" element={
            <AuthProtectRoute>
              <ForgotPasswordPage />
            </AuthProtectRoute>
          } />
          <Route path="/signup" element={
            <AuthProtectRoute>
              <SignUpPage />
            </AuthProtectRoute>
          } />
          <Route path="/complete-profile" element={
            <ProtectedRoute>
              <CompleteProfile />
            </ProtectedRoute>
          } />
          <Route path="/home" element={
            <ProtectedRoute allowedRoles={['researcher', 'reviewer']}>
              <HomePage />
            </ProtectedRoute>
          } />
          <Route path="/projects" element={
            <ProtectedRoute allowedRoles={['researcher']}>
              <MyProjects />
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminHomePage />
            </ProtectedRoute>
          } />
          <Route path="/admin/funding" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <FundingManagementPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminUsersPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/projects" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminProjectsPage />
            </ProtectedRoute>
          } />
          <Route path="/trackfunding" element={
            <ProtectedRoute allowedRoles={['researcher']}>
              <FundingTrackerPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/projects/:projectId" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ProjectDetailsPage />
            </ProtectedRoute>
          } />
          <Route path="/projects/:projectId" element={
            <ProtectedRoute allowedRoles={['researcher', 'admin']}>
              <ProjectDetailsPage />
            </ProtectedRoute>
          } />
          <Route path="/documents" element={
            <ProtectedRoute allowedRoles={['researcher', 'reviewer']}>
              <DocumentsPage />
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
