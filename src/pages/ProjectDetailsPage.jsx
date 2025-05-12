import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { fetchProject, updateProject, deleteProject, getProjectDetails } from '../backend/firebase/projectDB';
import { updateProjectFunds, updateProjectExpense, getFundingHistory } from '../backend/firebase/fundingDB';
import { uploadDocument, fetchDocumentsByFolder, deleteDocument } from '../backend/firebase/documentsDB';
import { createFolder, updateFolderName, deleteFolder } from '../backend/firebase/folderDB';
import { ClipLoader } from 'react-spinners';
import StatusModal from '../components/StatusModal';
import CreateProjectForm from '../components/CreateProjectForm';
import { AnimatePresence, motion } from 'framer-motion';
import { formatFirebaseDate } from '../utils/dateUtils';
import AssignReviewersModal from '../components/ResearcherComponents/AssignReviewersModal';
import ProjectReviews from '../components/ReviewerComponents/ProjectReviews';
import { createReviewRequest, getReviewerRequestsForProject } from '../backend/firebase/reviewerDB';
import { auth } from '../backend/firebase/firebaseConfig';
import { updateExistingReviewerInfo } from '../backend/firebase/reviewerDB';
import ReviewersCard from '../components/ProjectDetailsPage/ReviewersCard';
import DocumentsCard from '../components/ProjectDetailsPage/DocumentsCard';

