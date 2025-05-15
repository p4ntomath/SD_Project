import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  getAvailableReviewers,
  fetchReviewRequests,
  submitReviewFeedback,
  getProjectFeedback,
  updateExistingReviewerInfo
} from '../backend/firebase/reviewerDB';

import { 
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
} from 'firebase/firestore';

// Mock Firebase config
vi.mock('../backend/firebase/firebaseConfig', () => ({
  auth: {
    currentUser: {
      uid: 'test-user-id'
    }
  },
  db: {}
}));

// Mock Firestore methods
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  arrayUnion: vi.fn(),
  serverTimestamp: vi.fn(() => new Date())
}));

describe('Reviewer Database Operations', () => {
  const originalConsoleError = console.error;
  
  beforeEach(() => {
    // Silence console.error during tests
    console.error = vi.fn();
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore console.error after each test
    console.error = originalConsoleError;
  });

  describe('getAvailableReviewers', () => {
    it('fetches available reviewers', async () => {
      const mockReviewers = [
        {
          id: 'reviewer1',
          fullName: 'John Doe',
          expertise: ['AI', 'Machine Learning'],
          role: 'reviewer'
        },
        {
          id: 'reviewer2',
          fullName: 'Jane Smith',
          expertise: ['Data Science'],
          role: 'reviewer'
        }
      ];

      vi.mocked(getDocs).mockResolvedValue({
        docs: mockReviewers.map(reviewer => ({
          id: reviewer.id,
          data: () => reviewer
        }))
      });

      const result = await getAvailableReviewers();

      expect(result).toHaveLength(2);
      expect(result[0].fullName).toBe('John Doe');
      expect(result[1].fullName).toBe('Jane Smith');
    });

    it('returns empty array when no reviewers exist', async () => {
      vi.mocked(getDocs).mockResolvedValue({
        docs: []
      });

      const result = await getAvailableReviewers();

      expect(result).toEqual([]);
    });
  });

  describe('fetchReviewRequests', () => {
    it('fetches review requests for a reviewer', async () => {
      const mockInvitations = [{
        id: 'invitation1',
        projectId: 'project1',
        status: 'pending',
        createdAt: new Date()
      }];

      const mockProject = {
        id: 'project1',
        title: 'Test Project',
        description: 'Test Description'
      };

      vi.mocked(collection).mockReturnValue('invitations-collection');
      vi.mocked(query).mockReturnValue('query-result');
      vi.mocked(doc).mockReturnValue('project-doc-ref');
      
      vi.mocked(getDocs).mockResolvedValueOnce({
        docs: mockInvitations.map(inv => ({
          id: inv.id,
          data: () => inv
        }))
      });

      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        id: mockProject.id,
        data: () => mockProject
      });

      const result = await fetchReviewRequests('test-user-id');
      
      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(result[0].project.id).toBe('project1');
    });
  });

  describe('submitReviewFeedback', () => {
    it('submits feedback successfully', async () => {
      const mockFeedback = {
        comment: 'Great project',
        rating: 4,
        status: 'approved'
      };

      vi.mocked(collection).mockReturnValue('reviews-collection');
      vi.mocked(doc).mockReturnValue('project-doc-ref');
      
      vi.mocked(addDoc).mockResolvedValueOnce({
        id: 'feedback1'
      });

      vi.mocked(updateDoc).mockResolvedValueOnce(undefined);

      const result = await submitReviewFeedback('project1', 'reviewer1', mockFeedback);

      expect(result).toEqual({
        success: true,
        feedbackId: 'feedback1'
      });
    });

    it('handles submission errors', async () => {
      vi.mocked(addDoc).mockRejectedValue(new Error('Database error'));

      await expect(submitReviewFeedback({}))
        .rejects
        .toThrow('Failed to submit review feedback');
    });
  });

  describe('getProjectFeedback', () => {

    it('fetches feedback with reviewer details', async () => {
      const mockTimestamp = {
        toDate: () => new Date(),
        seconds: Math.floor(Date.now() / 1000),
        nanoseconds: 0
      };

      const mockFeedbackDoc = {
        id: 'feedback1',
        reviewerId: 'reviewer1',
        feedback: 'Great work',
        rating: 4,
        status: 'approved',
        createdAt: mockTimestamp,
        updatedAt: mockTimestamp
      };

      const mockReviewer = {
        id: 'reviewer1',
        fullName: 'John Doe',
        expertise: ['AI']
      };

      vi.mocked(collection).mockReturnValue('reviews-collection');
      vi.mocked(query).mockReturnValue('query-result');
      vi.mocked(doc).mockReturnValue('reviewer-doc-ref');

      vi.mocked(getDocs).mockResolvedValueOnce({
        docs: [{
          id: mockFeedbackDoc.id,
          data: () => mockFeedbackDoc
        }]
      });

      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => mockReviewer
      });

      const result = await getProjectFeedback('project1');

      expect(result).toHaveLength(1);
      expect(result[0].reviewer.name).toBe('John Doe');
      expect(result[0].rating).toBe(4);
      expect(result[0].createdAt).toBeDefined();
      expect(result[0].updatedAt).toBeDefined();
    });

    it('handles missing reviewer data', async () => {
      const mockTimestamp = {
        toDate: () => new Date(),
        seconds: Math.floor(Date.now() / 1000),
        nanoseconds: 0
      };

      const mockFeedbackDoc = {
        id: 'feedback1',
        reviewerId: 'reviewer1',
        feedback: 'Good work',
        rating: 4,
        status: 'approved',
        createdAt: mockTimestamp,
        updatedAt: mockTimestamp
      };

      vi.mocked(collection).mockReturnValue('reviews-collection');
      vi.mocked(query).mockReturnValue('query-result');
      vi.mocked(doc).mockReturnValue('reviewer-doc-ref');

      vi.mocked(getDocs).mockResolvedValueOnce({
        docs: [{
          id: mockFeedbackDoc.id,
          data: () => mockFeedbackDoc
        }]
      });

      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => false,
        data: () => null
      });

      const result = await getProjectFeedback('project1');

      expect(result).toHaveLength(1);
      expect(result[0].reviewer.name).toBe('Anonymous Reviewer');
      expect(result[0].reviewer.expertise).toBe('Not specified');
      expect(result[0].feedback).toBe('Good work');
      expect(result[0].createdAt).toBeDefined();
    });
  });

  describe('updateReviewerInformation', () => {
    it('updates reviewer details in project', async () => {
      const mockReviewers = [
        { id: 'reviewer1', name: 'John Doe' }
      ];

      const mockDocRef = {};
      vi.mocked(doc).mockReturnValue(mockDocRef);

      vi.mocked(getDoc)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            reviewers: mockReviewers
          })
        })
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            fullName: 'John Doe Updated',
            expertise: ['AI', 'ML']
          })
        });

      vi.mocked(updateDoc).mockResolvedValue(undefined);

      const result = await updateExistingReviewerInfo('project1');

      expect(result).toBe(true);
      expect(updateDoc).toHaveBeenCalledWith(
        mockDocRef,
        {
          reviewers: [
            {
              id: 'reviewer1',
              name: 'John Doe Updated',
              fieldOfResearch: ['AI', 'ML']
            }
          ],
          updatedAt: expect.any(Date)
        }
      );
    });

    it('handles non-existent project', async () => {
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => false
      });

      await expect(updateExistingReviewerInfo('non-existent'))
        .rejects
        .toThrow('Project not found');
    });
  });
});