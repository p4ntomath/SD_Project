import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { describe, it, expect, beforeEach } from 'vitest';
import { useDebounce } from '../hooks/useDebounce';
import { useExport } from '../hooks/useExport';
import { auth } from '../backend/firebase/firebaseConfig';
import { handleDashboardExport } from '../backend/firebase/csv_report';
import { 
  generateProjectOverviewPdf,
  generateFundingHistoryReportPdf,
  generateProgressReportPdf,
  generateTeamReportPdf,
  generateFolderReportPdf,
  generateReviewedProjectsReportPdf,
} from '../backend/firebase/pdf_report';

// Mock Firebase modules
vi.mock('../backend/firebase/firebaseConfig', () => ({
  auth: {
    currentUser: { uid: 'test-user' }
  }
}));

vi.mock('../backend/firebase/csv_report', () => ({
  handleDashboardExport: vi.fn()
}));

vi.mock('../backend/firebase/pdf_report', () => ({
  generateProjectOverviewPdf: vi.fn(),
  generateFundingHistoryReportPdf: vi.fn(),
  generateProgressReportPdf: vi.fn(),
  generateTeamReportPdf: vi.fn(),
  generateFolderReportPdf: vi.fn(),
  generateReviewedProjectsReportPdf: vi.fn()
}));

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial value'));
    expect(result.current).toBe('initial value');
  });

  it('debounces value changes', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'initial' } }
    );

    // Initial value should be set immediately
    expect(result.current).toBe('initial');

    // Change the value
    rerender({ value: 'changed' });

    // Value shouldn't change immediately
    expect(result.current).toBe('initial');

    // Fast forward past debounce delay
    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    // Now the value should be updated
    expect(result.current).toBe('changed');
  });

  it('cleans up timeout on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
    const { unmount } = renderHook(() => useDebounce('test'));
    
    unmount();
    
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});

describe('useExport', () => {
  const mockShowExportDialog = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useExport());
    
    expect(result.current.exportLoading).toBe(false);
    expect(result.current.showExportMenu).toBe(false);
    expect(typeof result.current.handleExport).toBe('function');
  });

  it('handles CSV export correctly', async () => {
    const { result } = renderHook(() => useExport());

    await act(async () => {
      await result.current.handleExport('projects', 'csv', {
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        projectIds: ['1', '2']
      }, mockShowExportDialog);
    });

    expect(handleDashboardExport).toHaveBeenCalledWith(
      'test-user',
      'projects',
      expect.objectContaining({
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        projectIds: ['1', '2']
      })
    );
  });

  it('handles PDF export correctly', async () => {
    const { result } = renderHook(() => useExport());

    await act(async () => {
      await result.current.handleExport('projects', 'pdf', {
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        projectIds: ['1', '2']
      }, mockShowExportDialog);
    });

    expect(generateProjectOverviewPdf).toHaveBeenCalledWith(
      'test-user',
      expect.objectContaining({
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        projectIds: ['1', '2']
      })
    );
  });

  it('handles dashboard export correctly', async () => {
    const { result } = renderHook(() => useExport());

    await act(async () => {
      await result.current.handleExport('dashboard', 'pdf', {}, mockShowExportDialog);
    });

    expect(generateProjectOverviewPdf).toHaveBeenCalled();
    expect(generateFundingHistoryReportPdf).toHaveBeenCalled();
    expect(generateProgressReportPdf).toHaveBeenCalled();
    expect(generateTeamReportPdf).toHaveBeenCalled();
  });

  it('handles export error correctly', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    handleDashboardExport.mockRejectedValueOnce(new Error('Export failed'));
    
    const { result } = renderHook(() => useExport());

    await act(async () => {
      try {
        await result.current.handleExport('projects', 'csv', {}, mockShowExportDialog);
      } catch (error) {
        expect(error.message).toBe('Export failed');
      }
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith('Export failed:', expect.any(Error));
    expect(result.current.exportLoading).toBe(false);
    
    consoleErrorSpy.mockRestore();
  });

  it('handles unauthorized user correctly', async () => {
    vi.spyOn(auth, 'currentUser', 'get').mockReturnValueOnce(null);
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const { result } = renderHook(() => useExport());

    await act(async () => {
      await result.current.handleExport('projects', 'csv', {}, mockShowExportDialog);
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith('No user logged in');
    expect(result.current.exportLoading).toBe(false);
    
    consoleErrorSpy.mockRestore();
  });
});