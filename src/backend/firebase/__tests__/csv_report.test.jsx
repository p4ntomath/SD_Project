import { vi } from 'vitest';
import {
  generateFundingCSV,
  generateFolderCSV,
  generateReviewedProjectsCSV,
  generateProjectOverviewCSV,
  generateProgressCSV,
  generateTeamCSV,
  handleDashboardExport
} from '../csv_report';
import { db } from '../firebaseConfig';
import { getDoc } from 'firebase/firestore';

// Mock Firebase
vi.mock('../firebaseConfig', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  getDoc: vi.fn(),
  doc: vi.fn(),
}));

describe('CSV Report Generation', () => {
  // Set up DOM environment for downloadCSVFile
  const mockCreateElement = vi.fn();
  const mockAppendChild = vi.fn();
  const mockRemoveChild = vi.fn();
  const mockClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.URL.createObjectURL = vi.fn();
    global.URL.revokeObjectURL = vi.fn();
    document.createElement = mockCreateElement;
    document.body.appendChild = mockAppendChild;
    document.body.removeChild = mockRemoveChild;
  });

  describe('generateFundingCSV', () => {
    it('should generate correct CSV format for funding data', () => {
      const mockData = [{
        title: 'Project 1',
        fundingHistory: [{
          amount: 1000,
          type: 'grant',
          source: 'External Grant',
          updatedByName: 'John Doe',
          updatedAt: new Date('2025-01-01')
        }]
      }];

      const expectedCSV = 
        'Project Name,Funding Amount,Source/Description,Type,Added By,Updated At\n' +
        'Project 1,1000,External Grant,grant,John Doe,2025-01-01T00:00:00.000Z\n';

      const result = generateFundingCSV(mockData);
      expect(result).toBe(expectedCSV);
    });

    it('should handle missing or null values', () => {
      const mockData = [{
        fundingHistory: [{}]
      }];

      const expectedCSV = 
        'Project Name,Funding Amount,Source/Description,Type,Added By,Updated At\n' +
        'Unnamed Project,,,,Unknown,\n';

      const result = generateFundingCSV(mockData);
      expect(result).toBe(expectedCSV);
    });
  });

  describe('generateFolderCSV', () => {
    it('should generate correct CSV format for folder data', () => {
      const mockData = [{
        projectName: 'Project 1',
        folders: [{
          name: 'Folder 1',
          files: [{
            fileName: 'test.doc',
            uploadedBy: 'John Doe',
            uploadedAt: new Date('2025-01-01')
          }]
        }]
      }];

      const expectedCSV = 
        'Project Name,Folder Name,File Name,Uploaded By,Uploaded At\n' +
        'Project 1,Folder 1,test.doc,John Doe,2025-01-01T00:00:00.000Z\n';

      const result = generateFolderCSV(mockData);
      expect(result).toBe(expectedCSV);
    });

    it('should handle folders with no files', () => {
      const mockData = [{
        projectName: 'Project 1',
        folders: [{
          name: 'Empty Folder'
        }]
      }];

      const expectedCSV = 
        'Project Name,Folder Name,File Name,Uploaded By,Uploaded At\n' +
        'Project 1,Empty Folder,,,\n';

      const result = generateFolderCSV(mockData);
      expect(result).toBe(expectedCSV);
    });
  });

  describe('generateReviewedProjectsCSV', () => {
    it('should generate correct CSV format for reviewed projects', () => {
      const mockData = [{
        title: 'Project 1',
        description: 'Test Project',
        researcherName: 'John Doe',
        feedback: 'Good work',
        date: '2025-01-01'
      }];

      const expectedCSV = 
        'Project Title,Project Description,Researcher Name,Feedback,Review Date\n' +
        'Project 1,Test Project,John Doe,Good work,2025-01-01\n';

      const result = generateReviewedProjectsCSV(mockData);
      expect(result).toBe(expectedCSV);
    });

    it('should sanitize fields with commas and newlines', () => {
      const mockData = [{
        title: 'Project 1, Version 2',
        description: 'Line 1\nLine 2',
        researcherName: 'Doe, John',
        feedback: 'Good, needs minor revisions',
        date: '2025-01-01'
      }];

      const expectedCSV = 
        'Project Title,Project Description,Researcher Name,Feedback,Review Date\n' +
        'Project 1 Version 2,Line 1 Line 2,Doe John,Good needs minor revisions,2025-01-01\n';

      const result = generateReviewedProjectsCSV(mockData);
      expect(result).toBe(expectedCSV);
    });
  });

  describe('generateProjectOverviewCSV', () => {
    it('should generate correct CSV format for project overview', () => {
      const mockData = [{
        title: 'Project 1',
        description: 'Test Project',
        status: 'Active',
        createdAt: { toDate: () => new Date('2025-01-01') },
        updatedAt: { toDate: () => new Date('2025-01-02') },
        availableFunds: 1000,
        usedFunds: 500
      }];

      const expectedCSV = 
        'Project Name,Description,Status,Created Date,Last Updated,Available Funds,Used Funds\n' +
        'Project 1,Test Project,Active,2025-01-01T00:00:00.000Z,2025-01-02T00:00:00.000Z,1000,500\n';

      const result = generateProjectOverviewCSV(mockData);
      expect(result).toBe(expectedCSV);
    });
  });

  describe('generateProgressCSV', () => {
    it('should generate correct CSV format for progress report', () => {
      const mockData = [{
        title: 'Project 1',
        goals: [
          { completed: true },
          { completed: true },
          { completed: false }
        ],
        status: 'In Progress',
        updatedAt: { toDate: () => new Date('2025-01-01') }
      }];

      const expectedCSV = 
        'Project Name,Overall Progress,Total Goals,Completed Goals,Status,Last Updated\n' +
        'Project 1,67%,3,2,In Progress,2025-01-01T00:00:00.000Z\n';

      const result = generateProgressCSV(mockData);
      expect(result).toBe(expectedCSV);
    });

    it('should handle projects with no goals', () => {
      const mockData = [{
        title: 'Project 1',
        goals: [],
        status: 'New',
        updatedAt: { toDate: () => new Date('2025-01-01') }
      }];

      const expectedCSV = 
        'Project Name,Overall Progress,Total Goals,Completed Goals,Status,Last Updated\n' +
        'Project 1,0%,0,0,New,2025-01-01T00:00:00.000Z\n';

      const result = generateProgressCSV(mockData);
      expect(result).toBe(expectedCSV);
    });
  });

  describe('generateTeamCSV', () => {
    it('should generate correct CSV format for team report', () => {
      const mockData = [{
        title: 'Project 1',
        collaborators: [{
          name: 'John Doe',
          role: 'Developer',
          accessLevel: 'Editor',
          permissions: {
            canEditProject: true,
            canViewFiles: true,
            canManageTeam: false
          }
        }]
      }];

      const expectedCSV = 
        'Project Name,Collaborator Name,Role,Access Level,Permissions\n' +
        'Project 1,John Doe,Developer,Editor,canEditProject; canViewFiles\n';

      const result = generateTeamCSV(mockData);
      expect(result).toBe(expectedCSV);
    });
  });

  describe('handleDashboardExport', () => {
    it('should throw error if user not found', async () => {
      getDoc.mockResolvedValueOnce({ exists: () => false });

      await expect(handleDashboardExport('user123', 'projects')).rejects.toThrow('User not found');
    });

    it('should throw error for invalid report type', async () => {
      getDoc.mockResolvedValueOnce({ exists: () => true });

      await expect(handleDashboardExport('user123', 'invalid')).rejects.toThrow('Invalid report type');
    });
  });
});