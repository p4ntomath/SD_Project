import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { 
  uploadDocument,
  fetchDocumentsByFolder,
  reuploadDocument,
  deleteDocument,
  fetchAllDocuments
} from '../backend/firebase/documentsDB';
import { auth } from '../backend/firebase/firebaseConfig';

// Suppress expected error messages and console output during tests
const originalError = console.error;
const originalLog = console.log;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    // Skip all expected test-related error messages
    const skipMessages = [
      'Error uploading document',
      'Storage file not found',
      'Failed to upload document',
      'Object not found',
      'Error deleting document',
      'Failed to delete document',
      'Storage file might already be deleted'
    ];

    // Check both the message and any nested error messages
    const shouldSkip = skipMessages.some(msg => 
      (typeof args[0] === 'string' && args[0].includes(msg)) ||
      (args[0]?.message && args[0].message.includes(msg)) ||
      (args[1] && typeof args[1] === 'string' && args[1].includes(msg))
    );

    if (shouldSkip) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.log = (...args) => {
    // Skip logging downloadURL and metadata
    const skipValues = ['downloadURL', 'metadata'];
    if (skipValues.some(val => 
      (typeof args[0] === 'string' && args[0].includes(val)) ||
      (args[0] && typeof args[0] === 'object' && Object.keys(args[0]).some(key => skipValues.includes(key)))
    )) {
      return;
    }
    originalLog.call(console, ...args);
  };

  console.warn = (...args) => {
    // Skip all storage-related warnings 
    const skipMessages = [
      'Storage file not found',
      'Object not found',
      'continuing with document deletion'
    ];

    if (skipMessages.some(msg => 
      (typeof args[0] === 'string' && args[0].includes(msg)) ||
      (args[0]?.message && args[0].message.includes(msg))
    )) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.log = originalLog;
  console.warn = originalWarn;
});

// Get hoisted mock functions for storage
const { deleteObject, uploadBytes, getDownloadURL } = vi.hoisted(() => ({
  deleteObject: vi.fn(),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn()
}));

// Mock Firebase Storage
vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(() => ({})),
  ref: vi.fn(),
  uploadBytes,
  getDownloadURL,
  deleteObject
}));

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
const { getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, serverTimestamp, collection, doc } = vi.hoisted(() => ({
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  serverTimestamp: vi.fn(() => new Date()),
  collection: vi.fn(),
  doc: vi.fn()
}));

vi.mock('firebase/firestore', () => ({
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp: vi.fn(() => 'mocked-timestamp'),
}));

