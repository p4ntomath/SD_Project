import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchUniversities } from '../../utils/universityOptions';

describe('universityOptions', () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    vi.resetAllMocks();
  });

  it('fetches and formats universities successfully', async () => {
    const mockUniversities = [
      { name: 'University of Cape Town' },
      { name: 'University of Pretoria' },
      { name: 'University of the Witwatersrand' }
    ];

    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockUniversities)
      })
    );

    const result = await fetchUniversities();

    expect(fetch).toHaveBeenCalledWith(
      'http://universities.hipolabs.com/search?country=south+africa'
    );

    expect(result).toEqual([
      { value: 'University of Cape Town', label: 'University of Cape Town' },
      { value: 'University of Pretoria', label: 'University of Pretoria' },
      { value: 'University of the Witwatersrand', label: 'University of the Witwatersrand' }
    ]);
  });

  it('handles fetch errors gracefully', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));

    const result = await fetchUniversities();

    expect(fetch).toHaveBeenCalledWith(
      'http://universities.hipolabs.com/search?country=south+africa'
    );
    expect(result).toEqual([]);
  });

  it('handles invalid response data', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(null)
      })
    );

    const result = await fetchUniversities();
    expect(result).toEqual([]);
  });
});