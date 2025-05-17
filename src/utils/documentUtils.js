import { createFolder, updateFolderName, deleteFolder } from '../backend/firebase/folderDB';
import { uploadDocument, deleteDocument } from '../backend/firebase/documentsDB';
import { auth } from '../backend/firebase/firebaseConfig';

const MAX_FOLDER_SIZE = 100 * 1024 * 1024; // 100MB in bytes

const calculateFolderSize = (files) => {
    return files.reduce((total, file) => {
        if (!file.size) return total;
        
        if (typeof file.size === 'number') {
            return total + file.size;
        }
        
        // Handle string sizes (e.g. "1.5 KB")
        const sizeMatch = file.size.match(/^([\d.]+)\s*([KMG]B|B)$/i);
        if (!sizeMatch) return total;

        const [, number, unit] = sizeMatch;
        const size = parseFloat(number);
        
        switch(unit.toUpperCase()) {
            case 'KB': return total + (size * 1024);
            case 'MB': return total + (size * 1024 * 1024);
            case 'GB': return total + (size * 1024 * 1024 * 1024);
            case 'B': return total + size;
            default: return total;
        }
    }, 0);
};

const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

export const handleCreateFolder = async ({
    newFolderName,
    projectId,
    setUploadLoading,
    setFolders,
    folders,
    setModalOpen,
    setError,
    setStatusMessage,
    setNewFolderName,
    setShowFolderModal,
    additionalCleanup = () => {} // Optional callback for additional cleanup
}) => {
    if (!newFolderName.trim()) return;
    if (!projectId) {
        setError("Please select a project");
        return;
    }

    try {
        setUploadLoading(true);
        const folderId = await createFolder(projectId, newFolderName);
        
        const newFolder = {
            id: folderId,
            name: newFolderName,
            files: [],
            createdAt: new Date(),
            projectId: projectId,
            size: 0,
            remainingSpace: MAX_FOLDER_SIZE
        };

        setFolders([...folders, newFolder]);
        setNewFolderName('');
        setShowFolderModal(false);
        setModalOpen(true);
        setError(false);
        setStatusMessage('Folder created successfully');
        additionalCleanup(); // Call any additional cleanup function
    } catch (err) {
        console.error('Error creating folder:', err);
        setModalOpen(true);
        setError(true);
        setStatusMessage('Failed to create folder: ' + err.message);
    } finally {
        setUploadLoading(false);
    }
};

