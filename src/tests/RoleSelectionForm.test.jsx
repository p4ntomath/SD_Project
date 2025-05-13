import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import RoleSelectionForm from '../components/RoleSelctionForm';
import { useLocation } from 'react-router-dom';
import * as tagSuggestions from '../utils/tagSuggestions';

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useLocation: vi.fn()
}));

// Mock react-select
vi.mock('react-select', () => ({ 
  default: ({ inputId, options = [], value, onChange, isMulti }) => {
    const handleChange = (e) => {
      const selectedValue = e.target.value;
      // For multi-select, maintain array of selected options
      if (isMulti) {
        const option = options.find(opt => opt.value === selectedValue);
        if (option) {
          // Add to existing selections if not already selected
          const newValue = value || [];
          if (!newValue.some(v => v.value === selectedValue)) {
            onChange([...newValue, option]);
          }
        }
      } else {
        const option = options.find(opt => opt.value === selectedValue);
        onChange(option);
      }
    };

    return (
      <select
        id={inputId}
        data-testid={`mock-select-${inputId}`}
        value={isMulti ? (value || []).map(v => v.value) : (value?.value || '')}
        onChange={handleChange}
        multiple={isMulti}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }
}));

// Mock the fetchUniversities function
vi.mock('../utils/universityOptions', () => ({
  fetchUniversities: vi.fn().mockResolvedValue([
    { value: 'university1', label: 'University 1' },
    { value: 'university2', label: 'University 2' }
  ])
}));

describe('RoleSelectionForm Component', () => {
  const mockOnSubmit = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    useLocation.mockReturnValue({ state: {} });

    // Setup mocks for tag suggestion functions
    vi.spyOn(tagSuggestions, 'getAllTags').mockReturnValue([
      { value: 'tag1', label: 'Tag 1', faculty: 'Computer Science' },
      { value: 'tag2', label: 'Tag 2', faculty: 'Engineering' }
    ]);

    vi.spyOn(tagSuggestions, 'getFaculties').mockReturnValue(['Computer Science', 'Engineering']);

    vi.spyOn(tagSuggestions, 'getTagsByFaculty').mockReturnValue([
      { value: 'tag1', label: 'Tag 1', faculty: 'Computer Science' }
    ]);
  });

  it('renders form fields correctly', () => {
    render(<RoleSelectionForm onSubmit={mockOnSubmit} />);
    
    expect(screen.getByTestId('fullname-input')).toBeInTheDocument();
    expect(screen.getByTestId('institution-select')).toBeInTheDocument();
    expect(screen.getByTestId('role-select')).toBeInTheDocument();
    expect(screen.getByTestId('field-of-research-input')).toBeInTheDocument();
    expect(screen.getByTestId('bio-input')).toBeInTheDocument();
  });

  it('pre-fills name from location state if available', () => {
    useLocation.mockReturnValue({ 
      state: { 
        name: 'John Doe',
        isEmailSignup: true 
      } 
    });

    render(<RoleSelectionForm onSubmit={mockOnSubmit} />);
    expect(screen.getByTestId('fullname-input')).toHaveValue('John Doe');
  });

  it('handles form submission with valid researcher data', async () => {
    render(<RoleSelectionForm onSubmit={mockOnSubmit} />);
    
    // Fill form
    fireEvent.change(screen.getByTestId('fullname-input'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByTestId('role-select'), { target: { value: 'researcher' } });
    fireEvent.change(screen.getByTestId('field-of-research-input'), { target: { value: 'Computer Science' } });
    
    // Add 3 tags
    const tagSelect = screen.getByTestId('mock-select-select-tags');
    fireEvent.change(tagSelect, { target: { value: 'tag1' } });
    fireEvent.change(tagSelect, { target: { value: 'tag2' } });
    
    // Select institution
    fireEvent.change(screen.getByTestId('mock-select-select-institution'), { target: { value: 'university1' } });
    
    // Add department
    fireEvent.change(screen.getByTestId('department-input'), { target: { value: 'Computer Science' } });
    
    // Optional bio
    fireEvent.change(screen.getByTestId('bio-input'), { target: { value: 'Test bio' } });

    // Submit form
    await act(async () => {
      fireEvent.click(screen.getByTestId('submit-button'));
    });

    expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
      fullName: 'John Doe',
      role: 'researcher',
      fieldOfResearch: 'Computer Science',
      department: 'Computer Science',
      institution: 'university1',
      bio: 'Test bio',
      tags: expect.arrayContaining([
        { value: 'tag1', label: 'Tag 1' },
        { value: 'tag2', label: 'Tag 2' }
      ])
    }));
  });

  it('handles form submission with valid reviewer data', async () => {
    render(<RoleSelectionForm onSubmit={mockOnSubmit} />);
    
    // Fill form
    fireEvent.change(screen.getByTestId('fullname-input'), { target: { value: 'Jane Smith' } });
    fireEvent.change(screen.getByTestId('role-select'), { target: { value: 'reviewer' } });
    fireEvent.change(screen.getByTestId('field-of-research-input'), { target: { value: 'Computer Science' } });

    // Add 3 tags
    const tagSelect = screen.getByTestId('mock-select-select-tags');
    fireEvent.change(tagSelect, { target: { value: 'tag1' } });
    fireEvent.change(tagSelect, { target: { value: 'tag2' } });

    // Select institution
    fireEvent.change(screen.getByTestId('mock-select-select-institution'), { target: { value: 'university1' } });
    
    // Add department
    fireEvent.change(screen.getByTestId('department-input'), { target: { value: 'Engineering' } });
    
    // Optional bio
    fireEvent.change(screen.getByTestId('bio-input'), { target: { value: 'Test bio' } });

    // Submit form
    await act(async () => {
      fireEvent.click(screen.getByTestId('submit-button'));
    });

    expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
      fullName: 'Jane Smith',
      role: 'reviewer',
      fieldOfResearch: 'Computer Science',
      department: 'Engineering',
      institution: 'university1',
      bio: 'Test bio',
      tags: expect.arrayContaining([
        { value: 'tag1', label: 'Tag 1' },
        { value: 'tag2', label: 'Tag 2' }
      ])
    }));
  });

  it('shows validation errors for empty required fields', async () => {
    render(<RoleSelectionForm onSubmit={mockOnSubmit} />);
    
    // Submit without filling required fields
    fireEvent.click(screen.getByTestId('submit-button'));

    expect(await screen.findByTestId('fullname-error')).toBeInTheDocument();
    expect(await screen.findByTestId('role-error')).toBeInTheDocument();
    expect(await screen.findByTestId('institution-error')).toBeInTheDocument();
    expect(await screen.findByTestId('field-of-research-error')).toBeInTheDocument();
  });

  it('shows loading state during submission', async () => {
    render(<RoleSelectionForm onSubmit={async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    }} />);

    // Fill required fields
    fireEvent.change(screen.getByTestId('fullname-input'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByTestId('role-select'), { target: { value: 'researcher' } });
    fireEvent.change(screen.getByTestId('mock-select-select-institution'), { target: { value: 'University 1' } });
    fireEvent.change(screen.getByTestId('field-of-research-input'), { target: { value: 'Computer Science' } });

    // Submit form
    fireEvent.click(screen.getByTestId('submit-button'));

    // Check for loading state
    expect(await screen.findByText(/completing profile/i)).toBeInTheDocument();
  });

  it('handles tag selection', async () => {
    render(<RoleSelectionForm onSubmit={mockOnSubmit} />);

    const tagSelect = screen.getByTestId('mock-select-select-tags');
    fireEvent.change(tagSelect, { target: { value: 'tag1' } });

    await act(async () => {
      fireEvent.click(screen.getByTestId('submit-button'));
    });

    expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
      tags: expect.arrayContaining([{ value: 'tag1', label: 'Tag 1' }])
    }));
  });
});