import React from 'react';
import { render,screen } from '@testing-library/react';
import StatusModal from '../components/StatusModal';
import { describe,it,expect } from 'vitest';
import "@testing-library/jest-dom"

describe('StatusModal', () => {
  it('renders correctly when open', () => {
    const { getByText } = render(
      <StatusModal isOpen={true} onClose={() => {}} success={true} message="Operation successful!" />
    );

    expect(getByText('Success')).toBeInTheDocument();
    expect(getByText('Operation successful!')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    const { queryByText } = render(
      <StatusModal isOpen={false} onClose={() => {}} success={true} message="Operation successful!" />
    );

    expect(queryByText('Success')).not.toBeInTheDocument();
  });
});

