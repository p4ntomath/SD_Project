import React, { useEffect, useState } from 'react';
import { DocumentIcon } from "@heroicons/react/24/outline";
import MainNav from '../components/ResearcherComponents/Navigation/MainNav';
import MobileBottomNav from '../components/ResearcherComponents/Navigation/MobileBottomNav';

export default function DocumentsPage() {
    const [documents, setDocuments] = useState([]);
    const [downloadedDocs, setDownloadedDocs] = useState([]);
    const [showOnlyDownloaded, setShowOnlyDownloaded] = useState(false);
    const [lastDeleted, setLastDeleted] = useState(null);
    const [undoTimer, setUndoTimer] = useState(null);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [newDescription, setNewDescription] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [customName, setCustomName] = useState('');
    const [customDescription, setCustomDescription] = useState('');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [titleError, setTitleError] = useState(false);
    const [sortOption, setSortOption] = useState('');
    const [visibleDocs, setVisibleDocs] = useState(documents);
    const [filterOption, setFilterOption] = useState('');
    const [folders, setFolders] = useState([]);
    const [newFolderName, setNewFolderName] = useState('');
    const [showFolderModal, setShowFolderModal] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [selectedFolder, setSelectedFolder] = useState(null);

    function handleDownload(url, id) {
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', '');
        document.body.appendChild(link);
        link.click();
        link.remove();

        setDownloadedDocs((prev) => {
            if (!prev.includes(id)) return [...prev, id];
            return prev;
        });
    }

    function toggleShowOnlyDownloaded() {
        setShowOnlyDownloaded(prev => !prev);
    }

    function handleDelete(id) {
        const confirmDelete = window.confirm('Are you sure you want to delete this document?');
        if (confirmDelete) {
            const deletedDoc = documents.find(doc => doc.id === id);
            setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== id));
            setLastDeleted(deletedDoc);

            if (undoTimer) clearTimeout(undoTimer);

            const timer = setTimeout(() => {
                setLastDeleted(null);
            }, 5000);

            setUndoTimer(timer);
        }
    }

    function handleUndo() {
        if (lastDeleted) {
            setDocuments(prevDocs => [...prevDocs, lastDeleted]);
            setLastDeleted(null);
            if (undoTimer) clearTimeout(undoTimer);
        }
    }

    useEffect(() => {
        let filtered = showOnlyDownloaded
            ? documents.filter(doc => downloadedDocs.includes(doc.id))
            : documents;

        if (filterOption === 'shared') {
            filtered = filtered.filter(doc => doc.shared);
        } else if (filterOption === 'private') {
            filtered = filtered.filter(doc => doc.private);
        }

        if (sortOption === 'name') {
            filtered.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sortOption === 'date') {
            filtered.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
        }

        setVisibleDocs(filtered);
    }, [documents, downloadedDocs, showOnlyDownloaded, sortOption]);

    function handleFileUpload(event) {
        const file = event.target.files[0];
        if (file && selectedFolder) {
            const newFile = {
                id: Date.now(),
                name: file.name,
                size: (file.size / 1024).toFixed(1) + ' KB',
                url: URL.createObjectURL(file),
                folderId: selectedFolder.id,
            };

            setFolders(folders.map(folder =>
                folder.id === selectedFolder.id
                    ? { ...folder, files: [...folder.files, newFile] }
                    : folder
            ));
        };

        setDocuments(prev => [...prev, newDoc]);
        setNewDescription('');
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
    };

    function handleConfirmUpload() {

        if (!customName.trim()) {
            setTitleError(true);
            alert("Please enter a document title before uploading.");
            return;
        }

        const newDoc = {
            id: Date.now(),
            name: customName,
            description: customDescription || 'No description provided',
            shared: false,
            url: URL.createObjectURL(selectedFile),
            type: selectedFile.type,
            size: (selectedFile.size / 1024).toFixed(1) + ' KB',
            uploadDate: new Date().toLocaleDateString()
        };

        setDocuments(prev => [...prev, newDoc]);

        setShowUploadModal(false);
        setCustomName('');
        setCustomDescription('');
        setSelectedFile(null);
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
    }

    const handleSort = (option) => {
        let sortedDocs = [...visibleDocs];
        if (option === 'name') {
            sortedDocs.sort((a, b) => a.name.localeCompare(b.name));
        } else if (option === 'date') {
            sortedDocs.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
        }
        setVisibleDocs(sortedDocs);
        setSortOption(option);
    };

    const handleFilter = (option) => {
        setFilterOption(option);
    };

    const handleCreateNewFolder = () => {
        if (newFolderName.trim()) {
            const newFolder = {
                id: Date.now(),
                name: newFolderName,
                files: [],
                lastModified: new Date().toLocaleDateString(),
            };

            setFolders((prevFolders) => [...prevFolders, newFolder]);
            setNewFolderName('');
            setShowFolderModal(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#f3f4fc]">
            <MainNav
                mobileMenuOpen={mobileMenuOpen}
                setMobileMenuOpen={setMobileMenuOpen}
                onSearch={() => { }}
            />

            <section className="pt-16 px-4 md:px-8 max-w-7xl mx-auto">
                {/* Page Title */}
                <header className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-800">My Documents</h1>
                    <p className="text-gray-600 mt-1">Manage and organize your research documents</p>
                </header>

                {uploadSuccess && (
                    <section className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-8 py-4 rounded-xl font-semibold shadow-lg z-[1000] animate-slideDown">
                        Document uploaded successfully!
                    </section>
                )}

                <section className="flex gap-4 my-8">
                    <select
                        value={sortOption}
                        onChange={(e) => {
                            const selected = e.target.value;
                            setSortOption(selected);
                            handleSort(selected);
                        }}

                        className="bg-[#f0f0fb] text-black font-semibold border border-[#cfcfcf] rounded-lg px-4 py-2 text-sm cursor-pointer shadow-sm">

                        <option value="">Sort by</option>
                        <option value="date">Date</option>
                        <option value="name">Name</option>
                    </select>

                    <select
                        value={filterOption}
                        onChange={(e) => handleFilter(e.target.value)}
                        className="bg-[#f0f0fb] text-black font-semibold border border-[#cfcfcf] rounded-lg px-4 py-2 text-sm cursor-pointer shadow-sm">

                        <option value="">Filter</option>
                        <option value="shared">Shared</option>
                        <option value="private">Private</option>
                    </select>

                    <button
                        onClick={toggleShowOnlyDownloaded}
                        className="bg-gray-100 text-black font-semibold border border-[#cfcfcf] rounded-lg px-4 py-2 text-sm shadow-sm hover:bg-gray-200 focus:ring-0"
                    >
                        {showOnlyDownloaded ? 'Show All' : 'Downloaded'}
                    </button>

                    {lastDeleted && (
                        <section className="flex items-center gap-4 bg-[#fff3cd] text-[#856404] p-4 mb-4 border border-[#ffeeba] rounded-lg">
                            <section>Document deleted.</section>
                            <button onClick={handleUndo} className="text-[#0c1f77] font-bold">Undo</button>
                        </section>
                    )}
                </section>

                <section className="flex flex-wrap gap-4 mb-8">
                    {visibleDocs.map((doc, i) => (
                        <article
                            key={i}
                            className="flex flex-col bg-white border border-[#ddd] rounded-xl shadow-md p-4 flex-1 max-w-[400px] w-full m-4 gap-2">
                            <header className="flex justify-between items-center">
                                <h2 className="text-base m-0">{doc.name}</h2>
                                <p className="text-sm text-[#555]">{doc.shared ? 'Shared' : 'Private'}</p>
                            </header>

                            <p className="text-sm text-[#555] break-words">{doc.description}</p>

                            <footer className="flex justify-between flex-wrap text-sm text-[#666] gap-2">
                                <p>{doc.type}</p>
                                <p>{doc.uploadDate}</p>
                                <p>{doc.size}</p>
                            </footer>

                            <section className="flex justify-end gap-2">
                                {!downloadedDocs.includes(doc.id) ? (
                                    <button onClick={() => handleDownload(doc.url, doc.id)}
                                        className="px-3 py-1 text-sm border border-gray-300 rounded">Download</button>
                                ) : (
                                    <button className="text-green-600 font-semibold">Downloaded</button>
                                )}
                                <button onClick={() => handleDelete(doc.id)}
                                    className="px-3 py-1 text-sm border border-gray-300 rounded">Delete</button>
                            </section>
                        </article>
                    ))}
                </section>

                {!showOnlyDownloaded && (
                    <section className="flex justify-start mb-8">
                        <input
                            type="file"
                            id="upload-input"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                    setSelectedFile(file);
                                    setCustomName(file.name);
                                    setShowUploadModal(true);
                                }
                            }}
                        />

                        <button onClick={() => document.getElementById('upload-input').click()}
                            className="bg-[#0c1f77] text-white py-2 px-4 rounded-lg font-bold">
                            + Upload New Document
                        </button>
                    </section>
                )}

                {!showOnlyDownloaded && (
                    <section className="mb-12">
                        <header className="mb-4">
                            <h2 className="text-xl">Folders</h2>
                        </header>

                        <section className="flex gap-4 flex-wrap">
                            {folders.map((folder) => (
                                <article key={folder.id} className="bg-white border border-[#ddd] rounded-lg shadow-md p-4 w-[250px] flex flex-col">
                                    <h3 className="flex items-center text-base mb-2">
                                        <img
                                            src="https://cdn-icons-png.flaticon.com/512/716/716784.png"
                                            alt="folder"
                                            className="w-6 h-6 mr-2"
                                        />
                                        {folder.name}
                                    </h3>
                                    <p className="text-sm text-[#555]">{folder.files.length} files</p>
                                    <p className="text-sm text-[#555]">Last modified: {folder.lastModified}</p>

                                    <ul className="mt-4">
                                        {folder.files.map((file) => (
                                            <li key={file.id} className="text-sm text-[#555]">
                                                <a href={file.url} target="_blank" rel="noopener noreferrer">
                                                    {file.name}
                                                </a> - {file.size}
                                            </li>
                                        ))}
                                    </ul>

                                </article>
                            ))}
                        </section>


                        <button
                            onClick={() => setShowFolderModal(true)}
                            className="mt-4 bg-[#0c1f77] text-white py-2 px-4 rounded-lg font-bold">
                            + Create New Folder
                        </button>

                        <select
                            onChange={(e) => {
                                const selected = folders.find(folder => folder.id === parseInt(e.target.value))
                                setSelectedFolder(selected);
                            }}
                            className="bg-[#f0f0fb] text-black font-semibold border border-[#cfcfcf] rounded-lg px-4 py-2 text-sm cursor-pointer shadow-sm">
                            <option value="">Select Folder</option>
                            {folders.map((folder) => (
                                <option key={folder.id} value={folder.id}>{folder.name}</option>
                            ))}
                        </select>

                    </section>
                )}

                {showUploadModal && (
                    <section className="fixed top-0 left-0 w-full h-full bg-black/30 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
                        <section className="bg-white p-6 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                            <header className="mb-4">
                                <h2 className="text-xl font-semibold text-gray-900">Upload Document</h2>
                            </header>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">File name:</label>
                                    <input
                                        className={`w-full px-3 py-2 border ${titleError ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                        type="text"
                                        placeholder="Enter file name"
                                        value={customName}
                                        onChange={(e) => {
                                            setCustomName(e.target.value);
                                            setTitleError(false);
                                        }}
                                    />
                                    {titleError && (
                                        <p className="mt-1 text-sm text-red-500">Please enter a file name</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description:</label>
                                    <textarea
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                        value={customDescription}
                                        onChange={(e) => setCustomDescription(e.target.value)}
                                        rows={4}
                                        placeholder="Add a description (optional)"
                                    />
                                </div>

                                <footer className="flex justify-end gap-3 pt-4">
                                    <button 
                                        onClick={() => setShowUploadModal(false)}
                                        className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={handleConfirmUpload}
                                        disabled={!customName.trim()}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Upload
                                    </button>
                                </footer>
                            </div>
                        </section>
                    </section>
                )}

                {showFolderModal && (
                    <section className="fixed top-0 left-0 w-full h-full bg-black/30 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
                        <section className="bg-white p-6 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                            <header className="mb-4">
                                <h2 className="text-xl font-semibold text-gray-900">Create New Folder</h2>
                            </header>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Folder name:</label>
                                    <input
                                        className={`w-full px-3 py-2 border ${titleError ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                        type="text"
                                        placeholder="Enter folder name"
                                        value={newFolderName}
                                        onChange={(e) => {
                                            setNewFolderName(e.target.value);
                                            setTitleError(false);
                                        }}
                                    />
                                    {titleError && (
                                        <p className="mt-1 text-sm text-red-500">Please enter a folder name</p>
                                    )}
                                </div>

                                <footer className="flex justify-end gap-3 pt-4">
                                    <button 
                                        onClick={() => setShowFolderModal(false)}
                                        className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={handleCreateNewFolder}
                                        disabled={!newFolderName.trim()}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Create
                                    </button>
                                </footer>
                            </div>
                        </section>
                    </section>
                )}
            </section>

            <MobileBottomNav
                showForm={showUploadModal}
                setShowForm={setShowUploadModal}
            />
        </main>
    );
}
