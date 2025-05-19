import React, { useState } from 'react';
import { ClipLoader } from 'react-spinners';
import { AnimatePresence, motion } from 'framer-motion';
import { checkPermission } from '../../utils/permissions';
import {
    handleCreateFolder,
    handleFileUpload,
    handleDeleteFolder,
    confirmDeleteFolder,
    handleDeleteFile,
    handleDownload,
    handleRenameFolder
} from '../../utils/documentUtils';
import { notify } from '../../backend/firebase/notificationsUtil';


function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

export default function DocumentsCard({ 
    projectId, 
    project,
    folders, 
    setFolders, 
    foldersLoading, 
    setModalOpen, 
    setError, 
    setStatusMessage 
}) {
    const [showFolderModal, setShowFolderModal] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [selectedFolder, setSelectedFolder] = useState(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [customName, setCustomName] = useState('');
    const [customDescription, setCustomDescription] = useState('');
    const [downloadingFile, setDownloadingFile] = useState(null);
    const [deletingFile, setDeletingFile] = useState(null);
    const [showDeleteFolderConfirm, setShowDeleteFolderConfirm] = useState(false);
    const [folderToDelete, setFolderToDelete] = useState(null);
    const [isRenamingFolder, setIsRenamingFolder] = useState(null);
    const [showDeleteFileConfirm, setShowDeleteFileConfirm] = useState(false);
    const [fileToDelete, setFileToDelete] = useState(null);
  
    const handleCreateFolderWrapper = () => {
        handleCreateFolder({
            newFolderName,
            projectId,
            setUploadLoading,
            setFolders,
            folders,
            setModalOpen,
            setError,
            setStatusMessage,
            setNewFolderName,
            setShowFolderModal
        });
        notify({
            type: 'Folder Created',
            targetUserId: project.userId,
            message: `A new folder "${newFolderName}" has been created in your project "${project.title || 'Untitled Project'}".`,
            projectId: projectId,
            projectTitle: project.title,
            folderName: newFolderName
        });
    };

    const handleFileUploadWrapper = (event) => {
        const file = event.target.files[0];
        if (file) {
            const fileNameWithoutExtension = file.name.replace(/\.[^/.]+$/, "");
            setSelectedFile(file);
            setCustomName(fileNameWithoutExtension);
            setCustomDescription('');
            setShowUploadModal(true);
        }
    };

    const handleConfirmUploadWrapper = async () => {
        try {
            const fileExtension = selectedFile.name.split('.').pop();
            const finalFileName = customName.endsWith(`.${fileExtension}`) ? customName : `${customName}.${fileExtension}`;

            handleFileUpload({
                selectedFile,
                selectedFolder,
                projectId,
                customName: finalFileName,
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
            notify({
                type: 'File Uploaded',
                targetUserId: project.userId,
                message: `The file "${finalFileName}" has been uploaded to the folder "${selectedFolder.name}" in your project "${project.title || 'Untitled Project'}".`,
                projectId: projectId,
                projectTitle: project.title,
                folderName: selectedFolder.name,
                documentName: finalFileName
            });

        } catch (err) {
            setError(true);
            setModalOpen(true);
            setStatusMessage('Failed to upload file: ' + err.message);
        }
    };

    const handleDeleteFolderWrapper = (folderId) => {
        const folder = folders.find(f => f.id === folderId);
        if (!folder) {
            setError(true);
            setModalOpen(true);
            setStatusMessage('Folder not found');
            return;
        }

        // Ensure the folder object has the projectId
        const folderWithProject = {
            ...folder,
            projectId: projectId // Add projectId from props
        };

        handleDeleteFolder({
            folder: folderWithProject,
            setError,
            setModalOpen,
            setStatusMessage,
            setFolderToDelete,
            setShowDeleteFolderModal: setShowDeleteFolderConfirm
        });

        notify({
            type: 'Folder Deleted',
            targetUserId: project.userId,
            message: `The folder "${folder.name}" has been deleted from your project "${project.title || 'Untitled Project'}".`,
            projectId: projectId,
            projectTitle: project.title,
            folderName: folder.name
        });
      
    };

    const confirmDeleteFolderWrapper = () => {
        // Ensure the folderToDelete has projectId
        const folderWithProject = folderToDelete ? {
            ...folderToDelete,
            projectId: projectId
        } : null;

        confirmDeleteFolder({
            folderToDelete: folderWithProject,
            setUploadLoading,
            setFolders,
            folders,
            setShowDeleteFolderModal: setShowDeleteFolderConfirm,
            setFolderToDelete,
            setModalOpen,
            setError,
            setStatusMessage,
            setShowDeleteFolderConfirm
        });
    };

    const handleDeleteFileWrapper = (file, folder) => {
        if (!checkPermission(project, 'canUploadFiles')) {
            setError(true);
            setModalOpen(true);
            setStatusMessage('You need permission to manage files in this project');
            return;
        }


        setFileToDelete({ file, folder });
        notify({
            type: 'File Deleted',
            targetUserId: project.userId,
            message: `The file "${file.name}" has been deleted from the folder "${folder.name}" in your project "${project.title || 'Untitled Project'}".`,
            projectId: projectId,
            projectTitle: project.title,
            folderName: folder.name,
            documentName: file.name
        });
        setShowDeleteFileConfirm(true);
    };


    const confirmDeleteFileWrapper = () => {
        if (!fileToDelete) return;
        
        handleDeleteFile({
            folderId: fileToDelete.folder.id,
            fileId: fileToDelete.file.id,
            projectId: projectId, // Add the projectId from props
            folders,
            setUploadLoading,
            setFolders,
            setModalOpen,
            setError,
            setStatusMessage,
            setDeletingFile,
            onSuccess: () => {
                setShowDeleteFileConfirm(false);
                setFileToDelete(null);
            }
        });
    };
    const handleDownloadFileWrapper = (file) => {
        handleDownload({
            downloadURL: file.downloadURL,
            setError,
            setModalOpen,
            setStatusMessage,
            setDownloadingFile,
            fileId: file.id
        });
    };

    const handleRenameFolderWrapper = (folder) => {
        if (!newFolderName.trim()) return;
        
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

  return (
    <section className="bg-white rounded-xl shadow-lg p-6">
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Project Documents</h2>
            <p className="text-sm text-gray-500">{folders.length} folders • {folders.reduce((acc, folder) => acc + folder.files.length, 0)} files</p>
          </div>
        </div>
        {checkPermission(project, 'canUploadFiles') && (
          <button
            onClick={() => setShowFolderModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Folder
          </button>
        )}
      </header>

      {foldersLoading ? (
        <div className="flex flex-col items-center justify-center py-12 bg-gray-50/50 rounded-lg">
          <ClipLoader color="#3B82F6" />
          <p className="mt-4 text-sm text-gray-500">Loading Folders...</p>
        </div>
      ) : (
        <div className="overflow-hidden">
          <div className="overflow-y-auto max-h-[300px] pr-2 -mr-2 no-scrollbar">
            <div className="grid grid-cols-1 gap-6">
              {folders.map((folder) => (
                <div key={folder.id} 
                  className="group relative bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                    </div>
                    <div>
                      {isRenamingFolder === folder.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            className="px-3 py-1 text-lg border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                        </div>
                      ) : (
                        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                          {folder.name}
                          {checkPermission(project, 'canUploadFiles') && (
                            <button
                              onClick={() => {
                                setIsRenamingFolder(folder.id);
                                setNewFolderName(folder.name);
                              }}
                              className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                              title="Rename folder"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          )}
                        </h3>
                      )}
                      <p className="text-sm text-gray-500">{folder.files.length} files</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs text-gray-500">
                      <p>Size: {formatFileSize(folder.size || 0)}</p>
                      <p>Remaining: {formatFileSize(folder.remainingSpace || 100 * 1024 * 1024)}</p>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1">
                        <div 
                          className="h-full bg-blue-600 rounded-full transition-all"
                          style={{ 
                              width: `${((folder.size || 0) / (100 * 1024 * 1024)) * 100}%`,
                              backgroundColor: ((folder.size || 0) / (100 * 1024 * 1024)) > 0.9 ? '#ef4444' : '#2563eb'
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto no-scrollbar">
                      {folder.files && folder.files.length > 0 ? (
                        folder.files.map((file) => (
                          <div key={file.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 transition-colors">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <svg className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>

                              {/* File name with truncation */}
                              <div className="flex-1 min-w-0">
                                <span className="text-sm text-gray-700 truncate block">{file.name}</span>
                                <span className="text-xs text-gray-500">{file.size}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleDownloadFileWrapper(file)}
                                className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                                disabled={downloadingFile === file.id}
                              >
                                {downloadingFile === file.id ? (
                                  <ClipLoader size={16} color="currentColor" />
                                ) : (
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4V4" />
                                  </svg>
                                )}
                              </button>
                              {checkPermission(project, 'canUploadFiles') && (
                                <button
                                  onClick={() => handleDeleteFileWrapper(file, folder)}
                                  className="p-1 text-red-600 hover:text-red-800 transition-colors"
                                  disabled={deletingFile === file.id}
                                >
                                  {deletingFile === file.id ? (
                                    <ClipLoader size={16} color="currentColor" />
                                  ) : (
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m4-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>

                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center py-6 text-center">
                          <svg className="h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          <p className="text-sm text-gray-500">This folder is empty</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {checkPermission(project, 'canUploadFiles') && (
                    <div className="mt-4 flex items-center justify-between pt-4 border-t border-gray-100">
                      <button
                        onClick={() => {
                          setSelectedFolder(folder);
                          document.getElementById('file-upload').click();
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Upload a file
                      </button>
                      {checkPermission(project, 'canUploadFiles') && (
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleDeleteFolderWrapper(folder.id)}
                            className="text-sm text-gray-600 hover:text-red-600 transition-colors flex items-center gap-1"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m4-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {folders.length === 0 && (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                    <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No folders yet</h3>
                  <p className="text-sm text-gray-500 mb-4">Create folders and start organizing your project documents</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <input
        id="file-upload"
        type="file"
        className="hidden"
        data-testid="file-upload"
        onChange={handleFileUploadWrapper}
      />

      {/* Create Folder Modal */}
      <AnimatePresence>
        {showFolderModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
              <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowFolderModal(false)} />
              <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">Create New Folder</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Folder Name</label>
                    <input
                      type="text"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      className="mt-1 block w-full h-12 px-4 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Enter folder name"
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowFolderModal(false)}
                      className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50/80 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateFolderWrapper}
                      disabled={!newFolderName.trim() || uploadLoading}
                      className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {uploadLoading ? (
                        <>
                          <ClipLoader size={16} color="#FFFFFF" className="mr-2" />
                          Creating...
                        </>
                      ) : (
                        'Create Folder'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Upload File Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
              <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => !uploadLoading && setShowUploadModal(false)} />
              <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">Upload File</h2>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-gray-700">File Name</label>
                      <span className="text-xs text-gray-500">Original: {selectedFile?.name}</span>
                    </div>
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="mt-1 block w-full h-12 px-4 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Enter file name"
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">The file extension will be added automatically</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description (optional)</label>
                    <textarea
                      value={customDescription}
                      onChange={(e) => setCustomDescription(e.target.value)}
                      className="mt-1 block w-full px-4 py-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      rows={3}
                      placeholder="Add a description for this file"
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowUploadModal(false)}
                      className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50/80 transition-colors"
                      disabled={uploadLoading}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmUploadWrapper}
                      disabled={!customName.trim() || uploadLoading}
                      className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
                    >
                      {uploadLoading ? (
                        <>
                          <ClipLoader size={16} color="#FFFFFF" className="mr-2" />
                          Uploading...
                        </>
                      ) : (
                        'Upload File'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Folder Confirmation Modal */}
      <AnimatePresence>
        {showDeleteFolderConfirm && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center">
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowDeleteFolderConfirm(false)} />
            <motion.article
              className="relative bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-gray-200"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Delete Folder?</h2>
              <p className="text-gray-700 mb-6">Are you sure you want to delete this folder and all its contents? This action cannot be undone.</p>
              <footer className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteFolderConfirm(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50/80 transition-colors"
                  disabled={uploadLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={() => confirmDeleteFolderWrapper()}
                  disabled={uploadLoading}
                  className="bg-red-600/90 backdrop-blur-sm text-white px-4 py-2 rounded-xl hover:bg-red-700/90 transition-colors flex items-center gap-2"
                >
                  {uploadLoading ? (
                    <>
                      <ClipLoader size={16} color="#FFFFFF" />
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
              </footer>
            </motion.article>
          </div>
        )}
      </AnimatePresence>

      {/* Delete File Confirmation Modal */}
      <AnimatePresence>
        {showDeleteFileConfirm && fileToDelete && (
            <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center">
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowDeleteFileConfirm(false)} />
                <motion.article
                    className="relative bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-gray-200"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                    <h2 className="text-xl font-semibold mb-4 text-gray-900">Delete File?</h2>
                    <p className="text-gray-700 mb-6">
                        Are you sure you want to delete "{fileToDelete.file.name}" from folder "{fileToDelete.folder.name}"? This action cannot be undone.
                    </p>
                    <footer className="flex justify-end gap-3">
                        <button
                            onClick={() => {
                                setShowDeleteFileConfirm(false);
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
            </div>
        )}
      </AnimatePresence>
    </section>
  );
}