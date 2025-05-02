import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth } from '../../backend/firebase/firebaseConfig';
import { getProjectDetails } from '../../backend/firebase/projectDB';
import ReviewFeedbackForm from '../../components/ReviewerComponents/ReviewFeedbackForm';

export default function ReviewProjectPage() {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadProject();
    }, [projectId]);

    const loadProject = async () => {
        try {
            const projectData = await getProjectDetails(projectId);
            setProject(projectData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFeedbackSubmitted = () => {
        navigate('/reviewer/dashboard', {
            state: { message: 'Review submitted successfully' }
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-red-600">
                    Error loading project: {error}
                </div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-600">
                    Project not found
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-gray-900">Review Project</h1>
                        <button
                            onClick={() => navigate(-1)}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                            Back
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="mb-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-2">{project.title}</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Research Field</h3>
                                    <p className="mt-1 text-gray-900">{project.researchField}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Project Status</h3>
                                    <p className="mt-1 text-gray-900">{project.status}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Created By</h3>
                                    <p className="mt-1 text-gray-900">{project.createdBy?.name || 'Unknown'}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                                    <p className="mt-1 text-gray-900">
                                        {project.updatedAt?.toDate?.().toLocaleDateString() || 'Not available'}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4">
                                <h3 className="text-sm font-medium text-gray-500">Project Description</h3>
                                <p className="mt-1 text-gray-900 whitespace-pre-wrap">{project.description}</p>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 pt-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Submit Review</h3>
                            <ReviewFeedbackForm
                                projectId={projectId}
                                reviewerId={auth.currentUser?.uid}
                                onSubmitComplete={handleFeedbackSubmitted}
                            />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}