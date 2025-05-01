import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import LoginPage from '../pages/loginPage';

// Mock the login display image
vi.mock('../assets/Screenshot 2025-03-31 194547.png', () => ({
  default: 'mocked-login-display'
}));

// Mock the LoginForm component
vi.mock('../components/LogInForm', () => ({
  default: () => <div data-testid="login-form">LoginForm Component</div>
}));

describe('LoginPage', () => {
  const renderLoginPage = () => {
    return render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );
  };

  it('renders the login page with correct structure', () => {
    const { container } = renderLoginPage();
    
    // Check if the main container exists with correct classes
    const mainElement = screen.getByRole('main');
    expect(mainElement).toHaveClass('min-h-screen', 'flex', 'flex-col', 'md:flex-row');
  });

  it('displays the login image section', () => {
    renderLoginPage();
    
    // Check if the image section exists
    const imageElement = screen.getByRole('img', { name: /creative workspace illustration/i });
    expect(imageElement).toBeInTheDocument();
    expect(imageElement).toHaveAttribute('src', 'mocked-login-display');
    expect(imageElement).toHaveClass('h-auto', 'object-contain', 'rounded-lg', 'shadow-md');
  });

  it('renders the LoginForm component', () => {
    renderLoginPage();
    
    // Check if the LoginForm component is rendered
    const loginForm = screen.getByTestId('login-form');
    expect(loginForm).toBeInTheDocument();
  });

  it('has correct responsive layout classes', () => {
    renderLoginPage();
    
    // Check image section responsive classes
    const imageSection = screen.getByRole('complementary', { name: /aside/i });
    expect(imageSection).toHaveClass('md:w-1/2', 'bg-gray-100', 'rounded-tr-2xl', 'rounded-br-2xl');
    
    // Check form section responsive classes
    const formSection = screen.getByRole('region', { name: /login form/i });
    expect(formSection).toHaveClass('md:w-1/2', 'bg-white');
  });
});