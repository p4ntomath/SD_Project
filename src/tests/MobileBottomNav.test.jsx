import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import '@testing-library/jest-dom';
import MobileBottomNav from '../components/ResearcherComponents/Navigation/MobileBottomNav';

// Mock useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn()
  };
});

describe('MobileBottomNav Component', () => {
  const defaultProps = {
    showForm: false,
    setShowForm: vi.fn()
  };

  const renderWithRouter = (ui, { route = '/home' } = {}) => {
    return render(
      <MemoryRouter initialEntries={[route]}>
        {ui}
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all navigation buttons with correct icons and labels', () => {
    renderWithRouter(<MobileBottomNav {...defaultProps} />);

    // Check for all navigation items
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Documents')).toBeInTheDocument();
    expect(screen.getByText('Alerts')).toBeInTheDocument();
    expect(screen.getByText('Account')).toBeInTheDocument();
  });

  it('has correct accessibility attributes', () => {
    renderWithRouter(<MobileBottomNav {...defaultProps} />);
    
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', 'Mobile navigation');

    expect(screen.getByRole('button', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Projects' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View documents' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View alerts' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View account' })).toBeInTheDocument();
  });

  it('applies proper styling classes for mobile display', () => {
    renderWithRouter(<MobileBottomNav {...defaultProps} />);
    
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass('md:hidden', 'fixed', 'bottom-0', 'left-0', 'right-0', 'bg-white', 'shadow-lg', 'border-t', 'border-gray-200');
  });

  it('highlights active route with blue color', () => {
    renderWithRouter(<MobileBottomNav {...defaultProps} />, { route: '/home' });
    
    const homeButton = screen.getByRole('button', { name: 'Home' });
    expect(homeButton).toHaveClass('text-blue-600');
    
    const projectsButton = screen.getByRole('button', { name: 'Projects' });
    expect(projectsButton).toHaveClass('text-gray-600');
  });

  it('renders icons with correct sizes and text styling', () => {
    renderWithRouter(<MobileBottomNav {...defaultProps} />);
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      const icon = button.querySelector('svg');
      const text = button.querySelector('p');
      
      expect(icon).toHaveClass('h-6', 'w-6');
      expect(text).toHaveClass('text-xs', 'mt-1');
    });
  });

  it('applies correct transition and hover classes', () => {
    renderWithRouter(<MobileBottomNav {...defaultProps} />);
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveClass('group', 'hover:bg-blue-50', 'transition-all', 'duration-200');
    });
  });
});
