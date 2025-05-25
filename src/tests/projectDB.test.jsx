// Restore actual projectDB implementation
import { vi } from 'vitest';
vi.unmock('../backend/firebase/projectDB');

// Mock firebaseConfig to provide a mutable auth object
vi.mock('../backend/firebase/firebaseConfig', () => ({
  auth: { currentUser: null },
  db: {},
  storage: {}
}));

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createProject,
  fetchProjects,
  fetchProject,
  updateProject,
  deleteProject,
  assignReviewers,
  getReviewRequests,
  updateReviewerRequest,
  getProjectDetails
} from '../backend/firebase/projectDB';
import { auth } from '../backend/firebase/firebaseConfig';
import {
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  doc,
  arrayUnion
} from 'firebase/firestore';

beforeEach(() => {
  vi.clearAllMocks();
  // Default authenticated user
  auth.currentUser = { uid: 'user1' };
});

describe('createProject', () => {
  it('should throw if user not authenticated', async () => {
    auth.currentUser = null;
    await expect(createProject({ title: 'Test' })).rejects.toThrow('User not authenticated');
  });

  it('should throw if required fields are missing', async () => {
    await expect(createProject({ title: '', description: 'Desc' })).rejects.toThrow('Missing required fields');
  });

  it('should create project and return id', async () => {
    // Mock doc to return a new doc ref with id
    doc.mockImplementation(() => ({ id: 'new-id' }));
    setDoc.mockResolvedValue();

    const projectData = {
      title: 'Title',
      description: 'Desc',
      researchField: 'Field',
      deadline: new Date().toISOString(),
      goals: [{ text: 'goal1', completed: false }]
    };

    const id = await createProject(projectData);
    expect(id).toBe('new-id');
    expect(setDoc).toHaveBeenCalled();
  });
});

describe('fetchProjects', () => {
  it('should return combined owned and collaborator projects', async () => {
    const owned = [{ id: '1', data: () => ({ userId: 'user1', foo: 'bar' }) }];
    const all = [
      { id: '1', data: () => ({ userId: 'user1' }) },
      { id: '2', data: () => ({ collaborators: [{ id: 'user1' }] }) }
    ];
    getDocs.mockResolvedValueOnce({ docs: owned });
    getDocs.mockResolvedValueOnce({ docs: all });

    const projects = await fetchProjects('user1');
    expect(projects).toEqual([
      { id: '1', userId: 'user1', foo: 'bar' },
      { id: '2', collaborators: [{ id: 'user1' }] }
    ]);
  });

  it('should return empty array when no projects', async () => {
    getDocs.mockResolvedValue({ docs: [] });
    const projects = await fetchProjects('user1');
    expect(projects).toEqual([]);
  });
});

describe('fetchProject', () => {
  it('should throw if user not authenticated', async () => {
    auth.currentUser = null;
    await expect(fetchProject('proj1')).rejects.toThrow('User not authenticated');
  });

  it('should throw if project not found', async () => {
    getDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({ role: 'user' }) });
    getDoc.mockResolvedValueOnce({ exists: () => false });
    await expect(fetchProject('proj1')).rejects.toThrow('Project not found');
  });

  it('should throw if user has no permission', async () => {
    getDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({ role: 'user' }) }); // user role
    getDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({ userId: 'other' }) }); // project
    getDocs.mockResolvedValue({ empty: true });
    await expect(fetchProject('proj1')).rejects.toThrow('You do not have permission to access this project');
  });

  it('should return project data for owner', async () => {
    const projectData = { userId: 'user1', createdAt: '2020-01-01', deadline: '2020-02-01', updatedAt: '2020-01-01' };
    // first getDoc for user role
    getDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({ role: 'user' }) });
    // second getDoc for project, include id
    getDoc.mockResolvedValueOnce({ exists: () => true, id: 'proj1', data: () => projectData });
    getDocs.mockResolvedValue({ empty: true });

    const result = await fetchProject('proj1');
    // verify id, ownership and role
    expect(result.id).toBe('proj1');
    expect(result.userId).toBe('user1');
    expect(result.userRole).toBe('user');
  });
});

describe('updateProject', () => {
  it('should throw if project not found', async () => {
    getDoc.mockResolvedValueOnce({ exists: () => false });
    await expect(updateProject('proj1', {})).rejects.toThrow('Project not found');
  });

  it('should update project for owner', async () => {
    const existing = { exists: () => true, data: () => ({ userId: 'user1', collaborators: [] }) };
    getDoc.mockResolvedValue(existing);
    updateDoc.mockResolvedValue();

    const res = await updateProject('proj1', { status: 'Done' });
    expect(res).toEqual({ success: true, message: 'Project updated successfully' });
    expect(updateDoc).toHaveBeenCalled();
  });
});

