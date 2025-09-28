/**
 * Main ColorSplash class - Unified API for color splash effects
 */

import {
  Color,
  ColorTolerance,
  ColorSpace,
  GrayscaleMethod,
  PreviewQuality,
  ColorSplashOptions,
  SplashConfig
} from '../types';
import { applyColorSplash } from './image-processing';
import {
  calculateOptimalPreviewSize,
  resizeImageData,
  PreviewCache,
  PerformanceMonitor
} from './performance-optimization';
import { WebGLBackend } from './webgl-backend';

export class ColorSplash {
  private options: Required<ColorSplashOptions>;
  private cache: PreviewCache;
  private performanceMonitor: PerformanceMonitor;
  private preloadedImage: ImageData | null = null;
  private lastConfig: Partial<SplashConfig> | null = null;
  private webglBackend: WebGLBackend | null = null;

  constructor(options: ColorSplashOptions = {}) {
    // Set default options
    this.options = {
      defaultColorSpace: options.defaultColorSpace || ColorSpace.HSV,
      defaultTolerance: options.defaultTolerance || { hue: 15, saturation: 20, lightness: 25 },
      processingChunkSize: options.processingChunkSize || 50000,
      webWorkers: options.webWorkers || false,
      gpuAcceleration: options.gpuAcceleration || false,
      previewQuality: options.previewQuality || PreviewQuality.MEDIUM,
      maxPreviewSize: options.maxPreviewSize || 500
    };

    this.cache = new PreviewCache();
    this.performanceMonitor = new PerformanceMonitor();
  }

  /**
   * Get current configuration options
   */
  getOptions(): Required<ColorSplashOptions> {
    return { ...this.options };
  }

  /**
   * Select color at specific coordinates in image
   * @param imageData Source image data
   * @param x X coordinate
   * @param y Y coordinate
   * @returns Selected color
   */
  selectColor(imageData: ImageData, x: number, y: number): Color {
    // Clamp coordinates to valid bounds
    const clampedX = Math.max(0, Math.min(Math.floor(x) || 0, imageData.width - 1));
    const clampedY = Math.max(0, Math.min(Math.floor(y) || 0, imageData.height - 1));

    const index = (clampedY * imageData.width + clampedX) * 4;

    return {
      r: imageData.data[index]!,
      g: imageData.data[index + 1]!,
      b: imageData.data[index + 2]!
    };
  }

  /**
   * Preload image for faster subsequent operations
   * @param imageData Image to preload
   */
  async preloadImage(imageData: ImageData): Promise<void> {
    const endTimer = this.performanceMonitor.startTimer('preload_image');

    this.preloadedImage = imageData;

    // Clear any previous cached results since we have a new image
    this.cache.clear();
    this.lastConfig = null;

    endTimer();
  }

  /**
   * Create fast preview with reduced resolution
   * @param imageData Source image data
   * @param targetColors Colors to preserve
   * @param tolerance Color matching tolerance (uses default if not provided)
   * @param quality Preview quality level (uses default if not provided)
   * @returns Fast preview ImageData
   */
  async createFastPreview(
    imageData: ImageData,
    targetColors: Color[],
    tolerance: ColorTolerance = this.options.defaultTolerance,
    quality: PreviewQuality = this.options.previewQuality
  ): Promise<ImageData> {
    const endTimer = this.performanceMonitor.startTimer('create_fast_preview');

    // Generate cache key including quality
    const cacheKey = this.cache.generateCacheKey(
      imageData,
      targetColors,
      tolerance,
      this.options.defaultColorSpace
    ) + `_${quality}`;

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      endTimer();
      return cached;
    }

    // Calculate optimal preview size using class maxPreviewSize
    const previewSize = calculateOptimalPreviewSize(
      imageData.width,
      imageData.height,
      quality,
      this.options.maxPreviewSize
    );

    // Resize image for faster processing
    const resizedImage = resizeImageData(imageData, previewSize.width, previewSize.height);

    // Apply color splash effect on smaller image
    const preview = applyColorSplash(
      resizedImage,
      targetColors,
      tolerance,
      this.options.defaultColorSpace,
      GrayscaleMethod.LUMINANCE
    );

    // Cache the result
    this.cache.set(cacheKey, preview);

    // Store configuration for incremental updates
    this.lastConfig = {
      targetColors,
      tolerance,
      colorSpace: this.options.defaultColorSpace
    };

