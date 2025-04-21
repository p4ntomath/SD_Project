import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import WelcomePage from './pages/welcomePage.jsx';
import LoginPage from './pages/loginPage.jsx';
import ForgotPasswordPage from './pages/forgotpasswordPage.jsx';
import SignUpPage from './pages/SignUpPage.jsx';
import CompleteProfile from './pages/roleSelectionPage.jsx';
import { AuthProvider } from './context/AuthContext'; // Import AuthProvider
import ProtectedRoute from './components/ProtectedRoute'; // Import the ProtectedRoute component
import HomePage from './pages/HomePage.jsx';
import AuthProtectRoute from './components/AuthProtectRoute'; // Import the AuthProtectRoute component
import FundingTrackerPage from './pages/FundingTrackerPage.jsx';
import ProjectDetailsPage from './pages/ProjectDetailsPage.jsx';

//mport { fetchProjects, updateProject, deleteProject } from './backend/firebase/projectDB'; was just for testing
function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={
            <WelcomePage />
          } />
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
          {/* Complete-profile is protected but available to users without role */}
          <Route path="/complete-profile" element={
            <ProtectedRoute>
              <CompleteProfile />
            </ProtectedRoute>
          } />
          <Route path="/home" element={
            <ProtectedRoute>
              <HomePage/>
            </ProtectedRoute>
          }/>
          <Route path="/trackfunding" element={
              <FundingTrackerPage />
          }/>
          <Route path="/projects/:projectId" element={
            <ProjectDetailsPage />
            } />
          
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
