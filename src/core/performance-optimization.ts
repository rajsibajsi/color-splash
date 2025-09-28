/**
 * Performance optimization features for real-time previews
 */

import { Color, ColorTolerance, ColorSpace, GrayscaleMethod, PreviewQuality } from '../types';
import { applyColorSplash } from './image-processing';

export interface PreviewSize {
  width: number;
  height: number;
}

/**
 * Resize ImageData to specified dimensions using nearest neighbor sampling
 * @param imageData Source image data
 * @param targetWidth Target width
 * @param targetHeight Target height
 * @returns Resized ImageData
 */
export function resizeImageData(
  imageData: ImageData,
  targetWidth: number,
  targetHeight: number
): ImageData {
  const { data: sourceData, width: sourceWidth, height: sourceHeight } = imageData;
  const targetData = new Uint8ClampedArray(targetWidth * targetHeight * 4);

  const xRatio = sourceWidth / targetWidth;
  const yRatio = sourceHeight / targetHeight;

  for (let targetY = 0; targetY < targetHeight; targetY++) {
    for (let targetX = 0; targetX < targetWidth; targetX++) {
      // Find nearest source pixel using nearest neighbor
      const sourceX = Math.floor(targetX * xRatio);
      const sourceY = Math.floor(targetY * yRatio);

      const sourceIndex = (sourceY * sourceWidth + sourceX) * 4;
      const targetIndex = (targetY * targetWidth + targetX) * 4;

      // Copy pixel data
      targetData[targetIndex] = sourceData[sourceIndex]!; // R
      targetData[targetIndex + 1] = sourceData[sourceIndex + 1]!; // G
      targetData[targetIndex + 2] = sourceData[sourceIndex + 2]!; // B
      targetData[targetIndex + 3] = sourceData[sourceIndex + 3]!; // A
    }
  }

  return new ImageData(targetData, targetWidth, targetHeight);
}

/**
 * Calculate optimal preview size based on quality and constraints
 * @param originalWidth Original image width
 * @param originalHeight Original image height
 * @param quality Preview quality level
 * @param maxSize Maximum dimension size (default: 500)
 * @returns Optimal preview dimensions
 */
export function calculateOptimalPreviewSize(
  originalWidth: number,
  originalHeight: number,
  quality: PreviewQuality,
  maxSize: number = 500
): PreviewSize {
  let scaleFactor: number;

  // Determine scale factor based on quality
  switch (quality) {
    case PreviewQuality.LOW:
      scaleFactor = 0.125; // 1/8 resolution
      break;
    case PreviewQuality.MEDIUM:
      scaleFactor = 0.25; // 1/4 resolution
      break;
    case PreviewQuality.HIGH:
      scaleFactor = 0.5; // 1/2 resolution
      break;
    case PreviewQuality.REALTIME:
      // Dynamic scaling based on image size
      const pixelCount = originalWidth * originalHeight;
      if (pixelCount > 2000000) {
        // > 2MP
        scaleFactor = 0.125;
      } else if (pixelCount > 500000) {
        // > 0.5MP
        scaleFactor = 0.25;
      } else {
        scaleFactor = 0.5;
      }
      break;
    default:
      scaleFactor = 0.25;
  }

  let targetWidth = Math.round(originalWidth * scaleFactor);
  let targetHeight = Math.round(originalHeight * scaleFactor);

  // Apply maximum size constraint while preserving aspect ratio
  const aspectRatio = originalWidth / originalHeight;

  if (targetWidth > maxSize || targetHeight > maxSize) {
    if (targetWidth > targetHeight) {
      targetWidth = maxSize;
      targetHeight = Math.round(maxSize / aspectRatio);
    } else {
      targetHeight = maxSize;
      targetWidth = Math.round(maxSize * aspectRatio);
    }
  }

  // Ensure minimum size
  targetWidth = Math.max(targetWidth, 1);
  targetHeight = Math.max(targetHeight, 1);

  // For small images, don't downscale too much
  if (originalWidth <= maxSize && originalHeight <= maxSize) {
    return { width: originalWidth, height: originalHeight };
  }

  return { width: targetWidth, height: targetHeight };
}

