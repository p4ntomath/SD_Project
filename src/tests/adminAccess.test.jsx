import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { 
  createFunding,
  getAllFunding,
  updateFunding,
  deleteFunding,
  getAllProjects
} from '../backend/firebase/adminAccess';
import { getDocs, deleteDoc, updateDoc, addDoc, doc, collection } from 'firebase/firestore';

// Suppress console errors
const originalError = console.error;

beforeAll(() => {
  console.error = (...args) => {
    const skipMessages = [
      'Error creating funding',
      'Error fetching funding',
      'Error updating funding',
      'Error deleting funding',
      'Error fetching projects',
      'Database error',
      'Update failed',
      'Delete failed',
      'Failed to load projects'
    ];

    if (skipMessages.some(msg => 
      (typeof args[0] === 'string' && args[0].includes(msg)) ||
      (args[0]?.message && args[0].message.includes(msg))
    )) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Mock Firebase Firestore
vi.mock('../backend/firebase/firebaseConfig', () => ({
  db: {
    collection: vi.fn(),
    doc: vi.fn()
  }
}));

// Mock Firestore methods
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  Timestamp: {
    now: () => ({ seconds: Math.floor(Date.now() / 1000) })
  }
}));

describe('Admin Access Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createFunding', () => {
    it('creates funding opportunity successfully', async () => {
      const mockFunding = {
        name: 'Research Grant',
        expectedFunds: 50000,
        externalLink: 'https://example.com/grant'
      };

      const mockDocRef = { id: 'funding1' };
      vi.mocked(collection).mockReturnValue({});
      vi.mocked(addDoc).mockResolvedValue(mockDocRef);

      const result = await createFunding(mockFunding);

      expect(result).toEqual({
        id: 'funding1',
        ...mockFunding
      });
    });

    it('handles creation errors', async () => {
      vi.mocked(addDoc).mockRejectedValue(new Error('Database error'));

      await expect(createFunding({}))
        .rejects
        .toThrow('Error creating funding: Database error');
    });
  });

  describe('getAllFunding', () => {
    
    it('returns empty array when no funding exists', async () => {
      vi.mocked(getDocs).mockResolvedValue({ docs: [] });

      const result = await getAllFunding();

      expect(result).toEqual([]);
    });
  });

  describe('updateFunding', () => {
    it('updates funding successfully', async () => {
      const fundingId = 'funding1';
      const updatedData = {
        name: 'Updated Grant',
        expectedFunds: 60000,
        externalLink: 'https://example.com/updated'
      };

      const mockDocRef = {};
      vi.mocked(doc).mockReturnValue(mockDocRef);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      const result = await updateFunding(fundingId, updatedData);

      expect(result).toEqual({
        id: fundingId,
        ...updatedData
      });
      expect(updateDoc).toHaveBeenCalledWith(
        mockDocRef,
        expect.objectContaining({
          funding_name: updatedData.name,
          expected_funds: updatedData.expectedFunds,
          external_link: updatedData.externalLink
        })
      );
    });

    it('handles update errors', async () => {
      vi.mocked(updateDoc).mockRejectedValue(new Error('Update failed'));

      await expect(updateFunding('funding1', {}))
        .rejects
        .toThrow('Error updating funding: Update failed');
    });
  });

  describe('deleteFunding', () => {
    it('deletes funding successfully', async () => {
      const fundingId = 'funding1';

      vi.mocked(deleteDoc).mockResolvedValue(undefined);

      const result = await deleteFunding(fundingId);

      expect(result).toBe(fundingId);
      expect(deleteDoc).toHaveBeenCalled();
    });

    it('handles deletion errors', async () => {
      vi.mocked(deleteDoc).mockRejectedValue(new Error('Delete failed'));

      await expect(deleteFunding('funding1'))
        .rejects
        .toThrow('Error deleting funding: Delete failed');
    });
  });

  describe('getAllProjects', () => {
    it('fetches all projects', async () => {
      const mockProjects = [
        {
          id: 'project1',
          title: 'Research Project 1',
          status: 'In Progress'
        },
        {
          id: 'project2',
          title: 'Research Project 2',
          status: 'Completed'
        }
      ];

      vi.mocked(getDocs).mockResolvedValue({
        docs: mockProjects.map(project => ({
          id: project.id,
          data: () => project
        }))
      });

      const result = await getAllProjects();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockProjects[0]);
      expect(result[1]).toEqual(mockProjects[1]);
    });

    it('handles fetch errors', async () => {
      vi.mocked(getDocs).mockRejectedValue(new Error('Failed to load projects'));

      await expect(getAllProjects())
        .rejects
        .toThrow('Error fetching projects: Failed to load projects');
    });

    it('returns empty array when no projects exist', async () => {
      vi.mocked(getDocs).mockResolvedValue({
        docs: []
      });

      const result = await getAllProjects();
      expect(result).toEqual([]);
    });
  });
});