    endTimer();
    return preview;
  }

  /**
   * Update preview with new parameters (incremental)
   * @param partialConfig Partial configuration to update
   * @returns Updated preview ImageData
   */
  async updatePreview(partialConfig: Partial<SplashConfig>): Promise<ImageData> {
    const endTimer = this.performanceMonitor.startTimer('update_preview');

    if (!this.preloadedImage) {
      throw new Error('No image preloaded. Call preloadImage() first.');
    }

    // Merge with last configuration
    const fullConfig = {
      ...this.lastConfig,
      ...partialConfig
    };

    const targetColors = fullConfig.targetColors || [];
    const tolerance = fullConfig.tolerance || this.options.defaultTolerance;

    const result = await this.createFastPreview(
      this.preloadedImage,
      targetColors,
      tolerance,
      this.options.previewQuality
    );

    endTimer();
    return result;
  }

  /**
   * Apply color splash effect at full resolution
   * @param imageData Source image data
   * @param config Color splash configuration
   * @returns Full resolution result ImageData
   */
  async applyColorSplash(imageData: ImageData, config: SplashConfig): Promise<ImageData> {
    const endTimer = this.performanceMonitor.startTimer('apply_color_splash');

    try {
      // Try GPU acceleration if available
      if (this.options.gpuAcceleration && this.webglBackend && this.webglBackend.isAvailable()) {
        const result = await this.webglBackend.applyColorSplash(
          imageData,
          config.targetColors,
          config.tolerance,
          config.colorSpace || this.options.defaultColorSpace
        );
        endTimer();
        return result;
      }
    } catch (error) {
      console.warn('GPU acceleration failed, falling back to CPU:', error);
      // Fall through to CPU implementation
    }

    // Fallback to CPU implementation
    const result = applyColorSplash(
      imageData,
      config.targetColors,
      config.tolerance,
      config.colorSpace || this.options.defaultColorSpace,
      config.grayscaleMethod || GrayscaleMethod.LUMINANCE
    );

    endTimer();
    return result;
  }

  /**
   * Set preview quality
   * @param quality New preview quality
   */
  setPreviewQuality(quality: PreviewQuality): void {
    this.options.previewQuality = quality;
    this.cache.clear(); // Clear cache since quality changed
  }

  /**
   * Set default color space
   * @param colorSpace New default color space
   */
  setDefaultColorSpace(colorSpace: ColorSpace): void {
    this.options.defaultColorSpace = colorSpace;
    this.cache.clear(); // Clear cache since color space changed
  }

  /**
   * Enable GPU acceleration using WebGL
   * @param canvas Canvas element for WebGL context
   * @returns Promise<boolean> Success status
   */
  async enableGPUAcceleration(canvas: HTMLCanvasElement): Promise<boolean> {
    const endTimer = this.performanceMonitor.startTimer('enable_gpu');

    try {
      this.webglBackend = new WebGLBackend();
      const success = await this.webglBackend.initialize(canvas);

      if (success) {
        this.options.gpuAcceleration = true;
        endTimer();
        return true;
      } else {
        this.webglBackend = null;
        this.options.gpuAcceleration = false;
        endTimer();
        return false;
      }
    } catch (error) {
      console.error('GPU acceleration initialization failed:', error);
      this.webglBackend = null;
      this.options.gpuAcceleration = false;
      endTimer();
      return false;
    }
  }

  /**
   * Disable GPU acceleration
   */
  disableGPUAcceleration(): void {
    if (this.webglBackend) {
      this.webglBackend.dispose();
      this.webglBackend = null;
    }
    this.options.gpuAcceleration = false;
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): { [operationName: string]: { average: number; min: number; max: number; count: number } | null } {
    return this.performanceMonitor.getAllStats();
  }

  /**
   * Clear preview cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Clear performance statistics
   */
  clearPerformanceStats(): void {
    this.performanceMonitor.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size(),
      maxSize: 20 // Current max cache size
    };
  }

  /**
   * Convert to grayscale using default method
   * @param imageData Source image data
   * @param method Grayscale method (optional)
   */
  convertToGrayscale(imageData: ImageData, method: GrayscaleMethod = GrayscaleMethod.LUMINANCE): ImageData {
    const { convertToGrayscale } = require('./image-processing');
    return convertToGrayscale(imageData, method);
  }
}