/**
 * Create fast preview with reduced resolution for real-time performance
 * @param imageData Source image data
 * @param targetColors Colors to preserve
 * @param tolerance Color matching tolerance
 * @param colorSpace Color space for comparison
 * @param grayscaleMethod Grayscale conversion method
 * @param quality Preview quality level
 * @returns Fast preview ImageData
 */
export async function createFastPreview(
  imageData: ImageData,
  targetColors: Color[],
  tolerance: ColorTolerance,
  colorSpace: ColorSpace,
  grayscaleMethod: GrayscaleMethod,
  quality: PreviewQuality
): Promise<ImageData> {
  // Calculate optimal preview size
  const previewSize = calculateOptimalPreviewSize(imageData.width, imageData.height, quality);

  // Resize image for faster processing
  const resizedImage = resizeImageData(imageData, previewSize.width, previewSize.height);

  // Apply color splash effect on smaller image
  const preview = applyColorSplash(
    resizedImage,
    targetColors,
    tolerance,
    colorSpace,
    grayscaleMethod
  );

  return preview;
}

/**
 * Preview cache for storing processed results
 */
export class PreviewCache {
  private cache = new Map<string, ImageData>();
  private maxSize: number;

  constructor(maxSize: number = 20) {
    this.maxSize = maxSize;
  }

  /**
   * Generate cache key from processing parameters
   */
  generateCacheKey(
    imageData: ImageData,
    targetColors: Color[],
    tolerance: ColorTolerance,
    colorSpace: ColorSpace
  ): string {
    // Create a hash-like key from parameters
    const imageKey = `${imageData.width}x${imageData.height}`;
    const colorsKey = targetColors.map((c) => `${c.r}${c.g}${c.b}`).join(',');
    const toleranceKey = `h${tolerance.hue || 0}s${tolerance.saturation || 0}l${tolerance.lightness || 0}e${tolerance.euclidean || 0}`;

    return `${imageKey}_${colorsKey}_${toleranceKey}_${colorSpace}`;
  }

  /**
   * Get cached preview result
   */
  get(key: string): ImageData | null {
    return this.cache.get(key) || null;
  }

  /**
   * Store preview result in cache
   */
  set(key: string, imageData: ImageData): void {
    // Evict oldest entry if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, imageData);
  }

  /**
   * Clear all cached results
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get current cache size
   */
  size(): number {
    return this.cache.size;
  }
}

/**
 * Performance monitor for tracking processing times
 */
export class PerformanceMonitor {
  private measurements = new Map<string, number[]>();

  /**
   * Start timing an operation
   */
  startTimer(operationName: string): () => number {
    const startTime = performance.now();

    return () => {
      const duration = performance.now() - startTime;
      this.recordMeasurement(operationName, duration);
      return duration;
    };
  }

  /**
   * Record a measurement
   */
  recordMeasurement(operationName: string, duration: number): void {
    if (!this.measurements.has(operationName)) {
      this.measurements.set(operationName, []);
    }

    const measurements = this.measurements.get(operationName)!;
    measurements.push(duration);

    // Keep only last 50 measurements
    if (measurements.length > 50) {
      measurements.shift();
    }
  }

  /**
   * Get performance statistics for an operation
   */
  getStats(operationName: string): {
    average: number;
    min: number;
    max: number;
    count: number;
  } | null {
    const measurements = this.measurements.get(operationName);
    if (!measurements || measurements.length === 0) {
      return null;
    }

    const average = measurements.reduce((sum, val) => sum + val, 0) / measurements.length;
    const min = Math.min(...measurements);
    const max = Math.max(...measurements);

    return {
      average: Math.round(average * 100) / 100,
      min: Math.round(min * 100) / 100,
      max: Math.round(max * 100) / 100,
      count: measurements.length,
    };
  }

  /**
   * Get all performance statistics
   */
  getAllStats(): {
    [operationName: string]: { average: number; min: number; max: number; count: number } | null;
  } {
    const stats: {
      [key: string]: { average: number; min: number; max: number; count: number } | null;
    } = {};

    for (const operationName of this.measurements.keys()) {
      stats[operationName] = this.getStats(operationName);
    }

    return stats;
  }

  /**
   * Clear all measurements
   */
  clear(): void {
    this.measurements.clear();
  }
}
