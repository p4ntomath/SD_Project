import React, { useState } from 'react';
import { ClipLoader } from 'react-spinners';
import { AnimatePresence, motion } from 'framer-motion';
import { createFolder, updateFolderName, deleteFolder } from '../../backend/firebase/folderDB';
import { uploadDocument, deleteDocument } from '../../backend/firebase/documentsDB';
import { notify } from '../../backend/firebase/notificationsUtil';
export default function DocumentsCard({ 
  projectId, 
  folders, 
  setFolders, 
  foldersLoading, 
  setModalOpen, 
  setError, 
  setStatusMessage,
  projectTitle

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

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      setUploadLoading(true);
      const folderId = await createFolder(projectId, newFolderName);
      
      const newFolder = {
        id: folderId,
        name: newFolderName,
        files: [],
        createdAt: new Date(),
        projectId: projectId
      };

      setFolders([...folders, newFolder]);
      
      notify({
        type: "Folder Created",
        projectId,
        projectTitle: projectTitle,
        folderName: newFolderName
      });
      setNewFolderName('');
      setShowFolderModal(false);
      setModalOpen(true);
      setError(false);
      setStatusMessage('Folder created successfully');
      

    } catch (err) {
      console.error('Error creating folder:', err);
      setModalOpen(true);
      setError(true);
      setStatusMessage('Failed to create folder: ' + err.message);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleRenameFolder = async (folderId, newName) => {
    try {
      await updateFolderName(projectId, folderId, newName);
      
      const updatedFolders = folders.map(folder => 
        folder.id === folderId ? { ...folder, name: newName } : folder
      );
      setFolders(updatedFolders);
      
      setModalOpen(true);
      setError(false);
      setStatusMessage('Folder renamed successfully');
      notify({
        type: "Folder Updated",     
        projectId,
        projectTitle: projectTitle,
        folderName: newName
      });
    } catch (err) {
      console.error('Error renaming folder:', err);
      setModalOpen(true);
      setError(true);
      setStatusMessage('Failed to rename folder: ' + err.message);
    }
  };

  const handleDeleteFolder = (folderId) => {
    setFolderToDelete(folders.find(folder => folder.id === folderId));
    setShowDeleteFolderConfirm(true);
  };

  const confirmDeleteFolder = async () => {
    try {
      setUploadLoading(true);
      await deleteFolder(projectId, folderToDelete.id);
      
      setFolders(folders.filter(folder => folder.id !== folderToDelete.id));
      setShowDeleteFolderConfirm(false);
      setFolderToDelete(null);
      setModalOpen(true);
      setError(false);
      setStatusMessage('Folder deleted successfully');
      notify({
        type: "Folder Deleted", 
        projectId,
        projectTitle: projectTitle,
        folderName: folderToDelete.name
      });
    } catch (err) {
      console.error('Error deleting folder:', err);
      setModalOpen(true);
      setError(true);
      setStatusMessage('Failed to delete folder: ' + err.message);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const fileNameWithoutExtension = file.name.replace(/\.[^/.]+$/, "");
      setSelectedFile(file);
      setCustomName(fileNameWithoutExtension);
      setCustomDescription('');
      setShowUploadModal(true);
    }
  };

  const handleConfirmUpload = async () => {
    if (!customName.trim()) {
      setModalOpen(true);
      setError(true);
      setStatusMessage('Please enter a file name');
      return;
    }

    const fileExtension = selectedFile.name.split('.').pop();
    const finalFileName = customName.endsWith(`.${fileExtension}`) ? customName : `${customName}.${fileExtension}`;

    if (!selectedFolder) {
      setModalOpen(true);
      setError(true);
      setStatusMessage('Please select a folder');
      return;
    }

    try {
      setUploadLoading(true);

      const documentId = await uploadDocument(selectedFile, projectId, selectedFolder.id, {
        displayName: finalFileName,
        description: customDescription || 'No description provided'
      });
      
      const newFile = {
        id: documentId,
        documentId: documentId,
        name: finalFileName,
        displayName: finalFileName,
        description: customDescription || 'No description provided',
        originalName: selectedFile.name,
        size: (selectedFile.size / 1024).toFixed(1) + ' KB',
        type: selectedFile.type,
        uploadDate: new Date(),
        folderId: selectedFolder.id,
        projectId: projectId
      };

      const updatedFolders = folders.map(folder => {
        if (folder.id === selectedFolder.id) {
          return {
            ...folder,
            files: [...folder.files, newFile]
          };
        }
        return folder;
      });

      setFolders(updatedFolders);
      setShowUploadModal(false);
      setSelectedFile(null);
      setCustomName('');
      setCustomDescription('');
      setModalOpen(true);
      setError(false);
      setStatusMessage('File uploaded successfully');
      notify({
        type: "File Uploaded",
        projectId,
        projectTitle: projectTitle,
        folderName: selectedFolder.name,
        documentName: finalFileName
      });
    } catch (err) {
      console.error('Error uploading file:', err);
      setModalOpen(true);
      setError(true);
      setStatusMessage('Failed to upload file: ' + err.message);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDownloadFile = async (file) => {
    try {
      setDownloadingFile(file.id);
      if (file.downloadURL) {
        window.open(file.downloadURL, '_blank');
      } else {
        throw new Error('Download URL not found');
      }
    } catch (err) {
      console.error('Error downloading file:', err);
      setError(true);
      setModalOpen(true);
      setStatusMessage('Failed to download file: ' + err.message);
    } finally {
      setDownloadingFile(null);
    }
  };

  const handleDeleteFile = async (file, folder) => {
    try {
      setDeletingFile(file.id);
      await deleteDocument(file.documentId, projectId, folder.id);
      
      const updatedFolders = folders.map(f => {
        if (f.id === folder.id) {
          return {
            ...f,
            files: f.files.filter(f => f.id !== file.id)
          };
        }
        return f;
      });
      
      setFolders(updatedFolders);
      setModalOpen(true);
      setError(false);
      setStatusMessage('File deleted successfully');
      notify({
        type: "File Deleted",
        projectId,
        projectTitle: projectTitle,
        folderName: folder.name,
        documentName: file.name
      });
    } catch (err) {
      console.error('Error deleting file:', err);
      setError(true);
      setModalOpen(true);
      setStatusMessage('Failed to delete file: ' + err.message);
    } finally {
      setDeletingFile(null);
    }
  };

  return (
    <>
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
          <button
            onClick={() => setShowFolderModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all transform hover:scale-105 active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Folder
          </button>
        </header>

        {foldersLoading ? (
          <div className="flex flex-col items-center justify-center py-12 bg-gray-50/50 rounded-lg">
            <ClipLoader color="#3B82F6" />
            <p className="mt-4 text-sm text-gray-500">Loading Folders...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {folders.map((folder) => (
              <div key={folder.id} 
                className="group relative bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-4 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-medium text-gray-900">{folder.name}</h3>
                    <p className="text-sm text-gray-500">{folder.files.length} files</p>
                  </div>
                </div>

                <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 mb-4">
                  {folder.files && folder.files.length > 0 ? (
                    folder.files.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <svg className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>

                          {/* File name with truncation */}
                          <div className="flex-1 min-w-0">
                            <span className="block truncate text-sm text-gray-700">{file.name}</span>
                          </div>

                          {/* Buttons do not shrink */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => handleDownloadFile(file)}
                              className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                              disabled={downloadingFile === file.id}
                            >
                              {downloadingFile === file.id ? (
                                <ClipLoader size={16} color="currentColor" />
                              ) : (
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteFile(file, folder)}
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
                          </div>
                        </div>
                      </div>

                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-center bg-gray-50 rounded-lg border border-gray-200">
                      <svg className="h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm text-gray-500 mb-2">This folder is empty</p>
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
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRenameFolder(folder.id, prompt('Enter new folder name:', folder.name))}
                      className="text-sm text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-1"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Rename
                    </button>
                    <button
                      onClick={() => handleDeleteFolder(folder.id)}
                      className="text-sm text-gray-600 hover:text-red-600 transition-colors flex items-center gap-1"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m4-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedFolder(folder);
                      document.getElementById('file-upload').click();
                    }}
                    className="w-full text-sm text-blue-600 hover:text-blue-800 transition-colors flex items-center justify-center gap-1 px-2 truncate"
                  >
                    <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span className="truncate">Upload File</span>
                  </button>
                </div>
              </div>
            ))}

            {folders.length === 0 && (
              <div className="text-center py-12 ">
                <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                  <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No folders yet</h3>
                <p className="text-sm text-gray-500 mb-4">Create a new folder to start organizing your project documents</p>
                
              </div>
            )}
          </div>
        )}

        <input
          id="file-upload"
          type="file"
          className="hidden"
          onChange={handleFileUpload}
        />
      </section>

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
                      onClick={handleCreateFolder}
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
                      onClick={handleConfirmUpload}
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
                  onClick={() => confirmDeleteFolder()}
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
    </>
  );
}