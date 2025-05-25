import { describe, it, expect, vi, beforeEach } from 'vitest';
import getCroppedImg from '../components/CropImage';

// Mock browser APIs
class MockCanvas {
  constructor() {
    this.width = 0;
    this.height = 0;
  }

  getContext() {
    return {
      drawImage: vi.fn()
    };
  }

  toBlob(callback) {
    const mockBlob = new Blob(['test'], { type: 'image/jpeg' });
    callback(mockBlob);
  }
}

describe('CropImage', () => {
  let mockCreateElement;
  let mockCreateObjectURL;
  let consoleError;

  beforeEach(() => {
    // Mock document.createElement
    mockCreateElement = vi.fn().mockImplementation((type) => {
      if (type === 'canvas') return new MockCanvas();
      return null;
    });
    document.createElement = mockCreateElement;

    // Mock URL.createObjectURL
    mockCreateObjectURL = vi.fn().mockReturnValue('blob:test-url');
    URL.createObjectURL = mockCreateObjectURL;

    // Mock console.error
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('successfully crops an image', async () => {
    const mockImage = {
      onload: null,
      src: '',
      crossOrigin: ''
    };

    // Mock Image constructor
    global.Image = class {
      constructor() {
        return mockImage;
      }
    };

    const croppedAreaPixels = {
      x: 0,
      y: 0,
      width: 100,
      height: 100
    };

    const cropPromise = getCroppedImg('test-image.jpg', croppedAreaPixels);
    
    // Simulate image load
    mockImage.onload();

    const result = await cropPromise;

    expect(mockCreateElement).toHaveBeenCalledWith('canvas');
    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(result).toBe('blob:test-url');
    expect(mockImage.crossOrigin).toBe('anonymous');
  });

  it('handles image load error', async () => {
    const mockImage = {
      onerror: null,
      src: '',
      crossOrigin: ''
    };

    global.Image = class {
      constructor() {
        return mockImage;
      }
    };

    const croppedAreaPixels = {
      x: 0,
      y: 0,
      width: 100,
      height: 100
    };

    const cropPromise = getCroppedImg('test-image.jpg', croppedAreaPixels);
    
    // Simulate image load error
    mockImage.onerror(new Error('Failed to load'));

    await expect(cropPromise).rejects.toThrow('Image load failed (bad URL or CORS).');
    expect(consoleError).toHaveBeenCalled();
  });

  it('handles blob creation failure', async () => {
    const mockImage = {
      onload: null,
      src: '',
      crossOrigin: ''
    };

    global.Image = class {
      constructor() {
        return mockImage;
      }
    };

    // Mock canvas that returns null blob
    class FailingCanvas extends MockCanvas {
      toBlob(callback) {
        callback(null);
      }
    }

    mockCreateElement.mockImplementation((type) => {
      if (type === 'canvas') return new FailingCanvas();
      return null;
    });

    const croppedAreaPixels = {
      x: 0,
      y: 0,
      width: 100,
      height: 100
    };

    const cropPromise = getCroppedImg('test-image.jpg', croppedAreaPixels);
    mockImage.onload();

    await expect(cropPromise).rejects.toThrow('Failed to crop image.');
  });

  it('validates required parameters', async () => {
    await expect(getCroppedImg()).rejects.toThrow();
    await expect(getCroppedImg('test.jpg')).rejects.toThrow();
  });
});