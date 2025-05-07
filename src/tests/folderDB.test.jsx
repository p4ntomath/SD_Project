import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  createFolder,
  updateFolderName,
  deleteFolder,
  getFolders
} from '../backend/firebase/folderDB';
import { auth,} from '../backend/firebase/firebaseConfig';
import { deleteDocument } from '../backend/firebase/documentsDB';
import { 
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';

// Mock deleteDocument function from documentsDB
vi.mock('../backend/firebase/documentsDB', () => ({
  deleteDocument: vi.fn()
}));

// Mock Firebase Auth and Firestore
vi.mock('../backend/firebase/firebaseConfig', () => ({
  auth: {
    currentUser: null
  },
  db: {}
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
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    serverTimestamp: vi.fn(() => new Date())
  };
});

describe('Folder Database Operations', () => {
  const originalConsoleError = console.error;
  
  beforeEach(() => {
    // Silence console.error during tests
    console.error = vi.fn();
    vi.clearAllMocks();
    // Set up default authenticated state
    vi.spyOn(auth, 'currentUser', 'get').mockReturnValue({ uid: 'test-user-id' });
  });

  afterEach(() => {
    // Restore console.error after each test
    console.error = originalConsoleError;
  });

  describe('createFolder', () => {
    it('creates a folder successfully', async () => {
      const mockFolderId = 'folder1';
      const folderName = 'Test Folder';

      // Mock document reference
      vi.mocked(doc).mockReturnValue({
        id: mockFolderId
      });

      vi.mocked(setDoc).mockResolvedValue(undefined);

      const result = await createFolder('test-project', folderName);

      expect(result).toBe(mockFolderId);
      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          name: folderName,
          createdBy: 'test-user-id'
        })
      );
    });

    it('throws error when user is not authenticated', async () => {
      vi.spyOn(auth, 'currentUser', 'get').mockReturnValue(null);

      await expect(createFolder('test-project', 'Test Folder'))
        .rejects
        .toThrow('User not authenticated');
    });

    it('validates folder name', async () => {
      await expect(createFolder('test-project', ''))
        .rejects
        .toThrow('Folder name is required');

      await expect(createFolder('test-project', '   '))
        .rejects
        .toThrow('Folder name is required');
    });

    it('validates project ID', async () => {
      await expect(createFolder('', 'Test Folder'))
        .rejects
        .toThrow('Project ID is required');
    });
  });

  describe('updateFolderName', () => {
    it('updates folder name successfully', async () => {
      const newName = 'Updated Folder Name';

      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true
      });

      const mockDocRef = {};
      vi.mocked(doc).mockReturnValue(mockDocRef);

      await updateFolderName('test-project', 'folder1', newName);

      expect(updateDoc).toHaveBeenCalledWith(
        mockDocRef,
        {
          name: newName,
          updatedAt: expect.any(Date)
        }
      );
    });

    it('throws error for non-existent folder', async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false
      });

      await expect(updateFolderName('test-project', 'non-existent', 'New Name'))
        .rejects
        .toThrow('Folder not found');
    });

    it('validates new folder name', async () => {
      await expect(updateFolderName('test-project', 'folder1', ''))
        .rejects
        .toThrow('New folder name is required');

      await expect(updateFolderName('test-project', 'folder1', '   '))
        .rejects
        .toThrow('New folder name is required');
    });
  });

  describe('deleteFolder', () => {
    it('deletes folder and its contents', async () => {
      const mockFiles = [
        { id: 'file1' },
        { id: 'file2' }
      ];

      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true
      });

      vi.mocked(getDocs).mockResolvedValue({
        docs: mockFiles.map(file => ({
          id: file.id
        }))
      });

      vi.mocked(deleteDocument).mockResolvedValue(true);
      vi.mocked(deleteDoc).mockResolvedValue(undefined);

      await deleteFolder('test-project', 'folder1');

      // Should attempt to delete each file
      expect(deleteDocument).toHaveBeenCalledTimes(2);
      // Should delete the folder itself
      expect(deleteDoc).toHaveBeenCalled();
    });

    it('throws error for non-existent folder', async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false
      });

      await expect(deleteFolder('test-project', 'non-existent'))
        .rejects
        .toThrow('Folder not found');
    });

    it('handles missing files gracefully', async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true
      });

      vi.mocked(getDocs).mockResolvedValue({
        docs: []
      });

      vi.mocked(deleteDoc).mockResolvedValue(undefined);

      await deleteFolder('test-project', 'folder1');

      // Should still delete the folder even if it's empty
      expect(deleteDoc).toHaveBeenCalled();
    });
  });

  describe('getFolders', () => {
    it('fetches all folders for a project', async () => {
      const mockFolders = [
        {
          id: 'folder1',
          name: 'Documents',
          createdAt: new Date()
        },
        {
          id: 'folder2',
          name: 'Images',
          createdAt: new Date()
        }
      ];

      vi.mocked(getDocs).mockResolvedValue({
        docs: mockFolders.map(folder => ({
          id: folder.id,
          data: () => folder
        }))
      });

      const result = await getFolders('test-project');

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Documents');
      expect(result[1].name).toBe('Images');
    });

    it('throws error when user is not authenticated', async () => {
      vi.spyOn(auth, 'currentUser', 'get').mockReturnValue(null);

      await expect(getFolders('test-project'))
        .rejects
        .toThrow('User not authenticated');
    });

    it('returns empty array when no folders exist', async () => {
      vi.mocked(getDocs).mockResolvedValue({
        docs: []
      });

      const result = await getFolders('test-project');

      expect(result).toEqual([]);
    });
  });
});