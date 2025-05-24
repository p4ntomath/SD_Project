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

export const isProjectOwner = (project) => {
  if (!project || !auth.currentUser) return false;
  return project.userId === auth.currentUser.uid;
};

export const isCollaborator = (project) => {
  if (!project || !auth.currentUser || !project.collaborators) return false;
  return project.collaborators.some(collab => collab.id === auth.currentUser.uid);
};

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

export const checkPermission = (project, permission) => {
  const permissions = getCollaboratorPermissions(project);
  if (!permissions) return false;
  return permissions[permission] || false;
};