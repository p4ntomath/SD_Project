import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import DocumentsCard from '@/components/ProjectDetailsPage/DocumentsCard';
import { checkPermission } from '@/utils/permissions';
import { notify } from '@/backend/firebase/notificationsUtil';
import {
  handleCreateFolder,
  handleFileUpload,
  handleDeleteFolder,
  confirmDeleteFolder,
  handleDeleteFile,
  handleDownload,
  handleRenameFolder
} from '@/utils/documentUtils';

// Mock permissions
vi.mock('@/utils/permissions', () => ({
  checkPermission: vi.fn()
}));

// Mock notifications
vi.mock('@/backend/firebase/notificationsUtil', () => ({
  notify: vi.fn()
}));

// Mock document utilities
vi.mock('@/utils/documentUtils', () => ({
  handleCreateFolder: vi.fn(),
  handleFileUpload: vi.fn(),
  handleDeleteFolder: vi.fn(),
  confirmDeleteFolder: vi.fn(),
  handleDeleteFile: vi.fn(),
  handleDownload: vi.fn(),
  handleRenameFolder: vi.fn()
}));

describe('DocumentsCard', () => {
  const mockFolders = [
    {
      id: 'folder1',
      name: 'Test Folder 1',
      files: [
        {
          id: 'file1',
          name: 'test.pdf',
          size: '1.2 MB',
          downloadURL: 'http://example.com/test.pdf'
        }
      ],
      size: 1024 * 1024, // 1MB
      remainingSpace: 1024 * 1024 * 99 // 99MB
    }
  ];

  const mockProps = {
    projectId: 'test-project-id',
    project: {
      title: 'Test Project',
      userId: 'test-user'
    },
    folders: mockFolders,
    setFolders: vi.fn(),
    foldersLoading: false,
    setModalOpen: vi.fn(),
    setError: vi.fn(),
    setStatusMessage: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    checkPermission.mockReturnValue(true);
  });

  test('renders folders and files correctly', () => {
    render(<DocumentsCard {...mockProps} />);

    expect(screen.getByText('Test Folder 1')).toBeInTheDocument();
    expect(screen.getByText('test.pdf')).toBeInTheDocument();
    expect(screen.getByText('1.2 MB')).toBeInTheDocument();
  });

  test('shows loading state', () => {
    render(<DocumentsCard {...mockProps} foldersLoading={true} />);
    expect(screen.getByText('Loading Folders...')).toBeInTheDocument();
  });

  test('shows empty state when no folders exist', () => {
    render(<DocumentsCard {...mockProps} folders={[]} />);
    expect(screen.getByText('No folders yet')).toBeInTheDocument();
  });

  test('handles folder creation', async () => {
    render(<DocumentsCard {...mockProps} />);

    // Open create folder modal
    fireEvent.click(screen.getByRole('button', { name: /new folder/i }));

    // Enter folder name
    const input = screen.getByPlaceholderText(/enter folder name/i);
    fireEvent.change(input, { target: { value: 'New Folder' } });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /create folder$/i }));

    await waitFor(() => {
      expect(handleCreateFolder).toHaveBeenCalledWith(expect.objectContaining({
        newFolderName: 'New Folder',
        projectId: 'test-project-id'
      }));
    });
  });

  test('handles file upload', async () => {
    render(<DocumentsCard {...mockProps} />);

    // Mock file selection
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByTestId('file-upload');
    fireEvent.change(input, { target: { files: [file] } });

    // Fill upload form
    const nameInput = screen.getByPlaceholderText(/enter file name/i);
    fireEvent.change(nameInput, { target: { value: 'test document' } });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /upload file$/i }));

    await waitFor(() => {
      expect(handleFileUpload).toHaveBeenCalledWith(expect.objectContaining({
        selectedFile: file,
        customName: 'test document.txt'
      }));
    });
  });

  test('handles folder deletion', async () => {
    render(<DocumentsCard {...mockProps} />);

    // Click the folder delete button
    const deleteButton = screen.getByRole('button', { name: 'Delete' });
    fireEvent.click(deleteButton);

    // Wait for confirmation dialog and then confirm deletion
    await waitFor(() => {
      expect(handleDeleteFolder).toHaveBeenCalledWith(expect.objectContaining({
        folder: expect.objectContaining({ id: 'folder1' })
      }));
    });
  });

  test('handles folder renaming', async () => {
    render(<DocumentsCard {...mockProps} />);

    // Click rename button
    const renameButton = screen.getByTitle('Rename folder');
    fireEvent.click(renameButton);

    // Enter new name
    const input = screen.getByDisplayValue('Test Folder 1');
    fireEvent.change(input, { target: { value: 'Renamed Folder' } });

    // Save changes
    const saveButton = screen.getByTitle('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(handleRenameFolder).toHaveBeenCalledWith(expect.objectContaining({
        folder: expect.objectContaining({ id: 'folder1' }),
        newName: 'Renamed Folder'
      }));
    });
  });

  test('handles file download', async () => {
    render(<DocumentsCard {...mockProps} />);

    // Find all buttons with SVG icons
    const buttons = screen.getAllByRole('button', { name: '' });
    
    // Find the download button by its unique SVG path
    const downloadButton = buttons.find(button => {
      const path = button.querySelector('path');
      return path && path.getAttribute('d').includes('M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0');
    });

    expect(downloadButton).toBeTruthy();
    expect(downloadButton).toHaveClass('text-blue-600');

    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(handleDownload).toHaveBeenCalledWith(expect.objectContaining({
        downloadURL: 'http://example.com/test.pdf'
      }));
    });
  });

  test('disables actions when user lacks permission', () => {
    checkPermission.mockReturnValue(false);
    render(<DocumentsCard {...mockProps} />);

    expect(screen.queryByRole('button', { name: /new folder/i })).not.toBeInTheDocument();
    expect(screen.queryByTitle('Rename folder')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });

  test('shows correct space usage in folder', () => {
    render(<DocumentsCard {...mockProps} />);

    expect(screen.getByText('Size: 1.00 MB')).toBeInTheDocument();
    expect(screen.getByText('Remaining: 99.00 MB')).toBeInTheDocument();
  });
});