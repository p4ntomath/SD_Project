import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isProjectOwner, isCollaborator, getCollaboratorPermissions, checkPermission } from '../../utils/permissions';
import { auth } from '../../backend/firebase/firebaseConfig';

// Improved Firebase auth mock
vi.mock('../../backend/firebase/firebaseConfig', () => ({
  auth: {
    currentUser: {
      uid: 'test-user-id'
    }
  }
}));

describe('permissions', () => {
  const mockProject = {
    userId: 'test-user-id',
    collaborators: [
      { id: 'collaborator-1', accessLevel: 'Editor' },
      { id: 'collaborator-2', accessLevel: 'Viewer' },
      { id: 'collaborator-3', accessLevel: 'Collaborator' }
    ]
  };

  beforeEach(() => {
    // Reset auth mock before each test
    vi.spyOn(auth, 'currentUser', 'get').mockReturnValue({ uid: 'test-user-id' });
  });

  describe('isProjectOwner', () => {
    it('returns true when user is project owner', () => {
      expect(isProjectOwner(mockProject)).toBe(true);
    });

    it('returns false when user is not project owner', () => {
      vi.spyOn(auth, 'currentUser', 'get').mockReturnValue({ uid: 'different-id' });
      expect(isProjectOwner({ ...mockProject, userId: 'another-id' })).toBe(false);
    });

    it('returns false for null/undefined project', () => {
      expect(isProjectOwner(null)).toBe(false);
      expect(isProjectOwner(undefined)).toBe(false);
    });

    it('returns false when user is not authenticated', () => {
      vi.spyOn(auth, 'currentUser', 'get').mockReturnValue(null);
      expect(isProjectOwner(mockProject)).toBe(false);
    });
  });

  describe('isCollaborator', () => {
    it('returns true when user is a collaborator', () => {
      vi.spyOn(auth, 'currentUser', 'get').mockReturnValue({ uid: 'collaborator-1' });
      expect(isCollaborator(mockProject)).toBe(true);
    });

    it('returns false when user is not a collaborator', () => {
      vi.spyOn(auth, 'currentUser', 'get').mockReturnValue({ uid: 'non-collaborator' });
      expect(isCollaborator(mockProject)).toBe(false);
    });

    it('returns false for null/undefined project', () => {
      expect(isCollaborator(null)).toBe(false);
      expect(isCollaborator(undefined)).toBe(false);
    });

    it('returns false when project has no collaborators', () => {
      const projectWithoutCollaborators = { ...mockProject, collaborators: null };
      expect(isCollaborator(projectWithoutCollaborators)).toBe(false);
    });
  });

  describe('getCollaboratorPermissions', () => {
    it('returns full permissions for project owner', () => {
      const permissions = getCollaboratorPermissions(mockProject);
      expect(permissions).toEqual({
        canViewProject: true,
        canCompleteGoals: true,
        canAddFunds: true,
        canUploadFiles: true,
        canManageGoals: true,
        canManageCollaborators: true,
        canEditProjectDetails: true
      });
    });

    it('returns editor permissions for editor collaborator', () => {
      vi.spyOn(auth, 'currentUser', 'get').mockReturnValue({ uid: 'collaborator-1' });
      const permissions = getCollaboratorPermissions(mockProject);
      expect(permissions).toEqual({
        canViewProject: true,
        canCompleteGoals: true,
        canAddFunds: false,
        canUploadFiles: true,
        canManageGoals: true,
        canManageCollaborators: false,
        canEditProjectDetails: true
      });
    });

    it('returns viewer permissions for viewer collaborator', () => {
      vi.spyOn(auth, 'currentUser', 'get').mockReturnValue({ uid: 'collaborator-2' });
      const permissions = getCollaboratorPermissions(mockProject);
      expect(permissions).toEqual({
        canViewProject: true,
        canCompleteGoals: false,
        canAddFunds: false,
        canUploadFiles: false,
        canManageGoals: false,
        canManageCollaborators: false,
        canEditProjectDetails: false
      });
    });

    it('returns null for non-collaborators', () => {
      vi.spyOn(auth, 'currentUser', 'get').mockReturnValue({ uid: 'non-collaborator' });
      expect(getCollaboratorPermissions(mockProject)).toBeNull();
    });
  });

  describe('checkPermission', () => {
    it('returns true for permitted actions', () => {
      // Project owner should have all permissions
      expect(checkPermission(mockProject, 'canViewProject')).toBe(true);
      expect(checkPermission(mockProject, 'canManageCollaborators')).toBe(true);
    });

    it('returns false for non-permitted actions', () => {
      vi.spyOn(auth, 'currentUser', 'get').mockReturnValue({ uid: 'collaborator-2' });
      expect(checkPermission(mockProject, 'canManageGoals')).toBe(false);
    });

    it('returns false for invalid permissions', () => {
      expect(checkPermission(mockProject, 'invalidPermission')).toBe(false);
    });

    it('returns false when user has no permissions', () => {
      vi.spyOn(auth, 'currentUser', 'get').mockReturnValue({ uid: 'non-collaborator' });
      expect(checkPermission(mockProject, 'canViewProject')).toBe(false);
    });
  });
});