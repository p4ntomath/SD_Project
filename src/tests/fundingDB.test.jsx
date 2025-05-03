import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  fetchFunding,
  updateProjectFunds,
  updateProjectExpense,
  getFundingHistory
} from '../backend/firebase/fundingDB';
import { getDocs, getDoc, updateDoc ,addDoc} from 'firebase/firestore';

// Mock Firebase Auth
vi.mock('../backend/firebase/firebaseConfig', () => ({
  auth: {
    currentUser: {
      uid: 'test-user-id'
    }
  },
  db: {
    collection: vi.fn(),
    doc: vi.fn()
  }
}));

// Mock Firestore methods
vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    collection: vi.fn(),
    doc: vi.fn(),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    addDoc: vi.fn(),
    updateDoc: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    Timestamp: {
      now: vi.fn(() => ({ seconds: Math.floor(Date.now() / 1000) }))
    }
  };
});

describe('Funding Database Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchFunding', () => {
    it('fetches all funding opportunities', async () => {
      const mockFunding = [
        { id: '1', name: 'Fund 1', amount: 10000 },
        { id: '2', name: 'Fund 2', amount: 20000 }
      ];

      vi.mocked(getDocs).mockResolvedValue({
        docs: mockFunding.map(fund => ({
          id: fund.id,
          data: () => fund
        }))
      });

      const result = await fetchFunding();

      expect(result).toHaveLength(2);
      expect(result).toEqual(expect.arrayContaining(mockFunding));
    });

    it('returns empty array when no funding exists', async () => {
      vi.mocked(getDocs).mockResolvedValue({
        docs: []
      });

      const result = await fetchFunding();

      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });

    it('handles errors gracefully', async () => {
      vi.mocked(getDocs).mockRejectedValue(new Error('Database error'));

      await expect(fetchFunding())
        .rejects
        .toThrow('Failed to fetch funding information');
    });
  });

  describe('updateProjectFunds', () => {
    it('updates project funds successfully', async () => {
      const projectId = 'test-project-id';
      const amount = 5000;

      // Mock project data
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({
          availableFunds: 10000,
          userId: 'test-user-id'
        })
      });

      vi.mocked(updateDoc).mockResolvedValue(undefined);
      vi.mocked(addDoc).mockResolvedValue({ id: 'transaction-id' });

      const result = await updateProjectFunds(projectId, amount);

      expect(result).toEqual(expect.objectContaining({
        success: true,
        message: 'Funds updated and history logged'
      }));
      expect(updateDoc).toHaveBeenCalled();
      expect(addDoc).toHaveBeenCalled();
    });

    it('throws error for unauthorized user', async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({
          userId: 'different-user-id'
        })
      });

      await expect(updateProjectFunds('test-project-id', 1000))
        .rejects
        .toThrow('Not authorized to update funding for this project');
    });

    it('throws error for non-existent project', async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false
      });

      await expect(updateProjectFunds('non-existent-id', 1000))
        .rejects
        .toThrow('Project not found');
    });
  });

  describe('updateProjectExpense', () => {
    it('updates project expenses successfully', async () => {
      const projectId = 'test-project-id';
      const amount = 1000;
      const description = 'Test expense';

      // Mock project data
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({
          availableFunds: 5000,
          usedFunds: 2000,
          userId: 'test-user-id'
        })
      });

      vi.mocked(updateDoc).mockResolvedValue(undefined);
      vi.mocked(addDoc).mockResolvedValue({ id: 'expense-id' });

      const result = await updateProjectExpense(projectId, amount, description);

      expect(result).toEqual(expect.objectContaining({
        success: true,
        message: 'Expense updated and history logged'
      }));
      expect(updateDoc).toHaveBeenCalled();
      expect(addDoc).toHaveBeenCalled();
    });

    it('throws error for insufficient funds', async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({
          availableFunds: 500,  // Less than expense amount
          usedFunds: 0,
          userId: 'test-user-id'
        })
      });

      await expect(updateProjectExpense('test-project-id', 1000, 'Test'))
        .rejects
        .toThrow('Insufficient funds');
    });
  });

  describe('getFundingHistory', () => {
    it('fetches funding history for a project', async () => {
      // Mock project document
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({
          userId: 'test-user-id'
        })
      });

      const mockHistory = [
        { id: '1', type: 'funds', amount: 5000 },
        { id: '2', type: 'expense', amount: -1000 }
      ];

      vi.mocked(getDocs).mockResolvedValue({
        docs: mockHistory.map(item => ({
          id: item.id,
          data: () => item
        }))
      });

      const result = await getFundingHistory('test-project-id');

      expect(result).toHaveLength(2);
      expect(result).toEqual(expect.arrayContaining(mockHistory));
    });

    it('returns empty array for no history', async () => {
      // Mock project document
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({
          userId: 'test-user-id'
        })
      });
      
      vi.mocked(getDocs).mockResolvedValue({
        docs: []
      });

      const result = await getFundingHistory('test-project-id');

      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });
  });
});