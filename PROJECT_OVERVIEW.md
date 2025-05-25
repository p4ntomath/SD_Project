# Research Collaboration Platform - Project Overview

## Project Name
**SD_Project** - Research Collaboration Platform

## Tech Stack

### Frontend
- **React 19.0.0** - Modern JavaScript library for building user interfaces
- **Vite 6.2.4** - Fast build tool and development server
- **Tailwind CSS 4.0.15** - Utility-first CSS framework for styling
- **React Router DOM 7.4.1** - Client-side routing for single-page application
- **Framer Motion 12.6.5** - Animation library for smooth UI transitions
- **React Icons 5.5.0** - Icon library with Font Awesome and Heroicons

### Backend & Database
- **Firebase 11.6.0** - Complete backend-as-a-service platform
  - **Firebase Authentication** - User authentication and authorization
  - **Cloud Firestore** - NoSQL document database
  - **Firebase Storage** - File storage for documents and images
  - **Firebase Admin 13.4.0** - Server-side Firebase SDK for admin operations

### UI Components & Libraries
- **Material Tailwind 2.1.10** - Pre-built UI components
- **React Select 5.10.1** - Customizable select components
- **React Spinners 0.15.0** - Loading spinners and indicators
- **Heroicons React 2.2.0** - SVG icon library
- **React Easy Crop 5.4.2** - Image cropping component
- **Emoji Picker React 4.12.2** - Emoji selection component

### File Processing & Export
- **jsPDF 3.0.1** - PDF generation library
- **jsPDF AutoTable 5.0.2** - Table generation for PDFs
- **PapaParse 5.5.2** - CSV parsing and generation
- **Browser Image Compression 2.0.2** - Client-side image optimization

### Testing & Development
- **Vitest 3.1.1** - Fast unit testing framework
- **Testing Library (React, Jest-DOM, User-Event)** - Component testing utilities
- **ESLint 9.21.0** - Code linting and quality assurance
- **Vite Coverage (V8)** - Code coverage reporting

### 3D Graphics & Animations
- **Three.js 0.176.0** - 3D graphics library
- **Vanta 0.5.24** - Animated 3D backgrounds

## Main Components and Modules

### 1. Authentication System
- **Location**: `src/backend/firebase/authFirebase.jsx`
- **Features**:
  - Email/password authentication
  - Google OAuth integration
  - Password reset functionality
  - Role-based access control (Admin, Researcher, Reviewer)
  - Profile completion flow

### 2. Project Management
- **Location**: `src/backend/firebase/projectDB.jsx`, `src/pages/MyProjects.jsx`
- **Features**:
  - Create, read, update, delete projects
  - Project collaboration and sharing
  - Goal tracking and progress monitoring
  - Research field categorization
  - Project status management

### 3. Document Management System
- **Location**: `src/backend/firebase/documentsDB.jsx`, `src/backend/firebase/folderDB.jsx`
- **Features**:
  - File upload to Firebase Storage
  - Folder organization within projects
  - Document sharing and permissions
  - File type validation and size limits (10MB)
  - Batch document operations

### 4. Funding Management
- **Location**: `src/backend/firebase/fundingDB.jsx`, `src/pages/FundingTrackerPage.jsx`
- **Features**:
  - Track available and used funds
  - Funding opportunity management
  - Expense tracking and reporting
  - Financial reporting and analytics

### 5. Collaboration System
- **Location**: `src/backend/firebase/collaborationDB.jsx`
- **Features**:
  - Send/receive collaboration invitations
  - Role-based permissions (Owner, Editor, Viewer)
  - Collaborator access level management
  - Real-time collaboration requests

### 6. Review System
- **Location**: `src/backend/firebase/reviewerDB.jsx`
- **Features**:
  - Reviewer assignment to projects
  - Review request management
  - Peer review workflow
  - Review status tracking

