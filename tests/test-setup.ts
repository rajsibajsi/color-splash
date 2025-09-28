// Test setup and global configurations

// Mock HTMLCanvasElement methods for testing
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: jest.fn(() => ({
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    getImageData: jest.fn(() => new ImageData(100, 100)),
    putImageData: jest.fn(),
    createImageData: jest.fn(() => new ImageData(100, 100)),
    setTransform: jest.fn(),
    drawImage: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
  })),
});

Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
  value: jest.fn((type = 'image/png') => {
    if (type === 'image/jpeg') {
      return 'data:image/jpeg;base64,test';
    }
    if (type === 'image/webp') {
      return 'data:image/webp;base64,test';
    }
    return 'data:image/png;base64,test';
  }),
});

Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
  value: jest.fn((callback, type = 'image/png') => {
    const blob = new Blob(['fake-blob-content'], { type });
    setTimeout(() => callback(blob), 0);
  }),
});

// Mock ImageData constructor with minimal required properties
global.ImageData = class ImageData {
  data: Uint8ClampedArray;
  width: number;
  height: number;
  colorSpace: PredefinedColorSpace = 'srgb';

  constructor(data: Uint8ClampedArray | number, width?: number, height?: number) {
    if (typeof data === 'number') {
      this.width = data;
      this.height = width || data;
      this.data = new Uint8ClampedArray(this.width * this.height * 4);
    } else {
      this.data = data;
      this.width = width || 1;
      this.height = height || 1;
    }
  }
} as any;

// Performance mock for testing
if (!global.performance) {
  global.performance = {
    now: jest.fn(() => Date.now()),
  } as any;
}

// Mock Image constructor for file loading tests
global.Image = class Image {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  src = '';
  width = 100;
  height = 100;
  crossOrigin: string | null = null;

  constructor() {
    setTimeout(() => {
      if (this.onload) this.onload();
    }, 10);
  }
} as any;

// Mock URL methods for blob handling
global.URL = {
  createObjectURL: jest.fn(() => 'blob:mock-url'),
  revokeObjectURL: jest.fn(),
} as any;

// Console warnings for unimplemented canvas features
console.warn = jest.fn();
