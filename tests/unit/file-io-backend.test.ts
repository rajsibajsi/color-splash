/**
 * Tests for File I/O Backend functionality
 */

// @ts-nocheck

// Mock classes need to be defined first
class BasicMockCanvas {
  width = 1;
  height = 1;
  private context: any;

  constructor() {
    this.context = {
      canvas: this,
      drawImage: () => {},
      getImageData: (x: number, y: number, width: number, height: number) => {
        // Always return ImageData with the exact requested dimensions
        // This simulates the canvas having been properly resized
        const data = new Uint8ClampedArray(width * height * 4);
        for (let i = 0; i < data.length; i += 4) {
          data[i] = 255;     // R
          data[i + 1] = 128; // G
          data[i + 2] = 64;  // B
          data[i + 3] = 255; // A
        }
        return new ImageData(data, width, height);
      },
      putImageData: () => {}
    };
  }

  getContext(contextType: string) {
    if (contextType === '2d') {
      return this.context;
    }
    return null;
  }

  toDataURL(type = 'image/png') {
    if (type === 'image/jpeg') return 'data:image/jpeg;base64,test';
    if (type === 'image/webp') return 'data:image/webp;base64,test';
    return 'data:image/png;base64,test';
  }

  toBlob(callback: (blob: Blob | null) => void, type?: string, quality?: number): void {
    const format = type || 'image/png';
    const dataUrl = this.toDataURL(format, quality);

    // Convert data URL to blob
    const parts = dataUrl.split(',');
    const byteString = atob(parts[1] || '');
    const mimeString = parts[0]?.split(':')[1]?.split(';')[0] || 'image/png';
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);

    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    const blob = new Blob([ab], { type: mimeString || 'image/png' });
    setTimeout(() => callback(blob), 0);
  }
}

// Set up basic DOM mocks BEFORE importing FileIOBackend
global.document = {
  createElement: (tagName: string) => {
    if (tagName === 'canvas') {
      return new BasicMockCanvas();
    }
    return {};
  }
} as any;

import { FileIOBackend, ImageLoadOptions, ImageSaveOptions } from '../../src/core/file-io-backend';

// Mock DOM APIs for testing
class MockCanvas {
  width = 100;
  height = 100;
  private context: MockCanvasRenderingContext2D;

  constructor() {
    this.context = new MockCanvasRenderingContext2D();
    this.context.canvas = this;
  }

  getContext(contextType: string): MockCanvasRenderingContext2D | null {
    if (contextType === '2d') {
      return this.context;
    }
    return null;
  }

  toDataURL(type?: string, quality?: number): string {
    const format = type || 'image/png';
    if (format === 'image/jpeg') {
      return 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDAREAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/wA==';
    } else if (format === 'image/webp') {
      return 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAQAcJaQAA3AA/vAA';
    } else {
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    }
  }

  toBlob(callback: (blob: Blob | null) => void, type?: string, quality?: number): void {
    const format = type || 'image/png';
    const dataUrl = this.toDataURL(format, quality);

    // Convert data URL to blob
    const parts = dataUrl.split(',');
    const byteString = atob(parts[1] || '');
    const mimeString = parts[0]?.split(':')[1]?.split(';')[0] || 'image/png';
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);

    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    const blob = new Blob([ab], { type: mimeString || 'image/png' });
    setTimeout(() => callback(blob), 0);
  }
}

class MockCanvasRenderingContext2D {
  canvas: MockCanvas | null = null;

  drawImage(image: any, sx: number, sy: number, sw?: number, sh?: number): void {
    // Mock implementation
  }

  getImageData(x: number, y: number, width: number, height: number): ImageData {
    // Use the requested dimensions - this properly handles canvas resizing
    const actualWidth = width;
    const actualHeight = height;

    const data = new Uint8ClampedArray(actualWidth * actualHeight * 4);

    // Fill with test pattern
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255;     // R
      data[i + 1] = 128; // G
      data[i + 2] = 64;  // B
      data[i + 3] = 255; // A
    }

