import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { auth } from '../backend/firebase/firebaseConfig';
import { createProject, fetchProjects } from '../backend/firebase/projectDB';
import ResearcherHome from '../pages/ResearcherPages/ResearcherHome';
import { formatDate, formatFirebaseDate } from '../pages/ResearcherPages/ResearcherHome';
import { act } from '@testing-library/react';
import CreateProjectForm from '../components/CreateProjectForm';


// Mock the firebase auth
vi.mock('../backend/firebase/firebaseConfig', () => ({
  auth: {
    currentUser: {
      uid: 'test-user-id'
    },
    onAuthStateChanged: vi.fn((callback) => {
      callback({ uid: 'test-user-id' });
      return () => {}; // Return unsubscribe function
    })
  }
}));

// Mock the project database functions
vi.mock('../backend/firebase/projectDB', () => ({
  createProject: vi.fn(),
  fetchProjects: vi.fn().mockResolvedValue([])
}));

describe('ResearcherHome date formatting functions', () => {
  // Testing formatDate function
  describe('formatDate', () => {
    it('should return "Not specified" for null or undefined input', () => {
      expect(formatDate(null)).toBe('Not specified');
      expect(formatDate(undefined)).toBe('Not specified');
    });

    it('should format date string correctly', () => {
      const testDate = '2025-04-22';
      const formattedDate = formatDate(testDate);
      expect(formattedDate).toContain('2025');
      expect(formattedDate).toMatch(/Apr|April/);
      expect(formattedDate).toContain('22');
    });
  });

  // Testing formatFirebaseDate function
  describe('formatFirebaseDate', () => {
    it('should return empty string for invalid input', () => {
      expect(formatFirebaseDate(null)).toBe('');
      expect(formatFirebaseDate(undefined)).toBe('');
      expect(formatFirebaseDate('not an object')).toBe('');
    });

    it('should format Firebase timestamp correctly', () => {
      const timestamp = {
        seconds: 1714089600,
        nanoseconds: 0
      };
      const formattedDate = formatFirebaseDate(timestamp);
      expect(formattedDate).toBe('April 26, 2024');
    });
  });
});

describe('CreateProjectForm', () => {
    it('submits valid form and calls onCreate with correct data', async () => {
      const mockOnCreate = vi.fn();
      
      render(
        <CreateProjectForm 
          loading={false}
          onCreate={mockOnCreate}
          onCancel={() => {}}
          isUpdateMode={false}
        />
      );
  
      // Fill out the form
      fireEvent.change(screen.getByLabelText(/title/i), {
        target: { value: 'Test Research Project' }
      });
  
      fireEvent.change(screen.getByLabelText(/description/i), {
        target: { value: 'This is a valid research project description.' }
      });
  
      fireEvent.change(screen.getByLabelText(/research field/i), {
        target: { value: 'Physics' }
      });
  
      fireEvent.change(screen.getByLabelText(/duration/i), {
        target: { value: '6 months' }
      });
  
      const goalInput = screen.getByLabelText(/Goals\* \(Press Enter or comma to add\)/i);

  
      fireEvent.change(goalInput, { target: { value: 'Goal 1' } });
      fireEvent.keyDown(goalInput, { key: 'Enter', code: 'Enter' });
  
      fireEvent.change(goalInput, { target: { value: 'Goal 2' } });
      fireEvent.keyDown(goalInput, { key: 'Enter', code: 'Enter' });
  
      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: /create project/i }));
  
      // Expect onCreate to have been called once
      expect(mockOnCreate).toHaveBeenCalledTimes(1);
  
      const createdProject = mockOnCreate.mock.calls[0][0];
      expect(createdProject.title).toBe('Test Research Project');
      expect(createdProject.goals).toHaveLength(2);
      expect(createdProject.researchField).toBe('Physics');
      expect(createdProject.duration).toBe('6 months');
    });
  });