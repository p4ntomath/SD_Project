import { useState } from 'react';
import FormInput from './FormInput';
import { FaGoogle, FaFacebook } from 'react-icons/fa';


const SignUpForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '' // No default, will force selection
  });

  const [errors, setErrors] = useState({});

  const roles = [
    { value: '', label: 'Select your role', disabled: true },
    { value: 'researcher', label: 'Researcher' },
    { value: 'admin', label: 'Administrator' },
    { value: 'reviewer', label: 'Reviewer' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required'; // check if the name has been filled
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';                            // check if the email has been filled
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Email is invalid';                             // check if the filled email is valid
    }
    if (!formData.password) newErrors.password = 'Password is required';  // check if the email has been filled
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords must match';
    }
    if (!formData.role) newErrors.role = 'Please select a role';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      console.log('Form data with role:', formData);
      alert(`Account created as ${formData.role}! (Auth is not yet implemented)`);
    }
  };

  const handleGoogleAuth = () => {
    console.log('Google authentication initiated');
    // Add your Google auth logic here
  };

  const handleFacebookAuth = () => {
    console.log('Facebook authentication initiated');
    // Add your Facebook auth logic here
  };

  return (
    <div className="w-full max-w-md">
      <h2 className="text-5xl font-bold text-gray-800 mb-2">Create Account</h2>
      <p className="text-gray-600 mb-6 text-sm">Do you have an Account already? <a href="/login" className=" text-sm text-green-600 hover:underlin">
          Log in
        </a></p>


    
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          label="Full Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
        />
        
        <FormInput
          label="Email Address"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
        />
        
        {/* Role Dropdown Field */}
        <div className="mb-4">
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
            Role
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
        </div>
        
        <FormInput
          label="Password"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
        />
        
        <FormInput
          label="Confirm Password"
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
        />

                
        <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition"
            >
            Sign Up
            </button>  

       {/* Divider */}
        <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with </span>
            </div>
        </div>

        <div className="flex flex-col space-y-3 mb-6">
                <button
                onClick={handleGoogleAuth}
                type="button"
                className="w-full flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                <FaGoogle className="mr-3 text-red-500" />
                Continue with Google
                </button>
                
                <button
                onClick={handleFacebookAuth}
                type="button"
                className="w-full flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                <FaFacebook className="mr-3 text-blue-600" />
                Continue with Facebook
                </button>
            </div>
        
      </form>
      
    </div>
  );
};

export default SignUpForm;