import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../backend/firebase/firebaseConfig';
import { getReviewerRequests, updateReviewRequestStatus } from '../../backend/firebase/reviewerDB';

export default function ReviewRequestsPanel() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        loadRequests();
    }, []);

    const formatDate = (timestamp) => {
        if (!timestamp) return 'Date not available';
        try {
            // Handle Firebase Timestamp
            if (typeof timestamp === 'object' && timestamp.seconds) {
                return new Date(timestamp.seconds * 1000).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }
            // Handle Date object
            if (timestamp instanceof Date) {
                return timestamp.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }
            // Handle date string
            return new Date(timestamp).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Date not available';
        }
    };

    const loadRequests = async () => {
        try {
            const reviewerId = auth.currentUser?.uid;
            if (!reviewerId) return;
            const reviewRequests = await getReviewerRequests(reviewerId);
            // Only show pending requests
            const pendingRequests = reviewRequests.filter(req => req.status === 'pending');
            setRequests(pendingRequests);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (requestId, projectId) => {
        try {
            await updateReviewRequestStatus(requestId, 'accepted');
            // Remove the request from the list
            setRequests(requests.filter(req => req.id !== requestId));
            // Navigate to the review page
            navigate(`/reviewer/review/${projectId}`);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleReject = async (requestId) => {
        try {
            await updateReviewRequestStatus(requestId, 'rejected');
            // Remove the request from the list
            setRequests(requests.filter(req => req.id !== requestId));
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-8">
                <div 
                    className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
                    role="status"
                    aria-label="Loading review requests"
                />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-red-600 text-center py-4">
                Error loading requests: {error}
            </div>
        );
    }

    if (requests.length === 0) {
        return (
            <div className="text-center py-6">
                <p className="text-gray-500">No pending review requests</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {requests.map((request) => (
                <div key={request.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                            {request.project?.title || 'Untitled Project'}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Requested on {formatDate(request.createdAt)}
                        </p>
                    </div>

                    <div className="mb-4">
                        <p className="text-gray-600">
                            {request.project?.description || 'No description available'}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={() => handleAccept(request.id, request.projectId)}
                            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Accept Request
                        </button>
                        <button
                            onClick={() => handleReject(request.id)}
                            className="flex-1 bg-white text-gray-700 px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
                        >
                            Decline
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}