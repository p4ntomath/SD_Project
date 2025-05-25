import { vi } from 'vitest';
import { db, auth } from '../backend/firebase/firebaseConfig';
import {
    addCollaboratorToProject,
    updateCollaboratorAccessLevel,
    removeCollaboratorFromProject,
    sendResearcherInvitation,
    respondToResearcherInvitation,
    getPendingCollaboratorInvitations
} from '../backend/firebase/collaborationDB';
import { 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    updateDoc, 
    addDoc,
    arrayUnion,
    arrayRemove,
    query,
    where,
    serverTimestamp 
} from 'firebase/firestore';

// Mock Firebase functions
vi.mock('../backend/firebase/firebaseConfig', () => ({
    auth: {
        currentUser: { uid: 'test-user-id' }
    },
    db: {}
}));

vi.mock('firebase/firestore', async () => {
    const actual = await vi.importActual('firebase/firestore');
    return {
        ...actual,
        collection: vi.fn(() => ({ id: 'test-collection' })),
        doc: vi.fn(() => ({ id: 'test-doc' })),
        getDoc: vi.fn(),
        getDocs: vi.fn(),
        updateDoc: vi.fn(),
        addDoc: vi.fn(),
        arrayUnion: vi.fn(data => data),
        arrayRemove: vi.fn(data => data),
        query: vi.fn(),
        where: vi.fn(),
        serverTimestamp: vi.fn(() => ({ seconds: Math.floor(Date.now() / 1000) }))
    };
});

describe('CollaborationDB', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('addCollaboratorToProject', () => {
        it('should add a collaborator with correct permissions', async () => {
            const mockCollaboratorDoc = {
                exists: () => true,
                data: () => ({
                    fullName: 'Test User',
                    institution: 'Test Institution',
                    fieldOfResearch: 'Computer Science'
                })
            };

            vi.mocked(doc).mockReturnValue({ id: 'test-doc' });
            vi.mocked(getDoc).mockResolvedValueOnce(mockCollaboratorDoc);
            vi.mocked(updateDoc).mockResolvedValueOnce(undefined);

            await addCollaboratorToProject('project-1', 'collaborator-1');

            expect(updateDoc).toHaveBeenCalledWith(
                { id: 'test-doc' },
                expect.objectContaining({
                    collaborators: arrayUnion(expect.objectContaining({
                        id: 'collaborator-1',
                        accessLevel: 'Collaborator',
                        permissions: expect.objectContaining({
                            canUploadFiles: true,
                            canCompleteGoals: true,
                            canAddFunds: true
                        })
                    }))
                })
            );
        });

        it('should throw error if collaborator not found', async () => {
            vi.mocked(getDoc).mockResolvedValueOnce({
                exists: () => false
            });

            await expect(addCollaboratorToProject('project-1', 'invalid-id'))
                .rejects.toThrow('Failed to add collaborator');
        });
    });

    describe('updateCollaboratorAccessLevel', () => {
        it('should update collaborator access level and permissions', async () => {
            const mockProjectDoc = {
                exists: () => true,
                data: () => ({
                    collaborators: [{
                        id: 'collaborator-1',
                        accessLevel: 'Collaborator'
                    }]
                })
            };

            vi.mocked(doc).mockReturnValue({ id: 'test-doc' });
            vi.mocked(getDoc).mockResolvedValueOnce(mockProjectDoc);
            vi.mocked(updateDoc).mockResolvedValueOnce(undefined);

            await updateCollaboratorAccessLevel('project-1', 'collaborator-1', 'Editor');

            expect(updateDoc).toHaveBeenCalledWith(
                { id: 'test-doc' },
                expect.objectContaining({
                    collaborators: expect.any(Array)
                })
            );
        });

        it('should throw error if project not found', async () => {
            vi.mocked(getDoc).mockResolvedValueOnce({
                exists: () => false,
                data: () => null
            });

            await expect(updateCollaboratorAccessLevel('invalid-id', 'collaborator-1', 'Editor'))
                .rejects.toThrow('Failed to update collaborator access level');
        });
    });

    describe('sendResearcherInvitation', () => {
        it('should create invitation if not already sent', async () => {
            // Mock empty pending invitations
            vi.mocked(query).mockReturnValue({ id: 'test-query' });
            vi.mocked(getDocs).mockResolvedValueOnce({
                empty: true,
                docs: []
            });

            // Mock project exists
            vi.mocked(getDoc).mockResolvedValueOnce({
                exists: () => true,
                data: () => ({
                    collaborators: []
                })
            });

            // Mock invitation creation
            const mockInvitationId = 'invitation-1';
            vi.mocked(collection).mockReturnValue({ id: 'test-collection' });
            vi.mocked(addDoc).mockResolvedValueOnce({ id: mockInvitationId });

            const result = await sendResearcherInvitation('project-1', 'researcher-1', 'sender-1');

            expect(result).toEqual({
                success: true,
                message: 'Invitation sent successfully'
            });
            expect(addDoc).toHaveBeenCalledWith(
                { id: 'test-collection' },
                expect.objectContaining({
                    projectId: 'project-1',
                    researcherId: 'researcher-1',
                    status: 'pending'
                })
            );
        });

        it('should throw error if invitation already exists', async () => {
            vi.mocked(query).mockReturnValue({ id: 'test-query' });
            vi.mocked(getDocs).mockResolvedValueOnce({
                empty: false,
                docs: [{ id: 'existing-invitation' }]
            });

            await expect(sendResearcherInvitation('project-1', 'researcher-1', 'sender-1'))
                .rejects.toThrow('An invitation has already been sent to this researcher');
        });
    });

    describe('removeCollaboratorFromProject', () => {
        it('should remove collaborator from project', async () => {
            const mockProjectDoc = {
                exists: () => true,
                data: () => ({
                    collaborators: [{
                        id: 'collaborator-1',
                        fullName: 'Test Collaborator'
                    }]
                })
            };

            vi.mocked(doc).mockReturnValue({ id: 'test-doc' });
            vi.mocked(getDoc).mockResolvedValueOnce(mockProjectDoc);
            vi.mocked(updateDoc).mockResolvedValueOnce(undefined);

            await removeCollaboratorFromProject('project-1', 'collaborator-1');

            expect(updateDoc).toHaveBeenCalledWith(
                { id: 'test-doc' },
                expect.objectContaining({
                    collaborators: arrayRemove(expect.objectContaining({
                        id: 'collaborator-1'
                    }))
                })
            );
        });

        it('should throw error if collaborator not found in project', async () => {
            const mockProjectDoc = {
                exists: () => true,
                data: () => ({
                    collaborators: []
                })
            };

            vi.mocked(doc).mockReturnValue({ id: 'test-doc' });
            vi.mocked(getDoc).mockResolvedValueOnce(mockProjectDoc);

            await expect(removeCollaboratorFromProject('project-1', 'invalid-id'))
                .rejects.toThrow('Failed to remove collaborator');
        });
    });
});