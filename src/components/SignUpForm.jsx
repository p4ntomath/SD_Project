import { useState,useContext } from "react";
import { useNavigate } from "react-router-dom";
import FormInput from "./FormInput";
import googleLogo from "../assets/googleLogo.png";
import { signUp, googleSignIn,getUserRole } from "../backend/firebase/authFirebase";
import { ClipLoader } from "react-spinners"; // Import the spinner
import AuthContext from "../context/AuthContext";

const SignUpForm = () => {
  const paths = {
    success: "/home",
    successGoogle: "/complete-profile",
  };
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
  });
  

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { setRole,setLoading} = useContext(AuthContext);

  const roles = [
    { value: "", label: "Select your role", disabled: true },
    { value: "researcher", label: "Researcher" },
    { value: "reviewer", label: "Reviewer" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setErrors((prev) => ({ ...prev, [name]: "" })); // Clear error for the field being changed
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else {
      if (
        formData.password.length < 8 ||
        !/[A-Za-z]/.test(formData.password) ||
        !/[0-9]/.test(formData.password) ||
        !/[^A-Za-z0-9]/.test(formData.password)
      ) {
        newErrors.password =
          "Password must be at least 8 characters, contain at least one letter, number, and special character (@,#,!)";
      }
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords must match";
    }

    if (!formData.role) newErrors.role = "Please select a role";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      await signUp(formData.name, formData.email, formData.password, formData.role);
      navigate(paths.sucess);
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        setErrors({ email: "Email already exists,try logging in or use a different email" });
      } else {
        setErrors({ form: error.message });
      }
    }
    setIsLoading(false);
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setLoading(true);
    try {
      const { isNewUser, user } = await googleSignIn();
      const role = await getUserRole(user.uid);
      setRole(role);
      if (isNewUser) {
        navigate(paths.succesGoogle, { state: { userId: user.uid, email: user.email, name: user.displayName } });
      } else {
        navigate(paths.success);
      }
    } catch (error) {
      if (error.code === "auth/popup-closed-by-user") {
        setErrors({ form: "Google sign-in was closed before completion." });
      }
      else if (error.code === "auth/popup-blocked") {
        setErrors({ form: "Google sign-in popup was blocked." });
      }
      else if (error.code === "auth/invalid-credential") {
        setErrors({ form: "Invalid credentials. Please try again." });
      }
      else{
      setErrors({ form: 'Google sign-up failed. Please try again.' });}
    }
    setLoading(false);
    setIsLoading(false);
  };

  return (
    <div className="w-full max-w-md">
      <h2 className="text-5xl font-bold text-gray-800 mb-2">Create Account</h2>
      <p className="text-gray-600 mb-6 text-sm">
        Already have an account?{" "}
        <a href="/login" className="text-sm text-green-600 hover:underline">
          Log in
        </a>
      </p>

      {errors.form && <p className="text-red-600">{errors.form}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput label="Full Name" name="name" value={formData.name} onChange={handleChange} error={errors.name} />
        <FormInput
          label="Email Address"
          name="email"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
        />

        {/* Role Dropdown */}
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
              errors.role ? "border-red-500" : "border-gray-300"
            }`}
          >
            {roles.map((role) => (
              <option key={role.value} value={role.value} disabled={role.disabled} className={role.disabled ? "text-gray-400" : ""}>
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
        {!errors.password && (
          <p className="mt-1 text-xs text-gray-500">
            Make it strong! Include:
            <br />• At least 8 characters
            <br />• Both letters and numbers
            <br />• Symbols like (@,!,#)
          </p>
        )}
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
          disabled={isLoading}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition"
        >
          {isLoading ? (
            <ClipLoader color="#ffffff" loading={isLoading} size={20} />
          ) : (
            "Sign Up"
          )}
        </button>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">OR</span>
          </div>
        </div>

        {/* Google Sign-In */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-md py-2 px-4 text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
        >
          <img src={googleLogo} alt="Google" className="w-5 h-5" />
          <span>Continue with Google</span>
        </button>
      </form>
    </div>
  );
};

export default SignUpForm;
