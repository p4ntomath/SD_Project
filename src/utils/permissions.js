/**
 * @fileoverview User permissions and access control utilities
 * @description Defines permission levels and functions for project access control
 */

import { auth } from '../backend/firebase/firebaseConfig';

// Define permission levels and their included permissions
const accessLevelPermissions = {
  Viewer: {
    canViewProject: true,
    canCompleteGoals: false,
    canAddFunds: false,
    canUploadFiles: false,
    canManageGoals: false,
    canManageCollaborators: false,
    canEditProjectDetails: false
  },
  Editor: {
    canViewProject: true,
    canCompleteGoals: true,
    canAddFunds: false,
    canUploadFiles: true,
    canManageGoals: true,
    canManageCollaborators: false,
    canEditProjectDetails: true
  },
  Collaborator: {
    canViewProject: true,
    canCompleteGoals: true,
    canAddFunds: true,
    canUploadFiles: true,
    canManageGoals: true,
    canManageCollaborators: false,
    canEditProjectDetails: false
  }
};

/**
 * Check if current user is the project owner
 * @param {Object} project - Project object with userId field
 * @returns {boolean} True if current user owns the project
 */
export const isProjectOwner = (project) => {
  if (!project || !auth.currentUser) return false;
  return project.userId === auth.currentUser.uid;
};

/**
 * Check if current user is a collaborator on the project
 * @param {Object} project - Project object with collaborators field
 * @returns {boolean} True if current user is a collaborator
 */
export const isCollaborator = (project) => {
  if (!project || !auth.currentUser || !project.collaborators) return false;
  return project.collaborators.some(collab => collab.id === auth.currentUser.uid);
};

/**
 * Get the permissions of the current user for a specific project
 * @param {Object} project - Project object with collaborators field
 * @returns {Object|null} Permissions object or null if no permissions found
 */
export const getCollaboratorPermissions = (project) => {
  if (!project || !auth.currentUser) return null;
  
  // Project owner has all permissions
  if (isProjectOwner(project)) {
    return {
      canViewProject: true,
      canCompleteGoals: true,
      canAddFunds: true,
      canUploadFiles: true,
      canManageGoals: true,
      canManageCollaborators: true,
      canEditProjectDetails: true
    };
  }

  // Get collaborator's data
  const collaborator = project.collaborators?.find(c => c.id === auth.currentUser.uid);
  if (!collaborator) return null;

  // Return permissions based on access level
  return accessLevelPermissions[collaborator.accessLevel] || accessLevelPermissions.Viewer;
};

/**
 * Check if the current user has a specific permission for a project
 * @param {Object} project - Project object to check permissions against
 * @param {string} permission - Permission key to check
 * @returns {boolean} True if the user has the permission, false otherwise
 */
export const checkPermission = (project, permission) => {
  const permissions = getCollaboratorPermissions(project);
  if (!permissions) return false;
  return permissions[permission] || false;
};