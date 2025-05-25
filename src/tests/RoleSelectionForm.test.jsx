import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import RoleSelectionForm from '../components/RoleSelctionForm';
import { BrowserRouter } from 'react-router-dom';
import { fetchUniversities } from '../utils/universityOptions';

// Mock window.scrollTo
window.scrollTo = vi.fn();

// Mock the modules
vi.mock('../utils/tagSuggestions', () => ({
  getAllTags: vi.fn(() => [
    { value: 'ml', label: 'Machine Learning' },
    { value: 'ai', label: 'Artificial Intelligence' },
    { value: 'ds', label: 'Data Science' }
  ]),
  getFaculties: vi.fn(() => ['Science', 'Engineering']),
  getTagsByFaculty: vi.fn(() => [])
}));

vi.mock('../utils/universityOptions', () => ({
  fetchUniversities: vi.fn(() => Promise.resolve([
    { value: 'uni1', label: 'University 1' },
    { value: 'uni2', label: 'University 2' }
  ]))
}));

// Mock React-Select
vi.mock('react-select', () => ({
  default: ({ value, onChange, options, placeholder, isMulti, inputId, name }) => (
    <div data-testid={`react-select-${name || inputId}`}>
      <input
        data-testid={`select-input-${name || inputId}`}
        placeholder={placeholder}
        value={isMulti ? value?.map(v => v.label).join(', ') || '' : value?.label || ''}
        onChange={(e) => {
          if (isMulti) {
            const labels = e.target.value.split(', ').filter(Boolean);
            const selectedOptions = labels.map(label => 
              options?.find(opt => opt.label === label) || { value: label.toLowerCase(), label }
            );
            onChange?.(selectedOptions);
          } else {
            const option = options?.find(opt => opt.label === e.target.value);
            onChange?.(option);
          }
        }}
      />
      <div data-testid={`select-options-${name || inputId}`}>
        {options?.map(option => (
          <button 
            key={option.value}
            onClick={() => {
              if (isMulti) {
                const currentValues = value || [];
                const newValues = currentValues.some(v => v.value === option.value) 
                  ? currentValues.filter(v => v.value !== option.value)
                  : [...currentValues, option].slice(0, 3); // Limit to 3 for tags
                onChange?.(newValues);
              } else {
                onChange?.(option);
              }
            }}
            data-testid={`option-${option.value}`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}));

const mockOnSubmit = vi.fn();

const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    const skipMessages = [
      'inside a test was not wrapped in act',
      'React state updates should be wrapped in act',
      'changing a controlled input to be uncontrolled'
    ];
    if (skipMessages.some(msg => args[0]?.includes(msg))) return;
    originalError.call(console, ...args);
  };

  console.warn = (...args) => {
    const skipMessages = [
      'An update to ProjectDetailsPage inside a test was not wrapped in act',
      'A component is changing a controlled input'
    ];
    if (skipMessages.some(msg => args[0]?.includes(msg))) return;
    originalWarn.call(console, ...args);
  };
});

// Helper function to render with router
const renderWithRouter = (ui, { route = '/' } = {}) => {
  window.history.pushState({}, 'Test page', route);
  return render(ui, { wrapper: BrowserRouter });
};

describe('RoleSelectionForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the form with all required fields', async () => {
    renderWithRouter(<RoleSelectionForm onSubmit={mockOnSubmit} />);

    // Check for main form elements
    expect(screen.getByTestId('role-selection-form')).toBeInTheDocument();
    expect(screen.getByTestId('fullname-input')).toBeInTheDocument();
    expect(screen.getByTestId('role-select')).toBeInTheDocument();
    expect(screen.getByTestId('department-input')).toBeInTheDocument();
    expect(screen.getByTestId('field-of-research-input')).toBeInTheDocument();

    // Check for React-Select components
    expect(screen.getByTestId('react-select-institution')).toBeInTheDocument();
    expect(screen.getByTestId('react-select-tags')).toBeInTheDocument();

    // Verify that universities are fetched
    expect(fetchUniversities).toHaveBeenCalled();
  });

  it('validates required fields on submission', async () => {
    renderWithRouter(<RoleSelectionForm onSubmit={mockOnSubmit} />);

    // Try to submit without filling required fields
    fireEvent.click(screen.getByText('Complete Profile'));

    // Check for error messages
    await waitFor(() => {
      expect(screen.getByTestId('fullname-error')).toHaveTextContent('Full name is required');
      expect(screen.getByTestId('role-error')).toHaveTextContent('Please select a role');
      expect(screen.getByTestId('department-error')).toHaveTextContent('Department is required');
      expect(screen.getByTestId('field-of-research-error')).toHaveTextContent('Field of research is required');
      expect(screen.getByTestId('institution-error')).toHaveTextContent('Institution is required');
      expect(screen.getByTestId('tags-error')).toHaveTextContent('Please select at least 3 research tags');
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('submits form successfully with valid data', async () => {
    const user = userEvent.setup();
    renderWithRouter(<RoleSelectionForm onSubmit={mockOnSubmit} />);

    // Fill in the form
    await user.type(screen.getByTestId('fullname-input'), 'John Doe');
    await user.selectOptions(screen.getByTestId('role-select'), 'researcher');
    await user.type(screen.getByTestId('department-input'), 'Computer Science');
    await user.type(screen.getByTestId('field-of-research-input'), 'Machine Learning');

    // Select institution using mocked React-Select
    const institutionButton = screen.getByTestId('option-uni1');
    await user.click(institutionButton);

    // Select research tags using mocked React-Select
    const tagsContainer = screen.getByTestId('select-options-tags');
    const mlOption = screen.getByTestId('option-ml');
    const aiOption = screen.getByTestId('option-ai');
    const dsOption = screen.getByTestId('option-ds');
    
    await user.click(mlOption);
    await user.click(aiOption);
    await user.click(dsOption);

    // Submit form
    await user.click(screen.getByText('Complete Profile'));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
        fullName: 'John Doe',
        role: 'researcher',
        department: 'Computer Science',
        fieldOfResearch: 'Machine Learning',
        institution: 'uni1',
        tags: ['Machine Learning', 'Artificial Intelligence', 'Data Science']
      }));
    }, { timeout: 10000 });
  });

  it('loads and filters research tags by faculty', async () => {
    renderWithRouter(<RoleSelectionForm onSubmit={mockOnSubmit} />);

    // Check if faculty select is rendered
    const facultySelect = screen.getByTestId('faculty-select');
    expect(facultySelect).toBeInTheDocument();

    // Change faculty
    fireEvent.change(facultySelect, {
      target: { value: 'Science' }
    });

    expect(screen.getByTestId('faculty-option-Science')).toBeInTheDocument();
  });

  it('handles profile completion loading state', async () => {
    renderWithRouter(<RoleSelectionForm onSubmit={mockOnSubmit} />);

    // Wait for universities to load first
    await waitFor(() => {
      expect(screen.getByTestId('option-uni1')).toBeInTheDocument();
    });

    // Fill required fields
    fireEvent.change(screen.getByTestId('fullname-input'), {
      target: { value: 'John Doe' }
    });

    fireEvent.change(screen.getByTestId('role-select'), {
      target: { value: 'researcher' }
    });
    fireEvent.change(screen.getByTestId('department-input'), {
      target: { value: 'Computer Science' }
    });
    fireEvent.change(screen.getByTestId('field-of-research-input'), {
      target: { value: 'Machine Learning' }
    });

    // Select institution using mocked React-Select
    const institutionButton = screen.getByTestId('option-uni1');
    fireEvent.click(institutionButton);

    // Select tags using mocked React-Select
    const mlOption = screen.getByTestId('option-ml');
    const aiOption = screen.getByTestId('option-ai');
    const dsOption = screen.getByTestId('option-ds');
    
    fireEvent.click(mlOption);
    fireEvent.click(aiOption);
    fireEvent.click(dsOption);

    // Mock a loading state by making onSubmit return a promise
    mockOnSubmit.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    // Submit form
    fireEvent.click(screen.getByText('Complete Profile'));

    // Check for loading state
    expect(await screen.findByText('Completing Profile...')).toBeInTheDocument();
  });
});