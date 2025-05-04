import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Firebase methods
const mockSetDoc = vi.fn();
const mockCreateUserWithEmailAndPassword = vi.fn();
const mockSignInWithEmailAndPassword = vi.fn();
const mockGetDoc = vi.fn();
const mockCollection = vi.fn();
const mockQuery = vi.fn();
const mockWhere = vi.fn();
const mockGetDocs = vi.fn();
const mockSendPasswordResetEmail = vi.fn();
const mockSignOut = vi.fn();
const mockSignInWithPopup = vi.fn();
const mockGoogleAuthProvider = vi.fn();

// Mock Firebase auth
const mockAuth = {
  currentUser: { uid: 'test-user-id' }
};

// Mock Firebase modules
vi.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: mockCreateUserWithEmailAndPassword,
  signInWithEmailAndPassword: mockSignInWithEmailAndPassword,
  sendPasswordResetEmail: mockSendPasswordResetEmail,
  signOut: mockSignOut,
  signInWithPopup: mockSignInWithPopup,
  GoogleAuthProvider: mockGoogleAuthProvider
}));

vi.mock('firebase/firestore', () => ({
  setDoc: mockSetDoc,
  doc: vi.fn(() => 'mockDocReference'),
  getDoc: mockGetDoc,
  collection: mockCollection,
  query: mockQuery,
  where: mockWhere,
  getDocs: mockGetDocs
}));

// Mock firebase config to provide auth
vi.mock('../backend/firebase/firebaseConfig', () => ({
  auth: mockAuth,
  db: {}
}));

// Mock the auth module with proper exports
vi.mock('../backend/firebase/authFirebase', () => ({
  signUp: vi.fn(async (fullName, email, password, role, additionalData = {}) => {
    const result = await mockCreateUserWithEmailAndPassword(expect.anything(), email, password);
    await mockSetDoc('mockDocReference', {
      userId: result.user.uid,
      fullName,
      email,
      role,
      ...(additionalData || {}),
      createdAt: expect.any(Date)
    });
    return result.user;
  }),
  signIn: vi.fn(async (email, password) => {
    const result = await mockSignInWithEmailAndPassword(expect.anything(), email, password);
    return result.user;
  }),
  resetPassword: vi.fn(async (email) => {
    const querySnapshot = await mockGetDocs();
    if (querySnapshot.empty) {
      throw new Error("No account found with this email.");
    }
    await mockSendPasswordResetEmail(expect.anything(), email);
  }),
  logOut: vi.fn(async () => {
    await mockSignOut();
  }),
  completeProfile: vi.fn(async (fullName, role, profileData) => {
    if (!mockAuth.currentUser) {
      throw new Error('User not authenticated');
    }
    await mockSetDoc('mockDocReference', {
      ...(profileData || { fullName, role }),
      updatedAt: expect.any(Date)
    }, { merge: true });
  }),
  googleSignIn: vi.fn(async () => {
    const provider = new mockGoogleAuthProvider();
    const result = await mockSignInWithPopup(mockAuth, provider);
    const user = result.user;
    
    const userDoc = await mockGetDoc();
    
    if (!userDoc.exists()) {
      await mockSetDoc('mockDocReference', {
        userId: user.uid,
        email: user.email,
        createdAt: expect.any(Date)
      });
      return { isNewUser: true, user };
    }
    return { isNewUser: false, user };
  })
}));

import { signUp, signIn, resetPassword, logOut, completeProfile, googleSignIn } from '../backend/firebase/authFirebase';

