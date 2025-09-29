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
  SplashConfig,
  SelectionArea,
} from '../types';
import { applyColorSplash } from './image-processing';
import { isColorSimilar } from '../algorithms/color-similarity';
import {
  calculateOptimalPreviewSize,
  resizeImageData,
  PreviewCache,
  PerformanceMonitor,
} from './performance-optimization';
import {
  FileIOBackend,
  ImageLoadOptions,
  ImageSaveOptions,
  FileFormatSupport,
} from './file-io-backend';
import { WebGLBackend } from './webgl-backend';
import { SelectionAreaProcessor } from './area-processor';

export class ColorSplash {
  private options: Required<ColorSplashOptions>;
  private cache: PreviewCache;
  private performanceMonitor: PerformanceMonitor;
  private preloadedImage: ImageData | null = null;
  private lastConfig: Partial<SplashConfig> | null = null;
  private fileIOBackend: FileIOBackend;
  private webglBackend: WebGLBackend | null = null;
  private areaProcessor: SelectionAreaProcessor;

  constructor(options: ColorSplashOptions = {}) {
    // Set default options
    this.options = {
      defaultColorSpace: options.defaultColorSpace || ColorSpace.HSV,
      defaultTolerance: options.defaultTolerance || { hue: 15, saturation: 20, lightness: 25 },
      processingChunkSize: options.processingChunkSize || 50000,
      webWorkers: options.webWorkers || false,
      gpuAcceleration: options.gpuAcceleration || false,
      previewQuality: options.previewQuality || PreviewQuality.MEDIUM,
      maxPreviewSize: options.maxPreviewSize || 500,
    };

    this.cache = new PreviewCache();
    this.performanceMonitor = new PerformanceMonitor();
    this.fileIOBackend = new FileIOBackend();
    this.areaProcessor = new SelectionAreaProcessor();
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
      b: imageData.data[index + 2]!,
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
    const cacheKey =
      this.cache.generateCacheKey(
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
      colorSpace: this.options.defaultColorSpace,
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
      ...partialConfig,
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
      // Fall through to CPU implementation when GPU acceleration fails
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
  getPerformanceStats(): {
    [operationName: string]: { average: number; min: number; max: number; count: number } | null;
  } {
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
      maxSize: 20, // Current max cache size
    };
  }

  /**
   * Convert to grayscale using default method
   * @param imageData Source image data
   * @param method Grayscale method (optional)
   */
  convertToGrayscale(
    imageData: ImageData,
    method: GrayscaleMethod = GrayscaleMethod.LUMINANCE
  ): ImageData {
    // Import dynamically to avoid circular dependency
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { convertToGrayscale } = require('./image-processing');
    return convertToGrayscale(imageData, method);
  }

  // File I/O Methods

  /**
   * Load image from File object
   * @param file File object to load
   * @param options Loading options
   * @returns Promise<ImageData> Loaded image data
   */
  async loadFromFile(file: File, options?: ImageLoadOptions): Promise<ImageData> {
    const endTimer = this.performanceMonitor.startTimer('load_from_file');
    try {
      const imageData = await this.fileIOBackend.loadFromFile(file, options);
      endTimer();
      return imageData;
    } catch (error) {
      endTimer();
      throw error;
    }
  }

  /**
   * Load image from URL
   * @param url URL to load image from
   * @param options Loading options
   * @returns Promise<ImageData> Loaded image data
   */
  async loadFromUrl(url: string, options?: ImageLoadOptions): Promise<ImageData> {
    const endTimer = this.performanceMonitor.startTimer('load_from_url');
    try {
      const imageData = await this.fileIOBackend.loadFromUrl(url, options);
      endTimer();
      return imageData;
    } catch (error) {
      endTimer();
      throw error;
    }
  }

  /**
   * Load image from Base64 data URL
   * @param dataUrl Base64 data URL
   * @param options Loading options
   * @returns Promise<ImageData> Loaded image data
   */
  async loadFromBase64(dataUrl: string, options?: ImageLoadOptions): Promise<ImageData> {
    const endTimer = this.performanceMonitor.startTimer('load_from_base64');
    try {
      const imageData = await this.fileIOBackend.loadFromBase64(dataUrl, options);
      endTimer();
      return imageData;
    } catch (error) {
      endTimer();
      throw error;
    }
  }

  /**
   * Load image from ArrayBuffer
   * @param buffer ArrayBuffer containing image data
   * @param options Loading options
   * @returns Promise<ImageData> Loaded image data
   */
  async loadFromArrayBuffer(buffer: ArrayBuffer, options?: ImageLoadOptions): Promise<ImageData> {
    const endTimer = this.performanceMonitor.startTimer('load_from_array_buffer');
    try {
      const imageData = await this.fileIOBackend.loadFromArrayBuffer(buffer, options);
      endTimer();
      return imageData;
    } catch (error) {
      endTimer();
      throw error;
    }
  }

  /**
   * Save processed image as Blob
   * @param imageData Processed image data
   * @param options Save options
   * @returns Promise<Blob> Image blob
   */
  async saveAsBlob(imageData: ImageData, options: ImageSaveOptions): Promise<Blob> {
    const endTimer = this.performanceMonitor.startTimer('save_as_blob');
    try {
      const blob = await this.fileIOBackend.saveImageData(imageData, options);
      endTimer();
      return blob;
    } catch (error) {
      endTimer();
      throw error;
    }
  }

  /**
   * Save processed image as Base64 data URL
   * @param imageData Processed image data
   * @param options Save options
   * @returns Base64 data URL
   */
  saveAsBase64(imageData: ImageData, options: ImageSaveOptions): string {
    const endTimer = this.performanceMonitor.startTimer('save_as_base64');
    try {
      const dataUrl = this.fileIOBackend.saveAsBase64(imageData, options);
      endTimer();
      return dataUrl;
    } catch (error) {
      endTimer();
      throw error;
    }
  }

  /**
   * Download processed image as file
   * @param imageData Processed image data
   * @param options Save options with filename
   */
  async downloadImage(imageData: ImageData, options: ImageSaveOptions): Promise<void> {
    const endTimer = this.performanceMonitor.startTimer('download_image');
    try {
      await this.fileIOBackend.downloadImage(imageData, options);
      endTimer();
    } catch (error) {
      endTimer();
      throw error;
    }
  }

  /**
   * Get supported image formats
   * @returns Object with format support information
   */
  getSupportedFormats(): FileFormatSupport {
    return this.fileIOBackend.getSupportedFormats();
  }

  /**
   * Check if a specific format is supported
   * @param format Format to check (jpeg, png, webp)
   * @returns Boolean indicating support
   */
  isFormatSupported(format: string): boolean {
    return this.fileIOBackend.isFormatSupported(format);
  }

  /**
   * Process image file with color splash and return result
   * @param file Input file
   * @param config Color splash configuration
   * @param loadOptions Loading options
   * @param saveOptions Save options
   * @returns Promise<Blob> Processed image blob
   */
  async processFile(
    file: File,
    config: SplashConfig,
    loadOptions?: ImageLoadOptions,
    saveOptions?: ImageSaveOptions
  ): Promise<Blob> {
    const endTimer = this.performanceMonitor.startTimer('process_file');

    try {
      // Load image from file
      const imageData = await this.loadFromFile(file, loadOptions);

      // Apply color splash effect
      const processedImageData = await this.applyColorSplash(imageData, config);

      // Save as blob with specified options
      const defaultSaveOptions: ImageSaveOptions = {
        format: 'png',
        quality: 0.92,
        ...saveOptions,
      };

      const blob = await this.saveAsBlob(processedImageData, defaultSaveOptions);
      endTimer();
      return blob;
    } catch (error) {
      endTimer();
      throw error;
    }
  }

  /**
   * Cleanup file I/O resources
   */
  dispose(): void {
    this.fileIOBackend.dispose();
    if (this.webglBackend) {
      this.webglBackend.dispose();
      this.webglBackend = null;
    }
  }

  // Selection Area Methods

  /**
   * Create a selection area mask for the specified region
   * @param width Image width
   * @param height Image height
   * @param area Selection area definition
   * @returns Boolean mask array
   */
  createSelectionMask(width: number, height: number, area: SelectionArea): boolean[] {
    return this.areaProcessor.createSelectionMask(width, height, area);
  }

  /**
   * Create an alpha mask with optional feathering for the specified region
   * @param width Image width
   * @param height Image height
   * @param area Selection area definition
   * @returns Alpha mask array (0-1 values)
   */
  createAlphaMask(width: number, height: number, area: SelectionArea): number[] {
    return this.areaProcessor.createAlphaMask(width, height, area);
  }

  /**
   * Apply selection area to ImageData, preserving only selected regions
   * @param imageData Source image data
   * @param area Selection area definition
   * @param outsideColor Color to use for non-selected areas (default: transparent)
   * @returns New ImageData with selection applied
   */
  applySelectionToImageData(
    imageData: ImageData,
    area: SelectionArea,
    outsideColor?: { r: number; g: number; b: number; a: number }
  ): ImageData {
    return this.areaProcessor.applySelectionToImageData(imageData, area, outsideColor);
  }

  /**
   * Apply color splash effect within a specific selection area
   * @param imageData Source image data
   * @param area Selection area to apply effect within
   * @param config Color splash configuration
   * @returns ImageData with color splash applied only within the selection area
   */
  async applyColorSplashInSelection(
    imageData: ImageData,
    area: SelectionArea,
    config: SplashConfig
  ): Promise<ImageData> {
    const endTimer = this.performanceMonitor.startTimer('apply_color_splash_in_selection');

    // Create alpha mask for the selection area
    const alphaMask = this.areaProcessor.createAlphaMask(imageData.width, imageData.height, area);


    // Start with the original image
    const result = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    );

    // Process all pixels
    let preservedPixelCount = 0;
    let insideSelectionCount = 0;

    for (let i = 0; i < imageData.data.length; i += 4) {
      const pixelIndex = Math.floor(i / 4);
      const alpha = alphaMask[pixelIndex]!;

      if (alpha > 0) {
        insideSelectionCount++;
      }

      const originalR = imageData.data[i]!;
      const originalG = imageData.data[i + 1]!;
      const originalB = imageData.data[i + 2]!;

      if (alpha === 0) {
        // Outside selection area - convert everything to grayscale
        const gray = this.toGrayscale(originalR, originalG, originalB, config.grayscaleMethod);
        result.data[i] = gray;
        result.data[i + 1] = gray;
        result.data[i + 2] = gray;
      } else {
        // Inside selection area (alpha > 0) - apply color splash effect
        const pixelColor = { r: originalR, g: originalG, b: originalB };
        let preserveColor = false;

        // Check if this pixel matches any target color
        for (const targetColor of config.targetColors) {
          if (this.isColorSimilarHelper(pixelColor, targetColor, config.tolerance, config.colorSpace || this.options.defaultColorSpace)) {
            preserveColor = true;
            break;
          }
        }


        if (preserveColor) {
          preservedPixelCount++;
          // Preserve target color
          if (alpha === 1) {
            // Fully inside selection - explicitly keep original color
            result.data[i] = originalR;
            result.data[i + 1] = originalG;
            result.data[i + 2] = originalB;
            // Keep original alpha (already copied)
          } else {
            // Feathered edge - blend between grayscale (outside) and color (inside)
            const gray = this.toGrayscale(originalR, originalG, originalB, config.grayscaleMethod);
            result.data[i] = Math.round(gray * (1 - alpha) + originalR * alpha);
            result.data[i + 1] = Math.round(gray * (1 - alpha) + originalG * alpha);
            result.data[i + 2] = Math.round(gray * (1 - alpha) + originalB * alpha);
          }
        } else {
          // Non-target color inside selection - convert to grayscale
          const gray = this.toGrayscale(originalR, originalG, originalB, config.grayscaleMethod);

          if (alpha === 1) {
            // Fully inside selection - use grayscale
            result.data[i] = gray;
            result.data[i + 1] = gray;
            result.data[i + 2] = gray;
          } else {
            // Feathered edge - blend between grayscale (outside) and grayscale (inside)
            // In this case, both are grayscale, so just use grayscale
            result.data[i] = gray;
            result.data[i + 1] = gray;
            result.data[i + 2] = gray;
          }
        }
      }
    }


    endTimer();
    return result;
  }

  /**
   * Helper method to check if colors are similar
   */
  private isColorSimilarHelper(color1: Color, color2: Color, tolerance: ColorTolerance, colorSpace: ColorSpace): boolean {
    return isColorSimilar(color1, color2, tolerance, colorSpace);
  }

  /**
   * Helper method to convert RGB to grayscale
   */
  private toGrayscale(r: number, g: number, b: number, method?: GrayscaleMethod): number {
    const grayscaleMethod = method || GrayscaleMethod.LUMINANCE;

    switch (grayscaleMethod) {
      case GrayscaleMethod.LUMINANCE:
        return Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      case GrayscaleMethod.AVERAGE:
        return Math.round((r + g + b) / 3);
      case GrayscaleMethod.DESATURATION:
        return Math.round((Math.max(r, g, b) + Math.min(r, g, b)) / 2);
      default:
        return Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    }
  }

  /**
   * Check if a point is inside the specified selection area
   * @param x X coordinate
   * @param y Y coordinate
   * @param area Selection area definition
   * @returns true if point is inside the area
   */
  isPointInArea(x: number, y: number, area: SelectionArea): boolean {
    return this.areaProcessor.isPointInArea(x, y, area);
  }
}
