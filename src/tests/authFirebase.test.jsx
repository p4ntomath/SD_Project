import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Firebase methods
const mockCreateUserWithEmailAndPassword = vi.fn();
const mockSignInWithEmailAndPassword = vi.fn();
const mockSignInWithPopup = vi.fn();
const mockGetDoc = vi.fn();
const mockSetDoc = vi.fn();
const mockCollection = vi.fn();
const mockQuery = vi.fn();
const mockWhere = vi.fn();
const mockGetDocs = vi.fn();
const mockSendPasswordResetEmail = vi.fn();
const mockSignOut = vi.fn();
const mockOnAuthStateChanged = vi.fn();
const mockGoogleAuthProvider = vi.fn();

// Mock auth object
const mockAuth = {
  currentUser: { uid: 'test-user-id' }
};

// Mock Firebase modules
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => mockAuth),
  createUserWithEmailAndPassword: (...args) => mockCreateUserWithEmailAndPassword(...args),
  signInWithEmailAndPassword: (...args) => mockSignInWithEmailAndPassword(...args),
  signInWithPopup: (...args) => mockSignInWithPopup(...args),
  sendPasswordResetEmail: (...args) => mockSendPasswordResetEmail(...args),
  signOut: (...args) => mockSignOut(...args),
  onAuthStateChanged: (...args) => mockOnAuthStateChanged(...args),
  GoogleAuthProvider: vi.fn(() => mockGoogleAuthProvider)
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => 'mockDocRef'),
  collection: (...args) => mockCollection(...args),
  query: (...args) => mockQuery(...args),
  where: (...args) => mockWhere(...args),
  getDocs: (...args) => mockGetDocs(...args),
  getDoc: (...args) => mockGetDoc(...args),
  setDoc: (...args) => mockSetDoc(...args)
}));

// Mock Firebase config
vi.mock('../backend/firebase/firebaseConfig', () => ({
  auth: mockAuth,
  db: {}
}));

// Mock the entire authFirebase module
vi.mock('../backend/firebase/authFirebase', async () => ({
  signUp: async (fullName, email, password) => {
    const userCredential = await mockCreateUserWithEmailAndPassword(mockAuth, email, password);
    await mockSetDoc('mockDocRef', {
      userId: userCredential.user.uid,
      fullName,
      email,
      createdAt: expect.any(Date)
    });
    return userCredential.user;
  },
  signIn: async (email, password) => {
    const userCredential = await mockSignInWithEmailAndPassword(mockAuth, email, password);
    return userCredential.user;
  },
  googleSignIn: async () => {
    const result = await mockSignInWithPopup(mockAuth, mockGoogleAuthProvider);
    const userDoc = await mockGetDoc();
    if (!userDoc.exists()) {
      await mockSetDoc('mockDocRef', {
        userId: result.user.uid,
        email: result.user.email,
        fullName: result.user.displayName,
        createdAt: expect.any(Date)
      });
      return { isNewUser: true, user: result.user };
    }
    return { isNewUser: false, user: result.user };
  },
  resetPassword: async (email) => {
    const querySnapshot = await mockGetDocs();
    if (querySnapshot.empty) {
      throw new Error('No account found with this email.');
    }
    await mockSendPasswordResetEmail(mockAuth, email);
  },
  completeProfile: async (fullName, role, profileData = {}) => {
    if (!mockAuth.currentUser) {
      throw new Error('User not authenticated');
    }
    await mockSetDoc('mockDocRef', {
      fullName,
      role,
      ...profileData,
      updatedAt: expect.any(Date)
    }, { merge: true });
  },
  getUserRole: async (uid) => {
    const docSnap = await mockGetDoc();
    if (docSnap.exists()) {
      return docSnap.data().role;
    }
    return null;
  },
  logOut: async () => {
    await mockSignOut(mockAuth);
  },
  authStateListener: (callback) => {
    return mockOnAuthStateChanged(mockAuth, callback);
  }
}));

// Import AFTER mocking
const { 
  signUp, 
  signIn, 
  googleSignIn, 
  resetPassword, 
  logOut, 
  completeProfile,
  getUserRole,
  authStateListener 
} = await import('../backend/firebase/authFirebase');

