import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth, db } from '../../backend/firebase/firebaseConfig';
import { getProjectDetails, updateProject } from '../../backend/firebase/projectDB';
import { fetchDocumentsByFolder } from '../../backend/firebase/documentsDB';
import ReviewFeedbackForm from '../../components/ReviewerComponents/ReviewFeedbackForm';
import { ClipLoader } from 'react-spinners';
import { notify } from '../../backend/firebase/notificationsUtil';
import { getDoc, doc, serverTimestamp, query, collection, where, getDocs, updateDoc, writeBatch } from 'firebase/firestore';

export default function ReviewProjectPage() {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [folders, setFolders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadProject();
    }, [projectId]);

    const loadProject = async () => {
        try {
            const projectData = await getProjectDetails(projectId);
            setProject(projectData);
            
            const projectFolders = await fetchDocumentsByFolder(projectId);
            setFolders(projectFolders || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFeedbackSubmitted = async () => {
        try {
            // Get reviewer name from auth
            let reviewerName = auth.currentUser.displayName || 'Reviewer';
            const reviewerDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
            if (reviewerDoc.exists()) {
                reviewerName = reviewerDoc.data().fullName || reviewerDoc.data().displayName || reviewerName;
            }

            // Get researcher name from Firestore using project.userId
            let researcherName = 'Researcher';
            try {
                if (project.userId) {
                    const researcherDoc = await getDoc(doc(db, 'users', project.userId));
                    if (researcherDoc.exists()) {
                        researcherName = researcherDoc.data().fullName || researcherDoc.data().displayName || researcherName;
                    }
                }
            } catch (err) {
                console.error('Failed to fetch researcher name:', err);
            }

            // Update review request status to completed
            try {
                const requestsQuery = query(
                    collection(db, "reviewRequests"),
                    where("projectId", "==", projectId),
                    where("reviewerId", "==", auth.currentUser.uid),
                    where("status", "==", "accepted") // Only update if status is 'accepted'
                );
                const querySnapshot = await getDocs(requestsQuery);
                
                if (!querySnapshot.empty) {
                    const batch = writeBatch(db);
                    
                    // Update all matching requests to completed
                    querySnapshot.docs.forEach(doc => {
                        batch.update(doc.ref, {
                            status: 'completed',
                            updatedAt: serverTimestamp()
                        });
                    });
                    
                    await batch.commit();
                }
            } catch (err) {
                console.error('Error updating review request status:', err);
                throw new Error('Failed to update review status');
            }

            // Send notifications
            try {
                // Notify reviewer (yourself)
                await notify({
                    type: 'Review Submitted',
                    projectId,
                    projectTitle: project.title,
                    researcherName,
                    targetUserId: auth.currentUser.uid,
                    senderUserId: auth.currentUser.uid,
                    message: 'You have successfully submitted your review.'
                });

                // Notify researcher
                await notify({
                    type: 'Review Received',
                    projectId,
                    projectTitle: project.title,
                    researcherName,
                    reviewerName,
                    targetUserId: project.userId,
                    senderUserId: auth.currentUser.uid,
                    message: `${reviewerName} has submitted a review for your project "${project.title}".`
                });
            } catch (err) {
                console.error('Error sending notifications:', err);
            }

            // Navigate to history with success message
            navigate('/reviewer/history', {
                state: { message: 'Review submitted successfully' }
            });
        } catch (err) {
            console.error('Error in handleFeedbackSubmitted:', err);
            setError('Failed to submit review: ' + err.message);
        }
    };

    const handleDownload = (downloadURL, fileName) => {
        const a = document.createElement('a');
        a.href = downloadURL;
        a.download = fileName;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    if (loading) {
        return (
            <section data-testid="loading" className="min-h-screen bg-gray-50 flex items-center justify-center">
                <ClipLoader color="#3B82F6" />
            </section>
        );
    }

    if (error) {
        return (
            <section className="min-h-screen bg-gray-50 flex items-center justify-center">
                <section className="text-red-600 text-center">
                    <h2 className="text-lg font-medium mb-2">Error Loading Project</h2>
                    <p className="text-sm">{error}</p>
                </section>
            </section>
        );
    }

    if (!project) {
        return (
            <section className="min-h-screen bg-gray-50 flex items-center justify-center">
                <section className="text-gray-600 text-center">
                    <h2 className="text-lg font-medium mb-2">Project Not Found</h2>
                    <p className="text-sm">The requested project could not be found.</p>
                </section>
            </section>
        );
    }

    return (
        <section className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-50">
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <section className="flex items-center justify-between h-16">
                        <h1 className="text-xl font-bold text-gray-900">Review Project</h1>
                        <button
                            onClick={() => navigate(-1)}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Back
                        </button>
                    </section>
                </section>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Project Details */}
                    <section className="lg:col-span-2 space-y-6">
                        {/* Project Overview Card */}
                        <section className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">{project.title}</h2>
                            <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                <section>
                                    <h3 className="text-sm font-medium text-gray-500">Research Field</h3>
                                    <p className="mt-1 text-gray-900">{project.researchField}</p>
                                </section>
                                <section>
                                    <h3 className="text-sm font-medium text-gray-500">Status</h3>
                                    <span className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {project.status || 'In Progress'}
                                    </span>
                                </section>
                                <section>
                                    <h3 className="text-sm font-medium text-gray-500">Created By</h3>
                                    <p className="mt-1 text-gray-900">{project.researcherName || 'Researcher'}</p>
                                </section>
                                <section>
                                    <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                                    <p className="mt-1 text-gray-900">
                                        {project.updatedAt?.toDate?.().toLocaleDateString() || 'Not available'}
                                    </p>
                                </section>
                            </section>
                            <section>
                                <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
                                <p className="text-gray-900 whitespace-pre-wrap">{project.description}</p>
                            </section>
                        </section>

                        {/* Project Documents Card */}
                        <section className="bg-white rounded-lg shadow-sm p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                                </svg>
                                Project Documents
                            </h3>
                            {folders && folders.length > 0 ? (
                                <section className="grid grid-cols-1 gap-6">
                                    {folders.map((folder) => (
                                        <section key={folder.id} className="bg-gray-50 rounded-lg p-4 flex flex-col h-full">
                                            <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                                </svg>
                                                {folder.name}
                                            </h4>
                                            {folder.files && folder.files.length > 0 ? (
                                                <section className="flex-1 space-y-4">
                                                    {folder.files.map((file) => (
                                                        <section key={file.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                                                            <section className="flex items-start space-x-3 mb-2">
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                                </svg>
                                                                <section className="flex-1 min-w-0">
                                                                    <h5 className="font-medium text-gray-900 truncate">{file.name}</h5>
                                                                    <p className="text-sm text-gray-500">{file.size}</p>
                                                                </section>
                                                            </section>
                                                            {file.description && (
                                                                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{file.description}</p>
                                                            )}
                                                            <button
                                                                onClick={() => handleDownload(file.downloadURL, file.fileName)}
                                                                className="w-full inline-flex items-center justify-center px-3 py-2 border border-blue-100 rounded-md text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                                </svg>
                                                                Download
                                                            </button>
                                                        </section>
                                                    ))}
                                                </section>
                                            ) : (
                                                <section className="text-center py-4 bg-white rounded-lg border border-gray-200">
                                                    <p className="text-gray-500 text-sm">No files in this folder</p>
                                                </section>
                                            )}
                                        </section>
                                    ))}
                                </section>
                            ) : (
                                <section className="text-center py-12 px-4 rounded-lg bg-gray-50">
                                    <p className="text-gray-500">No documents available</p>
                                </section>
                            )}
                        </section>
                    </section>

                    {/* Right Column - Review Form */}
                    <section className="lg:col-span-1">
                        <section className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Submit Review</h3>
                            <ReviewFeedbackForm
                                projectId={projectId}
                                reviewerId={auth.currentUser?.uid}
                                onSubmitComplete={handleFeedbackSubmitted}
                            />
                        </section>
                    </section>
                </section>
            </main>
        </section>
    );
}