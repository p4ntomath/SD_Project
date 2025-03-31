import React from 'react'
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import './App.css'
import WelcomePage from './pages/welcomePage.jsx'
import SignUpPage from './pages/signUpPage.jsx';

function App() {

  return (
    <Router>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/SignUpPage" element={<SignUpPage />} />
      </Routes>
    </Router>
  );
}

export default App
