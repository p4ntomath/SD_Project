import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Select from 'react-select';
import { getAllTags, getFaculties, getTagsByFaculty } from '../utils/tagSuggestions';
import { fetchUniversities } from '../utils/universityOptions';
import { completeProfile } from '../backend/firebase/authFirebase';
import { ClipLoader } from 'react-spinners';

const RoleSelectionForm = ({ onSubmit }) => {
  const location = useLocation();
  const { state } = location;
  const isEmailSignup = state?.isEmailSignup;
  const isGoogleSignup = state?.isGoogleSignup;

  const [formData, setFormData] = useState({
    fullName: state?.name || '',
    role: '',
    institution: '',
    department: '',
    fieldOfResearch: '',
    bio: '',
    tags: []  // Will now store only tag labels as strings
  });

  const [errors, setErrors] = useState({});
  const [selectedFaculty, setSelectedFaculty] = useState('all');
  const [selectedTags, setSelectedTags] = useState([]);
  const [filteredTags, setFilteredTags] = useState(getAllTags());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [universities, setUniversities] = useState([]);
  const [institutionLoading, setInstitutionLoading] = useState(true);
  const faculties = ['all', ...getFaculties()];

  const roles = [
    { value: '', label: 'Select your role', disabled: true },
    { value: 'researcher', label: 'Researcher' },
    { value: 'reviewer', label: 'Reviewer' }
  ];

  const handleFacultyChange = (e) => {
    const faculty = e.target.value;
    setSelectedFaculty(faculty);
    // Only update the filtered/available tags, not the selected ones
    setFilteredTags(faculty === 'all' ? getAllTags() : getTagsByFaculty(faculty));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleTagsChange = (selectedOptions) => {
    // Limit to first 3 selections if more than 3 are selected
    const limitedOptions = selectedOptions.slice(0, 3);
    setSelectedTags(limitedOptions); // Keep full objects for Select component
    setFormData(prev => ({
      ...prev,
      tags: limitedOptions.map(tag => tag.label) // Store only the labels
    }));
    if (errors.tags) {
      setErrors(prev => ({ ...prev, tags: '' }));
    }
  };

  const handleInstitutionChange = (selectedOption) => {
    setErrors(prev => ({ ...prev, institution: '' }));
    setFormData(prev => ({
      ...prev,
      institution: selectedOption ? selectedOption.value : ''
    }));
  };

  // Get all available options by combining filtered tags and selected tags
  const getAvailableOptions = () => {
    const selectedOptions = selectedTags;
    const filteredOptions = filteredTags.filter(tag => 
      !selectedOptions.some(selected => selected.label === tag.label)
    );
    return [...selectedOptions, ...filteredOptions];
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Only validate fullName if it wasn't provided during signup
    if (!formData.fullName?.trim() && !isEmailSignup) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.role) {
      newErrors.role = 'Please select a role';
    }

    if (!formData.institution?.trim()) {
      newErrors.institution = 'Institution is required';
    }

    if (!formData.department?.trim()) {
      newErrors.department = 'Department is required';
    }

    if (!formData.fieldOfResearch?.trim()) {
      newErrors.fieldOfResearch = 'Field of research is required';
    }

    if (formData.tags.length < 3) {
      newErrors.tags = 'Please select at least 3 research tags';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    const loadUniversities = async () => {
      setInstitutionLoading(true);
      const uniOptions = await fetchUniversities();
      setUniversities(uniOptions);
      setInstitutionLoading(false);
    };

    loadUniversities();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      setIsSubmitting(true);
      try {
        // Complete user profile in Firebase
        await onSubmit(formData);

      } catch (error) {
        console.error('Error completing profile:', error);
        setErrors(prev => ({
          ...prev,
          submit: error.message
        }));
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <section className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6">Complete Your Profile</h2>
  
      <form onSubmit={handleSubmit} className="space-y-4" data-testid="role-selection-form">
        <fieldset>
          <legend className="sr-only">Profile Information</legend>
  
          {/* Only show full name field if not provided during email signup */}
          {!isEmailSignup && (
            <article>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                data-testid="fullname-input"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="e.g., John Smith"
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.fullName ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.fullName && <p data-testid="fullname-error" className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
            </article>
          )}

          <article className="mt-4">
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              id="role"
              name="role"
              data-testid="role-select"
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
                  data-testid={`role-option-${role.value}`}
                >
                  {role.label}
                </option>
              ))}
            </select>
            {errors.role && <p data-testid="role-error" className="mt-1 text-sm text-red-600">{errors.role}</p>}
          </article>

          <article className="mt-4">
            <label htmlFor="select-institution" className="block text-sm font-medium text-gray-700 mb-1">
              Institution
            </label>
            <Select
              inputId="select-institution"
              name="institution"
              data-testid="institution-select"
              value={universities?.length ? universities.find(uni => uni.value === formData.institution) : null}
              onChange={handleInstitutionChange}
              options={universities}
              className={errors.institution ? 'react-select-error' : ''}
              classNamePrefix="select"
              placeholder={institutionLoading ? 'Loading universities...' : 'Select your institution...'}
              isLoading={institutionLoading}
              noOptionsMessage={() => "No matching institutions found"}
              styles={{
                control: (base, state) => ({
                  ...base,
                  borderColor: errors.institution ? '#ef4444' : state.isFocused ? '#3b82f6' : '#d1d5db',
                  boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
                  '&:hover': {
                    borderColor: state.isFocused ? '#3b82f6' : '#d1d5db'
                  }
                })
              }}
            />
            {errors.institution && <p data-testid="institution-error" className="mt-1 text-sm text-red-600">{errors.institution}</p>}
          </article>

          <article className="mt-4">
            <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <input
              type="text"
              id="department"
              name="department"
              data-testid="department-input"
              value={formData.department}
              onChange={handleChange}
              placeholder="e.g., Computer Science, Engineering"
              className={`w-full px-3 py-2 border rounded-md ${
                errors.department ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.department && <p data-testid="department-error" className="mt-1 text-sm text-red-600">{errors.department}</p>}
          </article>

          <article className="mt-4">
            <label htmlFor="fieldOfResearch" className="block text-sm font-medium text-gray-700 mb-1">
              Field of Research/Expertise
            </label>
            <input
              type="text"
              id="fieldOfResearch"
              name="fieldOfResearch"
              data-testid="field-of-research-input"
              value={formData.fieldOfResearch}
              onChange={handleChange}
              placeholder="e.g., Machine Learning, Data Science, Software Engineering"
              className={`w-full px-3 py-2 border rounded-md ${
                errors.fieldOfResearch ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.fieldOfResearch && <p data-testid="field-of-research-error" className="mt-1 text-sm text-red-600">{errors.fieldOfResearch}</p>}
          </article>

          <article className="mt-4">
            <label htmlFor="select-tags" className="block text-sm font-medium text-gray-700 mb-1">
              Research Tags (Select 3)
            </label>
            <div className="mb-2">
              <label htmlFor="faculty" className="block text-xs text-gray-600 mb-1">
                Filter by Faculty
              </label>
              <select
                id="faculty"
                value={selectedFaculty}
                onChange={handleFacultyChange}
                data-testid="faculty-select"
                className="w-full px-3 py-2 border rounded-md border-gray-300 text-sm"
              >
                {faculties.map(faculty => (
                  <option key={faculty} value={faculty} data-testid={`faculty-option-${faculty}`}>
                    {faculty === 'all' ? 'All Faculties' : faculty}
                  </option>
                ))}
              </select>
            </div>
            <Select
              inputId="select-tags"
              isMulti
              name="tags"
              data-testid="tags-select"
              options={getAvailableOptions()}
              className={`${errors.tags ? 'react-select-error' : ''}`}
              classNamePrefix="select"
              value={selectedTags}
              onChange={handleTagsChange}
              placeholder="Select exactly 3 research tags..."
              noOptionsMessage={() => "No matching tags found"}
              isOptionDisabled={() => selectedTags.length >= 3}
              styles={{
                control: (base, state) => ({
                  ...base,
                  borderColor: errors.tags ? '#ef4444' : state.isFocused ? '#3b82f6' : '#d1d5db',
                  boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
                  '&:hover': {
                    borderColor: state.isFocused ? '#3b82f6' : '#d1d5db'
                  }
                }),
                menu: (base) => ({
                  ...base,
                  zIndex: 9999
                })
              }}
            />
            <p className="mt-1 text-xs text-gray-500" data-testid="tags-count">
              {selectedTags.length}/3 tags selected
            </p>
            {errors.tags && <p data-testid="tags-error" className="mt-1 text-sm text-red-600">{errors.tags}</p>}
          </article>

          <article className="mt-4">
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
              Bio (Optional)
            </label>
            <textarea
              id="bio"
              name="bio"
              data-testid="bio-input"
              value={formData.bio}
              onChange={handleChange}
              rows={4}
              placeholder="e.g., I am a researcher with 5 years of experience in machine learning and artificial intelligence. My current research focuses on developing novel deep learning architectures..."
              className="w-full px-3 py-2 border rounded-md border-gray-300 resize-none"
            />
          </article>
        </fieldset>

        <button
          type="submit"
          disabled={isSubmitting}
          data-testid="submit-button"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mt-6"
        >
          {isSubmitting ? (
            <>
              <ClipLoader color="#ffffff" size={20} className="mr-2" />
              <span>Completing Profile...</span>
            </>
          ) : (
            'Complete Profile'
          )}
        </button>
      </form>
    </section>
  );
};

export default RoleSelectionForm;