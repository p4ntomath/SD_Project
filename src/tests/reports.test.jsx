// filepath: src/tests/reports.unit.test.jsx
import { describe, it, expect, vi } from 'vitest';
import { getProjectFunding, getAllProjectFoldersWithFiles, getReviewedProjects } from '../backend/firebase/reports';
import { fetchProjects } from '../backend/firebase/projectDB';
import { getFundingHistory } from '../backend/firebase/fundingDB';
import { getDocs, getDoc } from 'firebase/firestore';

vi.mock('../backend/firebase/projectDB');
vi.mock('../backend/firebase/fundingDB');
vi.mock('firebase/firestore', () => ({
  initializeFirestore: vi.fn(() => ({})),
  persistentLocalCache: vi.fn(() => ({})),
  persistentMultipleTabManager: vi.fn(() => ({})),
  CACHE_SIZE_UNLIMITED: 999999999,
  getDoc: vi.fn(),
  doc: vi.fn((db, collection, id) => ({ path: `${collection}/${id}`, id })),
  collection: vi.fn(),
  addDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn((ref) => ref),
  where: vi.fn((field, op, val) => ({ field, op, val })),
}));

describe('getProjectFunding', () => {
  it('throws error when uid is missing', async () => {
    await expect(getProjectFunding()).rejects.toThrow('User ID is required');
  });

  it('returns empty array when no projects', async () => {
    vi.mocked(fetchProjects).mockResolvedValue([]);
    await expect(getProjectFunding('user1')).resolves.toEqual([]);
  });

  it('filters funding history by startDate', async () => {
    const mockProjects = [{ id: '1', title: 'P1' }];
    const entryOld = { updatedAt: { toDate: () => new Date('2020-01-01') }, date: '2020-01-01' };
    const entryNew = { updatedAt: { toDate: () => new Date('2025-01-01') }, date: '2025-01-01' };
    vi.mocked(fetchProjects).mockResolvedValue(mockProjects);
    vi.mocked(getFundingHistory).mockResolvedValue([entryOld, entryNew]);

    const result = await getProjectFunding('user1', new Date('2024-01-01'));
    expect(result).toHaveLength(1);
    expect(result[0].fundingHistory).toEqual([entryNew]);
  });

  it('handles fetchProjects error', async () => {
    vi.mocked(fetchProjects).mockRejectedValue(new Error('DB fail'));
    await expect(getProjectFunding('user1')).rejects.toThrow('Failed to get project funding data');
  });
});

// Minimal tests for folder and review functions
describe('getAllProjectFoldersWithFiles', () => {
  it('throws error when uid is missing', async () => {
    await expect(getAllProjectFoldersWithFiles()).rejects.toThrow('User ID is required');
  });

  it('returns empty array when no projects', async () => {
    vi.mocked(fetchProjects).mockResolvedValue([]);
    await expect(getAllProjectFoldersWithFiles('user1')).resolves.toEqual([]);
  });
});

describe('getReviewedProjects', () => {
  it('throws error when uid is missing', async () => {
    await expect(getReviewedProjects()).rejects.toThrow('Reviewer ID is required');
  });

  it('returns empty array when no reviews', async () => {
    vi.mocked(getDocs).mockResolvedValue({ empty: true, docs: [] });
    await expect(getReviewedProjects('user1')).resolves.toEqual([]);
  });
});