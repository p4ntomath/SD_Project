import { describe, it, expect, vi } from 'vitest';
import { getUserProfile } from '../backend/firebase/viewprofile';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { uploadUserProfilePicture } from '../backend/firebase/viewprofile';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { deleteProfilePicture } from '../backend/firebase/viewprofile';
import { deleteObject } from 'firebase/storage';
import { auth } from '../backend/firebase/firebaseConfig';
import { updateUserProfile } from '../backend/firebase/viewprofile';

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

describe('getUserProfile()', () => {
    it('returns user profile data when user exists', async () => {
        const profile = await getUserProfile();
        expect(profile.fullName).toBe('Test User');
        expect(profile.profilePicture).toBe('url');
    });
});

describe('uploadUserProfilePicture', () => {
    it('uploads file and updates Firestore', async () => {
        const fakeFile = new File(['dummy content'], 'profile.jpg', { type: 'image/jpeg' });

        const mockRef = {};
        const mockUrl = 'https://firebase.com/fake-url.jpg';

        ref.mockReturnValue(mockRef);
        uploadBytes.mockResolvedValue(); // doesn't return anything
        getDownloadURL.mockResolvedValue(mockUrl);
        doc.mockReturnValue('userDocRef');
        updateDoc.mockResolvedValue();
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



    describe('deleteProfilePicture', () => {
        it('deletes profile picture from storage and clears Firestore field', async () => {
            const mockRef = {};
            const mockUser = { uid: 'user123' };

            // Set auth user
            vi.mocked(auth).currentUser = mockUser;

            // Define mock behavior
            ref.mockReturnValue(mockRef);
            deleteObject.mockResolvedValue(); // simulate file deleted
            doc.mockReturnValue('userDocRef');
            updateDoc.mockResolvedValue(); // simulate firestore update

            const result = await deleteProfilePicture();

            expect(ref).toHaveBeenCalledWith({}, 'profilePictures/user123/profile.jpg');
            expect(deleteObject).toHaveBeenCalledWith(mockRef);
            expect(updateDoc).toHaveBeenCalledWith('userDocRef', {
                profilePicture: '',
            });
            expect(result).toBe(true);
        });
    });

    describe('updateUserProfile', () => {
        it('updates user profile fields in Firestore', async () => {
            const mockUser = { uid: 'user123' };
            const mockData = {
                fullName: 'Updated Name',
                bio: 'Updated Bio',
                researchField: 'AI',
            };

            auth.currentUser = mockUser;
            doc.mockReturnValue('userDocRef');
            updateDoc.mockResolvedValue();

            await updateUserProfile(mockData);

            expect(doc).toHaveBeenCalledWith({}, 'users', 'user123');
            expect(updateDoc).toHaveBeenCalledWith('userDocRef', mockData);


        });
    });

});
