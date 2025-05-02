import React, { useEffect, useState } from 'react';
import { DocumentIcon } from "@heroicons/react/24/outline";
import MainNav from '../components/ResearcherComponents/Navigation/MainNav';
import MobileBottomNav from '../components/ResearcherComponents/Navigation/MobileBottomNav';
import { ClipLoader } from 'react-spinners';
import { auth } from '../backend/firebase/firebaseConfig';
import { createFolder, getFolders, deleteFolder, updateFolderName } from '../backend/firebase/folderDB';
import { uploadDocument, fetchDocumentsByFolder, deleteDocument } from '../backend/firebase/documentsDB';
import { formatFirebaseDate } from '../utils/dateUtils';
import { fetchProjects } from '../backend/firebase/projectDB';

export default function DocumentsPage() {
    const [folders, setFolders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFolderModal, setShowFolderModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showDeleteFolderModal, setShowDeleteFolderModal] = useState(false);
    const [folderToDelete, setFolderToDelete] = useState(null);
    const [newFolderName, setNewFolderName] = useState('');
    const [selectedFolder, setSelectedFolder] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [customName, setCustomName] = useState('');
    const [customDescription, setCustomDescription] = useState('');
    const [error, setError] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [sortOption, setSortOption] = useState('date');
    const [filterOption, setFilterOption] = useState('all');
    const [projectsMap, setProjectsMap] = useState({});
    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState('');

    useEffect(() => {
        loadFolders();
    }, []);

    const loadFolders = async () => {
        try {
            setLoading(true);
            const user = auth.currentUser;
            if (!user) {
                setError("Please sign in to view documents");
                return;
            }

            // First get all user's projects
            const projects = await fetchProjects(user.uid);
            setProjects(projects); // Store all projects
            
            // Create a map of project IDs to project names
            const projectMapping = {};
            projects.forEach(project => {
                projectMapping[project.id] = project.title;
            });
            setProjectsMap(projectMapping);
            
            // Then fetch documents for each project
            const allFolders = [];
            for (const project of projects) {
                try {
                    const projectFolders = await fetchDocumentsByFolder(project.id);
                    if (projectFolders && projectFolders.length > 0) {
                        // Add project name to each folder
                        const foldersWithProject = projectFolders.map(folder => ({
                            ...folder,
                            projectName: project.title
                        }));
                        allFolders.push(...foldersWithProject);
                    }
                } catch (err) {
                    console.error(`Error loading folders for project ${project.id}:`, err);
                }
            }

            // Sort folders by date
            const sortedFolders = allFolders.sort((a, b) => {
                const dateA = a.createdAt?.seconds || 0;
                const dateB = b.createdAt?.seconds || 0;
                return dateB - dateA;
            });

            setFolders(sortedFolders);
        } catch (err) {
            setError(err.message);
            console.error("Error loading folders:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;
        if (!selectedProjectId) {
            setError("Please select a project");
            return;
        }

        try {
            setUploadLoading(true);
            const user = auth.currentUser;
            if (!user) throw new Error("Please sign in to create folders");
            
            await createFolder(selectedProjectId, newFolderName.trim());
            await loadFolders(); // Reload folders to get the new one
            setNewFolderName('');
            setSelectedProjectId('');
            setShowFolderModal(false);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setUploadLoading(false);
        }
    };

    const handleFileUpload = async () => {
        if (!selectedFile || !selectedFolder || !customName.trim()) {
            setError("Please select a file, folder and provide a name");
            setShowUploadModal(false);
            return;
        }

        // Validate file size (10MB limit)
        const maxSize = 10 * 1024 * 1024; // 10MB in bytes
        if (selectedFile.size > maxSize) {
            setError("File size exceeds the maximum limit of 10MB");
            setSelectedFile(null);
            setShowUploadModal(false);
            return;
        }

        // Validate file type
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'image/jpeg',
            'image/png',
            'image/gif'
        ];
        if (!allowedTypes.includes(selectedFile.type)) {
            setError("Invalid file type. Please upload a PDF, Word document, text file, or image.");
            setSelectedFile(null);
            setShowUploadModal(false);
            return;
        }

        try {
            setUploadLoading(true);
            const user = auth.currentUser;
            if (!user) throw new Error("Please sign in to upload files");

            // Add file extension if it was removed
            const fileExtension = selectedFile.name.split('.').pop();
            const finalFileName = customName.endsWith(`.${fileExtension}`) ? customName : `${customName}.${fileExtension}`;

            await uploadDocument(
                selectedFile,
                selectedFolder.projectId, // Use the project ID from the selected folder
                selectedFolder.id,
                {
                    displayName: finalFileName,
                    description: customDescription.trim() || 'No description provided'
                }
            );

            await loadFolders(); // Reload to get the new file
            setShowUploadModal(false);
            setSelectedFile(null);
            setCustomName('');
            setCustomDescription('');
            setError(null); // Clear any previous errors
        } catch (err) {
            setError(err.message);
        } finally {
            setUploadLoading(false);
        }
    };

    const handleDeleteFolder = async (folder) => {
        setFolderToDelete(folder);
        setShowDeleteFolderModal(true);
    };

    const confirmDeleteFolder = async () => {
        try {
            setUploadLoading(true);
            await deleteFolder(auth.currentUser.uid, folderToDelete.id);
            await loadFolders();
            setShowDeleteFolderModal(false);
            setFolderToDelete(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setUploadLoading(false);
        }
    };

    const handleDeleteFile = async (folderId, fileId) => {
        if (!window.confirm('Are you sure you want to delete this file?')) return;

        try {
            setUploadLoading(true);
            await deleteDocument(fileId, auth.currentUser.uid, folderId);
            await loadFolders();
        } catch (err) {
            setError(err.message);
        } finally {
            setUploadLoading(false);
        }
    };

    const handleDownload = (downloadURL) => {
        window.open(downloadURL, '_blank');
    };

    const sortFolders = (folders) => {
        const sorted = [...folders];
        switch (sortOption) {
            case 'name':
                sorted.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'date':
                sorted.sort((a, b) => b.createdAt - a.createdAt);
                break;
            default:
                break;
        }
        return sorted;
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-gray-50">
                <MainNav mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
                
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <header className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">My Documents</h1>
                        <p className="mt-2 text-sm text-gray-600">Manage and organize your research documents</p>
                    </header>

                    <div className="flex items-center justify-center min-h-[400px]">
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"></div>
                        </div>
                    </div>
                </section>

                <MobileBottomNav />
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50">
            <MainNav mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />

            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">My Documents</h1>
                    <p className="mt-2 text-sm text-gray-600">Manage and organize your research documents</p>
                </header>

                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
                        {error}
                    </div>
                )}

                <section className="mb-6 flex flex-wrap gap-4">
                    <button
                        onClick={() => setShowFolderModal(true)}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        New Folder
                    </button>

                    <select
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value)}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-gray-700"
                    >
                        <option value="date">Sort by Date</option>
                        <option value="name">Sort by Name</option>
                    </select>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortFolders(folders).map((folder) => (
                        <article key={folder.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                            <header className="flex items-start justify-between mb-4">
                                <div className="flex items-center">
                                    <div className="p-2 bg-blue-50 rounded-lg mr-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{folder.name}</h3>
                                        <p className="text-sm text-gray-500">{folder.files?.length || 0} files</p>
                                        <p className="text-xs text-blue-600 mt-1">Project: {folder.projectName}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDeleteFolder(folder)}
                                    className="text-red-600 hover:text-red-800 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m4-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </header>

                            <div className="space-y-2">
                                {folder.files?.map((file) => (
                                    <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                                        <div className="flex items-center space-x-2 min-w-0">
                                            <DocumentIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                                            <span className="truncate">{file.name}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => handleDownload(file.downloadURL)}
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteFile(folder.id, file.id)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m4-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                <button
                                    onClick={() => {
                                        setSelectedFolder(folder);
                                        setShowUploadModal(true);
                                    }}
                                    className="w-full mt-4 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                    Upload File
                                </button>
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <p className="text-xs text-gray-500">Created {formatFirebaseDate(folder.createdAt)}</p>
                            </div>
                        </article>
                    ))}
                </div>

                {/* Create Folder Modal */}
                {showFolderModal && (
                    <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
                        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowFolderModal(false)} />
                        <div className="relative bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-gray-200">
                            <h2 className="text-xl font-semibold mb-4">Create New Folder</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Select Project*
                                    </label>
                                    <select
                                        value={selectedProjectId}
                                        onChange={(e) => setSelectedProjectId(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    >
                                        <option value="">Select a project</option>
                                        {projects.map(project => (
                                            <option key={project.id} value={project.id}>
                                                {project.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Folder Name*
                                    </label>
                                    <input
                                        type="text"
                                        value={newFolderName}
                                        onChange={(e) => setNewFolderName(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter folder name"
                                    />
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    onClick={() => {
                                        setShowFolderModal(false);
                                        setNewFolderName('');
                                        setSelectedProjectId('');
                                        setError(null);
                                    }}
                                    className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50/80 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateFolder}
                                    disabled={!newFolderName.trim() || !selectedProjectId || uploadLoading}
                                    className="px-4 py-2 bg-blue-600/90 backdrop-blur-sm text-white rounded-xl hover:bg-blue-700/90 transition-colors disabled:opacity-50"
                                >
                                    {uploadLoading ? (
                                        <ClipLoader size={20} color="#ffffff" />
                                    ) : (
                                        'Create Folder'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Upload File Modal */}
                {showUploadModal && (
                    <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
                        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowUploadModal(false)} />
                        <div className="relative bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-gray-200">
                            <h2 className="text-xl font-semibold mb-4">Upload File to {selectedFolder?.name}</h2>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Choose File
                                    </label>
                                    <input
                                        type="file"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                setSelectedFile(file);
                                                setCustomName(file.name.split('.')[0]);
                                            }
                                        }}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Display Name
                                    </label>
                                    <input
                                        type="text"
                                        value={customName}
                                        onChange={(e) => setCustomName(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter display name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description (optional)
                                    </label>
                                    <textarea
                                        value={customDescription}
                                        onChange={(e) => setCustomDescription(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        rows={3}
                                        placeholder="Enter file description"
                                    />
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    onClick={() => {
                                        setShowUploadModal(false);
                                        setSelectedFile(null);
                                        setCustomName('');
                                        setCustomDescription('');
                                    }}
                                    className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50/80 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleFileUpload}
                                    disabled={!selectedFile || !customName.trim() || uploadLoading}
                                    className="px-4 py-2 bg-blue-600/90 backdrop-blur-sm text-white rounded-xl hover:bg-blue-700/90 transition-colors disabled:opacity-50"
                                >
                                    {uploadLoading ? (
                                        <ClipLoader size={20} color="#ffffff" />
                                    ) : (
                                        'Upload'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Folder Confirmation Modal */}
                {showDeleteFolderModal && (
                    <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
                        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowDeleteFolderModal(false)} />
                        <div className="relative bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-gray-200">
                            <h2 className="text-xl font-semibold mb-4">Delete Folder?</h2>
                            <p className="text-gray-700 mb-6">
                                Are you sure you want to delete the folder "{folderToDelete?.name}" and all its contents? This action cannot be undone.
                            </p>
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => {
                                        setShowDeleteFolderModal(false);
                                        setFolderToDelete(null);
                                    }}
                                    className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50/80 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDeleteFolder}
                                    disabled={uploadLoading}
                                    className="px-4 py-2 bg-red-600/90 backdrop-blur-sm text-white rounded-xl hover:bg-red-700/90 transition-colors disabled:opacity-50"
                                >
                                    {uploadLoading ? (
                                        <ClipLoader size={20} color="#ffffff" />
                                    ) : (
                                        'Delete Folder'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </section>

            <MobileBottomNav />
        </main>
    );
}
