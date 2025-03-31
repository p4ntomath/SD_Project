import React from 'react'
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import './App.css'
import WelcomePage from './pages/welcomePage.jsx';
import LoginPage from './pages/loginPage.jsx';



function App() {

  return (
    <Router>
      <Routes>
        <Route path="/" element={<WelcomePage />} /> 
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </Router>
  );
}

export default App
