import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import MobileBottomNav from '../components/ResearcherComponents/Navigation/MobileBottomNav';

describe('MobileBottomNav Component', () => {
  const defaultProps = {
    showForm: false,
    setShowForm: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all navigation buttons with correct icons and labels', () => {
    render(<MobileBottomNav {...defaultProps} />);

    // Check for all navigation items
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('My Projects')).toBeInTheDocument();
    expect(screen.getByText('Documents')).toBeInTheDocument();
    expect(screen.getByText('Alerts')).toBeInTheDocument();
    expect(screen.getByText('Account')).toBeInTheDocument();
  });

  it('has correct accessibility attributes', () => {
    render(<MobileBottomNav {...defaultProps} />);
    
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', 'Mobile navigation');

    // Check aria-labels for buttons with unique values
    expect(screen.getByLabelText('Home')).toBeInTheDocument();
    expect(screen.getByLabelText('My Projects')).toBeInTheDocument();
    expect(screen.getByLabelText('View documents')).toBeInTheDocument();
    expect(screen.getByLabelText('View alerts')).toBeInTheDocument();
    expect(screen.getByLabelText('View account')).toBeInTheDocument();
  });

  it('applies proper styling classes for mobile display', () => {
    render(<MobileBottomNav {...defaultProps} />);
    
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass('md:hidden', 'fixed', 'bottom-0');
  });

  it('applies hover styles to navigation buttons', () => {
    render(<MobileBottomNav {...defaultProps} />);
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveClass('group', 'hover:bg-blue-50');
    });
  });

  it('renders icons with correct sizes', () => {
    render(<MobileBottomNav {...defaultProps} />);
    
    const icons = screen.getAllByRole('button').map(button => 
      button.querySelector('svg')
    );
    
    icons.forEach(icon => {
      expect(icon).toHaveClass('h-6', 'w-6');
    });
  });

  it('has consistent text styling across all buttons', () => {
    render(<MobileBottomNav {...defaultProps} />);
    
    const labels = screen.getAllByRole('button').map(button => 
      button.querySelector('p')
    );
    
    labels.forEach(label => {
      expect(label).toHaveClass('text-xs', 'mt-1');
    });
  });
});
