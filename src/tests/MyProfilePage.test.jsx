import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MyProfilePage from '../pages/MyProfilePage';
import { vi } from 'vitest';

// Suppress console warnings for controlled/uncontrolled input warnings
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    if (typeof args[0] === 'string' && (
      args[0].includes('Warning:') ||
      args[0].includes('changing a controlled input to be uncontrolled') ||
      args[0].includes('A component is changing a controlled input')
    )) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args) => {
    if (typeof args[0] === 'string' && (
      args[0].includes('Warning:') ||
      args[0].includes('changing a controlled input')
    )) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Mock Firebase modules
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  onAuthStateChanged: vi.fn((auth, callback) => {
    callback({ 
      uid: '123',
      metadata: { creationTime: '2023-01-01T00:00:00Z' }
    });
    return () => {};
  }),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  initializeFirestore: vi.fn(() => ({})),
  persistentLocalCache: vi.fn(() => ({})),
  persistentMultipleTabManager: vi.fn(() => ({})),
  CACHE_SIZE_UNLIMITED: 'unlimited',
  doc: vi.fn(),
  getDoc: vi.fn(() => Promise.resolve({
    exists: () => true,
    data: () => ({
      fullName: 'Test User',
      role: 'researcher',
      bio: 'Test bio',
      fieldOfResearch: 'AI',
      institution: 'Test University',
      department: 'Computer Science',
      profilePicture: 'https://example.com/profile.jpg'
    }),
  })),
}));

vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(() => ({})),
}));

// Mock additional dependencies
vi.mock('react-easy-crop', () => ({
  default: ({ onCropComplete, onCropChange, onZoomChange }) => {
    // Simulate crop interactions using useEffect
    const React = require('react');
    React.useEffect(() => {
      onCropComplete?.(null, { x: 10, y: 10, width: 100, height: 100 });
    }, [onCropComplete]);
    
    return (
      <div data-testid="cropper">
        <button 
          onClick={() => onCropChange?.({ x: 5, y: 5 })}
          data-testid="crop-change"
        >
          Change Crop
        </button>
        <button 
          onClick={() => onZoomChange?.(1.5)}
          data-testid="zoom-change"
        >
          Change Zoom
        </button>
      </div>
    );
  }
}));

vi.mock('browser-image-compression', () => ({
  default: vi.fn((file) => Promise.resolve(new File(['compressed'], 'compressed.jpg', { type: 'image/jpeg' })))
}));

vi.mock('../components/CropImage', () => ({
  default: vi.fn(() => Promise.resolve('data:image/jpeg;base64,mockedcroppedimage'))
}));

vi.mock('react-spinners', () => ({
  ClipLoader: ({ color, size, className }) => (
    <div data-testid="clip-loader" className={className} style={{ color, fontSize: size }}>
      Loading...
    </div>
  )
}));

