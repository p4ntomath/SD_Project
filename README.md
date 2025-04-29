# University Research Collaboration Platform

## Introduction  
Researchers in universities often struggle to find collaborators for projects, manage shared resources, and track project progress.  
This project aims to create a **web-based research collaboration platform** that allows academics to **connect, share ideas, and manage their research work effectively**.

## Objectives  
The team is required to:  
- Use **Agile methodology**  
- Incorporate **CI/CD principles**  
- Take a **test-driven development (TDD) approach**  
- Develop and deploy a **publicly available** web application  

## Overview of Features  
- **Research Project Postings** – Create and manage project listings.  
- **Collaboration Tools** – Messaging, document sharing, and milestone tracking.  
- **Funding Tracking** – Manage research grants and expenditures.  
- **Reporting** – Generate key project and funding reports.  

## Detailed Requirements  

### User Verification  
- Use a **third-party identity provider** for authentication.  
- Three user roles:  
  - **Researcher** – Can create projects, invite collaborators, and manage research.  
  - **Reviewer** – Can review projects and provide feedback.  
  - **Admin** – Manages platform users and settings.  

### Project Management  
- Researchers can create **project listings**, define requirements, and invite collaborators.  

### Collaboration Tools  
- Built-in **messaging system**  
- **Document sharing** for research materials  
- **Milestone tracking** to monitor project progress  

### Funding Tracking  
- Researchers should be able to **track grants, spending, and funding needs**.  

### Reporting  
At least three **dashboard reports**:  
1. **Project Completion Status**  
2. **Funding Used vs. Available**  
3. **Custom View**  
- Reports should be **exportable as CSV or PDF**.  

### Bonus Features  
- **AI-powered collaborator recommendation** based on research interests and expertise.  

## Tech Stack  
- **Frontend**: React + Vite  
- **Backend**: Node.js (Express or FastAPI)  
- **Database**: PostgreSQL / Firebase  
- **Authentication**: OAuth (Google, ORCID, or institution-based login)  
- **CI/CD**: GitHub Actions  

## Installation  

### Prerequisites  
Make sure you have the following installed:  
- **Node.js** (>=16.x)  
- **npm** or **yarn**  
- **Git**  

### Setup  
1. Clone the repository:  
   ```sh
   git clone https://github.com/p4ntomath/SD_Project

# THESE ARE THE DESIGNS FOR THE PAGES:

## Researcher Dashboard
![Dashboard](PageDesigns/adminDashboard.png)

## Admin Dashboard
![Dashboard](PageDesigns/adminDashboard.png)

## admin Dashboard Small Screen
![Dashboard](PageDesigns/adminDashboardSmallScreen.png)

## create Project Page
![Dashboard](PageDesigns/createProjectPage.png)

## create Project Page Small Screen
![Dashboard](PageDesigns/createProjectPageSmallScreen.png)

## Documents
![Dashboard](PageDesigns/documents.png)

## documents Small Screen
![Dashboard](PageDesigns/documentsSmallScreen.png)

## myProfile
![Dashboard](PageDesigns/myProfile.png)

## myProfile Small Screen
![Dashboard](PageDesigns/myProfileSmallScreen.png)

## Researcher Dashboard version 2
![Dashboard](PageDesigns/researcherDashboardv2.png)

## reviewer Dashboard
![Dashboard](PageDesigns/reviewerDashboard.png)

## reviewer Dashboard Small Screen
![Dashboard](PageDesigns/reviewerDashboardSmallScreen.png)

## track Project Funding Page
![Dashboard](PageDesigns/trackProjectFundingPage.png)

## track Project Funding Page Small Screen
![Dashboard](PageDesigns/trackProjectFundingPageSmallScreen.png)

## view Project Page
![Dashboard](PageDesigns/viewProjectPage.png)

## view Project Page Small Screen
![Dashboard](PageDesigns/viewProjectPageSmallScreen.png)


