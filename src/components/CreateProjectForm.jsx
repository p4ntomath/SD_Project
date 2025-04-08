import { useState } from 'react';

export default function CreateProjectForm({ onCreate, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    researchField: '',
    startDate: '',
    endDate: '',
    goals: '',
    contact: ''
  });

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

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    } else if (formData.startDate && new Date(formData.endDate) < new Date(formData.startDate)) {
      newErrors.endDate = 'End date cannot be before start date';
    }

    if (!formData.goals.trim()) {
      newErrors.goals = 'Goals are required';
    } else if (formData.goals.split(',').length < 2) {
      newErrors.goals = 'Please enter at least 2 goals separated by commas';
    }

    if (!formData.contact.trim()) {
      newErrors.contact = 'Contact information is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact) && 
               !/^(\+\d{1,3}[- ]?)?\d{10}$/.test(formData.contact)) {
      newErrors.contact = 'Please enter a valid email or phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const projectData = {
        ...formData,
        goals: formData.goals.split(',').map(goal => goal.trim()),
        createdAt: new Date()
      };
      onCreate(projectData);
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
      
      <div className="space-y-4">
        {/* Title Field */}
        <div>
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
        </div>

        {/* Description Field */}
        <div>
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
        </div>

        {/* Research Field (now text input) */}
        <div>
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
        </div>

        {/* Date Range Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Start Date*</label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className={`w-full p-2 border rounded-md ${
                errors.startDate ? 'border-red-500' : 'border-gray-300'
              }`}
              min={new Date().toISOString().split('T')[0]}
            />
            {errors.startDate && (
              <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date*</label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              className={`w-full p-2 border rounded-md ${
                errors.endDate ? 'border-red-500' : 'border-gray-300'
              }`}
              min={formData.startDate || new Date().toISOString().split('T')[0]}
            />
            {errors.endDate && (
              <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
            )}
          </div>
        </div>

        {/* Goals Field */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Goals* <span className="text-gray-500 text-xs">(comma separated)</span>
          </label>
          <textarea
            name="goals"
            value={formData.goals}
            onChange={handleChange}
            className={`w-full p-2 border rounded-md ${
              errors.goals ? 'border-red-500' : 'border-gray-300'
            }`}
            rows={2}
            placeholder="Goal 1, Goal 2, Goal 3"
          />
          {errors.goals && (
            <p className="mt-1 text-sm text-red-600">{errors.goals}</p>
          )}
        </div>

        {/* Contact Field */}
        <div>
          <label className="block text-sm font-medium mb-1">Contact Info*</label>
          <input
            type="text"
            name="contact"
            value={formData.contact}
            onChange={handleChange}
            className={`w-full p-2 border rounded-md ${
              errors.contact ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Email or phone number"
          />
          {errors.contact && (
            <p className="mt-1 text-sm text-red-600">{errors.contact}</p>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border rounded-md hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Create Project
          </button>
        </div>
      </div>
    </form>
  );
}