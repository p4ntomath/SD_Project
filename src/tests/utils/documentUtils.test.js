import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  handleCreateFolder,
  handleFileUpload,
  handleDeleteFolder,
  confirmDeleteFolder,
  handleDeleteFile,
  handleDownload,
  handleRenameFolder
} from '../../utils/documentUtils';
import { createFolder, updateFolderName, deleteFolder } from '../../backend/firebase/folderDB';
import { uploadDocument, deleteDocument } from '../../backend/firebase/documentsDB';
import { getDownloadURL, ref } from 'firebase/storage';
import { doc, collection, getDoc } from 'firebase/firestore';
import { storage, db } from '../../backend/firebase/firebaseConfig';

// Mock all Firebase related functions
vi.mock('../../backend/firebase/folderDB', () => ({
  createFolder: vi.fn(),
  updateFolderName: vi.fn(),
  deleteFolder: vi.fn()
}));

vi.mock('../../backend/firebase/documentsDB', () => ({
  uploadDocument: vi.fn(),
  deleteDocument: vi.fn()
}));

vi.mock('firebase/storage', () => ({
  getDownloadURL: vi.fn(),
  ref: vi.fn()
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  collection: vi.fn(),
  getDoc: vi.fn(() => Promise.resolve({
    exists: () => true,
    data: () => ({
      storageFileName: 'test-storage-file.pdf'
    })
  }))
}));

vi.mock('../../backend/firebase/firebaseConfig', () => ({
  storage: {},
  db: {}
}));

describe('documentUtils', () => {
  const mockSetters = {
    setUploadLoading: vi.fn(),
    setFolders: vi.fn(),
    setModalOpen: vi.fn(),
    setError: vi.fn(),
    setStatusMessage: vi.fn(),
    setNewFolderName: vi.fn(),
    setShowFolderModal: vi.fn(),
    setShowUploadModal: vi.fn(),
    setSelectedFile: vi.fn(),
    setCustomName: vi.fn(),
    setCustomDescription: vi.fn(),
    setFolderToDelete: vi.fn(),
    setShowDeleteFolderModal: vi.fn(),
    setDeletingFile: vi.fn(),
    setDownloadingFile: vi.fn()
  };

  const mockFolder = {
    id: 'folder-1',
    name: 'Test Folder',
    files: [],
    projectId: 'project-1',
    size: 0,
    remainingSpace: 104857600 // 100MB in bytes
  };

  const mockFile = {
    name: 'test.pdf',
    size: 1024 * 1024, // 1MB
    type: 'application/pdf'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    Object.values(mockSetters).forEach(setter => setter.mockClear());
  });

  describe('handleCreateFolder', () => {
    it('creates a new folder successfully', async () => {
      createFolder.mockResolvedValueOnce('new-folder-id');
      
      await handleCreateFolder({
        newFolderName: 'New Folder',
        projectId: 'project-1',
        folders: [],
        ...mockSetters
      });

      expect(createFolder).toHaveBeenCalledWith('project-1', 'New Folder');
      expect(mockSetters.setFolders).toHaveBeenCalled();
      expect(mockSetters.setStatusMessage).toHaveBeenCalledWith('Folder created successfully');
    });

    it('handles errors during folder creation', async () => {
      createFolder.mockRejectedValueOnce(new Error('Creation failed'));
      
      await handleCreateFolder({
        newFolderName: 'New Folder',
        projectId: 'project-1',
        folders: [],
        ...mockSetters
      });

      expect(mockSetters.setError).toHaveBeenCalledWith(true);
      expect(mockSetters.setStatusMessage).toHaveBeenCalledWith(expect.stringContaining('Failed to create folder'));
    });
  });

  describe('handleFileUpload', () => {
    it('uploads a file successfully', async () => {
      uploadDocument.mockResolvedValueOnce('new-file-id');
      getDownloadURL.mockResolvedValueOnce('https://download.url');

      await handleFileUpload({
        selectedFile: mockFile,
        selectedFolder: mockFolder,
        customName: 'Custom File Name',
        customDescription: 'Test description',
        folders: [mockFolder],
        ...mockSetters
      });

      expect(uploadDocument).toHaveBeenCalled();
      expect(mockSetters.setStatusMessage).toHaveBeenCalledWith('File uploaded successfully');
    });

    it('validates file size limits', async () => {
      const largeFile = { ...mockFile, size: 20 * 1024 * 1024 }; // 20MB

      await handleFileUpload({
        selectedFile: largeFile,
        selectedFolder: mockFolder,
        customName: 'Large File',
        folders: [mockFolder],
        ...mockSetters
      });

      expect(mockSetters.setError).toHaveBeenCalledWith('File size exceeds the maximum limit of 10MB');
      expect(mockSetters.setShowUploadModal).toHaveBeenCalledWith(false);
    });
  });

  describe('handleDeleteFile', () => {
    it('deletes a file successfully', async () => {
      await handleDeleteFile({
        folderId: 'folder-1',
        fileId: 'file-1',
        projectId: 'project-1',
        folders: [mockFolder],
        ...mockSetters
      });

      expect(deleteDocument).toHaveBeenCalledWith('file-1', 'project-1', 'folder-1');
      expect(mockSetters.setStatusMessage).toHaveBeenCalledWith('File deleted successfully');
    });
  });

  describe('handleDownload', () => {
    beforeEach(() => {
      global.window = {
        open: vi.fn()
      };
    });

    it('downloads a file with direct URL', async () => {
      await handleDownload({
        downloadURL: 'https://test.url',
        ...mockSetters
      });

      expect(global.window.open).toHaveBeenCalledWith('https://test.url', '_blank');
    });

    it('generates download URL if not provided', async () => {
      getDownloadURL.mockResolvedValueOnce('https://generated.url');

      await handleDownload({
        file: {
          projectId: 'project-1',
          folderId: 'folder-1',
          storageFileName: 'file.pdf'
        },
        ...mockSetters
      });

      expect(ref).toHaveBeenCalled();
      expect(getDownloadURL).toHaveBeenCalled();
      expect(global.window.open).toHaveBeenCalledWith('https://generated.url', '_blank');
    });
  });

  describe('handleRenameFolder', () => {
    it('renames a folder successfully', async () => {
      await handleRenameFolder({
        folder: mockFolder,
        newName: 'Renamed Folder',
        folders: [mockFolder],
        ...mockSetters
      });

      expect(updateFolderName).toHaveBeenCalledWith('project-1', 'folder-1', 'Renamed Folder');
      expect(mockSetters.setStatusMessage).toHaveBeenCalledWith('Folder renamed successfully');
    });
  });
});