export default function ProjectDetailsPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [foldersLoading, setFoldersLoading] = useState(false);
  const [error, setError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showFundingHistory, setShowFundingHistory] = useState(false);
  const [fundingHistory, setFundingHistory] = useState([]);
  const [fundAmount, setFundAmount] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [fundingSource, setFundingSource] = useState('');
  const [addFundsLoading, setAddFundsLoading] = useState(false);
  const [addExpenseLoading, setAddExpenseLoading] = useState(false);
  const [showAssignReviewersModal, setShowAssignReviewersModal] = useState(false);
  const [sendingReviewRequests, setSendingReviewRequests] = useState(false);

  // New state for documents and folders
  const [folders, setFolders] = useState([]);
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
  const [reviewRequests, setReviewRequests] = useState([]);

  useEffect(() => {
    const loadProject = async () => {
      try {
        setLoading(true);
        const projectData = await fetchProject(projectId);
        if (!projectData) {
          setModalOpen(true);
          setError(true);
          setStatusMessage('Project not found');
          return;
        }
        
        if (projectData.goals) {
          projectData.goals = projectData.goals.map(goal =>
            typeof goal === 'string' ? { text: goal, completed: false } : goal
          );
        }
        
        // Ensure deadline and duration are properly handled
        if (projectData.deadline) {
          projectData.deadline = typeof projectData.deadline === 'string' 
            ? new Date(projectData.deadline)
            : projectData.deadline;

          // Calculate and set duration based on deadline
          const today = new Date();
          const deadlineDate = new Date(projectData.deadline.seconds ? projectData.deadline.seconds * 1000 : projectData.deadline);
          const durationDays = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
          const months = Math.floor(durationDays / 30);
          
          projectData.duration = months > 0 
            ? `${months} month${months > 1 ? 's' : ''}`
            : `${durationDays} day${durationDays > 1 ? 's' : ''}`;
        }
        
        projectData.id = projectData.id || projectId;
        projectData.status = projectData.status || 'In Progress';
        projectData.availableFunds = projectData.availableFunds || 0;
        projectData.usedFunds = projectData.usedFunds || 0;
        
        setProject(projectData);
        setError(false);
      } catch (err) {
        console.error('Error loading project:', err);
        setModalOpen(true);
        setError(true);
        setStatusMessage(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  useEffect(() => {
    const loadProject = async () => {
      try {
        setLoading(true);
        const projectData = await getProjectDetails(projectId);
        if (projectData) {
          // Update existing reviewer information
          await updateExistingReviewerInfo(projectId);
          // Reload project to get updated reviewer info
          const refreshedProject = await getProjectDetails(projectId);
          setProject(refreshedProject);
          // Get all review requests and process them
          const requests = await getReviewerRequestsForProject(projectId);
          if (requests && Array.isArray(requests)) {
            const processedRequests = requests.map(request => ({
              id: request.id,
              reviewerId: request.reviewerId,
              reviewerName: request.reviewerName || 'Anonymous Reviewer',
              status: request.status || 'pending',
              requestedAt: request.requestedAt || new Date(),
            }));
            setReviewRequests(processedRequests);
          }
        }
      } catch (err) {
        console.error('Error loading project:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  useEffect(() => {
    const loadFolders = async () => {
      try {
        setFoldersLoading(true);
        const folderData = await fetchDocumentsByFolder(projectId);
        if (!folderData || folderData.length === 0) {
          setFolders([]);
          return;
        }

        // Process the folders to ensure all required file metadata is present
        const processedFolders = folderData.map(folder => ({
          ...folder,
          files: folder.files.map(file => ({
            ...file,
            id: file.id || file.documentId,
            documentId: file.documentId || file.id,
            name: file.name || file.fileName || 'Unnamed File',
            fileName: file.fileName || file.name,
            uploadDate: file.uploadedAt ? new Date(file.uploadedAt.seconds * 1000) : new Date(),
          }))
        }));

        setFolders(processedFolders);
      } catch (err) {
        console.error('Error loading folders:', err);
        setError(true);
        setModalOpen(true);
        setStatusMessage('Failed to load project documents');
      } finally {
        setFoldersLoading(false);
      }
    };

    if (projectId) {
      loadFolders();
    }
  }, [projectId]);

  useEffect(() => {
    const loadReviewRequests = async () => {
      try {
        // Get all review requests for this project
        const requests = await getReviewerRequestsForProject(projectId);
        // Make sure each request has the required properties
        const processedRequests = requests.map(request => ({
          id: request.id,
          reviewerId: request.reviewerId,
          reviewerName: request.reviewerName || 'Anonymous Reviewer',
          status: request.status || 'pending',
          requestedAt: request.requestedAt || new Date(),
        }));
        setReviewRequests(processedRequests);
      } catch (err) {
        console.error('Error loading review requests:', err);
        setError(true);
        setModalOpen(true);
        setStatusMessage('Failed to load reviewer requests');
      }
    };

    if (projectId) {
      loadReviewRequests();
    }
  }, [projectId]);

  useEffect(() => {
    if (!showAssignReviewersModal) {
      // Reset loading state when modal closes
      setSendingReviewRequests(false);
    }
  }, [showAssignReviewersModal]);

  const handleDelete = async () => {
    try {
      await deleteProject(projectId);
      setModalOpen(true);
      setStatusMessage("Project deleted successfully");
      setTimeout(() => {
        navigate("/home");
      }, 2000);
    } catch (err) {
      setError(err.message);
      setModalOpen(true);
      setStatusMessage("Failed to delete project: " + err.message);
    }
  };

  const handleUpdate = async (updatedProject) => {
    try {
      setUpdateLoading(true);
      const { id, userId, createdAt, goalInput, ...updateData } = updatedProject;
      
      // Preserve existing funding and status values if not changed
      updateData.availableFunds = updatedProject.availableFunds ?? project.availableFunds;
      updateData.usedFunds = updatedProject.usedFunds ?? project.usedFunds;
      updateData.status = updatedProject.status ?? project.status;
      
      // Recalculate duration if deadline has changed
      if (updateData.deadline) {
        const today = new Date();
        const deadlineDate = new Date(updateData.deadline);
        const durationDays = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
        const months = Math.floor(durationDays / 30);
        
        updateData.duration = months > 0 
          ? `${months} month${months > 1 ? 's' : ''}`
          : `${durationDays} day${durationDays > 1 ? 's' : ''}`;
      }
      
      await updateProject(projectId, updateData);
      setProject({ ...project, ...updateData });
      setIsEditing(false);
      setModalOpen(true);
      setStatusMessage("Project updated successfully");
    } catch (err) {
      setError(err.message);
      setModalOpen(true);
      setStatusMessage("Failed to update project: " + err.message);
    } finally {
      setUpdateLoading(false);
    }
  };

  const toggleGoalStatus = async (goalIndex) => {
    try {
      const updatedGoals = project.goals.map((goal, index) => {
        if (index === goalIndex) {
          return { ...goal, completed: !goal.completed };
        }
        return goal;
      });
      
      // Check if all goals are completed
      const allGoalsCompleted = updatedGoals.every(goal => goal.completed);
      
      // Update both goals and status if all goals are completed
      await updateProject(projectId, { 
        goals: updatedGoals,
        status: allGoalsCompleted ? 'Complete' : 'In Progress'
      });
      
      setProject({ 
        ...project, 
        goals: updatedGoals,
        status: allGoalsCompleted ? 'Complete' : 'In Progress'
      });
      
      if (allGoalsCompleted) {
        setModalOpen(true);
        setStatusMessage("All goals completed! Project status set to Complete.");
      }
    } catch (err) {
      setError(err.message);
      setModalOpen(true);
      setStatusMessage("Failed to update goal status: " + err.message);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp || typeof timestamp !== 'object') return 'Not specified';
    if (timestamp.seconds) {
      const date = new Date(timestamp.seconds * 1000);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    if (timestamp instanceof Date) {
      return timestamp.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    return 'Not specified';
  };

  const calculateProgress = () => {
    if (!project.goals || project.goals.length === 0) return 0;
    const completed = project.goals.filter(goal => goal.completed).length;
    if(Math.round((completed / project.goals.length) * 100) === 100){
      project.status = 'Complete';
    }
    else{
      project.status = 'In Progress';
    }
    return Math.round((completed / project.goals.length) * 100);
  };

  const loadFundingHistory = async () => {
    try {
      const history = await getFundingHistory(projectId);
      setFundingHistory(history.sort((a, b) => b.updatedAt.seconds - a.updatedAt.seconds));
    } catch (err) {
      console.error('Error loading funding history:', err);
      setError(err.message);
    }
  };

  const handleAddFunds = async (e) => {
    e.preventDefault();
    try {
      setAddFundsLoading(true);
      const amount = parseFloat(fundAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid amount');
      }

      await updateProjectFunds(projectId, amount);
      setProject({
        ...project,
        availableFunds: (project.availableFunds || 0) + amount
      });
      setShowAddFundsModal(false);
      setFundAmount('');
      setFundingSource('');
      setModalOpen(true);
      setStatusMessage('Funds added successfully');
      loadFundingHistory();
    } catch (err) {
      setError(err.message);
      setModalOpen(true);
      setStatusMessage('Failed to add funds: ' + err.message);
    } finally {
      setAddFundsLoading(false);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      setAddExpenseLoading(true);
      const amount = parseFloat(expenseAmount);
      if (isNaN(amount) || amount <= 0) {
        setShowAddExpenseModal(false);
        setModalOpen(true);
        setError(true);
        setStatusMessage('Please enter a valid amount');
        return;
      }
      if (!expenseDescription.trim()) {
        setShowAddExpenseModal(false);
        setModalOpen(true);
        setError(true);
        setStatusMessage('Please enter an expense description');
        return;
      }

      if (amount > (project.availableFunds || 0)) {
        setShowAddExpenseModal(false);
        setModalOpen(true);
        setError(true);
        setStatusMessage('Insufficient funds to cover the expense');
        return;
      }

      await updateProjectExpense(projectId, amount);
      setProject({
        ...project,
        usedFunds: (project.usedFunds || 0) + amount,
        availableFunds: (project.availableFunds || 0) - amount
      });
      setShowAddExpenseModal(false);
      setExpenseAmount('');
      setExpenseDescription('');
      setModalOpen(true);
      setError(false);
      setStatusMessage('Expense added successfully');
      loadFundingHistory();
    } catch (err) {
      setShowAddExpenseModal(false);
      setModalOpen(true);
      setError(true);
      setStatusMessage(err.message);
    } finally {
      setAddExpenseLoading(false);
    }
  };

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
      
      // Update UI
      const updatedFolders = folders.map(folder => 
        folder.id === folderId ? { ...folder, name: newName } : folder
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
      // Set the default name as the original filename without extension
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

    // Add file extension if it was removed
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

      // Upload file to Firebase Storage with custom name
      const documentId = await uploadDocument(selectedFile, projectId, selectedFolder.id, {
        displayName: finalFileName,
        description: customDescription || 'No description provided'
      });
      
      // Create the new file object with all necessary metadata
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

      // Update UI with the new file
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
      // The downloadURL should be in the file metadata from Firebase
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
      
      // Update UI after successful deletion
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
    } catch (err) {
      console.error('Error deleting file:', err);
      setError(true);
      setModalOpen(true);
      setStatusMessage('Failed to delete file: ' + err.message);
    } finally {
      setDeletingFile(null);
    }
  };

  const handleAssignReviewers = async (selectedReviewers) => {
    try {
      // Create reviewer requests in the reviewRequests collection
      const reviewerPromises = selectedReviewers.map(reviewer => 
        createReviewRequest(
          projectId, 
          reviewer.id,
          project.title,
          auth.currentUser.displayName || 'Researcher'
        )
      );

      await Promise.all(reviewerPromises);
      
      // Reload review requests to update UI
      const updatedRequests = await getReviewerRequestsForProject(projectId);
      setReviewRequests(updatedRequests);
      
      setShowAssignReviewersModal(false);
      setModalOpen(true);
      setStatusMessage(
        <div className="flex items-center gap-2 text-green-600">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Successfully sent {selectedReviewers.length} reviewer request{selectedReviewers.length !== 1 ? 's' : ''}</span>
        </div>
      );
      setError(false);
    } catch (err) {
      console.error("Error assigning reviewers:", err);
      setError(true);
      setStatusMessage(
        <div className="flex items-center gap-2 text-red-600">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span>Failed to send reviewer requests: {err.message}</span>
        </div>
      );
    }
  };

  useEffect(() => {
    if (showFundingHistory) {
      loadFundingHistory();
    }
  }, [showFundingHistory]);

  if (loading) {
    return (
      <main className="flex justify-center items-center min-h-screen">
        <ClipLoader color="#3B82F6" />
      </main>
    );
  }

  if (!project) {
    return (
      <main className="flex justify-center items-center min-h-screen">
        <ClipLoader color="#3B82F6" />
      </main>
    );
  }

  if (isEditing) {
    return (
      <main className="p-6">
        <button 
          onClick={() => setIsEditing(false)}
          className="mb-4 flex items-center text-gray-600 hover:text-blue-600 transition-colors"
        >
          <FiArrowLeft className="mr-2" /> Back to Details
        </button>
        <CreateProjectForm
          projectToUpdate={project}
          isUpdateMode={true}
          onUpdate={handleUpdate}
          onCancel={() => setIsEditing(false)}
          loading={updateLoading}
        />
      </main>
    );
  }

  return (
    <>

      <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <section className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 sm:h-16 gap-3 sm:gap-0">
              <div className="flex items-center">
                <button
                  onClick={() => navigate(-1)}
                  className="text-gray-600 hover:text-blue-600 transition-colors flex items-center mr-3"
                >
                  <FiArrowLeft className="text-xl mr-2" />
                  Back
                </button>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-pink-500 bg-clip-text text-transparent truncate max-w-[200px] sm:max-w-none">
                  {project.title}
                </h1>
              </div>
              <nav className="flex gap-2 justify-start sm:justify-end">
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-600 text-white py-2 px-3 sm:px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center text-sm sm:text-base"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Project
                </button>
              </nav>
          </section>
        </section>
      </header>

      <main className="min-h-screen bg-gray-50 px-4 sm:px-6 py-4 sm:py-6">
      <article className="max-w-7xl mx-auto">

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Left Column - Main Info */}
          <section className="space-y-4 sm:space-y-6">
            {/* Basic Info Card */}
            <article className="bg-white rounded-lg shadow p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4">Project Overview</h2>
              <section className="space-y-4">
                {/* Progress Bar */}
                <section className="mb-4 sm:mb-6">
                  <header className="flex justify-between items-center mb-2">
                    <p className="text-sm text-gray-500">Overall Progress</p>
                    <p className="text-sm text-gray-600">{calculateProgress()}%</p>
                  </header>
                  <section className="w-full bg-gray-200 rounded-full h-2">
                    <section 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${calculateProgress()}%` }}
                    />
                  </section>
                </section>

                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm text-gray-500">Research Field</dt>
                    <dd className="font-medium">{project.researchField}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Duration</dt>
                    <dd className="font-medium">{project.duration}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Created</dt>
                    <dd className="font-medium">{formatFirebaseDate(project.createdAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Deadline</dt>
                    <dd className="font-medium">{formatFirebaseDate(project.deadline)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Status</dt>
                    <dd>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {project.status || 'In Progress'}
                      </span>
                    </dd>
                  </div>
                </dl>

                <section>
                  <h3 className="text-sm text-gray-500 mb-1">Description</h3>
                  <p className="text-gray-700">{project.description}</p>
                </section>
              </section>
            </article>

            {/* Goals Card */}
            <section className="bg-white rounded-lg shadow p-4 sm:p-6">
              <header className="flex justify-between items-center mb-4">
                <h2 className="text-lg sm:text-xl font-semibold">Project Goals</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Progress</span>
                  <span className="font-medium">{calculateProgress()}%</span>
                </div>
              </header>
              
              <ul className="space-y-3">
                {project.goals?.map((goal, index) => (
                  <li
                  key={index}
                  onClick={() => toggleGoalStatus(index)}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                >
                    <div className="flex items-center  gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={goal.completed}
                        className="h-4 w-4 text-blue-600 rounded"
                        onChange={() => {}}
                      />
                      <span className={`${goal.completed ? 'line-through text-gray-400' : 'text-gray-700'} text-sm sm:text-base break-words flex-1`}>
                        {goal.text}
                      </span>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ml-2 ${
                      goal.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {goal.completed ? 'Completed' : 'In Progress'}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <DocumentsCard 
              projectId={projectId}
              folders={folders}
              setFolders={setFolders}
              foldersLoading={foldersLoading}
              setModalOpen={setModalOpen}
              setError={setError}
              setStatusMessage={setStatusMessage}
            />
          </section>

          {/* Right Column - Additional Info */}
          <section className="space-y-4 sm:space-y-6">
            {/* Funding Card */}
            <section className="bg-white rounded-lg shadow p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4">Funding Details</h2>
              <section className="space-y-4">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm text-gray-500">Available Funds</dt>
                    <dd data-testid = "Available Funds"
                     className="text-xl sm:text-2xl font-bold text-green-600">
                      R {(project.availableFunds || 0).toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Used Funds</dt>
                    <dd className="text-lg sm:text-xl font-semibold text-red-600">
                      R {(project.usedFunds || 0).toLocaleString()}
                    </dd>
                  </div>
                </dl>
                
                <section className="pt-2">
                  <section className="w-full bg-gray-200 rounded-full h-2">
                    <section 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${((project.usedFunds || 0) / ((project.availableFunds || 0) + (project.usedFunds || 0)) * 100) || 0}%` }}
                    />
                  </section>
                  <p className="text-xs text-gray-500 text-right mt-1">
                    {(((project.usedFunds || 0) / ((project.availableFunds || 0) + (project.usedFunds || 0)) * 100) || 0).toFixed(1)}% utilized
                  </p>
                </section>

                <div className="grid grid-cols-3 gap-3">
                  <button
                    aria-label='Add Funds Btn'
                    onClick={() => setShowAddFundsModal(true)}
                    className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                  >
                    Add Funds
                  </button>
                  <button
                    onClick={() => setShowAddExpenseModal(true)}
                    className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base"
                  >
                    Add Expense
                  </button>
                  <button
                    onClick={() => setShowFundingHistory(true)}
                    className="bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors text-sm sm:text-base"
                  >
                    View History
                  </button>
                </div>
              </section>
            </section>

            {/* Message Board Card */}
            <section className="bg-white rounded-lg shadow p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4">Project Discussion</h2>
              <section className="space-y-4">
                <article className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                  <header className="flex items-center mb-3">
                    <svg className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-blue-700 font-medium text-sm sm:text-base">Project Discussion Coming Soon!</h3>
                  </header>
                  <p className="text-sm text-gray-600">
                    Stay tuned for our new discussion features that will allow you to:
                  </p>
                  <ul className="space-y-2 text-xs sm:text-sm text-gray-600 mt-2">
                    <li className="flex items-center">
                      <svg className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Communicate with team members in real-time</span>
                    </li>
                    <li className="flex items-center">
                      <svg className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0" fill="none" viewBox="0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Share updates and announcements</span>
                    </li>
                    <li className="flex items-center">
                      <svg className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Create topic-based discussion threads</span>
                    </li>
                  </ul>
                </article>
                <button
                  disabled
                  className="w-full flex items-center justify-center px-4 py-2 border border-blue-300 text-blue-600 rounded-lg bg-blue-50 opacity-50 cursor-not-allowed text-sm sm:text-base"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18-9-2zm0 0v-8" />
                  </svg>
                  Start Discussion (Coming Soon)
                </button>
              </section>
            </section>

            {/* Collaborators Card */}
            <section className="bg-white rounded-lg shadow p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4">Project Collaborators</h2>
              <section className="space-y-4">
                <article className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                  <p className="text-blue-700 text-xs sm:text-sm mb-2">
                    Collaboration features are coming soon! You'll be able to:
                  </p>
                  <ul className="mt-2 space-y-1 text-xs sm:text-sm text-gray-600">
                    <li className="flex items-center">
                      <svg className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Invite researchers to collaborate</span>
                    </li>
                    <li className="flex items-center">
                      <svg className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0" fill="none" viewBox="0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Share project documents</span>
                    </li>
                    <li className="flex items-center">
                      <svg className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Track shared progress</span>
                    </li>
                  </ul>
                </article>
                <button
                  disabled
                  className="text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm font-medium w-full flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Add Collaborators (Coming Soon)
                </button>
              </section>
            </section>

            <ReviewersCard 
              project={project}
              reviewRequests={reviewRequests}
              formatDate={formatDate}
              setShowAssignReviewersModal={setShowAssignReviewersModal}
            />
            
          </section>
        </section>

        {/* Project Reviews Card - Full Width */}
        <article className="bg-white rounded-lg shadow p-4 sm:p-6 mt-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Project Reviews</h2>
          <ProjectReviews projectId={projectId} formatDate={formatDate} />
        </article>

      </article>

      <StatusModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        success={!error}
        message={statusMessage}
      />

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center">
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
            <motion.article
              className="relative bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-gray-200"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Delete Project?</h2>
              <p className="text-gray-700 mb-6">Are you sure you want to delete this project? This action cannot be undone.</p>
              <footer className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50/80 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    handleDelete();
                  }}
                  className="bg-red-600/90 backdrop-blur-sm text-white px-4 py-2 rounded-xl hover:bg-red-700/90 transition-colors"
                >
                  Delete
                </button>
              </footer>
            </motion.article>
          </div>
        )}
      </AnimatePresence>

      {/* Add Funds Modal */}
      <AnimatePresence>
        {showAddFundsModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
              <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => !addFundsLoading && setShowAddFundsModal(false)} />
              <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">Add Funds</h2>
                <form onSubmit={handleAddFunds}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Amount (R)</label>
                      <input
                        type="number"
                        aria-label='Amount Add Funds'
                        value={fundAmount}
                        onChange={(e) => setFundAmount(e.target.value)}
                        className="mt-1 block w-full h-12 px-4 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Source</label>
                      <input
                        type="text"
                        aria-label='Funding Source'
                        value={fundingSource}
                        onChange={(e) => setFundingSource(e.target.value)}
                        className="mt-1 block w-full h-12 px-4 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowAddFundsModal(false)}
                      className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50/80 transition-colors"
                      disabled={addFundsLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      aria-label='Submit Add Funds'
                      className="bg-blue-600/90 text-white px-4 py-2 rounded-xl hover:bg-blue-700/90 transition-colors flex items-center justify-center disabled:opacity-50"
                      disabled={addFundsLoading}
                    >
                      {addFundsLoading ? (
                        <>
                          <ClipLoader size={16} color="#FFFFFF" className="mr-2" />
                          Adding...
                        </>
                      ) : (
                        'Add Funds'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Expense Modal */}
      <AnimatePresence>
        {showAddExpenseModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
              <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => !addExpenseLoading && setShowAddExpenseModal(false)} />
              <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">Add Expense</h2>
                <form onSubmit={handleAddExpense}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Amount (R)</label>
                      <input
                        aria-label='Amount'
                        type="number"
                        value={expenseAmount}
                        onChange={(e) => setExpenseAmount(e.target.value)}
                        className="mt-1 block w-full h-12 px-4 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <input
                        type="text"
                        aria-label='Description'
                        value={expenseDescription}
                        onChange={(e) => setExpenseDescription(e.target.value)}
                        className="mt-1 block w-full h-12 px-4 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      name = 'Cancel'
                      onClick={() => setShowAddExpenseModal(false)}
                      className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50/80 transition-colors"
                      disabled={addExpenseLoading}
                    >
                      Cancel
                    </button>
                    <button
                      aria-label='Submit Expense'
                      data-testid='submit-expense'
                      type="submit"
                      className="bg-blue-600/90 text-white px-4 py-2 rounded-xl hover:bg-blue-700/90 transition-colors flex items-center justify-center disabled:opacity-50"
                      disabled={addExpenseLoading}
                    >
                      {addExpenseLoading ? (
                        <>
                          <ClipLoader size={16} color="#FFFFFF" className="mr-2" />
                          Adding...
                        </>
                      ) : (
                        'Add Expense'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Funding History Modal */}
      <AnimatePresence>
        {showFundingHistory && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
              <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowFundingHistory(false)} />
              <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-6">
                <header className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Funding History</h2>
                  <button
                    onClick={() => setShowFundingHistory(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </header>
                <div className="max-h-[60vh] overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance After</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {fundingHistory.map((entry) => (
                        <tr key={entry.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatFirebaseDate(entry.updatedAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {entry.type === 'expense' ? 'Expense' : 'Funds Added'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={entry.amount < 0 ? 'text-red-600' : 'text-green-600'}>
                              R {Math.abs(entry.amount).toLocaleString()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            R {entry.totalAfterUpdate.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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

      <AssignReviewersModal
        isOpen={showAssignReviewersModal}
        onClose={() => setShowAssignReviewersModal(false)}
        onAssign={handleAssignReviewers}
        projectId={projectId}
      />
    </main>
  </>
  );
}
