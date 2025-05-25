import { describe, it, expect, vi } from 'vitest';
import { getUserProfile, uploadUserProfilePicture, deleteProfilePicture, updateUserProfile } from '../backend/firebase/viewprofile';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { auth } from '../backend/firebase/firebaseConfig';

// Mock Firebase modules
vi.mock('firebase/auth', () => ({
    auth: { currentUser: { uid: 'user123' } },
}));

vi.mock('firebase/firestore', () => ({
    doc: vi.fn(),
    updateDoc: vi.fn(),
    getDoc: vi.fn(() => Promise.resolve({
        exists: () => true,
        data: () => ({ fullName: 'Test User', profilePicture: 'url' }),
    })),
}));

vi.mock('firebase/storage', () => ({
    ref: vi.fn(),
    uploadBytes: vi.fn(),
    getDownloadURL: vi.fn(),
    deleteObject: vi.fn(),
}));

vi.mock('../backend/firebase/firebaseConfig', () => ({
    auth: { currentUser: { uid: 'user123' } },
    db: {},
    storage: {},
}));

describe('Profile Management', () => {
    describe('getUserProfile', () => {
        it('returns user profile data when user exists', async () => {
            const profile = await getUserProfile();
            expect(profile.fullName).toBe('Test User');
            expect(profile.profilePicture).toBe('url');
        });

        it('throws error when user is not logged in', async () => {
            vi.mocked(auth).currentUser = null;
            await expect(getUserProfile()).rejects.toThrow('User not logged in');
            vi.mocked(auth).currentUser = { uid: 'user123' }; // Reset for other tests
        });

        it('throws error when user profile not found', async () => {
            vi.mocked(getDoc).mockResolvedValueOnce({
                exists: () => false,
                data: () => null,
            });
            await expect(getUserProfile()).rejects.toThrow('User profile not found');
        });
    });

    describe('uploadUserProfilePicture', () => {
        it('successfully uploads profile picture', async () => {
            const fakeFile = new File(['dummy content'], 'profile.jpg', { type: 'image/jpeg' });
            const mockRef = {};
            const mockUrl = 'https://firebase.com/fake-url.jpg';

            ref.mockReturnValue(mockRef);
            uploadBytes.mockResolvedValue();
            getDownloadURL.mockResolvedValue(mockUrl);
            doc.mockReturnValue('userDocRef');
            updateDoc.mockResolvedValue();

            const result = await uploadUserProfilePicture(fakeFile);

            expect(ref).toHaveBeenCalledWith({}, 'profilePictures/user123/profile.jpg');
            expect(uploadBytes).toHaveBeenCalledWith(mockRef, fakeFile);
            expect(getDownloadURL).toHaveBeenCalledWith(mockRef);
            expect(updateDoc).toHaveBeenCalledWith('userDocRef', {
                profilePicture: mockUrl,
            });
            expect(result).toBe(mockUrl);
        });

        it('throws error when upload fails', async () => {
            const fakeFile = new File(['dummy content'], 'profile.jpg', { type: 'image/jpeg' });
            uploadBytes.mockRejectedValueOnce(new Error('Upload failed'));
            await expect(uploadUserProfilePicture(fakeFile)).rejects.toThrow();
        });
    });

    describe('deleteProfilePicture', () => {
        it('successfully deletes profile picture', async () => {
            const mockRef = {};
            ref.mockReturnValue(mockRef);
            deleteObject.mockResolvedValue();
            doc.mockReturnValue('userDocRef');
            updateDoc.mockResolvedValue();

            const result = await deleteProfilePicture();

            expect(ref).toHaveBeenCalledWith({}, 'profilePictures/user123/profile.jpg');
            expect(deleteObject).toHaveBeenCalledWith(mockRef);
            expect(updateDoc).toHaveBeenCalledWith('userDocRef', {
                profilePicture: '',
            });
            expect(result).toBe(true);
        });

        it('handles case when file does not exist', async () => {
            const mockError = { code: 'storage/object-not-found' };
            deleteObject.mockRejectedValueOnce(mockError);
            doc.mockReturnValue('userDocRef');
            updateDoc.mockResolvedValue();

            const result = await deleteProfilePicture();
            expect(result).toBe(true);
            expect(updateDoc).toHaveBeenCalledWith('userDocRef', {
                profilePicture: '',
            });
        });
    });

    describe('updateUserProfile', () => {
        it('successfully updates user profile', async () => {
            const profileData = {
                fullName: 'Updated Name',
                bio: 'Updated Bio',
                fieldOfResearch: 'AI',
                institution: 'Test University'
            };

            doc.mockReturnValue('userDocRef');
            updateDoc.mockResolvedValue();

            const result = await updateUserProfile(profileData);

            expect(doc).toHaveBeenCalledWith({}, 'users', 'user123');
            expect(updateDoc).toHaveBeenCalledWith('userDocRef', profileData);
            expect(result).toBe(true);
        });

        it('throws error when user is not logged in', async () => {
            vi.mocked(auth).currentUser = null;
            const profileData = { fullName: 'Test' };
            await expect(updateUserProfile(profileData)).rejects.toThrow('User not logged in');
            vi.mocked(auth).currentUser = { uid: 'user123' }; // Reset for other tests
        });

        it('throws error when update fails', async () => {
            updateDoc.mockRejectedValueOnce(new Error('Update failed'));
            const profileData = { fullName: 'Test' };
            await expect(updateUserProfile(profileData)).rejects.toThrow();
        });
    });
});
