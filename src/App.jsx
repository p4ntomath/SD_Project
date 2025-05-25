/**
 * @fileoverview Main application component that handles routing and authentication
 * @description This is the root component of the University Research Collaboration Platform.
 * It sets up the routing structure for different user roles (researcher, reviewer, admin)
 * and wraps the entire application with authentication context.
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Authentication and routing components
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AuthProtectRoute from './components/AuthProtectRoute';

// Page imports - Public pages
import WelcomePage from './pages/welcomePage.jsx';
import LoginPage from './pages/loginPage.jsx';
import ForgotPasswordPage from './pages/forgotpasswordPage.jsx';
import SignUpPage from './pages/SignUpPage.jsx';
import CompleteProfile from './pages/roleSelectionPage.jsx';

// Page imports - Researcher pages
import HomePage from './pages/HomePage.jsx';
import FundingTrackerPage from './pages/FundingTrackerPage.jsx';
import ProjectDetailsPage from './pages/ProjectDetailsPage.jsx';
import DocumentsPage from './pages/Documents.jsx';
import MyProjects from './pages/MyProjects.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';

// Page imports - Admin pages
import AdminHomePage from './pages/AdminHomePage.jsx';
import FundingManagementPage from './pages/FundingManagementPage.jsx';
import AdminUsersPage from './pages/AdminUsersPage.jsx';
import AdminProjectsPage from './pages/AdminProjectsPage.jsx';
import AdminDocumentsPage from './pages/AdminDocumentsPage.jsx';
import AdminNotificationsPage from './pages/AdminNotificationsPage.jsx';
import UserDetailsPage from './pages/UserDetailsPage.jsx';

// Page imports - Reviewer pages
import ReviewerHomePage from './pages/ReviewerHomePage.jsx';
import ReviewerProjects from './pages/reviewer/ReviewerProjects.jsx';
import ReviewRequests from './pages/reviewer/ReviewRequests.jsx';
import ReviewerHistory from './pages/ReviewerPages/ReviewerHistory.jsx';
import ReviewProjectPage from './pages/ReviewerPages/ReviewProjectPage.jsx';
import ReviewerNotificationsPage from './pages/reviewer/ReviewerNotificationsPage.jsx';

// Page imports - Shared pages
import MyProfilePage from './pages/MyProfilePage.jsx';
import MessagesList from './pages/MessagesList.jsx';
import ChatView from './pages/ChatView.jsx';
import MessagesLayout from './pages/MessagesLayout.jsx';
import UserSearchPage from './pages/UserSearchPage.jsx';
import PublicProfilePage from './pages/PublicProfilePage.jsx';

/**
 * Main App component that sets up routing and authentication for the research collaboration platform
 * 
 * @component
 * @description The App component serves as the main entry point for the application. It:
 * - Wraps the entire app with React Router for client-side navigation
 * - Provides authentication context to all child components
 * - Defines protected routes based on user roles (researcher, reviewer, admin)
 * - Handles role-based access control for different application features
 * 
 * @returns {JSX.Element} The complete application with routing and authentication
 * 
 * @example
 * // App component is typically rendered in main.jsx
 * import App from './App';
 * 
 * function main() {
 *   return <App />;
 * }
 */
function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes - accessible without authentication */}
          <Route path="/" element={<WelcomePage />} />
          
          {/* Authentication routes - redirect authenticated users */}
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
          
          {/* Profile completion - required for new users */}
          <Route path="/complete-profile" element={
            <ProtectedRoute>
              <CompleteProfile />
            </ProtectedRoute>
          } />
          
          {/* Researcher and Reviewer shared routes */}
          <Route path="/home" element={
            <ProtectedRoute allowedRoles={['researcher', 'reviewer']}>
              <HomePage />
            </ProtectedRoute>
          } />
          
          {/* Researcher-only routes */}
          <Route path="/projects" element={
            <ProtectedRoute allowedRoles={['researcher']}>
              <MyProjects />
            </ProtectedRoute>
          } />
          <Route path="/funding" element={
            <ProtectedRoute allowedRoles={['researcher']}>
              <FundingTrackerPage />
            </ProtectedRoute>
          } />
          <Route path="/projects/:projectId" element={
            <ProtectedRoute allowedRoles={['researcher', 'admin']}>
              <ProjectDetailsPage />
            </ProtectedRoute>
          } />
          <Route path="/notifications" element={
            <ProtectedRoute allowedRoles={['researcher']}>
              <NotificationsPage />
            </ProtectedRoute>
          } />
          
          {/* Admin-only routes */}
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
          <Route path="/admin/users/:userId" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UserDetailsPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/projects" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminProjectsPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/projects/:projectId" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ProjectDetailsPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/documents" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDocumentsPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/notifications" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminNotificationsPage />
            </ProtectedRoute>
          } />
          
          {/* Reviewer-only routes */}
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
          <Route path="/reviewer/account" element={
            <ProtectedRoute allowedRoles={['reviewer']}>
              <MyProfilePage />
            </ProtectedRoute>
          } />
          
          {/* Shared messaging routes with nested routing */}
          <Route path="/reviewer/messages" element={
            <ProtectedRoute allowedRoles={['reviewer']}>
              <MessagesLayout />
            </ProtectedRoute>
          }>
            <Route index element={<MessagesList />} />
            <Route path=":chatId" element={<ChatView />} />
          </Route>
          
          {/* Shared routes for multiple roles */}
          <Route path="/documents" element={
            <ProtectedRoute allowedRoles={['researcher', 'reviewer']}>
              <DocumentsPage />
            </ProtectedRoute>
          } />
          <Route path="/account" element={
            <ProtectedRoute allowedRoles={['researcher', 'reviewer']}>
              <MyProfilePage />
            </ProtectedRoute>
          } />
          <Route path="/messages" element={
            <ProtectedRoute allowedRoles={['researcher', 'reviewer', 'admin']}>
              <MessagesLayout />
            </ProtectedRoute>
          }>
            <Route index element={<MessagesList />} />
            <Route path=":chatId" element={<ChatView />} />
          </Route>
          <Route path="/search" element={
            <ProtectedRoute allowedRoles={['researcher', 'reviewer', 'admin']}>
              <UserSearchPage />
            </ProtectedRoute>
          } />
          <Route path="/profile/:userId" element={
            <ProtectedRoute allowedRoles={['researcher', 'reviewer', 'admin']}>
              <PublicProfilePage />
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