### 7. Chat & Messaging System
- **Location**: `src/backend/firebase/chatDB.jsx`
- **Implementation**: Real-time messaging using Firestore
- **Features**:
  - Direct messaging between users
  - Group chat functionality
  - Message persistence and history
  - Real-time message delivery

### 8. Admin Panel
- **Location**: `src/pages/Admin*`, `src/backend/firebase/adminAccess.jsx`
- **Features**:
  - User management and role assignment
  - System-wide project oversight
  - Document administration
  - Funding opportunity management

### 9. Notification System
- **Location**: `src/backend/firebase/notificationsUtil.jsx`
- **Features**:
  - Real-time notifications
  - Unread message/notification counters
  - Cross-component notification handling

### 10. Export & Reporting
- **Location**: `src/hooks/useExport.jsx`, `src/components/ExportDialog.jsx`
- **Features**:
  - PDF report generation
  - CSV data export
  - Project analytics and dashboards

## Component Architecture

### User Roles and Access Levels
1. **Admin**: Full system access, user management, global oversight
2. **Researcher**: Project creation, collaboration management, document handling
3. **Reviewer**: Project review access, evaluation capabilities

### Navigation Components
- **Researcher Navigation**: `src/components/ResearcherComponents/Navigation/`
- **Admin Navigation**: `src/components/AdminComponents/Navigation/`
- **Reviewer Navigation**: `src/components/ReviewerComponents/Navigation/`
- **Mobile-responsive** bottom navigation for all user types

### Page Structure
- **Dashboard Pages**: Role-specific home pages with analytics and overviews
- **Project Pages**: Project details, editing, and management
- **Management Pages**: Documents, funding, users, and admin functions

## How Components Interact

### Data Flow Architecture
1. **Frontend (React)** ↔ **Firebase SDK** ↔ **Cloud Firestore**
2. **Authentication State** managed through Firebase Auth context
3. **Real-time Updates** via Firestore listeners and subscriptions
4. **File Storage** handled through Firebase Storage with metadata in Firestore

### Key Interactions
- **Authentication Flow**: Login → Role Detection → Route to Appropriate Dashboard
- **Project Collaboration**: Owner creates project → Invites collaborators → Real-time permission management
- **Document Workflow**: Upload to Storage → Metadata to Firestore → Real-time sync across collaborators
- **Review Process**: Researcher requests review → Reviewer receives notification → Review submission and feedback

### Database Structure
- **Users Collection**: User profiles, roles, and preferences
- **Projects Collection**: Project data with subcollections for folders and files
- **Review Requests**: Reviewer assignments and status tracking
- **Chats Collection**: Real-time messaging data
- **Notifications**: System-wide notification management

## External Services and APIs

### Firebase Services
- **Firebase Authentication**: User management and security
- **Cloud Firestore**: Primary database for all application data
- **Firebase Storage**: File and document storage
- **Firebase Hosting**: Web application deployment (configured via `public/web.config`)

### Third-party Integrations
- **Google OAuth**: Alternative authentication method
- **Browser APIs**: File handling, notifications, and offline capabilities

### Development and Testing Services
- **Vite Dev Server**: Local development environment
- **Vitest**: Unit and integration testing
- **ESLint**: Code quality and consistency checking

## Deployment and Configuration
- **Build Tool**: Vite with React plugin
- **Config Files**: 
  - `vite.config.js` - Build configuration
  - `vitest.config.js` - Testing setup
  - `eslint.config.js` - Code quality rules
- **Coverage Reports**: Generated in `coverage/` directory
- **Environment**: Configured for browser globals and Firebase services

## Security Features
- **Role-based Access Control**: Enforced at both frontend and backend levels
- **Permission Validation**: Document and project access verification
- **File Upload Security**: Type validation and size limits
- **Firebase Security Rules**: Database-level access control

This platform provides a comprehensive research collaboration environment with real-time features, robust file management, and multi-role access control, all built on Firebase's scalable infrastructure.