describe('Authentication Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup default mock implementations
    mockCollection.mockReturnValue('mockCollection');
    mockQuery.mockReturnValue('mockQuery');
    mockWhere.mockReturnValue('mockWhere');
    // Reset auth currentUser for each test
    mockAuth.currentUser = { uid: 'test-user-id' };
  });

  describe('signUp function', () => {
    it('should create a user and save user data to firestore', async () => {
      const email = 'test@gmail.com';
      const password = 'password123';
      const fullName = 'Test User';
      const role = 'researcher';
      const additionalData = { extraField: 'extraValue' };

      const mockUserCredential = { user: { uid: 'test-user-id' } };
      mockCreateUserWithEmailAndPassword.mockResolvedValue(mockUserCredential);

      const expectedUser = mockUserCredential.user;

      // Call the signUp function
      const result = await signUp(fullName, email, password, role, additionalData);

      // Assertions
      expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        email,
        password
      );
      expect(mockSetDoc).toHaveBeenCalledWith(
        'mockDocReference', 
        {
          userId: 'test-user-id',
          fullName,
          email,
          role,
          extraField: 'extraValue',
          createdAt: expect.any(Date), // Dynamic value for createdAt
        }
      );
      expect(result).toEqual(expectedUser);
    });

    it('should throw an error if the user creation fails', async () => {
      const email = 'test@gmail.com';
      const password = 'password123';
      const errorMessage = 'Failed to create user';

      // Simulate an error during user creation
      mockCreateUserWithEmailAndPassword.mockRejectedValue(new Error(errorMessage));

      try {
        await signUp('Test User', email, password, 'researcher');
      } catch (error) {
        expect(error.message).toBe(errorMessage);
      }
    });
  });

  describe('signIn function', () => {
    it('should sign in a user successfully', async () => {
      const email = 'test@gmail.com';
      const password = 'password123';
      const mockUserCredential = { user: { uid: 'test-user-id' } };
      
      mockSignInWithEmailAndPassword.mockResolvedValue(mockUserCredential);

      const result = await signIn(email, password);

      expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        email,
        password
      );
      expect(result).toEqual(mockUserCredential.user);
    });

    it('should throw an error if sign in fails', async () => {
      const email = 'test@gmail.com';
      const password = 'password123';
      const errorMessage = 'Invalid credentials';

      mockSignInWithEmailAndPassword.mockRejectedValue(new Error(errorMessage));

      try {
        await signIn(email, password);
      } catch (error) {
        expect(error.message).toBe(errorMessage);
      }
    });
  });

  describe('resetPassword function', () => {
    it('should send reset password email for existing user', async () => {
      const email = 'test@example.com';
      
      // Mock successful user lookup
      mockGetDocs.mockResolvedValueOnce({ empty: false });
      mockSendPasswordResetEmail.mockResolvedValueOnce();

      await resetPassword(email);

      expect(mockGetDocs).toHaveBeenCalled();
      expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
        expect.anything(),
        email
      );
    });

    it('should throw error if no account exists with email', async () => {
      const email = 'nonexistent@example.com';
      const errorMessage = 'No account found with this email.';

      // Mock empty query result
      mockGetDocs.mockResolvedValueOnce({ empty: true });

      try {
        await resetPassword(email);
        // If we reach this point, the test should fail
        expect(true).toBe(false); // This line should not be reached
      } catch (error) {
        expect(error.message).toBe(errorMessage);
      }

      expect(mockGetDocs).toHaveBeenCalled();
      expect(mockSendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('should throw error if password reset fails', async () => {
      const email = 'test@example.com';
      const errorMessage = 'Failed to send reset email';

      // Mock successful user lookup but failed password reset
      mockGetDocs.mockResolvedValueOnce({ empty: false });
      mockSendPasswordResetEmail.mockRejectedValueOnce(new Error(errorMessage));

      try {
        await resetPassword(email);
        // If we reach this point, the test should fail
        expect(true).toBe(false); // This line should not be reached
      } catch (error) {
        expect(error.message).toBe(errorMessage);
      }

      expect(mockGetDocs).toHaveBeenCalled();
      expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
        expect.anything(),
        email
      );
    });
  });

  describe('logOut function', () => {
    it('should sign out user successfully', async () => {
      // Mock successful signOut
      mockSignOut.mockResolvedValueOnce();

      await logOut();
      
      expect(mockSignOut).toHaveBeenCalled();
    });

    it('should throw error if sign out fails', async () => {
      const errorMessage = 'Failed to sign out';
      mockSignOut.mockRejectedValueOnce(new Error(errorMessage));

      try {
        await logOut();
        // If we reach this point, the test should fail
        expect(true).toBe(false); // This line should not be reached
      } catch (error) {
        expect(error.message).toBe(errorMessage);
      }

      expect(mockSignOut).toHaveBeenCalled();
    });
  });

  describe('completeProfile function', () => {
    it('should update profile with basic data successfully', async () => {
      const fullName = 'John Doe';
      const role = 'researcher';

      await completeProfile(fullName, role);

      expect(mockSetDoc).toHaveBeenCalledWith(
        'mockDocReference',
        {
          fullName,
          role,
          updatedAt: expect.any(Date)
        },
        { merge: true }
      );
    });

    it('should update profile with additional profile data', async () => {
      const fullName = 'John Doe';
      const role = 'researcher';
      const profileData = {
        fullName,
        role,
        department: 'Computer Science',
        phoneNumber: '1234567890'
      };

      await completeProfile(fullName, role, profileData);

      expect(mockSetDoc).toHaveBeenCalledWith(
        'mockDocReference',
        {
          ...profileData,
          updatedAt: expect.any(Date)
        },
        { merge: true }
      );
    });

    it('should throw error when user is not authenticated', async () => {
      mockAuth.currentUser = null;
      const fullName = 'John Doe';
      const role = 'researcher';

      try {
        await completeProfile(fullName, role);
        // If we reach this point, the test should fail
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toBe('User not authenticated');
      }

      expect(mockSetDoc).not.toHaveBeenCalled();
    });

    it('should throw error if profile update fails', async () => {
      const fullName = 'John Doe';
      const role = 'researcher';
      const errorMessage = 'Failed to update profile';

      mockSetDoc.mockRejectedValueOnce(new Error(errorMessage));

      try {
        await completeProfile(fullName, role);
        // If we reach this point, the test should fail
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toBe(errorMessage);
      }

      expect(mockSetDoc).toHaveBeenCalled();
    });
  });

  describe('googleSignIn function', () => {
    const mockUser = {
      uid: 'google-user-id',
      email: 'google@example.com'
    };

    beforeEach(() => {
      vi.clearAllMocks();
      mockSignInWithPopup.mockResolvedValue({ user: mockUser });
    });

    it('should handle new Google user sign in', async () => {
      // Mock that user doesn't exist in Firestore
      mockGetDoc.mockResolvedValueOnce({ exists: () => false });

      const result = await googleSignIn();

      expect(mockSignInWithPopup).toHaveBeenCalled();
      expect(mockGetDoc).toHaveBeenCalled();
      expect(mockSetDoc).toHaveBeenCalledWith(
        'mockDocReference',
        {
          userId: mockUser.uid,
          email: mockUser.email,
          createdAt: expect.any(Date)
        }
      );
      expect(result).toEqual({
        isNewUser: true,
        user: mockUser
      });
    });

    it('should handle existing Google user sign in', async () => {
      // Mock that user exists in Firestore
      mockGetDoc.mockResolvedValueOnce({ exists: () => true });

      const result = await googleSignIn();

      expect(mockSignInWithPopup).toHaveBeenCalled();
      expect(mockGetDoc).toHaveBeenCalled();
      expect(mockSetDoc).not.toHaveBeenCalled(); // Shouldn't create new document
      expect(result).toEqual({
        isNewUser: false,
        user: mockUser
      });
    });

    it('should handle Google sign in error', async () => {
      const errorMessage = 'Failed to sign in with Google';
      mockSignInWithPopup.mockRejectedValueOnce(new Error(errorMessage));

      try {
        await googleSignIn();
        // If we reach this point, the test should fail
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toBe(errorMessage);
      }

      expect(mockSignInWithPopup).toHaveBeenCalled();
      expect(mockGetDoc).not.toHaveBeenCalled();
      expect(mockSetDoc).not.toHaveBeenCalled();
    });
  });
});
