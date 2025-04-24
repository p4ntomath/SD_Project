import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import StatusModal from '../components/StatusModal';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import "@testing-library/jest-dom";
import { LazyMotion, domAnimation } from 'framer-motion';
import userEvent from '@testing-library/user-event';

// Mock matchMedia to prevent errors related to framer-motion
beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

// Clean up after each test to ensure no state persists
afterEach(() => {
  cleanup(); // Cleans up the DOM after each test
});

// Wrap component in LazyMotion to provide animation context
const renderWithMotion = (component) => {
  return render(
    <LazyMotion features={domAnimation}>
      {component}
    </LazyMotion>
  );
};

describe('StatusModal', () => {
  beforeEach(() => {
    vi.clearAllMocks(); // Clears mocks before each test
  });

  it('renders correctly when closed', () => {
    renderWithMotion(
      <StatusModal isOpen={false} onClose={() => {}} success={true} message="Operation successful!" />
    );

    // Ensure that "Success" is not in the document when modal is closed
    expect(screen.queryByText('Success')).not.toBeInTheDocument();
    expect(screen.queryByText('Operation successful!')).not.toBeInTheDocument();
  });

  it('renders correctly when open', async () => {
    renderWithMotion(
      <StatusModal isOpen={true} onClose={() => {}} success={true} message="Operation successful!" />
    );

    // Wait for the modal content to appear and assert
    expect(await screen.findByText('Success')).toBeInTheDocument();
    expect(await screen.findByText('Operation successful!')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const onCloseMock = vi.fn(); // Mock the onClose function

    renderWithMotion(
      <StatusModal isOpen={true} onClose={onCloseMock} success={true} message="Done!" />
    );

    // Assuming the close button exists and has a role of button
    const closeButton = screen.getByRole('button', { name: /close/i });

    // Simulate a click event on the close button
    await userEvent.click(closeButton);

    // Assert that onClose was called once
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
});
