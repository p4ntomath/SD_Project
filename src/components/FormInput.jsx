const FormInput = ({ 
  label, 
  type = 'text', 
  name, 
  value, 
  onChange, 
  error 
}) => {
  const inputId = `${name}-input`;
  return (
    <section className="mb-4">
      <label 
        htmlFor={inputId}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
      </label>
      <input
        id={inputId}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full px-3 py-2 border rounded-md ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </section>
  );
};

export default FormInput;