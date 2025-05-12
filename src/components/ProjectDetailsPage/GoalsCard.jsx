import React from 'react';

export default function GoalsCard({ project, calculateProgress, toggleGoalStatus }) {
  return (
    <section className="bg-white rounded-lg shadow p-4 sm:p-6">
      <header className="flex justify-between items-center mb-4">
        <h2 className="text-lg sm:text-xl font-semibold">Project Goals</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Progress</span>
          <span className="font-medium">{calculateProgress()}%</span>
        </div>
      </header>
      
      <ul className="space-y-3">
        {project.goals?.map((goal, index) => (
          <li
            key={index}
            onClick={() => toggleGoalStatus(index)}
            className="flex items-center justify-between p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
          >
            <div className="flex items-center gap-3 flex-1">
              <input
                type="checkbox"
                checked={goal.completed}
                className="h-4 w-4 text-blue-600 rounded"
                onChange={() => {}}
              />
              <span className={`${goal.completed ? 'line-through text-gray-400' : 'text-gray-700'} text-sm sm:text-base break-words flex-1`}>
                {goal.text}
              </span>
            </div>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ml-2 ${
              goal.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {goal.completed ? 'Completed' : 'In Progress'}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}