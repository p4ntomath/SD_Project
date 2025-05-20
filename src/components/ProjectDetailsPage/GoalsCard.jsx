import { notify } from '../../backend/firebase/notificationsUtil';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus } from 'react-icons/fa';
import { checkPermission, isProjectOwner } from '../../utils/permissions';


export default function GoalsCard({ 
  project, 
  calculateProgress,
  setProject,
  projectId,
  setModalOpen,
  setError,
  setStatusMessage,
  updateProject 
}) {
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [newGoal, setNewGoal] = useState("");
  const [addingGoal, setAddingGoal] = useState(false);

  const handleGoalStatusChange = async (index) => {
    try {
      if (!checkPermission(project, 'canCompleteGoals')) {
        throw new Error('You do not have permission to update goals');
      }

      const updatedGoals = project.goals.map((goal, i) => 
        i === index ? { ...goal, completed: !goal.completed } : goal
      );

      const isComplete = updatedGoals.every(goal => goal.completed);

      await updateProject(projectId, {
        goals: updatedGoals,
        status: isComplete ? 'Complete' : 'In Progress'
      });

      setProject({
        ...project,
        goals: updatedGoals,
        status: isComplete ? 'Complete' : 'In Progress'
      });

      // Notify if a single goal is completed
      if (!project.goals[index].completed && updatedGoals[index].completed) {
        await notify({
          type: 'Goal Completed',
          targetUserId: project.userId,
          message: `The goal "${updatedGoals[index].text}" in your project "${project.title || 'Untitled Project'}" has been marked as completed.`,
          projectId: projectId,
          projectTitle: project.title,
          goalText: updatedGoals[index].text
        });
      }

      // Notify if project is now complete
      if (isComplete) {
        await notify({
          type: 'Project Completed',
          targetUserId: project.userId,
          message: `Congratulations! Your project "${project.title || 'Untitled Project'}" has been marked as complete.`,
          projectId: projectId,
          projectTitle: project.title
        });
      }

      setModalOpen(true);
      setError(false);
      setStatusMessage('Goal status updated successfully');
    } catch (err) {
      setError(true);
      setModalOpen(true);
      setStatusMessage(err.message);
    }
  };

  const handleAddGoal = async (e) => {
    e.preventDefault();
    try {
      if (!checkPermission(project, 'canManageGoals')) {
        throw new Error('You do not have permission to add goals');
      }

      setAddingGoal(true);
      const newGoalObj = { text: newGoal.trim(), completed: false };
      const updatedGoals = [...(project.goals || []), newGoalObj];

      await notify({
        type: 'New Goal Added', 
        targetUserId: project.userId,
        message: `A new goal "${newGoalObj.text}" has been added to your project "${project.title}".`,
        projectId: projectId,
        projectTitle: project.title,
        goalText: newGoalObj.text
      });

      await updateProject(projectId, { goals: updatedGoals });
      setProject({
        ...project,
        goals: updatedGoals
      });

      setShowAddGoalModal(false);
      setNewGoal("");
      setModalOpen(true);
      setError(false);
      setStatusMessage('Goal added successfully');

      
      
    } catch (err) {
      setError(true);
      setModalOpen(true);
      setStatusMessage(err.message);
    } finally {
      setAddingGoal(false);
    }
  };

  const handleDeleteGoal = async (index) => {
    try {
      if (!checkPermission(project, 'canManageGoals')) {
        throw new Error('You do not have permission to delete goals');
      }

      const deletedGoal = project.goals[index];
      const updatedGoals = project.goals.filter((_, i) => i !== index);

      // Notify user about deleted goal
      await notify({
        type: 'Goal Deleted',
        targetUserId: project.userId,
        message: `The goal "${deletedGoal?.text || 'Unknown'}" was deleted from your project "${project.title || 'Untitled Project'}".`,
        projectId: projectId,
        projectTitle: project.title,
        goalText: deletedGoal?.text
      });

      await updateProject(projectId, { goals: updatedGoals });
      setProject({
        ...project,
        goals: updatedGoals
      });

      setModalOpen(true);
      setError(false);
      setStatusMessage('Goal deleted successfully');
    } catch (err) {
      setError(true);
      setModalOpen(true);
      setStatusMessage(err.message);
    }
  };

  return (
    <section className="bg-white rounded-lg shadow p-4 sm:p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg sm:text-xl font-semibold">Project Goals</h2>
        {isProjectOwner(project) && (
          <button
            onClick={() => setShowAddGoalModal(true)}
            className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
            aria-label="Add goal"
          >
            <FaPlus className="h-5 w-5" />
            
          </button>
        )}
      </div>
      
      {(!project.goals || project.goals.length === 0) ? (
        <p className="text-gray-500 text-sm">No goals defined yet.</p>
      ) : (
        <div className="max-h-[300px] overflow-y-auto pr-2">
          <div className="space-y-3">
            {project.goals.map((goal, index) => (
              <div key={index} className="flex items-start gap-3 p-2 bg-gray-50 rounded-lg group">
                <input
                  type="checkbox"
                  checked={goal.completed}
                  onChange={() => checkPermission(project, 'canCompleteGoals') && handleGoalStatusChange(index)}
                  disabled={!checkPermission(project, 'canCompleteGoals')}
                  className="mt-1"
                />
                <span className={goal.completed ? 'line-through text-gray-500 flex-1' : 'flex-1'}>{goal.text}</span>
                {isProjectOwner(project) && (
                  <button
                    onClick={() => handleDeleteGoal(index)}
                    className="text-red-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={`Delete goal: ${goal.text}`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Goal Modal */}
      <AnimatePresence>
        {showAddGoalModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
              <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowAddGoalModal(false)} />
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
              >
                <h2 className="text-xl font-semibold mb-4">Add New Goal</h2>
                <form onSubmit={handleAddGoal}>
                  <input
                    type="text"
                    value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter goal description"
                    required
                  />
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowAddGoalModal(false)}
                      className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50/80 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={addingGoal}
                      className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {addingGoal ? 'Adding...' : 'Add Goal'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}