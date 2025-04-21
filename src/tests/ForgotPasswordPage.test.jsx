import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import ForgotPasswordPage from '../pages/forgotpasswordPage';

// Mock React Router hooks
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn()
  };
});

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders the forgotten password form correctly', () => {
    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>
    );
    
    expect(screen.getByTestId('forgot-password-page')).toBeInTheDocument();
  });

  it('mocks the resetPassword function correctly', async () => {
    const { resetPassword } = await import('../backend/firebase/authFirebase');
    expect(resetPassword).toBeDefined();
    
    // Test successful password reset
    await expect(resetPassword('test@example.com')).resolves.not.toThrow();
    
    // Test failed password reset
    await expect(resetPassword('nonexistent@example.com'))
      .rejects.toThrow('No account found with this email.');
  });
});