# University Research Collaboration Platform

## 🎓 Overview
A comprehensive web-based research collaboration platform that enables university researchers to connect, collaborate, and manage their research projects effectively. The platform facilitates project discovery, team collaboration, funding tracking, and peer review processes.

## ✨ Key Features

### 🔐 Authentication & User Management
- **Multi-role Authentication**: Support for Researchers, Reviewers, and Administrators
- **Firebase Authentication**: Secure login with email/password and Google OAuth
- **Role-based Access Control**: Different permissions and features for each user type
- **Profile Management**: Comprehensive user profiles with research interests and expertise

### 🔬 Research Project Management
- **Project Creation & Listing**: Researchers can create detailed project postings
- **Collaboration Tools**: Built-in messaging system and document sharing
- **Milestone Tracking**: Set and monitor project goals and deadlines
- **Project Discovery**: Browse and search for collaboration opportunities

### 💰 Funding Management
- **Grant Tracking**: Monitor available and used funding for projects
- **Budget Management**: Track expenses and allocate resources
- **Funding Opportunities**: Discover and manage funding applications
- **Financial Reporting**: Generate funding reports and analytics

### 👥 Review System
- **Peer Review Process**: Request and manage project reviews
- **Reviewer Dashboard**: Dedicated interface for managing review tasks
- **Review History**: Track completed reviews and feedback
- **Review Notifications**: Stay updated on review requests and status

### 📊 Analytics & Reporting
- **Project Dashboard**: Real-time project status and progress tracking
- **Funding Analytics**: Comprehensive funding usage and availability reports
- **Export Capabilities**: Generate CSV and PDF reports
- **Usage Statistics**: Platform analytics for administrators

### 💬 Communication Features
- **Real-time Messaging**: Direct communication between collaborators
- **Notifications System**: Stay updated on project activities
- **Document Sharing**: Upload and share research materials
- **Public Profiles**: Discover researchers and their expertise

## 🛠 Tech Stack

### Frontend
- **React 19** - Modern UI library with hooks and context
- **Vite** - Fast build tool and development server
- **React Router Dom** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Material Tailwind** - Pre-built React components
- **Framer Motion** - Animation library

### Backend & Database
- **Firebase** - Backend-as-a-Service platform
  - **Firebase Auth** - Authentication service
  - **Firestore** - NoSQL document database
  - **Firebase Storage** - File storage service
- **Node.js** - JavaScript runtime environment

### Development Tools
- **ESLint** - Code linting and quality
- **Vitest** - Unit testing framework
- **Testing Library** - React component testing
- **JSDoc** - Code documentation

### Additional Libraries
- **Heroicons & React Icons** - Icon libraries
- **jsPDF** - PDF generation
- **Papa Parse** - CSV parsing
- **React Spinners** - Loading indicators
- **Vanta.js & Three.js** - 3D animations

## 🚀 Getting Started

### Prerequisites
Ensure you have the following installed:
- **Node.js** (>=18.x)
- **npm** or **yarn**
- **Git**
- **Firebase CLI** (optional, for deployment)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/p4ntomath/SD_Project
   cd SD_Project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory with your Firebase configuration:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   Open your browser and navigate to `http://localhost:5173`

## 📁 Project Structure

```
SD_Project/
├── public/                     # Static assets
│   ├── appLogo.png            # Application logo
│   └── web.config             # IIS configuration
├── src/                       # Source code
│   ├── App.jsx                # Main application component
│   ├── main.jsx               # Application entry point
│   ├── assets/                # Images and static files
│   ├── backend/               # Firebase configuration and services
│   │   └── firebase/          # Firebase setup and authentication
│   ├── components/            # Reusable React components
│   ├── context/               # React context providers
│   │   └── AuthContext.jsx    # Authentication state management
│   ├── hooks/                 # Custom React hooks
│   ├── pages/                 # Application pages/routes
│   ├── tests/                 # Unit and integration tests
│   ├── types/                 # TypeScript type definitions
│   └── utils/                 # Utility functions and helpers
├── Documents/                 # Project documentation
├── PageDesigns/              # UI/UX design mockups
├── coverage/                 # Test coverage reports
├── package.json              # Project dependencies and scripts
├── vite.config.js            # Vite configuration
├── vitest.config.js          # Testing configuration
└── README.md                 # This file
```

## 🎯 User Roles & Permissions

### 👨‍🔬 Researcher
- Create and manage research projects
- Invite collaborators and manage teams
- Track project funding and expenses
- Upload and share documents
- Request project reviews
- Communicate with team members

### 👨‍⚖️ Reviewer
- Review assigned research projects
- Provide feedback and ratings
- Manage review requests
- Access project documentation
- Track review history

### 👨‍💼 Administrator
- Manage platform users and permissions
- Monitor system usage and analytics
- Oversee funding and project data
- Manage platform announcements
- Access comprehensive reporting tools

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm run test

# Run tests with coverage
npm run coverage

# Run tests in watch mode
npm run test -- --watch
```

### Test Coverage
Test coverage reports are generated in the `coverage/` directory. Open `coverage/index.html` in your browser to view detailed coverage information.

### Testing Stack
- **Vitest** - Fast unit testing framework
- **React Testing Library** - Component testing utilities
- **Jest DOM** - Custom Jest matchers
- **jsdom** - DOM implementation for testing

## 🚀 Development

### Code Quality
```bash
# Lint code
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

### Development Guidelines
- Follow React best practices and hooks patterns
- Use JSDoc comments for all functions and components
- Write unit tests for new features
- Follow the existing code style and formatting
- Use TypeScript for type safety where applicable

## 📊 Code Coverage

The project maintains comprehensive test coverage across:
- **Authentication system** - User login, registration, and role management
- **Component testing** - UI components and user interactions
- **Firebase integration** - Database operations and file storage
- **Utility functions** - Helper functions and permissions

View detailed coverage reports by running `npm run coverage` and opening the generated HTML report.

## 🔧 Configuration Files

### `vite.config.js`
Vite build tool configuration with React plugin and development server settings.

### `vitest.config.js`
Testing configuration including jsdom environment and coverage settings.

### `eslint.config.js`
ESLint configuration for code quality and consistency.

### `package.json`
Project dependencies, scripts, and metadata.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Workflow
- Follow Agile methodology principles
- Use Test-Driven Development (TDD) approach
- Implement CI/CD best practices
- Write comprehensive documentation


## 🆘 Support

For support and questions:
1. Check the [documentation](./Documents/) folder
2. Review existing issues on GitHub
3. Create a new issue with detailed information
4. Contact the development team

## 🎯 Roadmap

### Current Features (v1.0.0)
- ✅ User authentication and role management
- ✅ Project creation and collaboration tools
- ✅ Funding tracking and management
- ✅ Review system and peer feedback
- ✅ Real-time messaging and notifications
- ✅ Document sharing and file management
- ✅ Analytics and reporting dashboards

### Future Enhancements
- 🔄 AI-powered collaborator recommendations
- 🔄 Advanced analytics and insights
- 🔄 Mobile application
- 🔄 Integration with external research databases
- 🔄 Enhanced notification system
- 🔄 Advanced search and filtering capabilities

---

Built with ❤️ for the research community

