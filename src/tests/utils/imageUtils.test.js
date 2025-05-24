import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateThumbnail } from '../../utils/imageUtils';

// Mock browser APIs
class MockImage {
  constructor() {
    this.width = 800;
    this.height = 600;
  }

  set onload(fn) {
    this._onload = fn;
    // Trigger onload on next tick to simulate async behavior
    Promise.resolve().then(() => this._onload());
  }
}

class MockFileReader {
  constructor() {
    this.result = 'data:image/jpeg;base64,fake';
  }

  set onload(fn) {
    this._onload = fn;
  }

  readAsDataURL(file) {
    // Trigger onload on next tick to simulate async behavior
    Promise.resolve().then(() => this._onload({ target: { result: this.result } }));
  }
}

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

  toBlob(callback, type, quality) {
    // Trigger callback on next tick to simulate async behavior
    Promise.resolve().then(() => callback(new Blob(['mock-blob'], { type: 'image/jpeg' })));
  }
}

describe('imageUtils', () => {
  beforeEach(() => {
    global.Image = MockImage;
    global.FileReader = MockFileReader;
    global.document = {
      createElement: (type) => {
        if (type === 'canvas') return new MockCanvas();
        return null;
      }
    };
  });

  describe('generateThumbnail', () => {
    it('generates thumbnail for landscape image', async () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const thumbnail = await generateThumbnail(file);
      
      expect(thumbnail).toBeInstanceOf(Blob);
      expect(thumbnail.type).toBe('image/jpeg');
    });

    it('generates thumbnail for portrait image', async () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      global.Image = class extends MockImage {
        constructor() {
          super();
          this.width = 600;
          this.height = 800;
        }
      };
      
      const thumbnail = await generateThumbnail(file);
      expect(thumbnail).toBeInstanceOf(Blob);
      expect(thumbnail.type).toBe('image/jpeg');
    });

    it('returns null for non-image files', async () => {
      const file = new File([''], 'test.pdf', { type: 'application/pdf' });
      const thumbnail = await generateThumbnail(file);
      expect(thumbnail).toBeNull();
    });

    it('handles missing file input', async () => {
      const thumbnail = await generateThumbnail(null);
      expect(thumbnail).toBeNull();
    });
  });
});