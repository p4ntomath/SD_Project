import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FiHome, FiInbox, FiMessageSquare, FiArchive, FiStar, FiEdit, FiTrash2 } from 'react-icons/fi';

export default function MessagesPage() {
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <section className="h-screen flex">
      {/* Sidebar */}
      <aside className={`bg-white border-r border-gray-200 ${isSidebarCollapsed ? 'w-16' : 'w-64'} transition-all duration-300`}>
        <section className="h-full flex flex-col">
          {/* Sidebar Header */}
          <section className="h-16 border-b border-gray-200 flex items-center justify-between px-4">
            {!isSidebarCollapsed && <h2 className="text-lg font-semibold">Messages</h2>}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg
                className="h-5 w-5 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={isSidebarCollapsed ? "M13 5l7 7-7 7M5 5l7 7-7 7" : "M11 19l-7-7 7-7m8 14l-7-7 7-7"}
                />
              </svg>
            </button>
          </section>

          {/* Sidebar Content */}
          <nav className="flex-1 overflow-y-auto py-4">
            <section className="px-3 space-y-1">
              <button className="flex items-center w-full p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors">
                <FiEdit className="h-5 w-5" />
                {!isSidebarCollapsed && <span className="ml-3">Compose</span>}
              </button>
            </section>

            <section className="mt-6 px-3 space-y-1">
              <a
                href="#inbox"
                className="flex items-center px-2 py-2 text-gray-700 rounded-lg hover:bg-gray-100 bg-gray-100"
              >
                <FiInbox className="h-5 w-5" />
                {!isSidebarCollapsed && <span className="ml-3">Inbox</span>}
              </a>

              <a
                href="#sent"
                className="flex items-center px-2 py-2 text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <FiMessageSquare className="h-5 w-5" />
                {!isSidebarCollapsed && <span className="ml-3">Sent</span>}
              </a>

              <a
                href="#starred"
                className="flex items-center px-2 py-2 text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <FiStar className="h-5 w-5" />
                {!isSidebarCollapsed && <span className="ml-3">Starred</span>}
              </a>

              <a
                href="#archived"
                className="flex items-center px-2 py-2 text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <FiArchive className="h-5 w-5" />
                {!isSidebarCollapsed && <span className="ml-3">Archived</span>}
              </a>

              <a
                href="#trash"
                className="flex items-center px-2 py-2 text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <FiTrash2 className="h-5 w-5" />
                {!isSidebarCollapsed && <span className="ml-3">Trash</span>}
              </a>
            </section>
          </nav>
        </section>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <section className="h-16 border-b border-gray-200 bg-white flex items-center px-6">
          <h1 className="text-2xl font-semibold text-gray-800">Inbox</h1>
        </section>
        <section className="p-6">
          <section className="bg-white rounded-lg shadow p-4">
            {/* Placeholder empty state */}
            <section className="text-center py-12">
              <FiMessageSquare className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No messages yet</h3>
              <p className="mt-1 text-sm text-gray-500">Your inbox is empty. Messages you receive will appear here.</p>
              <section className="mt-6">
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <FiEdit className="mr-2 h-4 w-4" />
                  Compose Message
                </button>
              </section>
            </section>
          </section>
        </section>
      </main>
    </section>
  );
}