import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ForgotPasswordPage from '../pages/forgotpasswordPage';

// Move mocks before imports
vi.mock('../backend/firebase/authFirebase', () => {
  return {
    resetPassword: vi.fn()
  }
});

vi.mock('../assets/welcomeDisplayImage.jpg', () => {
  return {
    default: 'mocked-image-path'
  }
});

// Import after mocks
import { resetPassword } from '../backend/firebase/authFirebase';

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the reset password form with heading and input', () => {
    render(<ForgotPasswordPage />, { wrapper: MemoryRouter });

    expect(screen.getByTestId('reset-password-heading')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/your@email\.com/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
  });

  it('shows validation error for empty email', async () => {
    render(<ForgotPasswordPage />, { wrapper: MemoryRouter });

    const button = screen.getByRole('button', { name: /send reset link/i });
    fireEvent.click(button);

    expect(await screen.findByTestId('error-message')).toHaveTextContent('Email is required');
  });

  it('shows validation error for invalid email', async () => {
    render(<ForgotPasswordPage />, { wrapper: MemoryRouter });

    fireEvent.change(screen.getByPlaceholderText(/your@email\.com/i), {
      target: { value: 'invalid-email' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    expect(await screen.findByTestId('error-message')).toHaveTextContent('Please enter a valid email address');
  });

  it('shows error message if resetPassword fails', async () => {
    resetPassword.mockRejectedValueOnce(new Error('Something went wrong'));

    render(<ForgotPasswordPage />, { wrapper: MemoryRouter });

    fireEvent.change(screen.getByPlaceholderText(/your@email\.com/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    expect(await screen.findByTestId('error-message')).toHaveTextContent('Something went wrong');
  });

  it('shows success message when reset is successful', async () => {
    resetPassword.mockResolvedValueOnce();

    render(<ForgotPasswordPage />, { wrapper: MemoryRouter });

    fireEvent.change(screen.getByPlaceholderText(/your@email\.com/i), {
      target: { value: 'success@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByText(/password reset link has been sent/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/back to sign in/i)).toBeInTheDocument();
  });


});
