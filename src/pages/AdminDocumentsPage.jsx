import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaSearch, FaDownload, FaCheck, FaTimes } from 'react-icons/fa';
import { fetchAllDocuments } from '../backend/firebase/documentsDB';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../backend/firebase/firebaseConfig';
import { ClipLoader } from 'react-spinners';
import MainNav from '../components/AdminComponents/Navigation/AdminMainNav';
import MobileBottomNav from '../components/AdminComponents/Navigation/AdminMobileBottomNav';
import StatusModal from '../components/StatusModal';

export default function AdminDocumentsPage() {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCreator, setSelectedCreator] = useState('all');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentFilter, setCurrentFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [modalOpen, setModalOpen] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();

    // Get unique creators for filter dropdown
    const uniqueCreators = [...new Set(documents.map(doc => doc.creatorName))];

    // Filter documents based on selected creator
    const filteredDocuments = selectedCreator === 'all' 
        ? documents 
        : documents.filter(doc => doc.creatorName === selectedCreator);

    // Search documents based on search term
    const searchedDocuments = filteredDocuments.filter(doc => 
        doc.fileName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination
    const documentsPerPage = 10;
    const paginatedDocuments = searchedDocuments.slice((currentPage - 1) * documentsPerPage, currentPage * documentsPerPage);
    useEffect(() => {
        const loadDocuments = async () => {
            try {
                const docs = await fetchAllDocuments();
                
                const docsWithDetails = await Promise.all(
                    docs.map(async (document) => {
                        if (document.projectId) {
                            const projectRef = doc(db, "projects", document.projectId);
                            const projectSnap = await getDoc(projectRef);
                            
                            if (projectSnap.exists()) {
                                const projectData = projectSnap.data();
                                // Get user (creator) details
                                const userRef = doc(db, "users", projectData.userId);
                                const userSnap = await getDoc(userRef);
                                const userData = userSnap.exists() ? userSnap.data() : null;
                                
                                return {
                                    ...document,
                                    projectName: projectData.title || 'Unknown Project',
                                    creatorName: userData?.fullName || 'Unknown User'
                                };
                            }
                        }
                        return {
                            ...document,
                            projectName: 'Unknown Project',
                            creatorName: 'Unknown User'
                        };
                    })
                );
                
                setDocuments(docsWithDetails);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadDocuments();
    }, []);

    useEffect(() => {
        setTotalPages(Math.ceil(searchedDocuments.length / documentsPerPage));
    }, [searchedDocuments]);

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handleDownload = (document) => {
        // Implement download functionality
    };

    const handleApprove = (document) => {
        // Implement approve functionality
    };

    const handleReject = (document) => {
        // Implement reject functionality
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp.seconds * 1000);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const statusStyles = {
        pending: 'bg-yellow-100 text-yellow-800',
        approved: 'bg-green-100 text-green-800',
        rejected: 'bg-red-100 text-red-800',
    };

    if (loading) {
        return (
            <main aria-label='loading' className="min-h-screen bg-gray-50 p-4">
                <section className="flex justify-center items-center h-64">
                    <ClipLoader color="#3B82F6" />
                </section>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 p-4 md:p-8">
            <article className="max-w-7xl mx-auto">
                <header className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                    <nav className="flex items-center">
                        <button
                            onClick={() => navigate('/admin')}
                            className="mr-4 p-2 text-gray-600 hover:text-gray-800 transition-colors"
                            aria-label="Back to dashboard"
                        >
                            <FaArrowLeft className="h-5 w-5" />
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900">Project Documents</h1>
                    </nav>
                    <section className="flex items-center gap-4">
                        <section className="relative">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={handleSearch}
                                placeholder="Search documents..."
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        </section>
                        
                        <select
                            value={currentFilter}
                            onChange={(e) => setCurrentFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="all">All Documents</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </section>
                </header>

                {error && (
                    <aside className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                        <p className="text-red-700">{error}</p>
                    </aside>
                )}

                <section className="bg-white rounded-lg shadow">
                    <section className="p-4 sm:p-6">
                        <section className="overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Document
                                        </th>
                                        <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Project
                                        </th>
                                        <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Uploaded By
                                        </th>
                                        <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="6" className="px-4 sm:px-6 py-4 text-center">
                                                <ClipLoader color="#3B82F6" />
                                            </td>
                                        </tr>
                                    ) : paginatedDocuments.map((document) => (
                                        <motion.tr 
                                            key={document.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                <article className="text-sm">
                                                    <h3 className="font-medium text-gray-900">{document.fileName}</h3>
                                                    <p className="text-gray-500 hidden sm:block">{document.description}</p>
                                                </article>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                <p className="text-sm text-gray-900">{document.projectName}</p>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                <article className="text-sm">
                                                    <p className="text-gray-900">{document.uploaderName}</p>
                                                    <p className="text-gray-500">{document.uploaderEmail}</p>
                                                </article>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[document.status]}`}>
                                                    {document.status}
                                                </span>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <time dateTime={document.uploadedAt?.toDate?.().toISOString()}>
                                                    {formatDate(document.uploadedAt)}
                                                </time>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">
                                                <nav className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleDownload(document)}
                                                        className="text-blue-600 hover:text-blue-800 transition-colors"
                                                    >
                                                        <FaDownload />
                                                    </button>
                                                    <button
                                                        onClick={() => handleApprove(document)}
                                                        className="text-green-600 hover:text-green-800 transition-colors"
                                                        disabled={document.status === 'approved'}
                                                    >
                                                        <FaCheck />
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(document)}
                                                        className="text-red-600 hover:text-red-800 transition-colors"
                                                        disabled={document.status === 'rejected'}
                                                    >
                                                        <FaTimes />
                                                    </button>
                                                </nav>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </section>
                    </section>
                </section>
            </article>

            <nav className="mt-4 flex items-center justify-between">
                <section className="flex-1 flex justify-between sm:hidden">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        disabled={currentPage === totalPages}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                        Next
                    </button>
                </section>
            </nav>

            <StatusModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                success={!error}
                message={statusMessage}
            />
        </main>
    );
}