import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import StatusModal from '../components/StatusModal';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import "@testing-library/jest-dom";
import { LazyMotion, domAnimation } from 'framer-motion';
import userEvent from '@testing-library/user-event';

// Create a proper matchMedia mock that returns a MediaQueryList-like object
const createMatchMedia = (matches) => {
  return (query) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated but still used by some packages
    removeListener: vi.fn(), // Deprecated but still used by some packages
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })
};

// Set up the matchMedia mock before tests
beforeAll(() => {
  window.matchMedia = createMatchMedia(false);
});

// Clean up after each test
afterEach(() => {
  cleanup();
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
    vi.clearAllMocks();
  });

  it('renders correctly when closed', () => {
    renderWithMotion(
      <StatusModal isOpen={false} onClose={() => {}} success={true} message="Operation successful!" />
    );

    expect(screen.queryByText('Success')).not.toBeInTheDocument();
    expect(screen.queryByText('Operation successful!')).not.toBeInTheDocument();
  });

  it('renders correctly when open', async () => {
    renderWithMotion(
      <StatusModal isOpen={true} onClose={() => {}} success={true} message="Operation successful!" />
    );

    expect(await screen.findByText('Success')).toBeInTheDocument();
    expect(await screen.findByText('Operation successful!')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const onCloseMock = vi.fn();

    renderWithMotion(
      <StatusModal isOpen={true} onClose={onCloseMock} success={true} message="Done!" />
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    await userEvent.click(closeButton);

    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
});
