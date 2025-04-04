import React from 'react'
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import './App.css'
import WelcomePage from './pages/welcomePage.jsx';
import LoginPage from './pages/loginPage.jsx';
import ForgotPasswordPage from './pages/forgotpasswordPage.jsx';
import SignUpPage from './pages/SignUpPage.jsx';
import AuthHomeTest from './pages/authHomeTest.jsx';
function App() {

  return (
    <Router>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgotpassword" element={<ForgotPasswordPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/authHomeTest" element={<AuthHomeTest />} />
      </Routes>
    </Router>
  );
}

export default App
