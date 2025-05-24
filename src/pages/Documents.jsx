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
import { AnimatePresence, motion } from 'framer-motion';
import StatusModal from '../components/StatusModal';
import {
    handleCreateFolder,
    handleFileUpload,
    handleDeleteFolder,
    confirmDeleteFolder,
    handleDeleteFile,
    handleDownload,
    handleRenameFolder
} from '../utils/documentUtils';

function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

export default function Documents() {
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
    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const [isRenamingFolder, setIsRenamingFolder] = useState(null);
    const [showDeleteFileModal, setShowDeleteFileModal] = useState(false);
    const [fileToDelete, setFileToDelete] = useState(null);
    const [deletingFile, setDeletingFile] = useState(null);

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
            setProjects(projects);
            
            
            // Then fetch documents for each project
            const allFolders = [];
            for (const project of projects) {
                try {
                    const projectFolders = await fetchDocumentsByFolder(project.id);
                    if (projectFolders && projectFolders.length > 0) {
                        // Add project name and ID to each folder
                        const foldersWithProject = projectFolders.map(folder => ({
                            ...folder,
                            projectId: project.id, // Ensure projectId is set
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

    const handleCreateFolderWrapper = () => {
        handleCreateFolder({
            newFolderName,
            projectId: selectedProjectId,
            setUploadLoading,
            setFolders,
            folders,
            setModalOpen,
            setError,
            setStatusMessage,
            setNewFolderName,
            setShowFolderModal,
            additionalCleanup: () => setSelectedProjectId('')
        });
    };

    const handleFileUploadWrapper = () => {
        handleFileUpload({
            selectedFile,
            selectedFolder,
            customName,
            customDescription,
            setError,
            setShowUploadModal,
            setUploadLoading,
            setFolders,
            folders,
            setSelectedFile,
            setCustomName,
            setCustomDescription,
            setModalOpen,
            setStatusMessage
        });
    };

    const handleDeleteFolderWrapper = (folder) => {
        handleDeleteFolder({
            folder,
            setError,
            setModalOpen,
            setStatusMessage,
            setFolderToDelete,
            setShowDeleteFolderModal
        });
    };

    const confirmDeleteFolderWrapper = () => {
        confirmDeleteFolder({
            folderToDelete,
            setUploadLoading,
            setFolders,
            folders,
            setShowDeleteFolderModal,
            setFolderToDelete,
            setModalOpen,
            setError,
            setStatusMessage
        });
    };

    const handleDeleteFileWrapper = (folderId, fileId, folder, file) => {
        setFileToDelete({ folderId, fileId, folderName: folder.name, fileName: file.name });
        setShowDeleteFileModal(true);
    };

    const confirmDeleteFileWrapper = () => {
        if (!fileToDelete) return;
        
        handleDeleteFile({
            folderId: fileToDelete.folderId,
            fileId: fileToDelete.fileId,
            folders,
            setUploadLoading,
            setFolders,
            setModalOpen,
            setError,
            setStatusMessage,
            setDeletingFile,
            onSuccess: () => {
                setShowDeleteFileModal(false);
                setFileToDelete(null);
            }
        });
    };

    const handleDownloadWrapper = (downloadURL) => {
        handleDownload({
            downloadURL,
            setError,
            setModalOpen,
            setStatusMessage
        });
    };

    const handleRenameFolderWrapper = (folder) => {
        handleRenameFolder({
            folder,
            newName: newFolderName,
            setFolders,
            folders,
            setModalOpen,
            setError,
            setStatusMessage
        });
        setIsRenamingFolder(null);
        setNewFolderName('');
    };

    const sortFolders = (folders) => {
        const sorted = [...folders];
        switch (sortOption) {
            case 'name':
                sorted.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'date':
                sorted.sort((a, b) => {
                    const dateA = a.createdAt?.seconds || 0;
                    const dateB = b.createdAt?.seconds || 0;
                    return dateB - dateA;
                });
                break;
            default:
                // Default to date sorting
                sorted.sort((a, b) => {
                    const dateA = a.createdAt?.seconds || 0;
                    const dateB = b.createdAt?.seconds || 0;
                    return dateB - dateA;
                });
        }
        return sorted;
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-gray-50">
                {/* Main navigation bar */}
                <MainNav mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
                
                {/* Loading state with animated dots */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <header className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">My Documents</h1>
                        <p className="mt-2 text-sm text-gray-600">Manage and organize your research documents</p>
                    </header>

                    <section className="flex items-center justify-center min-h-[400px]">
                        <section className="flex items-center space-x-2">
                            <section className="w-3 h-3 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></section>
                            <section className="w-3 h-3 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></section>
                            <section className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"></section>
                        </section>
                    </section>
                </section>

                {/* Mobile bottom navigation */}
                <MobileBottomNav />
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50/90 backdrop-blur-xl">
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Page header */}
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">My Documents</h1>
                    <p className="mt-2 text-sm text-gray-600">Manage and organize your research documents</p>
                </header>

                {/* Folder actions: create and sort */}
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

                    {/* Sort folders dropdown, only if folders exist */}
                    {folders.length > 0 && (
                        <select
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value)}
                            className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-gray-700"
                        >
                            <option value="date">Sort by Date</option>
                            <option value="name">Sort by Name</option>
                        </select>
                    )}
                </section>

                {folders.length === 0 ? (
                    <section className="flex flex-col items-center justify-center min-h-[400px] text-center">
                        <figure className="mb-4">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                            <figcaption>
                                <h3 className="text-lg font-medium text-gray-900 mb-1">No documents yet</h3>
                                <p className="text-sm text-gray-500">Upload your first document to get started</p>
                            </figcaption>
                        </figure>
                    </section>
                ) : (
                    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sortFolders(folders).map((folder) => (
                            <article key={folder.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                                <header className="flex items-start justify-between mb-4">
                                    <section className="flex items-center">
                                        <section className="p-2 bg-blue-50 rounded-lg mr-3">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                            </svg>
                                        </section>
                                        <section>
                                            {isRenamingFolder === folder.id ? (
                                                <section className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        value={newFolderName}
                                                        onChange={(e) => setNewFolderName(e.target.value)}
                                                        className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                        placeholder="New folder name"
                                                        autoFocus
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                handleRenameFolderWrapper(folder);
                                                            } else if (e.key === 'Escape') {
                                                                setIsRenamingFolder(null);
                                                                setNewFolderName('');
                                                            }
                                                        }}
                                                    />
                                                    <button
                                                        onClick={() => handleRenameFolderWrapper(folder)}
                                                        className="p-1 text-green-600 hover:text-green-800"
                                                        title="Save"
                                                    >
                                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setIsRenamingFolder(null);
                                                            setNewFolderName('');
                                                        }}
                                                        className="p-1 text-gray-600 hover:text-gray-800"
                                                        title="Cancel"
                                                    >
                                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </section>
                                            ) : (
                                                <h3 className="font-semibold text-gray-900 group flex items-center gap-2">
                                                    {folder.name}
                                                    <button
                                                        onClick={() => {
                                                            setIsRenamingFolder(folder.id);
                                                            setNewFolderName(folder.name);
                                                        }}
                                                        className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                                                        title="Rename folder"
                                                    >
                                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 003-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                </h3>
                                            )}
                                            <p className="text-sm text-gray-500">{folder.files?.length || 0} files</p>
                                            <p className="text-xs text-blue-600 mt-1">Project: {folder.projectName}</p>
                                            <section className="mt-2 space-y-1">
                                                <p className="text-xs text-gray-500">Size: {formatFileSize(folder.size || 0)}</p>
                                                <p className="text-xs text-gray-500">Remaining: {formatFileSize(folder.remainingSpace || 100 * 1024 * 1024)}</p>
                                                <section className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <section 
                                                        className="h-full bg-blue-600 rounded-full transition-all"
                                                        style={{ 
                                                            width: `${((folder.size || 0) / (100 * 1024 * 1024)) * 100}%`,
                                                            backgroundColor: ((folder.size || 0) / (100 * 1024 * 1024)) > 0.9 ? '#ef4444' : '#2563eb'
                                                        }}
                                                    />
                                                </section>
                                            </section>
                                        </section>
                                    </section>
                                    <button
                                        onClick={() => handleDeleteFolderWrapper(folder)}
                                        className="text-red-600 hover:text-red-800 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m4-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </header>

                                <section className="space-y-2">
                                    {folder.files?.map((file) => (
                                        <section key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                                            <section className="flex items-center space-x-2 min-w-0">
                                                <DocumentIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                                                <p className="truncate">{file.name}</p>
                                            </section>
                                            <section className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => handleDownloadWrapper(file.downloadURL)}
                                                    className="text-blue-600 hover:text-blue-800"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteFileWrapper(folder.id, file.id, folder, file)}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m4-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </section>
                                        </section>
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
                                </section>

                                <section className="mt-4 pt-4 border-t border-gray-100">
                                    <p className="text-xs text-gray-500">Created {formatFirebaseDate(folder.createdAt)}</p>
                                </section>
                            </article>
                        ))}
                    </section>
                )}

                {/* Create Folder Modal */}
                {showFolderModal && (
                    <dialog className="fixed inset-0 flex items-center justify-center p-4 z-50" open>
                        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowFolderModal(false)} />
                        <article className="relative bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-gray-200">
                            <header>
                                <h2 className="text-xl font-semibold mb-4">Create New Folder</h2>
                            </header>
                            <section className="space-y-4">
                                <section>
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
                                </section>
                                <section>
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
                                </section>
                            </section>
                            <footer className="mt-6 flex justify-end gap-3">
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
                                    onClick={handleCreateFolderWrapper}
                                    disabled={!newFolderName.trim() || !selectedProjectId || uploadLoading}
                                    className="px-4 py-2 bg-blue-600/90 backdrop-blur-sm text-white rounded-xl hover:bg-blue-700/90 transition-colors disabled:opacity-50"
                                >
                                    {uploadLoading ? (
                                        <ClipLoader size={20} color="#ffffff" />
                                    ) : (
                                        'Create Folder'
                                    )}
                                </button>
                            </footer>
                        </article>
                    </dialog>
                )}

                {/* Upload File Modal */}
                {showUploadModal && (
                    <dialog className="fixed inset-0 flex items-center justify-center p-4 z-50" open>
                        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowUploadModal(false)} />
                        <article className="relative bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-gray-200">
                            <header className="mb-4">
                                <h2 className="text-xl font-semibold">Upload Document</h2>
                            </header>
                            
                            <section className="space-y-4">
                                <section>
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
                                </section>

                                <section>
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
                                </section>

                                <section>
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
                                </section>
                            </section>

                            <footer className="mt-6 flex justify-end gap-3">
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
                                    onClick={handleFileUploadWrapper}
                                    disabled={!selectedFile || !customName.trim() || uploadLoading}
                                    className="px-4 py-2 bg-blue-600/90 backdrop-blur-sm text-white rounded-xl hover:bg-blue-700/90 transition-colors disabled:opacity-50"
                                >
                                    {uploadLoading ? (
                                        <ClipLoader size={20} color="#ffffff" />
                                    ) : (
                                        'Upload'
                                    )}
                                </button>
                            </footer>
                        </article>
                    </dialog>
                )}

                {/* Delete Folder Confirmation Modal */}
                <AnimatePresence>
                    {showDeleteFolderModal && (
                        <section className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center">
                            <section className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowDeleteFolderModal(false)} />
                            <motion.article
                                className="relative bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-gray-200"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            >
                                <h2 className="text-xl font-semibold mb-4 text-gray-900">Delete Folder?</h2>
                                <p className="text-gray-700 mb-6">
                                    Are you sure you want to delete the folder "{folderToDelete?.name}" and all its contents? This action cannot be undone.
                                </p>
                                <footer className="flex justify-end gap-3">
                                    <button
                                        onClick={() => {
                                            setShowDeleteFolderModal(false);
                                            setFolderToDelete(null);
                                        }}
                                        className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50/80 transition-colors"
                                        disabled={uploadLoading}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmDeleteFolderWrapper}
                                        disabled={uploadLoading}
                                        className="bg-red-600/90 backdrop-blur-sm text-white px-4 py-2 rounded-xl hover:bg-red-700/90 transition-colors flex items-center gap-2"
                                    >
                                        {uploadLoading ? (
                                            <>
                                                <ClipLoader size={16} color="#FFFFFF" />
                                                <span>Deleting...</span>
                                            </>
                                        ) : (
                                            'Delete Folder'
                                        )}
                                    </button>
                                </footer>
                            </motion.article>
                        </section>
                    )}
                </AnimatePresence>

                {/* Delete File Confirmation Modal */}
                <AnimatePresence>
                    {showDeleteFileModal && fileToDelete && (
                        <section className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center">
                            <section className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowDeleteFileModal(false)} />
                            <motion.article
                                className="relative bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-gray-200"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            >
                                <h2 className="text-xl font-semibold mb-4 text-gray-900">Delete File?</h2>
                                <p className="text-gray-700 mb-6">
                                    Are you sure you want to delete "{fileToDelete.fileName}" from folder "{fileToDelete.folderName}"? This action cannot be undone.
                                </p>
                                <footer className="flex justify-end gap-3">
                                    <button
                                        onClick={() => {
                                            setShowDeleteFileModal(false);
                                            setFileToDelete(null);
                                        }}
                                        className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50/80 transition-colors"
                                        disabled={uploadLoading}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmDeleteFileWrapper}
                                        disabled={uploadLoading}
                                        className="bg-red-600/90 backdrop-blur-sm text-white px-4 py-2 rounded-xl hover:bg-red-700/90 transition-colors flex items-center gap-2"
                                    >
                                        {uploadLoading ? (
                                            <>
                                                <ClipLoader size={16} color="#FFFFFF" />
                                                <span>Deleting...</span>
                                            </>
                                        ) : (
                                            'Delete File'
                                        )}
                                    </button>
                                </footer>
                            </motion.article>
                        </section>
                    )}
                </AnimatePresence>

                {/* Status Modal */}
                <StatusModal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    success={!error}
                    message={statusMessage}
                />

            </section>

            <footer>
                <MobileBottomNav />
            </footer>
        </main>
    );
}
