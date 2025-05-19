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
import AdminDocumentsPage from './pages/AdminDocumentsPage.jsx';
import ReviewerHomePage from './pages/ReviewerHomePage.jsx';
import ReviewerProjects from './pages/reviewer/ReviewerProjects.jsx';
import ReviewRequests from './pages/reviewer/ReviewRequests.jsx';
import ReviewerHistory from './pages/ReviewerPages/ReviewerHistory.jsx';
import ReviewProjectPage from './pages/ReviewerPages/ReviewProjectPage.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';
import ReviewerNotificationsPage from './pages/reviewer/ReviewerNotificationsPage.jsx';
import MessagesPage from './pages/Messages.jsx';
import MessagesList from './pages/MessagesList.jsx';
import ChatView from './pages/ChatView.jsx';
import MessagesLayout from './pages/MessagesLayout.jsx';

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
          <Route path="/admin/documents" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDocumentsPage />
            </ProtectedRoute>
          } />
          <Route path="/funding" element={
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
          <Route path="/notifications" element={
            <ProtectedRoute allowedRoles={['researcher']}>
              <NotificationsPage />
            </ProtectedRoute>
          } />

          <Route path="/reviewer/notifications" element={
                      <ProtectedRoute allowedRoles={['reviewer']}>
                        <ReviewerNotificationsPage />
                      </ProtectedRoute>
                    } />
          <Route path="/reviewer/review/:projectId" element={
            <ProtectedRoute allowedRoles={['reviewer']}>
              <ReviewProjectPage />
            </ProtectedRoute>
          } />
          <Route path="/reviewer/dashboard" element={
            <ProtectedRoute allowedRoles={['reviewer']}>
              <ReviewerHomePage />
            </ProtectedRoute>
          } />
          <Route path="/reviewer/requests" element={
            <ProtectedRoute allowedRoles={['reviewer']}>
              <ReviewRequests />
            </ProtectedRoute>
          } />
          <Route path="/reviewer/assigned" element={
            <ProtectedRoute allowedRoles={['reviewer']}>
              <ReviewerProjects />
            </ProtectedRoute>
          } />
          <Route path="/reviewer/history" element={
            <ProtectedRoute allowedRoles={['reviewer']}>
              <ReviewerHistory />
            </ProtectedRoute>
          } />
          <Route path="/reviewer/analytics" element={
            <ProtectedRoute allowedRoles={['reviewer']}>
              <ReviewerHomePage />
            </ProtectedRoute>
          } />
          <Route path="/reviewer/settings" element={
            <ProtectedRoute allowedRoles={['reviewer']}>
              <ReviewerHomePage />
            </ProtectedRoute>
          } />
          <Route path="/reviewer/messages" element={
            <ProtectedRoute allowedRoles={['reviewer']}>
              <MessagesLayout />
            </ProtectedRoute>
          }>
            <Route index element={<MessagesList />} />
            <Route path=":chatId" element={<ChatView />} />
          </Route>
          <Route path="/messages" element={
            <ProtectedRoute allowedRoles={['researcher', 'reviewer', 'admin']}>
              <MessagesLayout />
            </ProtectedRoute>
          }>
            <Route index element={<MessagesList />} />
            <Route path=":chatId" element={<ChatView />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
