// Function to fetch South African universities
export const fetchUniversities = async () => {
  try {
    const response = await fetch('http://universities.hipolabs.com/search?country=south+africa');
    const data = await response.json();
    
    // Map to format needed for react-select
    return data.map(uni => ({
      value: uni.name,
      label: uni.name
    }));
  } catch (error) {
    
    return [];
  }
};