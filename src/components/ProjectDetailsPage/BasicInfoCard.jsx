import React from 'react';
import { formatFirebaseDate } from '../../utils/dateUtils';
import { isProjectOwner } from '../../utils/permissions';

export default function BasicInfoCard({ project, calculateProgress }) {
  const progressPercentage = calculateProgress();
  
  return (
    <article className="bg-white rounded-lg shadow p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 sm:items-center sm:justify-between mb-4">
        <h2 className="text-lg sm:text-xl font-semibold">Project Details</h2>
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs sm:text-sm max-w-fit ${
          project.status === 'Complete' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
        }`}>
          {project.status}
        </span>
      </div>

      <div className="space-y-4">
        {/* Progress Bar */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Project Progress</span>
            <span className="text-sm font-medium text-gray-700">{progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Project Description */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
          <p className="text-gray-600 text-sm">{project.description || 'No description provided.'}</p>
        </div>

        {/* Project Duration */}
        {project.duration && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Duration</h3>
            <p className="text-gray-600 text-sm">{project.duration}</p>
          </div>
        )}

        {/* Project Owner */}
        {project.researcherName && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Project Owner</h3>
            <p className="text-gray-600 text-sm">{project.researcherName}</p>
          </div>
        )}
      </div>
    </article>
  );
}