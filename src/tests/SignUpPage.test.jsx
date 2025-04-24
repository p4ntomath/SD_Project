import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import SignUpPage from '../pages/SignUpPage';
import welcomeImage from '../assets/welcomeDisplayImage.jpg';

// Mock the welcome image
vi.mock('../assets/welcomeDisplayImage.jpg', () => ({
  default: 'mocked-welcome-image'
}));

// Mock the SignUpForm component
vi.mock('../components/SignUpForm', () => ({
  default: () => <div data-testid="signup-form">SignUpForm Component</div>
}));

describe('SignUpPage', () => {
  const renderSignUpPage = () => {
    return render(
      <MemoryRouter>
        <SignUpPage />
      </MemoryRouter>
    );
  };

  it('renders with correct classes', () => {
    const { container } = renderSignUpPage();
    
    // Check if the container has the correct structure
    const mainSection = container.firstChild;
    expect(mainSection).toHaveClass('min-h-screen', 'flex', 'flex-col', 'md:flex-row');
  });

  it('displays the welcome image section', () => {
    renderSignUpPage();
    
    // Check if the image section exists
    const imageSection = screen.getByRole('img', { name: /welcome/i });
    expect(imageSection).toBeInTheDocument();
    expect(imageSection).toHaveAttribute('src', 'mocked-welcome-image');
    expect(imageSection).toHaveClass('h-auto', 'object-contain', 'rounded-lg', 'shadow-md');
  });

  it('renders the SignUpForm component', () => {
    renderSignUpPage();
    
    // Check if the SignUpForm component is rendered
    const signUpForm = screen.getByTestId('signup-form');
    expect(signUpForm).toBeInTheDocument();
  });

  it('has correct responsive layout classes', () => {
    renderSignUpPage();
    
    // Check image section responsive classes
    const imageSection = screen.getByRole('img', { name: /welcome/i }).parentElement;
    expect(imageSection).toHaveClass('md:w-1/2', 'bg-gray-100', 'rounded-tr-2xl', 'rounded-br-2xl');
    
    // Check form section responsive classes
    const formSection = screen.getByTestId('signup-form').parentElement;
    expect(formSection).toHaveClass('md:w-1/2', 'bg-white');
  });
});