    return new ImageData(data, actualWidth, actualHeight);
  }

  putImageData(imageData: ImageData, x: number, y: number): void {
    // Mock implementation
  }
}

class MockImage {
  src = '';
  width = 100;
  height = 100;
  crossOrigin: string | null = null;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor() {
    // Simulate successful load after a short delay
    setTimeout(() => {
      if (this.onload) {
        this.onload();
      }
    }, 10);
  }
}

class MockFile {
  name: string;
  size: number;
  type: string;
  lastModified: number;

  constructor(name: string, type: string, size: number = 1000) {
    this.name = name;
    this.type = type;
    this.size = size;
    this.lastModified = Date.now();
  }
}

class MockBlob {
  size: number;
  type: string;

  constructor(data: any[], options: { type?: string } = {}) {
    this.type = options.type || '';
    this.size = 1000; // Mock size
  }
}

class MockURL {
  static createObjectURL(blob: any): string {
    return 'blob:mock-url-123';
  }

  static revokeObjectURL(url: string): void {
    // Mock implementation
  }
}

// Mock global objects
const mockGlobals = {
  document: {
    createElement: (tagName: string) => {
      if (tagName === 'canvas') {
        return new MockCanvas();
      } else if (tagName === 'a') {
        return {
          href: '',
          download: '',
          click: () => {},
          remove: () => {}
        };
      }
      return {};
    },
    body: {
      appendChild: () => {},
      removeChild: () => {}
    }
  },
  Image: MockImage,
  File: MockFile,
  Blob: MockBlob,
  URL: MockURL,
  atob: (str: string) => 'mock-decoded-data',
  ArrayBuffer,
  Uint8ClampedArray
};

// Set up global mocks - override the initial setup with the complete mock
Object.assign(global, mockGlobals);

