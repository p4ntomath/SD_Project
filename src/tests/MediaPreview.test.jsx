import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import "@testing-library/jest-dom";
import MediaPreview from '../components/MediaPreview';

// Mock react-icons/fi
vi.mock('react-icons/fi', () => ({
  FiPaperclip: () => <div data-testid="paperclip-icon" />,
  FiX: () => <div data-testid="close-icon" />,
  FiMaximize2: () => <div data-testid="maximize-icon" />,
  FiMinimize2: () => <div data-testid="minimize-icon" />,
  FiDownload: () => <div data-testid="download-icon" />
}));

describe('MediaPreview', () => {
  // Common test data
  const mockImageAttachment = {
    type: 'image/jpeg',
    name: 'test-image.jpg',
    url: 'http://example.com/test-image.jpg',
    thumbnailUrl: 'http://example.com/test-image-thumb.jpg',
    dimensions: { width: 1920, height: 1080 },
    size: 1024 * 1024 // 1MB
  };

  const mockVideoAttachment = {
    type: 'video/mp4',
    name: 'test-video.mp4',
    url: 'http://example.com/test-video.mp4',
    thumbnailUrl: 'http://example.com/test-video-thumb.jpg',
    size: 2 * 1024 * 1024 // 2MB
  };

  const mockAudioAttachment = {
    type: 'audio/mp3',
    name: 'test-audio.mp3',
    url: 'http://example.com/test-audio.mp3',
    size: 512 * 1024 // 512KB
  };

  const mockDocumentAttachment = {
    type: 'application/pdf',
    name: 'test-document.pdf',
    url: 'http://example.com/test-document.pdf',
    size: 1.5 * 1024 * 1024 // 1.5MB
  };

  afterEach(() => {
    cleanup();
  });

  describe('Image Preview', () => {
    it('renders image preview correctly', () => {
      render(<MediaPreview attachment={mockImageAttachment} />);
      
      const image = screen.getByAltText(mockImageAttachment.name);
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', mockImageAttachment.thumbnailUrl);
    });

    it('displays image dimensions', () => {
      render(<MediaPreview attachment={mockImageAttachment} />);
      
      const dimensions = screen.getByText('1920 × 1080');
      expect(dimensions).toBeInTheDocument();
    });

    it('handles fullscreen toggle', () => {
      render(<MediaPreview attachment={mockImageAttachment} />);
      
      // Open fullscreen
      const image = screen.getByAltText(mockImageAttachment.name);
      fireEvent.click(image);
      
      // Check if fullscreen dialog is shown
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      
      // Close fullscreen with close button
      const closeButton = screen.getByLabelText('Close preview');
      fireEvent.click(closeButton);
      
      expect(dialog).not.toBeInTheDocument();
    });

    it('handles escape key in fullscreen mode', () => {
      render(<MediaPreview attachment={mockImageAttachment} />);
      
      // Open fullscreen
      const image = screen.getByAltText(mockImageAttachment.name);
      fireEvent.click(image);
      
      // Press Escape
      fireEvent.keyDown(document, { key: 'Escape' });
      
      // Check if fullscreen is closed
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Video Preview', () => {
    it('renders video preview correctly', () => {
      render(<MediaPreview attachment={mockVideoAttachment} />);
      
      const video = screen.getByLabelText(mockVideoAttachment.name);
      expect(video).toBeInTheDocument();
      expect(video).toBeInstanceOf(HTMLVideoElement);
      expect(video).toHaveAttribute('controls');
      expect(video).toHaveAttribute('poster', mockVideoAttachment.thumbnailUrl);
      expect(video).toHaveAttribute('preload', 'metadata');
      
      const source = video.querySelector('source');
      expect(source).toHaveAttribute('src', mockVideoAttachment.url);
      expect(source).toHaveAttribute('type', mockVideoAttachment.type);
    });

    it('shows download button for video', () => {
      render(<MediaPreview attachment={mockVideoAttachment} />);
      
      const downloadLink = screen.getByLabelText(`Download ${mockVideoAttachment.name}`);
      expect(downloadLink).toBeInTheDocument();
      expect(downloadLink).toHaveAttribute('href', mockVideoAttachment.url);
      expect(downloadLink).toHaveAttribute('download', mockVideoAttachment.name);
    });
  });

  describe('Audio Preview', () => {
    it('renders audio preview correctly', () => {
      render(<MediaPreview attachment={mockAudioAttachment} />);
      
      const audio = screen.getByLabelText(mockAudioAttachment.name);
      expect(audio).toBeInTheDocument();
      expect(audio).toBeInstanceOf(HTMLAudioElement);
      expect(audio).toHaveAttribute('controls');
      expect(audio).toHaveAttribute('preload', 'metadata');
      
      const source = audio.querySelector('source');
      expect(source).toHaveAttribute('src', mockAudioAttachment.url);
      expect(source).toHaveAttribute('type', mockAudioAttachment.type);
    });

    it('shows download button for audio', () => {
      render(<MediaPreview attachment={mockAudioAttachment} />);
      
      const downloadLink = screen.getByLabelText(`Download ${mockAudioAttachment.name}`);
      expect(downloadLink).toBeInTheDocument();
      expect(downloadLink).toHaveAttribute('href', mockAudioAttachment.url);
      expect(downloadLink).toHaveAttribute('download', mockAudioAttachment.name);
    });
  });

  describe('Document Preview', () => {
    it('renders document preview correctly', () => {
      render(<MediaPreview attachment={mockDocumentAttachment} />);
      
      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', mockDocumentAttachment.url);
      expect(link).toHaveAttribute('download', mockDocumentAttachment.name);
      
      const fileName = screen.getByText(mockDocumentAttachment.name);
      expect(fileName).toBeInTheDocument();
      
      const fileSize = screen.getByText('1.5MB');
      expect(fileSize).toBeInTheDocument();
    });
  });

  describe('Common Features', () => {
    it('applies custom className properly', () => {
      const customClass = 'custom-test-class';
      render(<MediaPreview attachment={mockImageAttachment} className={customClass} />);
      
      const container = screen.getByRole('figure');
      expect(container).toHaveClass(customClass);
    });

    it('handles missing optional properties gracefully', () => {
      const minimalAttachment = {
        type: 'image/jpeg',
        name: 'minimal.jpg',
        url: 'http://example.com/minimal.jpg',
        size: 1024
      };
      
      render(<MediaPreview attachment={minimalAttachment} />);
      
      const image = screen.getByAltText(minimalAttachment.name);
      expect(image).toBeInTheDocument();
      // Should not show dimensions
      expect(screen.queryByText(/×/)).not.toBeInTheDocument();
    });
  });
});