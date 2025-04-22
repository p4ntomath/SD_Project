import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import WelcomePage from '../pages/welcomePage';

// Mock navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

describe('WelcomePage Component', () => {
  const renderWelcomePage = () => {
    return render(
      <MemoryRouter>
        <WelcomePage />
      </MemoryRouter>
    );
  };

  it('renders the welcome page with main heading', () => {
    renderWelcomePage();

    const mainHeading = screen.getByRole('heading', { 
      level: 1,
      name: /one platform.*endless academic possibilities/i
    });
    expect(mainHeading).toBeInTheDocument();
  });

  it('displays the sign up button', () => {
    renderWelcomePage();
    const signUpButton = screen.getByRole('button', { name: /sign up!/i });
    expect(signUpButton).toBeInTheDocument();
  });

  it('navigates to signup page when sign up button is clicked', () => {
    renderWelcomePage();
    const signUpButton = screen.getByRole('button', { name: /sign up!/i });
    fireEvent.click(signUpButton);
    expect(mockNavigate).toHaveBeenCalledWith('/signup');
  });

  it('contains the welcome message and description', () => {
    renderWelcomePage();
    const description = screen.getByText(/All your research tools, in one brilliant place./i);
    expect(description).toBeInTheDocument();
  });

  it('displays the research collaboration illustration', () => {
    renderWelcomePage();
    const image = screen.getByAltText('Research collaboration illustration');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', expect.stringContaining('welcomeDisplay'));
  });

  it('renders the navigation bar', () => {
    renderWelcomePage();
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByText('Re:Search')).toBeInTheDocument();
  });
});