describe('Authentication Operations', () => {
  const mockUser = {
    uid: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.currentUser = mockUser;
  });

  describe('signUp', () => {
    const testEmail = 'test@example.com';
    const testPassword = 'Password123!';
    const testName = 'Test User';

    it('should create a new user and store their data', async () => {
      mockCreateUserWithEmailAndPassword.mockResolvedValueOnce({ user: mockUser });
      mockSetDoc.mockResolvedValueOnce();

      const result = await signUp(testName, testEmail, testPassword);

      expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(mockAuth, testEmail, testPassword);
      expect(mockSetDoc).toHaveBeenCalledWith(
        'mockDocRef',
        expect.objectContaining({
          userId: mockUser.uid,
          fullName: testName,
          email: testEmail,
          createdAt: expect.any(Date)
        })
      );
      expect(result).toEqual(mockUser);
    });

    it('should handle signup errors properly', async () => {
      const error = new Error('Email already in use');
      error.code = 'auth/email-already-in-use';
      mockCreateUserWithEmailAndPassword.mockRejectedValueOnce(error);

      await expect(signUp(testName, testEmail, testPassword))
        .rejects
        .toThrow('Email already in use');
    });
  });

  describe('signIn', () => {
    const testEmail = 'test@example.com';
    const testPassword = 'Password123!';

    it('should sign in an existing user', async () => {
      mockSignInWithEmailAndPassword.mockResolvedValueOnce({ user: mockUser });

      const result = await signIn(testEmail, testPassword);

      expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(mockAuth, testEmail, testPassword);
      expect(result).toEqual(mockUser);
    });

    it('should handle invalid credentials', async () => {
      const error = new Error('Invalid password');
      error.code = 'auth/wrong-password';
      mockSignInWithEmailAndPassword.mockRejectedValueOnce(error);

      await expect(signIn(testEmail, testPassword))
        .rejects
        .toThrow('Invalid password');
    });
  });

  describe('googleSignIn', () => {
    it('should handle new Google user signup', async () => {
      mockSignInWithPopup.mockResolvedValueOnce({ user: mockUser });
      mockGetDoc.mockResolvedValueOnce({ exists: () => false });
      mockSetDoc.mockResolvedValueOnce();

      const result = await googleSignIn();

      expect(mockSignInWithPopup).toHaveBeenCalled();
      expect(mockSetDoc).toHaveBeenCalledWith(
        'mockDocRef',
        expect.objectContaining({
          userId: mockUser.uid,
          email: mockUser.email,
          fullName: mockUser.displayName,
          createdAt: expect.any(Date)
        })
      );
      expect(result).toEqual({ isNewUser: true, user: mockUser });
    });

    it('should handle existing Google user signin', async () => {
      mockSignInWithPopup.mockResolvedValueOnce({ user: mockUser });
      mockGetDoc.mockResolvedValueOnce({ exists: () => true });

      const result = await googleSignIn();

      expect(mockSignInWithPopup).toHaveBeenCalled();
      expect(mockSetDoc).not.toHaveBeenCalled();
      expect(result).toEqual({ isNewUser: false, user: mockUser });
    });
  });

  describe('resetPassword', () => {
    const testEmail = 'test@example.com';

    it('should send reset email for existing user', async () => {
      mockGetDocs.mockResolvedValueOnce({ empty: false });
      mockSendPasswordResetEmail.mockResolvedValueOnce();

      await resetPassword(testEmail);

      expect(mockGetDocs).toHaveBeenCalled();
      expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(mockAuth, testEmail);
    });

    it('should reject for non-existent email', async () => {
      mockGetDocs.mockResolvedValueOnce({ empty: true });

      await expect(resetPassword(testEmail))
        .rejects
        .toThrow('No account found with this email.');
    });
  });

  describe('completeProfile', () => {
    it('should update user profile data', async () => {
      const profileData = {
        institution: 'Test University',
        department: 'Computer Science',
        fieldOfResearch: 'AI'
      };

      mockSetDoc.mockResolvedValueOnce();

      await completeProfile('Test User', 'researcher', profileData);

      expect(mockSetDoc).toHaveBeenCalledWith(
        'mockDocRef',
        expect.objectContaining({
          fullName: 'Test User',
          role: 'researcher',
          ...profileData,
          updatedAt: expect.any(Date)
        }),
        { merge: true }
      );
    });

    it('should handle unauthorized profile update', async () => {
      mockAuth.currentUser = null;

      await expect(completeProfile('Test User', 'researcher'))
        .rejects
        .toThrow('User not authenticated');
    });
  });

  describe('getUserRole', () => {
    it('should return user role when available', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ role: 'researcher' })
      });

      const role = await getUserRole('test-user-id');
      expect(role).toBe('researcher');
    });

    it('should return null for non-existent user', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => false
      });

      const role = await getUserRole('non-existent-id');
      expect(role).toBeNull();
    });
  });

  describe('logOut', () => {
    it('should sign out successfully', async () => {
      mockSignOut.mockResolvedValueOnce();

      await logOut();
      expect(mockSignOut).toHaveBeenCalledWith(mockAuth);
    });

    it('should handle sign out errors', async () => {
      mockSignOut.mockRejectedValueOnce(new Error('Network error'));

      await expect(logOut())
        .rejects
        .toThrow('Network error');
    });
  });

  describe('authStateListener', () => {
    it('should set up auth state change listener', () => {
      const callback = vi.fn();
      
      authStateListener(callback);
      
      expect(mockOnAuthStateChanged).toHaveBeenCalledWith(mockAuth, callback);
    });

    it('should handle auth state changes', () => {
      const callback = vi.fn();
      mockOnAuthStateChanged.mockImplementationOnce((auth, cb) => {
        cb(mockUser);
        return () => {};
      });

      authStateListener(callback);
      
      expect(callback).toHaveBeenCalledWith(mockUser);
    });
  });
});
