import { describe, it, expect, vi, beforeEach } from 'vitest';
import handleImageUpload from '../components/HandleImageUpload';
import { auth } from '../backend/firebase/firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';

// Mock Firebase modules
vi.mock('../backend/firebase/firebaseConfig', () => ({
  auth: {
    currentUser: { uid: 'test-user-id' }
  },
  storage: {},
  db: {}
}));

vi.mock('firebase/storage', () => ({
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn()
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  updateDoc: vi.fn()
}));

describe('HandleImageUpload', () => {
  const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
  const mockEvent = { target: { files: [mockFile] } };
  const mockDownloadURL = 'https://example.com/test.jpg';
  const mockSetFormData = vi.fn();
  const mockSetDraftData = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup successful mock implementations
    ref.mockReturnValue('storage-ref');
    uploadBytes.mockResolvedValue({});
    getDownloadURL.mockResolvedValue(mockDownloadURL);
    doc.mockReturnValue('doc-ref');
    updateDoc.mockResolvedValue({});
  });

  it('successfully uploads an image and updates state', async () => {
    await handleImageUpload(mockEvent, mockSetFormData, mockSetDraftData);

    // Verify Firebase storage operations
    expect(ref).toHaveBeenCalled();
    expect(uploadBytes).toHaveBeenCalledWith('storage-ref', mockFile);
    expect(getDownloadURL).toHaveBeenCalled();

    // Verify Firestore operations
    expect(doc).toHaveBeenCalled();
    expect(updateDoc).toHaveBeenCalledWith('doc-ref', { photoURL: mockDownloadURL });

    // Verify state updates
    expect(mockSetFormData).toHaveBeenCalled();
    expect(mockSetDraftData).toHaveBeenCalled();
  });

  it('handles missing file gracefully', async () => {
    const emptyEvent = { target: { files: [] } };
    await handleImageUpload(emptyEvent, mockSetFormData, mockSetDraftData);

    expect(uploadBytes).not.toHaveBeenCalled();
    expect(mockSetFormData).not.toHaveBeenCalled();
    expect(mockSetDraftData).not.toHaveBeenCalled();
  });

  it('handles upload failure', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    uploadBytes.mockRejectedValueOnce(new Error('Upload failed'));

    await handleImageUpload(mockEvent, mockSetFormData, mockSetDraftData);

    expect(consoleError).toHaveBeenCalled();
    expect(mockSetFormData).not.toHaveBeenCalled();
    expect(mockSetDraftData).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it('handles getDownloadURL failure', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    getDownloadURL.mockRejectedValueOnce(new Error('Get URL failed'));

    await handleImageUpload(mockEvent, mockSetFormData, mockSetDraftData);

    expect(consoleError).toHaveBeenCalled();
    expect(mockSetFormData).not.toHaveBeenCalled();
    expect(mockSetDraftData).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it('handles Firestore update failure', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    updateDoc.mockRejectedValueOnce(new Error('Update failed'));

    await handleImageUpload(mockEvent, mockSetFormData, mockSetDraftData);

    expect(consoleError).toHaveBeenCalled();
    expect(mockSetFormData).not.toHaveBeenCalled();
    expect(mockSetDraftData).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });
});