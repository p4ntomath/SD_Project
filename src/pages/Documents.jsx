import React, { useEffect, useState } from 'react';
import '../styling/documentsPage.css'; 


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
      

      function toggleShowOnlyDownloaded(){
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
            ? {...folder, files: [...folder.files, newFile]}
            : folder
        ))};
      
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

    <main className="min-h-screen bg-[#f3f4fc] font-['Segoe_UI'] flex flex-col">
      <header className="bg-[#0c1f77] text-white flex items-center px-14 py-4">
        <button className="text-white text-xl mr-4">☰</button>
        <h1 className="text-[20pt] m-0">Documents</h1>
      </header>
  
      <section className="pl-[35px]">
        {uploadSuccess && (
          <section className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-8 py-4 rounded-xl font-semibold shadow-lg z-[1000] animate-slideDown">
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
             setSelectedFolder(selected);}}
             className="bg-[#f0f0fb] text-black font-semibold border border-[#cfcfcf] rounded-lg px-4 py-2 text-sm cursor-pointer shadow-sm">
          <option value="">Select Folder</option>
          {folders.map((folder) => (
            <option key={folder.id} value={folder.id}>{folder.name}</option>
          ))}
        </select>

           </section>
        )}
  
        {showUploadModal && (
          <section className="fixed top-0 left-0 w-full h-full bg-black backdrop-blur-sm bg-white/30 flex items-center justify-center z-[9999]">
            <section className="bg-white p-8 rounded-xl w-[90%] max-w-[700px] flex flex-col gap-4">
              <section className="file-preview">
                <label>File name:</label>
                <input
                  className={`font-semibold text-base px-2 py-1 border ${titleError ? 'border-red-500' : 'border-gray-300'} rounded w-full`}
                  type="text"
                  placeholder={selectedFile?.name}
                  value={customName}
                  onChange={(e) => {
                    setCustomName(e.target.value);
                    setTitleError(false);
                  }}
                />
              </section>
  
              <label>Description:</label>
              <textarea
                className="font-semibold text-base px-2 py-1 border border-gray-300 rounded w-full"
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
              />
  
              <section className="flex justify-end gap-4">
                <button onClick={handleConfirmUpload} disabled={!customName.trim()} className="bg-[#0c1f77] text-white font-bold py-2 px-4 rounded-md shadow hover:bg-[#122a9c] active:bg-[#0c1f77] focus:outline-none" >
                  Upload
                </button>
                <button onClick={() => setShowUploadModal(false)} className="bg-[#0c1f77] text-white font-bold py-2 px-4 rounded-md shadow hover:bg-[#122a9c] active:bg-[#0c1f77] focus:outline-none"
                >
                  Cancel
                </button>
              </section>
            </section>
          </section>
        )}     

        {showFolderModal && (
          <section className="fixed top-0 left-0 w-full h-full bg-black backdrop-blur-sm bg-white/30 flex items-center justify-center z-[9999]">
          <section className="bg-white p-8 rounded-xl w-[90%] max-w-[700px] flex flex-col gap-4">
            <section className="file-preview">
              <label>Folder name:</label>
              <input
                className={`font-semibold text-base px-2 py-1 border ${titleError ? 'border-red-500' : 'border-gray-300'} rounded w-full`}
                type="text"
                placeholder={selectedFile?.name}
                value={newFolderName}
                onChange={(e) => {
                  setNewFolderName(e.target.value);
                  setTitleError(false);
                }}
              />

              
          <section className="flex gap-4">
              <button
                onClick={handleCreateNewFolder} 
                className="bg-blue-600 text-white py-2 px-4 rounded"
              >
                Create
              </button>
            
            <button
              onClick={() => setShowFolderModal(false)}
              className="bg-gray-300 text-black py-2 px-4 rounded">
              Cancel
            </button>
            
          <input
            type="file"
            onChange={handleFileUpload}
            className="bg-[#f0f0fb] text-black font-semibold border border-[#cfcfcf] rounded-lg px-4 py-2 text-sm cursor-pointer shadow-sm"
          /> 
          </section>  
        </section>
      </section>
    </section> 
        )}
      </section>
    </main>
  );   
}