export const handleFileUpload = async ({
    selectedFile,
    selectedFolder,
    projectId,
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
}) => {
    if (!selectedFile || !selectedFolder || !customName.trim()) {
        setError("Please select a file, folder and provide a name");
        setShowUploadModal(false);
        return;
    }

    // Calculate new folder size after adding this file
    const currentFolderSize = calculateFolderSize(selectedFolder.files);
    const newSize = currentFolderSize + selectedFile.size;

    // Check if adding the file would exceed the folder size limit
    if (newSize > MAX_FOLDER_SIZE) {
        setError(`Adding this file would exceed the folder size limit of ${formatSize(MAX_FOLDER_SIZE)}`);
        setSelectedFile(null);
        setShowUploadModal(false);
        return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
        setError("File size exceeds the maximum limit of 10MB");
        setSelectedFile(null);
        setShowUploadModal(false);
        return;
    }

    try {
        setUploadLoading(true);
        const fileExtension = selectedFile.name.split('.').pop();
        const finalFileName = customName.endsWith(`.${fileExtension}`) ? customName : `${customName}.${fileExtension}`;

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
            projectId
        };

        const updatedFolders = folders.map(folder => {
            if (folder.id === selectedFolder.id) {
                const updatedFiles = [...folder.files, newFile];
                const totalSize = calculateFolderSize(updatedFiles);
                return {
                    ...folder,
                    files: updatedFiles,
                    size: totalSize,
                    remainingSpace: MAX_FOLDER_SIZE - totalSize
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
    } catch (err) {
        console.error('Error uploading file:', err);
        setModalOpen(true);
        setError(true);
        setStatusMessage('Failed to upload file: ' + err.message);
    } finally {
        setUploadLoading(false);
    }
};

export const handleDeleteFolder = ({
    folder,
    setError,
    setModalOpen,
    setStatusMessage,
    setFolderToDelete,
    setShowDeleteFolderModal
}) => {
    if (!folder || !folder.projectId || !folder.id) {
        setError(true);
        setModalOpen(true);
        setStatusMessage('Invalid folder data');
        return;
    }
    setFolderToDelete(folder);
    setShowDeleteFolderModal(true);
};

export const confirmDeleteFolder = async ({
    folderToDelete,
    setUploadLoading,
    setFolders,
    folders,
    setShowDeleteFolderModal,
    setFolderToDelete,
    setModalOpen,
    setError,
    setStatusMessage,
    setShowDeleteFolderConfirm = null // Optional parameter for DocumentsCard
}) => {
    try {
        setUploadLoading(true);
        await deleteFolder(folderToDelete.projectId, folderToDelete.id);
        
        setFolders(folders.filter(folder => folder.id !== folderToDelete.id));
        if (setShowDeleteFolderConfirm) {
            setShowDeleteFolderConfirm(false);
        } else {
            setShowDeleteFolderModal(false);
        }
        setFolderToDelete(null);
        setModalOpen(true);
        setError(false);
        setStatusMessage('Folder deleted successfully');
    } catch (err) {
        console.error('Error deleting folder:', err);
        setModalOpen(true);
        setError(true);
        setStatusMessage('Failed to delete folder: ' + err.message);
    } finally {
        setUploadLoading(false);
    }
};

export const handleDeleteFile = async ({
    folderId,
    fileId,
    projectId,
    folders,
    setUploadLoading,
    setFolders,
    setModalOpen,
    setError,
    setStatusMessage,
    setDeletingFile = null,
    onSuccess = null
}) => {
    try {
        if (setDeletingFile) setDeletingFile(fileId);
        setUploadLoading(true);
        
        await deleteDocument(fileId, projectId, folderId);
        
        // Update folders state after deletion
        const updatedFolders = folders.map(f => {
            if (f.id === folderId) {
                return {
                    ...f,
                    files: f.files.filter(file => file.id !== fileId)
                };
            }
            return f;
        });

        setFolders(updatedFolders);
        setModalOpen(true);
        setError(false);
        setStatusMessage('File deleted successfully');
        
        // Call onSuccess callback if provided
        if (onSuccess) onSuccess();
    } catch (err) {
        setError(true);
        setModalOpen(true);
        setStatusMessage('Failed to delete file: ' + err.message);
    } finally {
        setUploadLoading(false);
        if (setDeletingFile) setDeletingFile(null);
    }
};

export const handleDownload = ({
    downloadURL,
    setError,
    setModalOpen,
    setStatusMessage,
    setDownloadingFile = null, // Optional parameter for DocumentsCard
    fileId = null // Optional parameter for DocumentsCard
}) => {
    try {
        if (setDownloadingFile) setDownloadingFile(fileId);
        
        if (downloadURL) {
            window.open(downloadURL, '_blank');
        } else {
            throw new Error('Download URL not found');
        }
    } catch (err) {
        console.error('Error downloading file:', err);
        setError(true);
        setModalOpen(true);
        setStatusMessage('Failed to download file: ' + err.message);
    } finally {
        if (setDownloadingFile) setDownloadingFile(null);
    }
};

export const handleRenameFolder = async ({
    folder,
    newName,
    setFolders,
    folders,
    setModalOpen,
    setError,
    setStatusMessage
}) => {
    if (!newName?.trim()) return;

    try {
        await updateFolderName(folder.projectId, folder.id, newName);
        
        // Update UI
        const updatedFolders = folders.map(f => 
            f.id === folder.id ? { ...f, name: newName.trim() } : f
        );
        
        setFolders(updatedFolders);
        setModalOpen(true);
        setError(false);
        setStatusMessage('Folder renamed successfully');
    } catch (err) {
        console.error('Error renaming folder:', err);
        setModalOpen(true);
        setError(true);
        setStatusMessage('Failed to rename folder: ' + err.message);
    }
};