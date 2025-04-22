import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import MainNav from '../components/ResearcherComponents/Navigation/MainNav';
import { logOut } from '../backend/firebase/authFirebase';

// Mock the firebase auth module
vi.mock('../backend/firebase/authFirebase', () => ({
  logOut: vi.fn(() => Promise.resolve())
}));

// Mock window.location
delete window.location;
window.location = { href: '' };

describe('MainNav Component', () => {
  const defaultProps = {
    showForm: false,
    setShowForm: vi.fn(),
    setMobileMenuOpen: vi.fn(),
    mobileMenuOpen: false,
    onSearch: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all desktop navigation buttons', () => {
    render(<MainNav {...defaultProps} />);
    
    // Test navigation buttons by their text content since it's more reliable
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('My Projects')).toBeInTheDocument();
    expect(screen.getByText('Documents')).toBeInTheDocument();
    expect(screen.getByText('Alerts')).toBeInTheDocument();
    expect(screen.getByText('Account')).toBeInTheDocument();
  });

  it('renders the search bar', () => {
    render(<MainNav {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search projects...');
    expect(searchInput).toBeInTheDocument();
  });

  it('handles search form submission', () => {
    render(<MainNav {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search projects...');
    const searchForm = searchInput.closest('form');
    
    fireEvent.change(searchInput, { target: { value: 'test search' } });
    fireEvent.submit(searchForm);
    
    expect(defaultProps.onSearch).toHaveBeenCalledWith('test search');
  });

  it('renders mobile menu toggle button on mobile view', () => {
    render(<MainNav {...defaultProps} />);
    
    const menuButton = screen.getByLabelText('Toggle menu');
    expect(menuButton).toBeInTheDocument();
  });

  it('toggles mobile menu when menu button is clicked', () => {
    render(<MainNav {...defaultProps} />);
    
    const menuButton = screen.getByLabelText('Toggle menu');
    fireEvent.click(menuButton);
    
    expect(defaultProps.setMobileMenuOpen).toHaveBeenCalledWith(true);
  });

  it('shows mobile menu content when mobileMenuOpen is true', () => {
    render(<MainNav {...defaultProps} mobileMenuOpen={true} />);
    
    expect(screen.getByText('My Profile')).toBeInTheDocument();
  });

  it('handles logout button click', () => {
    render(<MainNav {...defaultProps} />);
    
    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);
    
    expect(logOut).toHaveBeenCalled();
    expect(window.location.href).toBe('/login');
  });

  it('displays the Research Portal heading', () => {
    render(<MainNav {...defaultProps} />);
    
    expect(screen.getByText('Research Portal')).toBeInTheDocument();
  });

  it('applies hover styles to navigation buttons', () => {
    render(<MainNav {...defaultProps} />);
    
    const homeButton = screen.getByLabelText('Home');
    expect(homeButton).toHaveClass('group');
    expect(homeButton).toHaveClass('hover:bg-blue-50');
  });
});