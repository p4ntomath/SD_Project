import { auth } from '../backend/firebase/firebaseConfig';

export const isProjectOwner = (project) => {
  if (!project || !auth.currentUser) return false;
  return project.userId === auth.currentUser.uid;
};

export const isCollaborator = (project) => {
  if (!project || !auth.currentUser) return false;
  return project.collaborators?.some(collab => collab.id === auth.currentUser.uid);
};

export const checkPermission = (project, permission) => {
  if (!project || !auth.currentUser) return false;

  // Project owner has all permissions
  if (isProjectOwner(project)) return true;

  // Check if user is a collaborator
  if (!isCollaborator(project)) return false;

  // Define permissions for collaborators
  const collaboratorPermissions = {
    canCompleteGoals: true,    // Can mark goals as complete/incomplete
    canAddFunds: true,         // Can add funds and expenses
    canUploadFiles: true,      // Can upload documents
    canManageGoals: false,     // Cannot add/remove goals
    canEditProject: false      // Cannot edit project details
  };

  return collaboratorPermissions[permission] || false;
};