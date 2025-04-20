import { useState, useEffect } from 'react';
import ChipComponent from './ResearcherComponents/ChipComponent';
import { ClipLoader } from "react-spinners";

export default function CreateProjectForm({ loading, onUpdate, onCreate, onCancel, projectToUpdate, isUpdateMode }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    researchField: '',
    duration: '',
    goals: [],
    goalInput: '',
    availableFunds:100,
    usedFunds: 50,
    status:'In Progress'

  });

  // Pre-fill form data if preFormData is provided
  useEffect(() => {
    if (isUpdateMode && projectToUpdate) {
      setFormData({
        title: projectToUpdate.title || '',
        description: projectToUpdate.description || '',
        researchField: projectToUpdate.researchField || '',
        duration: projectToUpdate.duration || '',
        goals: projectToUpdate.goals || [],
        goalInput: ''
      });
    }
  }, [isUpdateMode, projectToUpdate]);

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.trim().length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
    }

    if (!formData.researchField.trim()) {
      newErrors.researchField = 'Research field is required';
    } else if (formData.researchField.trim().length < 3) {
      newErrors.researchField = 'Research field must be at least 3 characters';
    }

    if (!formData.duration) {
      newErrors.duration = 'Duration is required';
    }

    if (formData.goals.length < 2) {
      newErrors.goals = 'Please enter at least 2 goals';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addGoal = (e) => {
    e.preventDefault();
    if (formData.goalInput.trim() && !formData.goals.includes(formData.goalInput.trim())) {
      setFormData({
        ...formData,
        goals: [...formData.goals, formData.goalInput.trim()],
        goalInput: ''
      });
    }
  };

  const deleteGoal = (goalToDelete) => {
    setFormData({
      ...formData,
      goals: formData.goals.filter(goal => goal !== goalToDelete)
    });
  };

  const handleGoalKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      addGoal(e);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const projectData = {
        ...formData,
        createdAt: projectToUpdate?.createdAt || new Date(),
        id: projectToUpdate?.id,
      };
  
      if (isUpdateMode) {
        onUpdate(projectData);
      } else {
        onCreate(projectData);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">New Project Details</h2>

      <section className="space-y-2">
        {/* Title Field */}
        <section>
          <label className="block text-sm font-medium mb-1">Title*</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={`w-full p-2 border rounded-md ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title}</p>
          )}
        </section>

        {/* Description Field */}
        <section>
          <label className="block text-sm font-medium mb-1">Description*</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className={`w-full p-2 border rounded-md ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            }`}
            rows={4}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
        </section>

        {/* Research Field */}
        <section>
          <label className="block text-sm font-medium mb-1">Research Field*</label>
          <input
            type="text"
            name="researchField"
            value={formData.researchField}
            onChange={handleChange}
            className={`w-full p-2 border rounded-md ${
              errors.researchField ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your research field (e.g., Computer Science, Biology)"
          />
          {errors.researchField && (
            <p className="mt-1 text-sm text-red-600">{errors.researchField}</p>
          )}
        </section>

        {/* Duration Field */}
        <section>
          <label className="block text-sm font-medium mb-1">Duration*</label>
          <input
            type="text"
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            className={`w-full p-2 border rounded-md ${
              errors.duration ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., 3 months, 6 weeks, 1 year"
          />
          {errors.duration && (
            <p className="mt-1 text-sm text-red-600">{errors.duration}</p>
          )}
        </section>

        {/* Goals Field */}
        <section className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Goals* <span className="text-gray-500 text-xs">(Press Enter or comma to add)</span>
          </label>

          {/* Display chips for added goals */}
          <section className="flex flex-wrap mb-2">
            {formData.goals.map((goal, index) => (
              <ChipComponent
                key={index}
                goal={goal}
                onDelete={() => deleteGoal(goal)}
              />
            ))}
          </section>

          {/* Input for new goals */}
          <section className="flex">
            <input
              type="text"
              value={formData.goalInput}
              onChange={(e) => setFormData({ ...formData, goalInput: e.target.value })}
              onKeyDown={handleGoalKeyDown}
              placeholder="Enter a goal and press Enter"
              className={`flex-1 p-2 border rounded-l-md ${
                errors.goals ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <button
              onClick={addGoal}
              type="button"
              className="bg-blue-600 text-white px-4 rounded-r-md hover:bg-blue-700 transition-colors"
            >
              Add
            </button>
          </section>

          {errors.goals && (
            <p className="mt-1 text-sm text-red-600">{errors.goals}</p>
          )}
        </section>

        <section className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border rounded-md hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            {loading ? (
              <ClipLoader color="#ffffff" loading={loading} size={20} />
            ) : isUpdateMode ? 'Update Project' : 'Create Project'}
          </button>
        </section>
      </section>
    </form>
  );
}