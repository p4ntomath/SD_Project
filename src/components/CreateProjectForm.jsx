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
    availableFunds: 0,
    usedFunds: 0,
    status: 'In Progress'
  });

  // Pre-fill form data if projectToUpdate is provided
  useEffect(() => {
    if (isUpdateMode && projectToUpdate) {
      setFormData({
        title: projectToUpdate.title || '',
        description: projectToUpdate.description || '',
        researchField: projectToUpdate.researchField || '',
        duration: projectToUpdate.duration || '',
        goals: projectToUpdate.goals || [],
        goalInput: '',
        availableFunds: projectToUpdate.availableFunds || 0,
        usedFunds: projectToUpdate.usedFunds || 0,
        status: projectToUpdate.status || 'In Progress'
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

  const addGoal = () => {
    if (formData.goalInput.trim()) {
      setFormData({
        ...formData,
        goals: [...formData.goals, { text: formData.goalInput.trim(), completed: false }],
        goalInput: ''
      });
    }
  };

  const deleteGoal = (goalToDelete) => {
    setFormData({
      ...formData,
      goals: formData.goals.filter(goal => goal.text !== goalToDelete.text)
    });
  };

  const handleGoalKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addGoal();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const projectData = {
        ...formData,
        goals: formData.goals.map(goal => 
          typeof goal === 'string' ? { text: goal, completed: false } : goal
        ),
        availableFunds: projectToUpdate?.availableFunds || formData.availableFunds,
        usedFunds: projectToUpdate?.usedFunds || formData.usedFunds,
        status: projectToUpdate?.status || formData.status,
        createdAt: projectToUpdate?.createdAt || new Date(),
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
      <header>
        <h1 className="text-xl font-semibold mb-4">{isUpdateMode ? 'Update Project' : 'New Project Details'}</h1>
      </header>

      <fieldset className="space-y-2">
        <legend className="sr-only">Project Information</legend>

        {/* Title Field */}
        <div role="group" aria-labelledby="title-label">
          <label id="title-label" className="block text-sm font-medium mb-1">Title*</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={`w-full p-2 border rounded-md ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            }`}
            aria-required="true"
            aria-invalid={!!errors.title}
            aria-describedby={errors.title ? "title-error" : undefined}
          />
          {errors.title && (
            <p id="title-error" className="mt-1 text-sm text-red-600" role="alert">{errors.title}</p>
          )}
        </div>

        {/* Description Field */}
        <div role="group" aria-labelledby="description-label">
          <label id="description-label" className="block text-sm font-medium mb-1">Description*</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className={`w-full p-2 border rounded-md ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            }`}
            rows={4}
            aria-required="true"
            aria-invalid={!!errors.description}
            aria-describedby={errors.description ? "description-error" : undefined}
          />
          {errors.description && (
            <p id="description-error" className="mt-1 text-sm text-red-600" role="alert">{errors.description}</p>
          )}
        </div>

        {/* Research Field */}
        <div role="group" aria-labelledby="research-field-label">
          <label id="research-field-label" className="block text-sm font-medium mb-1">Research Field*</label>
          <input
            type="text"
            name="researchField"
            value={formData.researchField}
            onChange={handleChange}
            className={`w-full p-2 border rounded-md ${
              errors.researchField ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your research field (e.g., Computer Science, Biology)"
            aria-required="true"
            aria-invalid={!!errors.researchField}
            aria-describedby={errors.researchField ? "research-field-error" : undefined}
          />
          {errors.researchField && (
            <p id="research-field-error" className="mt-1 text-sm text-red-600" role="alert">{errors.researchField}</p>
          )}
        </div>

        {/* Duration Field */}
        <div role="group" aria-labelledby="duration-label">
          <label id="duration-label" className="block text-sm font-medium mb-1">Duration*</label>
          <input
            type="text"
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            className={`w-full p-2 border rounded-md ${
              errors.duration ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., 3 months, 6 weeks, 1 year"
            aria-required="true"
            aria-invalid={!!errors.duration}
            aria-describedby={errors.duration ? "duration-error" : undefined}
          />
          {errors.duration && (
            <p id="duration-error" className="mt-1 text-sm text-red-600" role="alert">{errors.duration}</p>
          )}
        </div>

        {/* Goals Field */}
        <div role="group" aria-labelledby="goals-label" className="mb-4">
          <label id="goals-label" className="block text-sm font-medium mb-1">
            Goals* <span className="text-gray-500 text-xs">(Press Enter or comma to add)</span>
          </label>

          {/* Display chips for added goals */}
          <ul className="flex flex-wrap mb-2" role="list" aria-label="Added goals">
            {formData.goals.map((goal, index) => (
              <li key={index}>
                <ChipComponent
                  goal={goal}
                  onDelete={() => deleteGoal(goal)}
                />
              </li>
            ))}
          </ul>

          {/* Input for new goals */}
          <div className="flex">
            <input
              type="text"
              value={formData.goalInput}
              onChange={(e) => setFormData({ ...formData, goalInput: e.target.value })}
              onKeyDown={handleGoalKeyDown}
              placeholder="Enter a goal and press Enter"
              className={`flex-1 p-2 border rounded-l-md ${
                errors.goals ? 'border-red-500' : 'border-gray-300'
              }`}
              aria-invalid={!!errors.goals}
              aria-describedby={errors.goals ? "goals-error" : undefined}
            />
            <button
              onClick={addGoal}
              type="button"
              className="bg-blue-600 text-white px-4 rounded-r-md hover:bg-blue-700 transition-colors"
              aria-label="Add goal"
            >
              Add
            </button>
          </div>

          {errors.goals && (
            <p id="goals-error" className="mt-1 text-sm text-red-600" role="alert">{errors.goals}</p>
          )}
        </div>

        <footer className="flex justify-end space-x-3 pt-4">
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
            aria-busy={loading}
          >
            {loading ? (
              <ClipLoader color="#ffffff" loading={loading} size={20} />
            ) : isUpdateMode ? 'Update Project' : 'Create Project'}
          </button>
        </footer>
      </fieldset>
    </form>
  );
}