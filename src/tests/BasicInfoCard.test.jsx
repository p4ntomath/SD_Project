import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import BasicInfoCard from '@/components/ProjectDetailsPage/BasicInfoCard';

describe('BasicInfoCard', () => {
  const mockProject = {
    title: 'Test Project',
    description: 'Test Description',
    duration: '3 months',
    researcherName: 'John Doe',
    status: 'In Progress'
  };

  const mockCalculateProgress = vi.fn().mockReturnValue(75);

  test('renders project details correctly', () => {
    render(<BasicInfoCard project={mockProject} calculateProgress={mockCalculateProgress} />);

    // Check if project status is displayed
    expect(screen.getByText(mockProject.status)).toBeInTheDocument();

    // Check if progress percentage is displayed


    // Check if description is displayed
    expect(screen.getByText(mockProject.description)).toBeInTheDocument();

    // Check if duration is displayed
    expect(screen.getByText(mockProject.duration)).toBeInTheDocument();

    // Check if project owner is displayed
    expect(screen.getByText(mockProject.researcherName)).toBeInTheDocument();
  });

  test('displays "No description provided" when description is missing', () => {
    const projectWithoutDesc = { ...mockProject, description: undefined };
    render(<BasicInfoCard project={projectWithoutDesc} calculateProgress={mockCalculateProgress} />);
    
    expect(screen.getByText('No description provided.')).toBeInTheDocument();
  });

  test('hides duration section when duration is not provided', () => {
    const projectWithoutDuration = { ...mockProject, duration: undefined };
    render(<BasicInfoCard project={projectWithoutDuration} calculateProgress={mockCalculateProgress} />);
    
    expect(screen.queryByText('Duration')).not.toBeInTheDocument();
  });

  test('hides project owner section when researcherName is not provided', () => {
    const projectWithoutResearcher = { ...mockProject, researcherName: undefined };
    render(<BasicInfoCard project={projectWithoutResearcher} calculateProgress={mockCalculateProgress} />);
    
    expect(screen.queryByText('Project Owner')).not.toBeInTheDocument();
  });
});