vi.mock('react-select', () => ({
  default: ({ value, onChange, options, placeholder, onInputChange }) => (
    <div data-testid="react-select">
      <input
        data-testid="select-input"
        placeholder={placeholder}
        value={value?.label || ''}
        onChange={(e) => {
          const option = options?.find(opt => opt.label === e.target.value);
          onChange?.(option);
        }}
      />
      <div data-testid="select-options">
        {options?.map(option => (
          <button 
            key={option.value}
            onClick={() => onChange?.(option)}
            data-testid={`option-${option.value}`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}));

vi.mock('../utils/universityOptions', () => ({
  fetchUniversities: vi.fn(() => Promise.resolve([
    { value: 'university1', label: 'University 1' },
    { value: 'university2', label: 'University 2' }
  ]))
}));

// Mock profile functions
vi.mock('../backend/firebase/viewprofile', () => ({
  updateUserProfile: vi.fn(),
  uploadUserProfilePicture: vi.fn(),
  deleteProfilePicture: vi.fn()
}));

// Mock UI components
vi.mock('../components/ResearcherComponents/Navigation/MainNav', () => ({
  default: () => <nav>MainNav</nav>,
}));

vi.mock('../components/ReviewerComponents/Navigation/ReviewerMainNav', () => ({
  default: () => <nav>ReviewerMainNav</nav>,
}));

vi.mock('../components/ResearcherComponents/Navigation/MobileBottomNav', () => ({
  default: () => <footer>MobileNav</footer>,
}));

vi.mock('../components/ReviewerComponents/Navigation/ReviewerMobileBottomNav', () => ({
  default: () => <footer>ReviewerMobileNav</footer>,
}));

// Import the mocked functions
import { updateUserProfile, uploadUserProfilePicture, deleteProfilePicture } from '../backend/firebase/viewprofile';
import { onAuthStateChanged } from 'firebase/auth';
import { getDoc } from 'firebase/firestore';

describe('MyProfilePage', () => {
  const mockUser = {
    uid: '123',
    metadata: { creationTime: '2023-01-01T00:00:00Z' }
  };

  const mockUserData = {
    fullName: 'Test User',
    role: 'researcher',
    bio: 'Test bio',
    fieldOfResearch: 'AI',
    institution: 'Test University',
    department: 'Computer Science',
    profilePicture: 'https://example.com/profile.jpg'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => mockUserData
    });
    vi.mocked(onAuthStateChanged).mockImplementation((auth, callback) => {
      callback(mockUser);
      return () => {};
    });
  });

  test('renders researcher navigation', async () => {
    render(<MyProfilePage />);
    expect(await screen.findByText(/MainNav/i)).toBeInTheDocument();
    expect(screen.getByText(/MobileNav/i)).toBeInTheDocument();
  });

  test('shows researcher form fields', async () => {
    render(<MyProfilePage />);
    expect(await screen.findByLabelText(/Name/i)).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /Research Field/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /Biography/i })).toBeInTheDocument();
  });

  test('allows typing into name field', async () => {
    render(<MyProfilePage />);
    const nameInput = await screen.findByLabelText(/Name/i);
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Updated Name');
    expect(screen.getByDisplayValue(/Updated Name/i)).toBeInTheDocument();
  });

  test('shows Save Changes button', async () => {
    render(<MyProfilePage />);
    const button = await screen.findByRole('button', { name: /Save Changes/i });
    expect(button).toBeEnabled();
  });

  describe('User Role Handling', () => {
    test('renders reviewer navigation for reviewer role', async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({ ...mockUserData, role: 'reviewer' })
      });

      render(<MyProfilePage />);
      
      expect(await screen.findByText('ReviewerMainNav')).toBeInTheDocument();
      expect(screen.getByText('ReviewerMobileNav')).toBeInTheDocument();
    });

    test('hides research field for reviewer role', async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({ ...mockUserData, role: 'reviewer' })
      });

      render(<MyProfilePage />);
      
      await waitFor(() => {
        expect(screen.queryByLabelText(/Research Field/i)).not.toBeInTheDocument();
      });
    });


  });

  describe('Profile Image Functionality', () => {
    test('displays initials when no profile picture', async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({ ...mockUserData, profilePicture: '' })
      });

      render(<MyProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('TU')).toBeInTheDocument(); // Test User initials
      });
    });

    test('displays profile picture when available', async () => {
      render(<MyProfilePage />);
      
      const profileImage = await screen.findByAltText('Profile Avatar');
      expect(profileImage).toHaveAttribute('src', mockUserData.profilePicture);
    });

    

    

    test('shows photo edit modal when edit button is clicked', async () => {
      render(<MyProfilePage />);
      
      const editButton = await screen.findByText('Edit Photo');
      await userEvent.click(editButton);
      
      expect(screen.getByText('Edit Profile Photo')).toBeInTheDocument();
    });

    test('handles profile picture deletion', async () => {
      vi.mocked(deleteProfilePicture).mockResolvedValue();
      
      render(<MyProfilePage />);
      
      const editButton = await screen.findByText('Edit Photo');
      await userEvent.click(editButton);
      
      const deleteButton = screen.getByText('Delete Photo');
      await userEvent.click(deleteButton);
      
      await waitFor(() => {
        expect(deleteProfilePicture).toHaveBeenCalled();
      });
    });
  });

  describe('Institution Selection', () => {
    test('renders institution dropdown with options', async () => {
      render(<MyProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('react-select')).toBeInTheDocument();
      });
    });

    test('shows custom institution input when requested', async () => {
      render(<MyProfilePage />);
      
      const customButton = await screen.findByText("Can't find your institution? Add it manually");
      await userEvent.click(customButton);
      
      expect(screen.getByPlaceholderText('Enter your institution name')).toBeInTheDocument();
    });

    test('handles custom institution addition', async () => {
      render(<MyProfilePage />);
      
      const customButton = await screen.findByText("Can't find your institution? Add it manually");
      await userEvent.click(customButton);
      
      const customInput = screen.getByPlaceholderText('Enter your institution name');
      await userEvent.type(customInput, 'Custom University');
      
      const addButton = screen.getByText('Add');
      await userEvent.click(addButton);
      
      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Enter your institution name')).not.toBeInTheDocument();
      });
    });

    test('cancels custom institution entry', async () => {
      render(<MyProfilePage />);
      
      const customButton = await screen.findByText("Can't find your institution? Add it manually");
      await userEvent.click(customButton);
      
      const cancelButton = screen.getByText('Cancel');
      await userEvent.click(cancelButton);
      
      expect(screen.queryByPlaceholderText('Enter your institution name')).not.toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    test('shows success message when profile is updated', async () => {
      vi.mocked(updateUserProfile).mockResolvedValue();
      
      render(<MyProfilePage />);
      
      const nameInput = await screen.findByLabelText(/Name/i);
      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, 'Updated Name');
      
      const submitButton = screen.getByRole('button', { name: /Save Changes/i });
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Profile updated successfully!')).toBeInTheDocument();
      });
    });

    test('shows error message when profile update fails', async () => {
      vi.mocked(updateUserProfile).mockRejectedValue(new Error('Update failed'));
      
      render(<MyProfilePage />);
      
      const nameInput = await screen.findByLabelText(/Name/i);
      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, 'Updated Name');
      
      const submitButton = screen.getByRole('button', { name: /Save Changes/i });
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Failed to update profile/)).toBeInTheDocument();
      });
    });

    test('shows info message when no changes are made', async () => {
      render(<MyProfilePage />);
      
      const submitButton = await screen.findByRole('button', { name: /Save Changes/i });
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('No changes to save')).toBeInTheDocument();
      });
    });

    test('disables submit button while saving', async () => {
      vi.mocked(updateUserProfile).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      render(<MyProfilePage />);
      
      const nameInput = await screen.findByLabelText(/Name/i);
      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, 'Updated Name');
      
      const submitButton = screen.getByRole('button', { name: /Save Changes/i });
      await userEvent.click(submitButton);
      
      expect(screen.getByText('Saving...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    test('handles auth state change errors gracefully', async () => {
      vi.mocked(getDoc).mockRejectedValue(new Error('Firestore error'));
      
      render(<MyProfilePage />);
      
      // Component should still render despite the error
      await waitFor(() => {
        expect(screen.getByText('My Profile')).toBeInTheDocument();
      });
    });

    test('handles missing user data gracefully', async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false,
        data: () => null
      });
      
      render(<MyProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('My Profile')).toBeInTheDocument();
      });
    });

   
  });

  describe('Modal Interactions', () => {
    test('closes status modal when close button is clicked', async () => {
      render(<MyProfilePage />);
      
      const submitButton = await screen.findByRole('button', { name: /Save Changes/i });
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('No changes to save')).toBeInTheDocument();
      });
      
      const closeButton = screen.getByText('Close');
      await userEvent.click(closeButton);
      
      expect(screen.queryByText('No changes to save')).not.toBeInTheDocument();
    });

   });



 
});
