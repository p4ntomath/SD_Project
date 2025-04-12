import { useState } from "react";

const southAfricanUniversities = [
  "University of the Witwatersrand",
  "University of Cape Town",
  "University of Pretoria",
  "University of Johannesburg",
  "University of KwaZulu-Natal",
  "Stellenbosch University",
  "University of the Free State",
  "Rhodes University",
  "Nelson Mandela University",
  "University of Limpopo",
  "University of Venda",
  "University of the Western Cape",
  "University of Zululand",
  "Walter Sisulu University",
  "Central University of Technology",
  "Durban University of Technology",
  "Mangosuthu University of Technology",
  "Tshwane University of Technology",
  "Vaal University of Technology",
  "Sefako Makgatho Health Sciences University",
];

const RoleSelectionForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    //Added here
    university: "",
    degreeType: "",
    studentNumber: "",
    degreeName: "",
  });

  const degreeTypes = [
    { value: "", label: "Select Degree Type", disabled: true },
    { value: "honours", label: "Honours" },
    { value: "masters", label: "Masters" },
    { value: "phd", label: "PhD" },
  ];

  const [errors, setErrors] = useState({});

  const roles = [
    { value: "", label: "Select your role", disabled: true },
    { value: "researcher", label: "Researcher" },
    { value: "reviewer", label: "Reviewer" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.role) {
      newErrors.role = "Please select a role";
    }

    if (!formData.university.trim())
      newErrors.university = "University is required";
    if (!formData.degreeType) newErrors.degreeType = "Select your degree type";
    if (!formData.studentNumber.trim())
      newErrors.studentNumber = "Student number is required";
    if (!formData.degreeName.trim())
      newErrors.degreeName = "Degree name is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      console.log(formData);
      onSubmit(formData);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6">
        Complete Your Profile
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Existing Full Name */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Full Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md ${
              errors.name ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        {/* Role Dropdown */}
        <div>
          <label
            htmlFor="role"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Your Role
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
              <option
                key={role.value}
                value={role.value}
                disabled={role.disabled}
              >
                {role.label}
              </option>
            ))}
          </select>
          {errors.role && (
            <p className="mt-1 text-sm text-red-600">{errors.role}</p>
          )}
        </div>

        {/* University Autocomplete */}
        <div>
          <label
            htmlFor="university"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            University
          </label>
          <input
            list="universities"
            name="university"
            value={formData.university}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md ${
              errors.university ? "border-red-500" : "border-gray-300"
            }`}
          />
          <datalist id="universities">
            {southAfricanUniversities.map((uni, index) => (
              <option key={index} value={uni} />
            ))}
          </datalist>
          {errors.university && (
            <p className="mt-1 text-sm text-red-600">{errors.university}</p>
          )}
        </div>

        {/* Degree Type */}
        <div>
          <label
            htmlFor="degreeType"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Degree Type
          </label>
          <select
            name="degreeType"
            value={formData.degreeType}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md ${
              errors.degreeType ? "border-red-500" : "border-gray-300"
            }`}
          >
            {degreeTypes.map((deg) => (
              <option key={deg.value} value={deg.value} disabled={deg.disabled}>
                {deg.label}
              </option>
            ))}
          </select>
          {errors.degreeType && (
            <p className="mt-1 text-sm text-red-600">{errors.degreeType}</p>
          )}
        </div>

        {/* Student Number */}
        <div>
          <label
            htmlFor="studentNumber"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Student Number
          </label>
          <input
            type="text"
            name="studentNumber"
            value={formData.studentNumber}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md ${
              errors.studentNumber ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.studentNumber && (
            <p className="mt-1 text-sm text-red-600">{errors.studentNumber}</p>
          )}
        </div>

        {/* Degree Name */}
        <div>
          <label
            htmlFor="degreeName"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Degree Name
          </label>
          <input
            type="text"
            name="degreeName"
            value={formData.degreeName}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md ${
              errors.degreeName ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.degreeName && (
            <p className="mt-1 text-sm text-red-600">{errors.degreeName}</p>
          )}
        </div>

        <button
          type="submit"
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition"
        >
          Continue
        </button>
      </form>
    </div>
  );
};

export default RoleSelectionForm;