describe('deleteProject', () => {
  it('should throw if project not found', async () => {
    getDoc.mockResolvedValueOnce({ exists: () => false });
    await expect(deleteProject('proj1')).rejects.toThrow('Project not found');
  });

  it('should delete project and funding history for owner', async () => {
    getDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({ userId: 'user1' }) });
    getDocs.mockResolvedValueOnce({ docs: [{ ref: 'r1' }, { ref: 'r2' }] });
    deleteDoc.mockResolvedValue();

    const res = await deleteProject('proj1');
    expect(res).toEqual({ success: true, message: 'Project and funding history deleted successfully' });
    expect(deleteDoc).toHaveBeenCalledTimes(3); // 2 history + project
  });
});

describe('assignReviewers', () => {
  it('should throw if project not found', async () => {
    getDoc.mockResolvedValueOnce({ exists: () => false });
    await expect(assignReviewers('proj1', [])).rejects.toThrow('Project not found');
  });

  it('should assign reviewers and return requests with ids', async () => {
    const projectSnap = { exists: () => true, data: () => ({}) };
    getDoc.mockResolvedValueOnce(projectSnap);
    // Mock random UUID
    vi.stubGlobal('crypto', { randomUUID: () => 'uuid1' });
    updateDoc.mockResolvedValue();

    const requests = await assignReviewers('proj1', [{ reviewerId: 'r1', reviewerName: 'Name' }]);
    expect(requests).toEqual([{ reviewerId: 'r1', reviewerName: 'Name', id: 'uuid1' }]);
    expect(updateDoc).toHaveBeenCalled();
  });
});

describe('getReviewRequests', () => {
  it('should return empty array if no review requests', async () => {
    const snapshot = { forEach: (fn) => {} };
    getDocs.mockResolvedValue(snapshot);
    const reqs = await getReviewRequests('r1');
    expect(reqs).toEqual([]);
  });

  it('should return review requests with projectId', async () => {
    const docs = [
      { id: 'p1', data: () => ({ reviewerRequests: [{ id: 'req1', reviewerId: 'r1', reviewerName: 'N' }] }) }
    ];
    const snapshot = { forEach: (fn) => docs.forEach(fn) };
    getDocs.mockResolvedValue(snapshot);

    const reqs = await getReviewRequests('r1');
    expect(reqs).toEqual([{ id: 'req1', reviewerId: 'r1', reviewerName: 'N', projectId: 'p1' }]);
  });
});

describe('updateReviewerRequest', () => {
  it('should throw if project not found', async () => {
    getDoc.mockResolvedValueOnce({ exists: () => false });
    await expect(updateReviewerRequest('proj1', 'req1', 'accepted')).rejects.toThrow('Project not found');
  });

  it('should update request and add reviewer when accepted', async () => {
    const req = { id: 'req1', reviewerId: 'r1', reviewerName: 'N', status: 'pending' };
    const projectData = { reviewerRequests: [req], reviewers: [] };
    const projectSnap = { exists: () => true, data: () => projectData };
    getDoc.mockResolvedValueOnce(projectSnap);
    // stub arrayUnion return
    vi.mocked(arrayUnion).mockImplementation((r) => ['union', r]);
    updateDoc.mockResolvedValue();

    await updateReviewerRequest('p1', 'req1', 'accepted');
    expect(updateDoc).toHaveBeenCalled();
  });

  it('should update request without adding reviewer when not accepted', async () => {
    const req = { id: 'req1', reviewerId: 'r1', reviewerName: 'N', status: 'pending' };
    const projectData = { reviewerRequests: [req], reviewers: [] };
    const projectSnap = { exists: () => true, data: () => projectData };
    getDoc.mockResolvedValueOnce(projectSnap);
    updateDoc.mockResolvedValue();

    await updateReviewerRequest('p1', 'req1', 'rejected');
    expect(updateDoc).toHaveBeenCalled();
  });
});

describe('getProjectDetails', () => {
  it('should throw if project not found', async () => {
    getDoc.mockResolvedValueOnce({ exists: () => false });
    await expect(getProjectDetails('proj1')).rejects.toThrow('Project not found');
  });

  it('should return project details with researcherName', async () => {
    const project = { userId: 'u1', other: 'value' };
    const projectSnap = { exists: () => true, id: 'p1', data: () => project };
    const ownerSnap = { exists: () => true, data: () => ({ fullName: 'Owner Name' }) };
    getDoc.mockResolvedValueOnce(projectSnap);
    getDoc.mockResolvedValueOnce(ownerSnap);

    const details = await getProjectDetails('proj1');
    expect(details).toEqual({ id: 'p1', userId: 'u1', other: 'value', researcherName: 'Owner Name' });
  });
});
