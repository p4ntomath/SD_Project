import React from 'react';
import { formatFirebaseDate } from '../../utils/dateUtils';
import { isProjectOwner } from '../../utils/permissions';

export default function BasicInfoCard({ project, calculateProgress }) {
  const progress = calculateProgress();

  return (
    <article className="bg-white rounded-lg shadow p-4 sm:p-6">
      <header className="flex flex-col sm:flex-row gap-2 sm:gap-0 sm:items-center sm:justify-between mb-4">
        <h2 className="text-lg sm:text-xl font-semibold">Project Details</h2>
        <mark className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs sm:text-sm max-w-fit ${
          project.status === 'Complete' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
        }`}>
          {project.status}
        </mark>
      </header>

      <section className="space-y-4">
        {/* Progress Bar */}
        <section>
          <header className="flex justify-between items-center mb-2">
            <strong className="text-sm font-medium text-gray-700">Project Progress</strong>
            <strong className="text-sm font-medium text-gray-700">{progress}%</strong>
          </header>
          <section className="w-full bg-gray-200 rounded-full h-2.5">
            <section 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
              style={{ width: `${progress}%` }}
            />
          </section>
        </section>

        {/* Project Description */}
        <section>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
          <p className="text-gray-600 text-sm">{project.description || 'No description provided.'}</p>
        </section>

        {/* Project Duration */}
        {project.duration && (
          <section>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Duration</h3>
            <p className="text-gray-600 text-sm">{project.duration}</p>
          </section>
        )}

        {/* Project Owner */}
        {project.researcherName && (
          <section>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Project Owner</h3>
            <p className="text-gray-600 text-sm">{project.researcherName}</p>
          </section>
        )}
      </section>
    </article>
  );
}