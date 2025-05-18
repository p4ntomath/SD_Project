// Tag suggestions organized by faculty/discipline
export const tagSuggestions = [
  // Computer Science & Technology
  { value: 'artificial-intelligence', label: 'Artificial Intelligence', faculty: 'Computer Science' },
  { value: 'machine-learning', label: 'Machine Learning', faculty: 'Computer Science' },
  { value: 'deep-learning', label: 'Deep Learning', faculty: 'Computer Science' },
  { value: 'natural-language-processing', label: 'Natural Language Processing', faculty: 'Computer Science' },
  { value: 'computer-vision', label: 'Computer Vision', faculty: 'Computer Science' },
  { value: 'data-science', label: 'Data Science', faculty: 'Computer Science' },
  { value: 'robotics', label: 'Robotics', faculty: 'Computer Science' },
  { value: 'cybersecurity', label: 'Cybersecurity', faculty: 'Computer Science' },
  { value: 'blockchain', label: 'Blockchain', faculty: 'Computer Science' },
  { value: 'internet-of-things', label: 'Internet of Things', faculty: 'Computer Science' },
  { value: 'cloud-computing', label: 'Cloud Computing', faculty: 'Computer Science' },
  { value: 'software-engineering', label: 'Software Engineering', faculty: 'Computer Science' },
  { value: 'web-development', label: 'Web Development', faculty: 'Computer Science' },
  { value: 'mobile-development', label: 'Mobile Development', faculty: 'Computer Science' },
  { value: 'quantum-computing', label: 'Quantum Computing', faculty: 'Computer Science' },
  { value: 'data-mining', label: 'Data Mining', faculty: 'Computer Science' },
  { value: 'big-data', label: 'Big Data', faculty: 'Computer Science' },
  { value: 'network-security', label: 'Network Security', faculty: 'Computer Science' },
  { value: 'human-computer-interaction', label: 'Human-Computer Interaction', faculty: 'Computer Science' },
  { value: 'distributed-systems', label: 'Distributed Systems', faculty: 'Computer Science' },

  // Engineering
  { value: 'mechanical-engineering', label: 'Mechanical Engineering', faculty: 'Engineering' },
  { value: 'electrical-engineering', label: 'Electrical Engineering', faculty: 'Engineering' },
  { value: 'civil-engineering', label: 'Civil Engineering', faculty: 'Engineering' },
  { value: 'chemical-engineering', label: 'Chemical Engineering', faculty: 'Engineering' },
  { value: 'aerospace-engineering', label: 'Aerospace Engineering', faculty: 'Engineering' },
  { value: 'biomedical-engineering', label: 'Biomedical Engineering', faculty: 'Engineering' },
  { value: 'industrial-engineering', label: 'Industrial Engineering', faculty: 'Engineering' },
  { value: 'materials-science', label: 'Materials Science', faculty: 'Engineering' },
  { value: 'environmental-engineering', label: 'Environmental Engineering', faculty: 'Engineering' },
  { value: 'renewable-energy', label: 'Renewable Energy', faculty: 'Engineering' },

  // Life Sciences & Medicine
  { value: 'molecular-biology', label: 'Molecular Biology', faculty: 'Life Sciences' },
  { value: 'genetics', label: 'Genetics', faculty: 'Life Sciences' },
  { value: 'biochemistry', label: 'Biochemistry', faculty: 'Life Sciences' },
  { value: 'neuroscience', label: 'Neuroscience', faculty: 'Life Sciences' },
  { value: 'immunology', label: 'Immunology', faculty: 'Life Sciences' },
  { value: 'microbiology', label: 'Microbiology', faculty: 'Life Sciences' },
  { value: 'bioinformatics', label: 'Bioinformatics', faculty: 'Life Sciences' },
  { value: 'cancer-research', label: 'Cancer Research', faculty: 'Life Sciences' },
  { value: 'pharmacology', label: 'Pharmacology', faculty: 'Life Sciences' },
  { value: 'public-health', label: 'Public Health', faculty: 'Life Sciences' },

  // Physical Sciences
  { value: 'physics', label: 'Physics', faculty: 'Physical Sciences' },
  { value: 'chemistry', label: 'Chemistry', faculty: 'Physical Sciences' },
  { value: 'astronomy', label: 'Astronomy', faculty: 'Physical Sciences' },
  { value: 'astrophysics', label: 'Astrophysics', faculty: 'Physical Sciences' },
  { value: 'particle-physics', label: 'Particle Physics', faculty: 'Physical Sciences' },
  { value: 'quantum-mechanics', label: 'Quantum Mechanics', faculty: 'Physical Sciences' },
  { value: 'nanotechnology', label: 'Nanotechnology', faculty: 'Physical Sciences' },
  { value: 'materials-physics', label: 'Materials Physics', faculty: 'Physical Sciences' },
  { value: 'optics', label: 'Optics', faculty: 'Physical Sciences' },
  { value: 'thermodynamics', label: 'Thermodynamics', faculty: 'Physical Sciences' },

  // Mathematics & Statistics
  { value: 'pure-mathematics', label: 'Pure Mathematics', faculty: 'Mathematics' },
  { value: 'applied-mathematics', label: 'Applied Mathematics', faculty: 'Mathematics' },
  { value: 'statistics', label: 'Statistics', faculty: 'Mathematics' },
  { value: 'data-analytics', label: 'Data Analytics', faculty: 'Mathematics' },
  { value: 'mathematical-modeling', label: 'Mathematical Modeling', faculty: 'Mathematics' },
  { value: 'operations-research', label: 'Operations Research', faculty: 'Mathematics' },
  { value: 'cryptography', label: 'Cryptography', faculty: 'Mathematics' },
  { value: 'numerical-analysis', label: 'Numerical Analysis', faculty: 'Mathematics' },
  { value: 'probability-theory', label: 'Probability Theory', faculty: 'Mathematics' },
  { value: 'optimization', label: 'Optimization', faculty: 'Mathematics' },

  // Social Sciences
  { value: 'psychology', label: 'Psychology', faculty: 'Social Sciences' },
  { value: 'sociology', label: 'Sociology', faculty: 'Social Sciences' },
  { value: 'economics', label: 'Economics', faculty: 'Social Sciences' },
  { value: 'political-science', label: 'Political Science', faculty: 'Social Sciences' },
  { value: 'anthropology', label: 'Anthropology', faculty: 'Social Sciences' },
  { value: 'archaeology', label: 'Archaeology', faculty: 'Social Sciences' },
  { value: 'education', label: 'Education', faculty: 'Social Sciences' },
  { value: 'linguistics', label: 'Linguistics', faculty: 'Social Sciences' },
  { value: 'social-policy', label: 'Social Policy', faculty: 'Social Sciences' },
  { value: 'development-studies', label: 'Development Studies', faculty: 'Social Sciences' },

  // Business & Management
  { value: 'finance', label: 'Finance', faculty: 'Business' },
  { value: 'marketing', label: 'Marketing', faculty: 'Business' },
  { value: 'entrepreneurship', label: 'Entrepreneurship', faculty: 'Business' },
  { value: 'management', label: 'Management', faculty: 'Business' },
  { value: 'accounting', label: 'Accounting', faculty: 'Business' },
  { value: 'business-analytics', label: 'Business Analytics', faculty: 'Business' },
  { value: 'supply-chain', label: 'Supply Chain Management', faculty: 'Business' },
  { value: 'organizational-behavior', label: 'Organizational Behavior', faculty: 'Business' },
  { value: 'strategy', label: 'Business Strategy', faculty: 'Business' },
  { value: 'international-business', label: 'International Business', faculty: 'Business' },

  // Environmental Sciences
  { value: 'climate-change', label: 'Climate Change', faculty: 'Environmental Sciences' },
  { value: 'ecology', label: 'Ecology', faculty: 'Environmental Sciences' },
  { value: 'conservation', label: 'Conservation', faculty: 'Environmental Sciences' },
  { value: 'sustainability', label: 'Sustainability', faculty: 'Environmental Sciences' },
  { value: 'environmental-policy', label: 'Environmental Policy', faculty: 'Environmental Sciences' },
  { value: 'biodiversity', label: 'Biodiversity', faculty: 'Environmental Sciences' },
  { value: 'marine-biology', label: 'Marine Biology', faculty: 'Environmental Sciences' },
  { value: 'atmospheric-science', label: 'Atmospheric Science', faculty: 'Environmental Sciences' },
  { value: 'geology', label: 'Geology', faculty: 'Environmental Sciences' },
  { value: 'oceanography', label: 'Oceanography', faculty: 'Environmental Sciences' },

  // Arts & Humanities
  { value: 'history', label: 'History', faculty: 'Arts & Humanities' },
  { value: 'philosophy', label: 'Philosophy', faculty: 'Arts & Humanities' },
  { value: 'literature', label: 'Literature', faculty: 'Arts & Humanities' },
  { value: 'art-history', label: 'Art History', faculty: 'Arts & Humanities' },
  { value: 'music', label: 'Music', faculty: 'Arts & Humanities' },
  { value: 'theater', label: 'Theater', faculty: 'Arts & Humanities' },
  { value: 'media-studies', label: 'Media Studies', faculty: 'Arts & Humanities' },
  { value: 'cultural-studies', label: 'Cultural Studies', faculty: 'Arts & Humanities' },
  { value: 'religious-studies', label: 'Religious Studies', faculty: 'Arts & Humanities' },
  { value: 'film-studies', label: 'Film Studies', faculty: 'Arts & Humanities' }
];

// Helper function to get tags by faculty
export const getTagsByFaculty = (faculty) => {
  return tagSuggestions.filter(tag => tag.faculty === faculty);
};

// Get unique faculties
export const getFaculties = () => {
  return [...new Set(tagSuggestions.map(tag => tag.faculty))];
};

// Get all tags
export const getAllTags = () => {
  return tagSuggestions;
};