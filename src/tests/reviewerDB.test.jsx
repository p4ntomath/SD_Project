import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  getAvailableReviewers,
  getReviewerRequests,
  submitReviewFeedback,
  getProjectReviews,
  updateExistingReviewerInfo,
  getReviewerHistory,
  updateReviewFeedback,
  updateReviewRequestStatus
} from '../backend/firebase/reviewerDB';

import { 
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  arrayUnion,
  serverTimestamp
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

  describe('getReviewerRequests', () => {
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

      const result = await getReviewerRequests('test-user-id');
      
      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(result[0].projectId).toBe('project1');
    });
  });

  describe('submitReviewFeedback', () => {


    it('handles submission errors', async () => {
      vi.mocked(addDoc).mockRejectedValueOnce(new Error('Database error'));

      await expect(submitReviewFeedback('project1', 'reviewer1', {
        comment: 'Test',
        rating: 3,
        status: 'approved'
      })).rejects.toThrow('Failed to submit review feedback');
    });
  });

  describe('getProjectReviews', () => {

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

      const result = await getProjectReviews('project1');

      expect(result).toHaveLength(1);
      expect(result[0].reviewer.fullName).toBe('John Doe');
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

      const result = await getProjectReviews('project1');

      expect(result).toHaveLength(1);
      expect(result[0].reviewer.name).toBe('Anonymous Reviewer');
      expect(result[0].reviewer.expertise).toBe('Not specified');
      expect(result[0].feedback).toBe('Good work');
      expect(result[0].createdAt).toBeDefined();
    });
  });

  describe('updateExistingReviewerInfo', () => {
    it('updates reviewer details in project', async () => {
      const mockReviewers = [
        { 
          id: 'reviewer1', 
          name: 'John Doe',
          reviewStatus: 'pending_feedback'
        }
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
            fieldOfResearch: ['AI', 'ML']
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
              fieldOfResearch: ['AI', 'ML'],
              reviewStatus: 'pending_feedback'
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
  
  describe('getReviewerHistory', () => {
    it('fetches review history for a reviewer', async () => {
      const mockTimestamp = {
        toDate: () => new Date(),
        seconds: Math.floor(Date.now() / 1000),
        nanoseconds: 0
      };

      const mockReviews = [{
        id: 'review1',
        projectId: 'project1',
        feedback: 'Good work',
        rating: 4,
        status: 'approved',
        createdAt: mockTimestamp,
        updatedAt: mockTimestamp
      }];

      const mockProject = {
        id: 'project1',
        title: 'Test Project',
        userId: 'researcher1'
      };

      const mockResearcher = {
        id: 'researcher1',
        fullName: 'Jane Research'
      };

      vi.mocked(collection).mockReturnValue('reviews-collection');
      vi.mocked(query).mockReturnValue('query-result');
      vi.mocked(doc).mockReturnValue('doc-ref');

      vi.mocked(getDocs).mockResolvedValueOnce({
        docs: mockReviews.map(review => ({
          id: review.id,
          data: () => review
        }))
      });

      vi.mocked(getDoc)
        .mockResolvedValueOnce({
          exists: () => true,
          id: mockProject.id,
          data: () => mockProject
        })
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => mockResearcher
        });

      const result = await getReviewerHistory('reviewer1');

      expect(result).toHaveLength(1);
      expect(result[0].feedback).toBe('Good work');
      expect(result[0].projectTitle).toBe('Test Project');
      expect(result[0].researcherName).toBe('Jane Research');
    });

    it('handles missing reviewer ID', async () => {
      await expect(getReviewerHistory())
        .rejects
        .toThrow('Failed to get reviewer history');
    });
  });

  describe('updateReviewFeedback', () => {
    it('updates existing review feedback', async () => {
      const mockFeedback = {
        comment: 'Updated feedback',
        rating: 5,
        status: 'approved'
      };

      const mockDocRef = {};
      vi.mocked(doc).mockReturnValue(mockDocRef);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      const result = await updateReviewFeedback('review1', mockFeedback);

      expect(result).toBe(true);
      expect(updateDoc).toHaveBeenCalledWith(
        mockDocRef,
        {
          feedback: 'Updated feedback',
          rating: 5,
          status: 'approved',
          updatedAt: expect.any(Date)
        }
      );
    });

    it('handles update errors', async () => {
      vi.mocked(updateDoc).mockRejectedValue(new Error('Update failed'));

      await expect(updateReviewFeedback('review1', {}))
        .rejects
        .toThrow('Failed to update review feedback');
    });
  });

  describe('updateReviewRequestStatus', () => {
    it('updates request status to accepted and adds reviewer to project', async () => {
      const mockRequest = {
        projectId: 'project1',
        reviewerId: 'reviewer1'
      };

      const mockReviewer = {
        fullName: 'John Reviewer',
        fieldOfResearch: 'AI'
      };

      const mockProject = {
        reviewers: []
      };

      vi.mocked(doc).mockReturnValue('doc-ref');

      vi.mocked(getDoc)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => mockRequest
        })
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => mockProject
        })
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => mockReviewer
        });

      vi.mocked(updateDoc).mockResolvedValue(undefined);

      const result = await updateReviewRequestStatus('request1', 'accepted');

      expect(result).toBe(true);
      expect(updateDoc).toHaveBeenCalledWith(
        'doc-ref',
        {
          status: 'accepted',
          updatedAt: expect.any(Date)
        }
      );
    });

    it('handles non-existent review request', async () => {
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => false
      });

      await expect(updateReviewRequestStatus('non-existent', 'accepted'))
        .rejects
        .toThrow('Review request not found');
    });

    it('updates request status to rejected without adding reviewer', async () => {
      const mockRequest = {
        projectId: 'project1',
        reviewerId: 'reviewer1'
      };

      vi.mocked(doc).mockReturnValue('doc-ref');
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => mockRequest
      });

      vi.mocked(updateDoc).mockResolvedValue(undefined);

      const result = await updateReviewRequestStatus('request1', 'rejected');

      expect(result).toBe(true);
      expect(updateDoc).toHaveBeenCalledWith(
        'doc-ref',
        {
          status: 'rejected',
          updatedAt: expect.any(Date)
        }
      );
    });
  });
});