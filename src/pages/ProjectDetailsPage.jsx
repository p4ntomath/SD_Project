import { useLocation, useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';

export default function ProjectDetailsPage() {
  const { state } = useLocation();
  const navigate = useNavigate();

  return (
    <section className="min-h-screen bg-gray-50">
      {/* header */}
      <header className="bg-white shadow-sm p-4 sticky top-0 z-10">
        <section className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Go back"
          >
            <FiArrowLeft className="text-gray-600 text-2xl" />
          </button>
          
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-pink-500 bg-clip-text text-transparent">
            {state?.title || "Project"}
          </h1>
        </section>
      </header>

     
      <section className="p-4">
        {/* Please implement funtionality here to display project info */}
      </section>
    </section>
  );
}