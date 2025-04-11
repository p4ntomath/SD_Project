import { useState } from 'react';
import ReviewerSidebar from '../components/ReviewerComponents/ReviewerSideBar';
import ReviewerSidebarToggle from "../components/ReviewerComponents/ReviewerSideBarToggle";
import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline";

export default function ReviewerHomePage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);


  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <ReviewerSidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <ReviewerSidebarToggle isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <header className="bg-white shadow-sm p-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Reviewer Dashboard</h1>

          </div>
        </header>

        <section aria-labelledby="projects-heading" className="p-4 md:p-8">
          <h2 id="projects-heading" className="sr-only">Projects for Review</h2>
          
          {/* Empty state card */}
          <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-7xl mx-auto">
            <ClipboardDocumentListIcon 
              className="mx-auto h-12 w-12 text-gray-400" 
              aria-hidden="true"
            />
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              There are no projects to review
            </h3>
            <p className="mt-1 text-gray-500">
              New projects will appear here when they're ready for your evaluation
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}