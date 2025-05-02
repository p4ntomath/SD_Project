import { useState } from 'react';

const RoleSelectionForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    role: '',
    expertise: '',
    department: ''
  });

  const [errors, setErrors] = useState({});

  const roles = [
    { value: '', label: 'Select your role', disabled: true },
    { value: 'researcher', label: 'Researcher' },
    { value: 'reviewer', label: 'Reviewer' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.role) {
      newErrors.role = 'Please select a role';
    }

    if (formData.role === 'reviewer') {
      if (!formData.expertise?.trim()) {
        newErrors.expertise = 'Expertise is required for reviewers';
      }
      if (!formData.department?.trim()) {
        newErrors.department = 'Department is required for reviewers';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <section className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6">Complete Your Profile</h2>
  
      <form onSubmit={handleSubmit} className="space-y-4">
        <fieldset>
          <legend className="sr-only">Profile Information</legend>
  
          <article>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md ${
                errors.fullName ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
          </article>
  
          <article>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              Your Role
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md ${
                errors.role ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              {roles.map((role) => (
                <option
                  key={role.value}
                  value={role.value}
                  disabled={role.disabled}
                  className={role.disabled ? 'text-gray-400' : ''}
                >
                  {role.label}
                </option>
              ))}
            </select>
            {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role}</p>}
          </article>

          {formData.role === 'reviewer' && (
            <>
              <article>
                <label htmlFor="expertise" className="block text-sm font-medium text-gray-700 mb-1">
                  Area of Expertise
                </label>
                <input
                  type="text"
                  id="expertise"
                  name="expertise"
                  value={formData.expertise}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.expertise ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Computer Science, Data Science"
                />
                {errors.expertise && <p className="mt-1 text-sm text-red-600">{errors.expertise}</p>}
              </article>

              <article>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.department ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Computing, Engineering"
                />
                {errors.department && <p className="mt-1 text-sm text-red-600">{errors.department}</p>}
              </article>
            </>
          )}
        </fieldset>
  
        <button
          type="submit"
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition"
        >
          Continue
        </button>
      </form>
    </section>
  );
};

export default RoleSelectionForm;