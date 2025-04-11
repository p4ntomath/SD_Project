export default function SidebarToggle({ toggleSidebar, isOpen }) {
  // Only show when sidebar is closed
  if (isOpen) return null;
  
  return (
    <button 
      onClick={toggleSidebar}
      className="fixed z-20 left-0 top-4 p-2 bg-blue-700 text-white rounded-r-md"
      aria-label="Open sidebar"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  );
}