import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import FormInput from '../components/FormInput';

describe('FormInput Component', () => {
  const defaultProps = {
    label: 'Test Label',
    type: 'text',
    name: 'testInput',
    value: '',
    onChange: vi.fn(),
    error: ''
  };

  it('renders with label and input', () => {
    render(<FormInput {...defaultProps} />);
    
    expect(screen.getByText('Test Label')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('applies error styles and shows error message when error prop is provided', () => {
    const errorMessage = 'This field is required';
    render(<FormInput {...defaultProps} error={errorMessage} />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-red-500');
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toHaveClass('text-red-600');
  });

  it('calls onChange handler when input value changes', () => {
    render(<FormInput {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test value' } });
    
    expect(defaultProps.onChange).toHaveBeenCalledTimes(1);
  });

  it('renders different input types correctly', () => {
    render(<FormInput {...defaultProps} type="password" />);
    
    const input = screen.getByLabelText('Test Label');
    expect(input).toHaveAttribute('type', 'password');
  });

  it('uses provided value prop', () => {
    render(<FormInput {...defaultProps} value="test value" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('test value');
  });

  it('has correct default input type when not specified', () => {
    const { type, ...propsWithoutType } = defaultProps;
    render(<FormInput {...propsWithoutType} />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'text');
  });
});