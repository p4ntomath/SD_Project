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
            </ProtectedRoute>
          } />
          <Route path="/trackfunding" element={
            <ProtectedRoute allowedRoles={['researcher']}>
              <FundingTrackerPage />
            </ProtectedRoute>
          } />
          <Route path="/projects/:projectId" element={
            <ProtectedRoute allowedRoles={['researcher']}>
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