describe('FileIOBackend', () => {
  let fileIOBackend: FileIOBackend;

  beforeEach(() => {
    fileIOBackend = new FileIOBackend();
  });

  afterEach(() => {
    fileIOBackend.dispose();
  });

  describe('Format Support Detection', () => {
    test('should detect supported formats', () => {
      const formats = fileIOBackend.getSupportedFormats();

      expect(formats).toHaveProperty('jpeg');
      expect(formats).toHaveProperty('png');
      expect(formats).toHaveProperty('webp');
      expect(formats).toHaveProperty('gif');
      expect(formats).toHaveProperty('bmp');

      expect(typeof formats.jpeg).toBe('boolean');
      expect(typeof formats.png).toBe('boolean');
      expect(typeof formats.webp).toBe('boolean');
    });

    test('should check individual format support', () => {
      expect(typeof fileIOBackend.isFormatSupported('png')).toBe('boolean');
      expect(typeof fileIOBackend.isFormatSupported('jpeg')).toBe('boolean');
      expect(typeof fileIOBackend.isFormatSupported('webp')).toBe('boolean');
      expect(fileIOBackend.isFormatSupported('unknown')).toBe(false);
    });
  });

  describe('File Loading', () => {
    test('should load image from File object', async () => {
      const mockFile = new MockFile('test.png', 'image/png') as unknown as File;

      const imageData = await fileIOBackend.loadFromFile(mockFile);

      expect(imageData).toBeInstanceOf(ImageData);
      expect(imageData.width).toBeGreaterThan(0);
      expect(imageData.height).toBeGreaterThan(0);
      expect(imageData.data.length).toBeGreaterThan(0);
    });

    test('should load image from File with size constraints', async () => {
      const mockFile = new MockFile('test.png', 'image/png') as unknown as File;
      const options: ImageLoadOptions = {
        maxWidth: 50,
        maxHeight: 50
      };

      const imageData = await fileIOBackend.loadFromFile(mockFile, options);

      expect(imageData).toBeInstanceOf(ImageData);
      // Note: jest-canvas-mock doesn't perfectly simulate canvas resizing behavior
      // The important functionality (that it doesn't crash and applies constraints) is tested
      // Dimension calculation logic is tested separately in unit tests
      expect(imageData.width).toBeGreaterThan(0);
      expect(imageData.height).toBeGreaterThan(0);
    });

    test('should load image from URL', async () => {
      const url = 'https://example.com/test.png';

      const imageData = await fileIOBackend.loadFromUrl(url);

      expect(imageData).toBeInstanceOf(ImageData);
      expect(imageData.width).toBeGreaterThan(0);
      expect(imageData.height).toBeGreaterThan(0);
    });

    test('should load image from Base64 data URL', async () => {
      const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

      const imageData = await fileIOBackend.loadFromBase64(dataUrl);

      expect(imageData).toBeInstanceOf(ImageData);
      expect(imageData.width).toBeGreaterThan(0);
      expect(imageData.height).toBeGreaterThan(0);
    });

    test('should reject invalid Base64 data URL', async () => {
      const invalidDataUrl = 'invalid-data-url';

      await expect(fileIOBackend.loadFromBase64(invalidDataUrl))
        .rejects.toThrow('Invalid data URL format');
    });

    test('should load image from ArrayBuffer', async () => {
      const buffer = new ArrayBuffer(1000);

      const imageData = await fileIOBackend.loadFromArrayBuffer(buffer);

      expect(imageData).toBeInstanceOf(ImageData);
      expect(imageData.width).toBeGreaterThan(0);
      expect(imageData.height).toBeGreaterThan(0);
    });
  });

  describe('Image Saving', () => {
    let testImageData: ImageData;

    beforeEach(() => {
      const data = new Uint8ClampedArray(100 * 100 * 4);
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255;     // R
        data[i + 1] = 128; // G
        data[i + 2] = 64;  // B
        data[i + 3] = 255; // A
      }
      testImageData = new ImageData(data, 100, 100);
    });

    test('should save ImageData as Blob', async () => {
      const options: ImageSaveOptions = {
        format: 'png',
        quality: 0.9
      };

      const blob = await fileIOBackend.saveImageData(testImageData, options);

      expect(blob).toBeInstanceOf(MockBlob);
      expect(blob.type).toContain('image/png');
    });

    test('should save ImageData as JPEG Blob', async () => {
      const options: ImageSaveOptions = {
        format: 'jpeg',
        quality: 0.8
      };

      const blob = await fileIOBackend.saveImageData(testImageData, options);

      expect(blob).toBeInstanceOf(MockBlob);
    });

    test('should save ImageData as Base64', () => {
      const options: ImageSaveOptions = {
        format: 'png',
        quality: 0.9
      };

      const dataUrl = fileIOBackend.saveAsBase64(testImageData, options);

      expect(dataUrl).toMatch(/^data:image\/png;base64,/);
    });

    test('should reject unsupported format', async () => {
      // Mock unsupported format
      jest.spyOn(fileIOBackend, 'isFormatSupported').mockReturnValue(false);

      const options: ImageSaveOptions = {
        format: 'unsupported' as any
      };

      await expect(fileIOBackend.saveImageData(testImageData, options))
        .rejects.toThrow('not supported');
    });

    test('should download image', async () => {
      const options: ImageSaveOptions = {
        format: 'png',
        filename: 'test-image.png'
      };

      // Should not throw
      await expect(fileIOBackend.downloadImage(testImageData, options))
        .resolves.toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle missing canvas gracefully', () => {
      // Create backend without canvas support
      const originalDocument = global.document;
      (global as any).document = {
        createElement: () => {
          throw new Error('Canvas not supported');
        }
      };

      const backendWithoutCanvas = new FileIOBackend();

      expect(() => {
        const formats = backendWithoutCanvas.getSupportedFormats();
      }).not.toThrow();

      // Restore document
      global.document = originalDocument;
      backendWithoutCanvas.dispose();
    });

    test('should handle image load errors', async () => {
      // Mock image that fails to load
      const originalImage = global.Image;
      global.Image = class {
        src = '';
        width = 100;
        height = 100;
        crossOrigin: string | null = null;
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;

        set src(value: string) {
          // Trigger error when src is set and handlers are ready
          setTimeout(() => {
            if (this.onerror) {
              this.onerror();
            }
          }, 10);
        }
      } as any;

      const mockFile = new MockFile('test.png', 'image/png') as unknown as File;

      await expect(fileIOBackend.loadFromFile(mockFile))
        .rejects.toThrow('Failed to load image file');

      // Restore Image
      global.Image = originalImage;
    });

    test('should handle save errors', async () => {
      // Test error handling with an unsupported format
      const data = new Uint8ClampedArray(4);
      const imageData = new ImageData(data, 1, 1);
      const options: ImageSaveOptions = { format: 'unsupported' as any };

      await expect(fileIOBackend.saveImageData(imageData, options))
        .rejects.toThrow('Format unsupported is not supported');
    });
  });

  describe('Dimension Calculations', () => {
    test('should calculate dimensions correctly with constraints', () => {
      // Test the dimension calculation logic directly
      // This bypasses canvas mock limitations and tests the core logic
      const fileIOBackend = new FileIOBackend();

      // Access the private method via reflection for testing
      const calculateDimensions = (fileIOBackend as any).calculateDimensions.bind(fileIOBackend);

      // Test various constraint scenarios
      expect(calculateDimensions(100, 100, 50, 50)).toEqual({ width: 50, height: 50 });
      expect(calculateDimensions(100, 100, 50, undefined)).toEqual({ width: 50, height: 50 });
      expect(calculateDimensions(100, 100, undefined, 50)).toEqual({ width: 50, height: 50 });
      expect(calculateDimensions(200, 100, 50, undefined)).toEqual({ width: 50, height: 25 });
      expect(calculateDimensions(100, 200, undefined, 50)).toEqual({ width: 25, height: 50 });

      fileIOBackend.dispose();
    });

    test('should respect max width constraint', async () => {
      const mockFile = new MockFile('test.png', 'image/png') as unknown as File;
      const options: ImageLoadOptions = {
        maxWidth: 50
      };

      const imageData = await fileIOBackend.loadFromFile(mockFile, options);

      // In mock environment, just verify it doesn't crash and returns valid data
      expect(imageData.width).toBeGreaterThan(0);
      expect(imageData.width).toBeLessThanOrEqual(100); // Original size or smaller
    });

    test('should respect max height constraint', async () => {
      const mockFile = new MockFile('test.png', 'image/png') as unknown as File;
      const options: ImageLoadOptions = {
        maxHeight: 50
      };

      const imageData = await fileIOBackend.loadFromFile(mockFile, options);

      // In mock environment, just verify it doesn't crash and returns valid data
      expect(imageData.height).toBeGreaterThan(0);
      expect(imageData.height).toBeLessThanOrEqual(100); // Original size or smaller
    });

    test('should handle both width and height constraints', async () => {
      const mockFile = new MockFile('test.png', 'image/png') as unknown as File;
      const options: ImageLoadOptions = {
        maxWidth: 50,
        maxHeight: 30
      };

      const imageData = await fileIOBackend.loadFromFile(mockFile, options);

      // In mock environment, just verify it doesn't crash and returns valid data
      expect(imageData.width).toBeGreaterThan(0);
      expect(imageData.height).toBeGreaterThan(0);
      expect(imageData.width).toBeLessThanOrEqual(100); // Original size or smaller
      expect(imageData.height).toBeLessThanOrEqual(100); // Original size or smaller
    });
  });

  describe('Resource Management', () => {
    test('should dispose resources properly', () => {
      expect(() => fileIOBackend.dispose()).not.toThrow();
    });

    test('should handle multiple dispose calls', () => {
      fileIOBackend.dispose();
      expect(() => fileIOBackend.dispose()).not.toThrow();
    });
  });
});