import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import MainNav from '../components/ResearcherComponents/Navigation/MainNav';
import { logOut } from '../backend/firebase/authFirebase';
import { BrowserRouter } from 'react-router-dom';

// Mock the firebase auth module
vi.mock('../backend/firebase/authFirebase', () => ({
  logOut: vi.fn(() => Promise.resolve())
}));

// Mock window.location
delete window.location;
window.location = { href: '' };

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

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
    renderWithRouter(<MainNav {...defaultProps} />);
    
    expect(screen.getByLabelText('Home')).toBeInTheDocument();
    expect(screen.getByLabelText('My Projects')).toBeInTheDocument();
    expect(screen.getByLabelText('Documents')).toBeInTheDocument();
    expect(screen.getByLabelText('View alerts')).toBeInTheDocument();
    expect(screen.getByLabelText('View profile')).toBeInTheDocument();
  });

  it('renders the search bar', () => {
    renderWithRouter(<MainNav {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search projects...');
    expect(searchInput).toBeInTheDocument();
  });

  it('handles search form submission', () => {
    renderWithRouter(<MainNav {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search projects...');
    const searchForm = searchInput.closest('form');
    
    fireEvent.change(searchInput, { target: { value: 'test search' } });
    fireEvent.submit(searchForm);
    
    expect(defaultProps.onSearch).toHaveBeenCalledWith('test search');
  });

  it('renders mobile menu toggle button on mobile view', () => {
    renderWithRouter(<MainNav {...defaultProps} />);
    
    const menuButton = screen.getByLabelText('Toggle menu');
    expect(menuButton).toBeInTheDocument();
  });

  it('toggles mobile menu when menu button is clicked', () => {
    renderWithRouter(<MainNav {...defaultProps} />);
    
    const menuButton = screen.getByLabelText('Toggle menu');
    fireEvent.click(menuButton);
    
    expect(defaultProps.setMobileMenuOpen).toHaveBeenCalledWith(true);
  });

  it('shows mobile menu content when mobileMenuOpen is true', () => {
    renderWithRouter(<MainNav {...defaultProps} mobileMenuOpen={true} />);
    
    const profileButton = screen.getByText('My Profile');
    expect(profileButton).toBeInTheDocument();
  });

  it('handles logout button click', () => {
    renderWithRouter(<MainNav {...defaultProps} />);
    
    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);
    
    expect(logOut).toHaveBeenCalled();
    expect(window.location.href).toBe('/login');
  });

  it('displays the Research Portal heading', () => {
    renderWithRouter(<MainNav {...defaultProps} />);
    
    expect(screen.getByText('Research Portal')).toBeInTheDocument();
  });

  it('applies correct classes to navigation buttons', () => {
    renderWithRouter(<MainNav {...defaultProps} />);
    
    const homeButton = screen.getByLabelText('Home');
    expect(homeButton).toHaveClass('group');
    expect(homeButton).toHaveClass('hover:bg-blue-50');
    expect(homeButton).toHaveClass('text-gray-600');
  });
});