/**
 * File I/O Backend for Direct Image Format Support
 * Supports JPEG, PNG, WebP without manual ImageData conversion
 */

export interface FileFormatSupport {
  jpeg: boolean;
  png: boolean;
  webp: boolean;
  gif: boolean;
  bmp: boolean;
}

export interface ImageLoadOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1 for JPEG/WebP compression
  format?: 'jpeg' | 'png' | 'webp';
}

export interface ImageSaveOptions {
  format: 'jpeg' | 'png' | 'webp';
  quality?: number; // 0-1 for JPEG/WebP compression
  filename?: string;
}

export class FileIOBackend {
  private supportedFormats: FileFormatSupport;
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;

  constructor() {
    this.supportedFormats = this.detectFormatSupport();
    this.initializeCanvas();
  }

  /**
   * Detect which image formats are supported by the browser
   */
  private detectFormatSupport(): FileFormatSupport {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;

    return {
      jpeg: canvas.toDataURL('image/jpeg').indexOf('data:image/jpeg') === 0,
      png: canvas.toDataURL('image/png').indexOf('data:image/png') === 0,
      webp: canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0,
      gif: false, // GIF writing not typically supported via canvas
      bmp: false, // BMP not supported via canvas
    };
  }

  /**
   * Initialize internal canvas for image processing
   */
  private initializeCanvas(): void {
    if (typeof document !== 'undefined') {
      this.canvas = document.createElement('canvas');
      this.context = this.canvas.getContext('2d');
    }
  }

  /**
   * Get supported image formats
   */
  getSupportedFormats(): FileFormatSupport {
    return { ...this.supportedFormats };
  }

  /**
   * Check if a specific format is supported
   */
  isFormatSupported(format: string): boolean {
    return this.supportedFormats[format as keyof FileFormatSupport] || false;
  }

