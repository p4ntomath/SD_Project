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
import ResearcherHomePage from './pages/ResearcherHomePage.jsx';

//mport { fetchProjects, updateProject, deleteProject } from './backend/firebase/projectDB'; was just for testing
function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgotpassword" element={<ForgotPasswordPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          {/* Complete-profile is protected but available to users without role */}
          <Route path="/complete-profile" element={
            <ProtectedRoute>
              <CompleteProfile />
            </ProtectedRoute>
          } />
          {/* AuthHomeTest requires both authentication and completed profile */}
          <Route path="/ResearcherHomePage" element={
            <ProtectedRoute>
              <ResearcherHomePage/>
            </ProtectedRoute>
          } />

        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
