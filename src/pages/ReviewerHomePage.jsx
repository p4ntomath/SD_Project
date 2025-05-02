import { useState } from 'react';
import ReviewerSidebar from '../components/ReviewerComponents/ReviewerSideBar';
import ReviewerSidebarToggle from "../components/ReviewerComponents/ReviewerSideBarToggle";
import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
import ReviewRequests from '../components/ReviewerComponents/ReviewRequests';

export default function ReviewerHomePage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <section className="min-h-screen bg-gray-50 flex">
      <ReviewerSidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <ReviewerSidebarToggle isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <header className="bg-white shadow-sm p-4">
          <section className="max-w-7xl mx-auto flex justify-between items-center">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Review Requests</h1>
          </section>
        </header>

        <section aria-labelledby="requests-heading" className="p-4 md:p-8">
          <h2 id="requests-heading" className="sr-only">Review Requests</h2>
          <ReviewRequests />
        </section>
      </main>
    </section>
  );
}