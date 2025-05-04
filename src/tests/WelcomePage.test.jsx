import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import WelcomePage from '../pages/welcomePage';

// ✅ Mock navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

// ✅ Utility to remove framer-motion-only props
const omitMotionProps = (props) => {
  const {
    whileHover,
    whileTap,
    whileInView,
    animate,
    initial,
    exit,
    transition,
    variants,
    layout,
    ...rest
  } = props;
  return rest;
};

// ✅ Mock framer-motion to avoid animation-related warnings/errors
vi.mock('framer-motion', () => ({
  motion: {
    section: ({ children, ...props }) => <section {...omitMotionProps(props)}>{children}</section>,
    div: ({ children, ...props }) => <div {...omitMotionProps(props)}>{children}</div>,
    figure: ({ children, ...props }) => <figure {...omitMotionProps(props)}>{children}</figure>,
    h1: ({ children, ...props }) => <h1 {...omitMotionProps(props)}>{children}</h1>,
    h2: ({ children, ...props }) => <h2 {...omitMotionProps(props)}>{children}</h2>,
    p: ({ children, ...props }) => <p {...omitMotionProps(props)}>{children}</p>,
    button: ({ children, onClick, ...props }) => (
      <button onClick={onClick} {...omitMotionProps(props)}>{children}</button>
    ),
  }
}));

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

  it('displays the get started button', () => {
    renderWelcomePage();
    const getStartedButton = screen.getByText(/get started now/i);
    expect(getStartedButton).toBeInTheDocument();
  });

  it('navigates to signup page when get started button is clicked', () => {
    renderWelcomePage();
    const getStartedButton = screen.getByText(/get started now/i);
    fireEvent.click(getStartedButton);
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
  });

  it('displays the features section', () => {
    renderWelcomePage();
    expect(screen.getByText('Why Choose Re:Search?')).toBeInTheDocument();
    expect(screen.getByText('Project Management')).toBeInTheDocument();
    expect(screen.getByText('Collaboration Tools')).toBeInTheDocument();
    expect(screen.getByText('Fund Management')).toBeInTheDocument();
  });

  it('displays the CTA section', () => {
    renderWelcomePage();
    expect(screen.getByText('Ready to Transform Your Research Journey?')).toBeInTheDocument();
    const signUpButton = screen.getByText('Sign Up Now');
    expect(signUpButton).toBeInTheDocument();
  });

  it('navigates to signup page when CTA sign up button is clicked', () => {
    renderWelcomePage();
    const signUpButton = screen.getByText('Sign Up Now');
    fireEvent.click(signUpButton);
    expect(mockNavigate).toHaveBeenCalledWith('/signup');
  });
});