describe('Document Database Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset auth.currentUser for each test
    auth.currentUser = {
      uid: 'test-user-id'
    };
    // Mock collection to include path
    vi.mocked(collection).mockImplementation((...segments) => ({
      path: segments.join('/'),
    }));
  });

  describe('uploadDocument', () => {
    it('uploads document successfully', async () => {
      const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const mockDownloadURL = 'https://storage.example.com/test.pdf';
      const mockMetadata = {
        displayName: 'Test Document',
        description: 'Test Description'
      };

      // Mock project access check
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({
          userId: 'test-user-id'
        })
      });

      vi.mocked(uploadBytes).mockResolvedValue({});
      vi.mocked(getDownloadURL).mockResolvedValue(mockDownloadURL);
      vi.mocked(setDoc).mockResolvedValue(undefined);
      vi.mocked(doc).mockReturnValue({ id: 'test-doc-id' });

      const result = await uploadDocument(mockFile, 'test-project', 'test-folder', mockMetadata);

      expect(result).toBe('test-doc-id');
      expect(uploadBytes).toHaveBeenCalled();
      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          fileName: mockFile.name,
          displayName: mockMetadata.displayName,
          description: mockMetadata.description
        })
      );
    });

    it('validates file size', async () => {
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.pdf');

      await expect(
        uploadDocument(largeFile, 'test-project', 'test-folder')
      ).rejects.toThrow('Failed to upload document: File size exceeds the 10MB limit');
    });

    it('throws error for unauthorized access', async () => {
      // Simulate no authenticated user
      vi.mocked(auth).currentUser = null;
    
      await expect(
        uploadDocument(new File(['test'], 'test.pdf'), 'test-project', 'test-folder')
      ).rejects.toThrow('Failed to upload document: You don\'t have permission');
    });

  });

  describe('fetchDocumentsByFolder', () => {
    it('fetches documents grouped by folders', async () => {
      const mockFolders = [
        {
          id: 'folder1',
          data: () => ({
            name: 'Folder 1',
            createdAt: new Date()
          })
        }
      ];

      const mockFiles = [
        {
          id: 'file1',
          data: () => ({
            fileName: 'test.pdf',
            displayName: 'Test File',
            description: 'Test Description',
            downloadURL: 'https://example.com/test.pdf',
            size: 1024,
            uploadedAt: new Date()
          })
        }
      ];

      // Mock project access check
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({
          userId: 'test-user-id'
        })
      });

      // Mock getDocs to return different results based on the collection
      vi.mocked(getDocs).mockImplementation(async (ref) => {
        const path = ref?.path || '';

        if (path.includes('reviewRequests')) {
          return { empty: true, docs: [] };
        } else if (path.includes('files')) {
          return { docs: mockFiles };
        } else {
          return { docs: mockFolders };
        }
      });

      const result = await fetchDocumentsByFolder('test-project');

      expect(result).toHaveLength(1); // One folder
      expect(result[0].files).toHaveLength(1); // One file in the folder
      expect(result[0].name).toBe('Folder 1');
      expect(result[0].files[0].name).toBe('Test File');
    });

    it('returns empty array when no folders exist', async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({
          userId: 'test-user-id'
        })
      });

      vi.mocked(getDocs).mockResolvedValue({ docs: [] });

      const result = await fetchDocumentsByFolder('test-project');

      expect(result).toEqual([]);
    });
  });

  describe('reuploadDocument', () => {
    beforeEach(() => {
      vi.clearAllMocks(); // Clear mocks before each test
    });
  
    it('updates existing document', async () => {
      const mockFile = new File(['updated content'], 'updated.pdf');
      const mockDownloadURL = 'https://storage.example.com/updated.pdf';
  
      // Mock necessary Firebase methods
      vi.mocked(uploadBytes).mockResolvedValue({});
      vi.mocked(getDownloadURL).mockResolvedValue(mockDownloadURL);
      vi.mocked(serverTimestamp).mockReturnValue('mocked-timestamp'); // Mock the serverTimestamp
      vi.mocked(updateDoc).mockResolvedValue(undefined); // Mock updateDoc
  
      // Mock doc reference properly
      const mockDocRef = { id: 'test-doc-id' };
      vi.mocked(doc).mockReturnValue(mockDocRef);
  
      // Call the function being tested
      const result = await reuploadDocument(
        mockFile,
        'test-doc-id',
        'test-project',
        'test-folder'
      );
  
      // Assertions
      expect(result).toBe('test-doc-id'); // Ensure the returned document ID matches
  
      expect(updateDoc).toHaveBeenCalledWith(
        mockDocRef, // Use the mocked document reference
        expect.objectContaining({
          downloadURL: mockDownloadURL, // Ensure download URL is correct
          fileName: mockFile.name, // Ensure file name is updated
          uploadedAt: 'mocked-timestamp', // Ensure timestamp is set
        })
      );
    });
  });
  
  describe('deleteDocument', () => {
    beforeEach(() => {
      vi.resetAllMocks();
    });
  
    it('deletes document and storage file', async () => {
      // Mock Firestore document snapshot
      const mockSnap = {
        exists: () => true,
        data: () => ({ storageFileName: 'mockfile.pdf' }),
      };
  
      vi.mocked(getDoc).mockResolvedValue(mockSnap);
      vi.mocked(deleteObject).mockResolvedValue(undefined);
      vi.mocked(deleteDoc).mockResolvedValue(undefined);
  
      const result = await deleteDocument(
        'test-doc-id',
        'test-project-id',
        'test-folder-id'
      );
  
      expect(result).toBe(true);
      expect(getDoc).toHaveBeenCalled();
      expect(deleteObject).toHaveBeenCalled();
      expect(deleteDoc).toHaveBeenCalled();
    });
  
    it('handles missing storage file gracefully', async () => {
      const mockSnap = {
        exists: () => true,
        data: () => ({ storageFileName: 'mockfile.pdf' }),
      };
  
      vi.mocked(getDoc).mockResolvedValue(mockSnap);
      vi.mocked(deleteObject).mockRejectedValue(new Error('Object not found'));
      vi.mocked(deleteDoc).mockResolvedValue(undefined);

      const result = await deleteDocument(
        'test-doc-id',
        'test-project-id',
        'test-folder-id'
      );
  
      expect(result).toBe(true);
      expect(getDoc).toHaveBeenCalled();
      expect(deleteObject).toHaveBeenCalled();
      expect(deleteDoc).toHaveBeenCalled();
    });
  });

  describe('fetchAllDocuments', () => {
    it('fetches documents from all projects', async () => {
      const mockProjects = [
        { id: 'project1', ref: {} }
      ];

      const mockFolders = [
        { id: 'folder1', ref: {}, data: () => ({ name: 'Folder 1' }) }
      ];

      const mockFiles = [
        {
          id: 'file1',
          data: () => ({
            fileName: 'test.pdf',
            displayName: 'Test File',
            description: 'Test Description',
            downloadURL: 'https://example.com/test.pdf',
            size: 1024,
            uploadedAt: new Date()
          })
        }
      ];

      vi.mocked(getDocs)
        .mockResolvedValueOnce({ docs: mockProjects }) // Projects query
        .mockResolvedValueOnce({ docs: mockFolders }) // Folders query
        .mockResolvedValueOnce({ docs: mockFiles }); // Files query

      const result = await fetchAllDocuments();

      expect(result).toHaveLength(1);
      expect(result[0].fileName).toBe('Test File'); // Checking fileName because fetchAllDocuments returns displayName || fileName
      expect(result[0].folderName).toBe('Folder 1');
    });

    it('returns empty array when no documents exist', async () => {
      vi.mocked(getDocs).mockResolvedValue({ docs: [] });

      const result = await fetchAllDocuments();

      expect(result).toEqual([]);
    });
  });
});