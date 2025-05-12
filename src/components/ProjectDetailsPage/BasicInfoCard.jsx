import React from 'react';
import { formatFirebaseDate } from '../../utils/dateUtils';

export default function BasicInfoCard({ project, calculateProgress }) {
  return (
    <article className="bg-white rounded-lg shadow p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-semibold mb-4">Project Overview</h2>
      <section className="space-y-4">
        {/* Progress Bar */}
        <section className="mb-4 sm:mb-6">
          <header className="flex justify-between items-center mb-2">
            <p className="text-sm text-gray-500">Overall Progress</p>
            <p className="text-sm text-gray-600">{calculateProgress()}%</p>
          </header>
          <section className="w-full bg-gray-200 rounded-full h-2">
            <section 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${calculateProgress()}%` }}
            />
          </section>
        </section>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-gray-500">Research Field</dt>
            <dd className="font-medium">{project.researchField}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Duration</dt>
            <dd className="font-medium">{project.duration}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Created</dt>
            <dd className="font-medium">{formatFirebaseDate(project.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Deadline</dt>
            <dd className="font-medium">{formatFirebaseDate(project.deadline)}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Status</dt>
            <dd>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {project.status || 'In Progress'}
              </span>
            </dd>
          </div>
        </dl>

        <section>
          <h3 className="text-sm text-gray-500 mb-1">Description</h3>
          <p className="text-gray-700">{project.description}</p>
        </section>
      </section>
    </article>
  );
}