  /**
   * Load image from File object
   */
  async loadFromFile(file: File, options: ImageLoadOptions = {}): Promise<ImageData> {
    return new Promise((resolve, reject) => {
      if (!this.canvas || !this.context) {
        reject(new Error('Canvas not available for file processing'));
        return;
      }

      const img = new Image();

      img.onload = (): void => {
        try {
          // Calculate dimensions with optional constraints
          const { width, height } = this.calculateDimensions(
            img.width,
            img.height,
            options.maxWidth,
            options.maxHeight
          );

          // Set canvas size and draw image
          this.canvas!.width = width;
          this.canvas!.height = height;
          this.context!.drawImage(img, 0, 0, width, height);

          // Extract ImageData
          const imageData = this.context!.getImageData(0, 0, width, height);
          resolve(imageData);
        } catch (error) {
          reject(new Error(`Failed to process image: ${error}`));
        }
      };

      img.onerror = (): void => {
        reject(new Error('Failed to load image file'));
      };

      // Create object URL for the file
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Load image from URL
   */
  async loadFromUrl(url: string, options: ImageLoadOptions = {}): Promise<ImageData> {
    return new Promise((resolve, reject) => {
      if (!this.canvas || !this.context) {
        reject(new Error('Canvas not available for URL processing'));
        return;
      }

      const img = new Image();

      // Handle CORS for external URLs
      img.crossOrigin = 'anonymous';

      img.onload = (): void => {
        try {
          // Calculate dimensions with optional constraints
          const { width, height } = this.calculateDimensions(
            img.width,
            img.height,
            options.maxWidth,
            options.maxHeight
          );

          // Set canvas size and draw image
          this.canvas!.width = width;
          this.canvas!.height = height;
          this.context!.drawImage(img, 0, 0, width, height);

          // Extract ImageData
          const imageData = this.context!.getImageData(0, 0, width, height);
          resolve(imageData);
        } catch (error) {
          reject(new Error(`Failed to process image from URL: ${error}`));
        }
      };

      img.onerror = (): void => {
        reject(new Error(`Failed to load image from URL: ${url}`));
      };

      img.src = url;
    });
  }

  /**
   * Load image from Base64 data URL
   */
  async loadFromBase64(dataUrl: string, options: ImageLoadOptions = {}): Promise<ImageData> {
    if (!dataUrl.startsWith('data:image/')) {
      throw new Error('Invalid data URL format');
    }

    return new Promise((resolve, reject) => {
      if (!this.canvas || !this.context) {
        reject(new Error('Canvas not available for Base64 processing'));
        return;
      }

      const img = new Image();

      img.onload = (): void => {
        try {
          // Calculate dimensions with optional constraints
          const { width, height } = this.calculateDimensions(
            img.width,
            img.height,
            options.maxWidth,
            options.maxHeight
          );

          // Set canvas size and draw image
          this.canvas!.width = width;
          this.canvas!.height = height;
          this.context!.drawImage(img, 0, 0, width, height);

          // Extract ImageData
          const imageData = this.context!.getImageData(0, 0, width, height);
          resolve(imageData);
        } catch (error) {
          reject(new Error(`Failed to process Base64 image: ${error}`));
        }
      };

      img.onerror = (): void => {
        reject(new Error('Failed to load Base64 image data'));
      };

      img.src = dataUrl;
    });
  }

  /**
   * Load image from ArrayBuffer
   */
  async loadFromArrayBuffer(
    buffer: ArrayBuffer,
    options: ImageLoadOptions = {}
  ): Promise<ImageData> {
    // Create blob from ArrayBuffer
    const blob = new Blob([buffer]);
    const url = URL.createObjectURL(blob);

    try {
      const imageData = await this.loadFromUrl(url, options);
      return imageData;
    } finally {
      // Clean up object URL
      URL.revokeObjectURL(url);
    }
  }

  /**
   * Save ImageData to various formats
   */
  async saveImageData(imageData: ImageData, options: ImageSaveOptions): Promise<Blob> {
    if (!this.canvas || !this.context) {
      throw new Error('Canvas not available for saving');
    }

    if (!this.isFormatSupported(options.format)) {
      throw new Error(`Format ${options.format} is not supported`);
    }

    // Set canvas size and put image data
    this.canvas.width = imageData.width;
    this.canvas.height = imageData.height;
    this.context.putImageData(imageData, 0, 0);

    // Convert to blob with specified format and quality
    return new Promise((resolve, reject) => {
      this.canvas!.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error(`Failed to convert image to ${options.format} format`));
          }
        },
        this.getMimeType(options.format),
        options.quality || 0.92
      );
    });
  }

  /**
   * Save ImageData as Base64 data URL
   */
  saveAsBase64(imageData: ImageData, options: ImageSaveOptions): string {
    if (!this.canvas || !this.context) {
      throw new Error('Canvas not available for Base64 conversion');
    }

    if (!this.isFormatSupported(options.format)) {
      throw new Error(`Format ${options.format} is not supported`);
    }

    // Set canvas size and put image data
    this.canvas.width = imageData.width;
    this.canvas.height = imageData.height;
    this.context.putImageData(imageData, 0, 0);

    // Convert to data URL
    return this.canvas.toDataURL(this.getMimeType(options.format), options.quality || 0.92);
  }

  /**
   * Download ImageData as file
   */
  async downloadImage(imageData: ImageData, options: ImageSaveOptions): Promise<void> {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      throw new Error('Download not available in this environment');
    }

    const blob = await this.saveImageData(imageData, options);
    const url = URL.createObjectURL(blob);

    try {
      // Create download link
      const a = document.createElement('a');
      a.href = url;
      a.download = options.filename || `image.${options.format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      // Clean up object URL
      URL.revokeObjectURL(url);
    }
  }

  /**
   * Calculate dimensions with optional constraints
   */
  private calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth?: number,
    maxHeight?: number
  ): { width: number; height: number } {
    let width = originalWidth;
    let height = originalHeight;

    // Apply max width constraint
    if (maxWidth && width > maxWidth) {
      const ratio = maxWidth / width;
      width = maxWidth;
      height = Math.round(height * ratio);
    }

    // Apply max height constraint
    if (maxHeight && height > maxHeight) {
      const ratio = maxHeight / height;
      height = maxHeight;
      width = Math.round(width * ratio);
    }

    return { width, height };
  }

  /**
   * Get MIME type for format
   */
  private getMimeType(format: string): string {
    switch (format) {
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'webp':
        return 'image/webp';
      default:
        throw new Error(`Unknown format: ${format}`);
    }
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.canvas = null;
    this.context = null;
  }
}

// Convenience functions for direct usage
export async function loadImageFromFile(
  file: File,
  options?: ImageLoadOptions
): Promise<ImageData> {
  const backend = new FileIOBackend();
  try {
    return await backend.loadFromFile(file, options);
  } finally {
    backend.dispose();
  }
}

export async function loadImageFromUrl(
  url: string,
  options?: ImageLoadOptions
): Promise<ImageData> {
  const backend = new FileIOBackend();
  try {
    return await backend.loadFromUrl(url, options);
  } finally {
    backend.dispose();
  }
}

export async function loadImageFromBase64(
  dataUrl: string,
  options?: ImageLoadOptions
): Promise<ImageData> {
  const backend = new FileIOBackend();
  try {
    return await backend.loadFromBase64(dataUrl, options);
  } finally {
    backend.dispose();
  }
}

export async function saveImageAsBlob(
  imageData: ImageData,
  options: ImageSaveOptions
): Promise<Blob> {
  const backend = new FileIOBackend();
  try {
    return await backend.saveImageData(imageData, options);
  } finally {
    backend.dispose();
  }
}

export function saveImageAsBase64(imageData: ImageData, options: ImageSaveOptions): string {
  const backend = new FileIOBackend();
  try {
    return backend.saveAsBase64(imageData, options);
  } finally {
    backend.dispose();
  }
}
