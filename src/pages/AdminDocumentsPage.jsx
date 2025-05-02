import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { fetchAllDocuments } from '../backend/firebase/documentsDB';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../backend/firebase/firebaseConfig';
import { ClipLoader } from 'react-spinners';

export default function AdminDocumentsPage() {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCreator, setSelectedCreator] = useState('all');
    const navigate = useNavigate();

    // Get unique creators for filter dropdown
    const uniqueCreators = [...new Set(documents.map(doc => doc.creatorName))];

    // Filter documents based on selected creator
    const filteredDocuments = selectedCreator === 'all' 
        ? documents 
        : documents.filter(doc => doc.creatorName === selectedCreator);

    useEffect(() => {
        const loadDocuments = async () => {
            try {
                const allDocs = await fetchAllDocuments();
                
                // Fetch project details for each document
                const docsWithDetails = await Promise.all(
                    allDocs.map(async (document) => {
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

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-4">
                <div className="flex justify-center items-center h-64">
                    <ClipLoader color="#3B82F6" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                        <button
                            onClick={() => navigate('/admin')}
                            className="mr-4 p-2 text-gray-600 hover:text-gray-800 transition-colors"
                            aria-label="Back to dashboard"
                        >
                            <FaArrowLeft className="h-5 w-5" />
                        </button>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Documents Management</h1>
                    </div>
                    
                    {/* Add creator filter dropdown */}
                    <div className="flex items-center">
                        <label htmlFor="creator-filter" className="mr-2 text-sm text-gray-600">
                            Filter by Creator:
                        </label>
                        <select
                            id="creator-filter"
                            value={selectedCreator}
                            onChange={(e) => setSelectedCreator(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Creators</option>
                            {uniqueCreators.map(creator => (
                                <option key={creator} value={creator}>
                                    {creator}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                        <p className="text-red-700">{error}</p>
                    </div>
                )}

                <div className="bg-white rounded-lg shadow">
                    <div className="p-6">
                        <div className="flex flex-col">
                            <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                                <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                                    <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Document Name
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Project Name
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Creator
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Type
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Size
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {filteredDocuments.map((document) => (
                                                    <motion.tr 
                                                        key={document.id}
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        transition={{ duration: 0.3 }}
                                                    >
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-medium text-gray-900">{document.fileName}</div>
                                                            <div className="text-sm text-gray-500">{document.description}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900">{document.projectName}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900">{document.creatorName}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900">{document.type}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {(document.size / 1024 / 1024).toFixed(2)} MB
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                            <button
                                                                onClick={() => window.open(document.downloadURL, '_blank')}
                                                                className="text-blue-600 hover:text-blue-900 mr-4"
                                                            >
                                                                View
                                                            </button>
                                                        </td>
                                                    </motion.tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}