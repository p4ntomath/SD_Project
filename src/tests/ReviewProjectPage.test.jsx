import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ReviewProjectPage from '../pages/ReviewerPages/ReviewProjectPage.jsx';
import * as projectDB from '../backend/firebase/projectDB';
import * as documentsDB from '../backend/firebase/documentsDB';
import { auth } from '../backend/firebase/firebaseConfig';

// Mock projectDB and documentsDB
vi.mock('../backend/firebase/projectDB', () => ({
  getProjectDetails: vi.fn()
}));
vi.mock('../backend/firebase/documentsDB', () => ({
  fetchDocumentsByFolder: vi.fn()
}));

// Mock firebaseConfig to provide auth.currentUser
vi.mock('../backend/firebase/firebaseConfig', () => ({
  auth: { currentUser: { uid: 'user1', displayName: 'John Doe' } },
}));

describe('ReviewProjectPage', () => {
  const renderWithRouter = (path = '/reviewer/review/1') => {
    return render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/reviewer/review/:projectId" element={<ReviewProjectPage />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('shows loader while fetching data', async () => {
    // Leave getProjectDetails unresolved to simulate loading
    projectDB.getProjectDetails.mockReturnValue(new Promise(() => {}));
    renderWithRouter();
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('displays error message when loading fails', async () => {
    projectDB.getProjectDetails.mockRejectedValue(new Error('Fetch failed'));
    documentsDB.fetchDocumentsByFolder.mockResolvedValue([]);
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByText('Error Loading Project')).toBeInTheDocument();
      expect(screen.getByText(/Fetch failed/)).toBeInTheDocument();
    });
  });

  it('displays not found when project is null', async () => {
    projectDB.getProjectDetails.mockResolvedValue(null);
    documentsDB.fetchDocumentsByFolder.mockResolvedValue([]);
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByText('Project Not Found')).toBeInTheDocument();
    });
  });

  it('renders project details and no documents message', async () => {
    const mockProject = {
      id: '1',
      title: 'Test Project',
      researchField: 'Biology',
      status: 'Active',
      researcherName: 'Alice',
      updatedAt: { toDate: () => new Date('2025-01-15') },
      description: 'Project description'
    };
    projectDB.getProjectDetails.mockResolvedValue(mockProject);
    documentsDB.fetchDocumentsByFolder.mockResolvedValue([]);
    renderWithRouter();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });
    expect(screen.getByText('Biology')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Project description')).toBeInTheDocument();
    expect(screen.getByText('No documents available')).toBeInTheDocument();
  });

 
});