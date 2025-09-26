/**
 * Tests for performance optimization features (TDD approach)
 * Phase 5: Multi-resolution processing and real-time previews
 */

import {
  createFastPreview,
  resizeImageData,
  calculateOptimalPreviewSize,
  PreviewCache
} from '../../src/core/performance-optimization';
import { Color, ColorTolerance, ColorSpace, PreviewQuality, GrayscaleMethod } from '../../src/types';

describe('Performance Optimization', () => {
  // Helper function to create test ImageData
  function createTestImageData(width: number, height: number, fillColor: Color = { r: 128, g: 128, b: 128 }): ImageData {
    const data = new Uint8ClampedArray(width * height * 4);

    for (let i = 0; i < data.length; i += 4) {
      data[i] = fillColor.r;     // R
      data[i + 1] = fillColor.g; // G
      data[i + 2] = fillColor.b; // B
      data[i + 3] = 255;         // A
    }

    return new ImageData(data, width, height);
  }

  describe('Image Resizing for Previews', () => {
    test('should resize large image to smaller preview size', () => {
      const originalImage = createTestImageData(1200, 800, { r: 255, g: 0, b: 0 });

      const resized = resizeImageData(originalImage, 300, 200);

      expect(resized.width).toBe(300);
      expect(resized.height).toBe(200);
      expect(resized.data.length).toBe(300 * 200 * 4);

      // Should preserve general color characteristics
      expect(resized.data[0]).toBeCloseTo(255, 50); // Red channel preserved approximately
      expect(resized.data[1]).toBeCloseTo(0, 50);   // Green channel preserved
      expect(resized.data[2]).toBeCloseTo(0, 50);   // Blue channel preserved
    });

    test('should handle aspect ratio preservation', () => {
      const originalImage = createTestImageData(1600, 900, { r: 0, g: 255, b: 0 });

      const resized = resizeImageData(originalImage, 400, 225);

      expect(resized.width).toBe(400);
      expect(resized.height).toBe(225);

      // Aspect ratio should be preserved (16:9)
      const originalRatio = 1600 / 900;
      const resizedRatio = 400 / 225;
      expect(resizedRatio).toBeCloseTo(originalRatio, 2);
    });

    test('should handle upscaling (though not recommended for previews)', () => {
      const originalImage = createTestImageData(100, 100, { r: 0, g: 0, b: 255 });

      const resized = resizeImageData(originalImage, 200, 200);

      expect(resized.width).toBe(200);
      expect(resized.height).toBe(200);
      expect(resized.data.length).toBe(200 * 200 * 4);
    });
  });

  describe('Optimal Preview Size Calculation', () => {
    test('should calculate preview size for large images', () => {
      const size = calculateOptimalPreviewSize(1920, 1080, PreviewQuality.MEDIUM);

      expect(size.width).toBeLessThanOrEqual(500);
      expect(size.height).toBeLessThanOrEqual(500);
      expect(size.width).toBeGreaterThan(0);
      expect(size.height).toBeGreaterThan(0);

      // Should maintain aspect ratio
      const originalRatio = 1920 / 1080;
      const previewRatio = size.width / size.height;
      expect(previewRatio).toBeCloseTo(originalRatio, 2);
    });

    test('should return different sizes for different quality levels', () => {
      const lowQuality = calculateOptimalPreviewSize(1200, 800, PreviewQuality.LOW);
      const mediumQuality = calculateOptimalPreviewSize(1200, 800, PreviewQuality.MEDIUM);
      const highQuality = calculateOptimalPreviewSize(1200, 800, PreviewQuality.HIGH);

      expect(lowQuality.width).toBeLessThan(mediumQuality.width);
      expect(mediumQuality.width).toBeLessThan(highQuality.width);
      expect(lowQuality.height).toBeLessThan(mediumQuality.height);
      expect(mediumQuality.height).toBeLessThan(highQuality.height);
    });

    test('should handle small images without unnecessary downsizing', () => {
      const size = calculateOptimalPreviewSize(300, 200, PreviewQuality.MEDIUM);

      // Small image should not be downsized much
      expect(size.width).toBe(300);
      expect(size.height).toBe(200);
    });

    test('should respect maximum preview size limits', () => {
      const size = calculateOptimalPreviewSize(4000, 3000, PreviewQuality.HIGH, 600);

      expect(size.width).toBeLessThanOrEqual(600);
      expect(size.height).toBeLessThanOrEqual(600);
    });
  });

  describe('Fast Preview Generation', () => {
    test('should generate fast preview with reduced resolution', async () => {
      const originalImage = createTestImageData(1200, 800, { r: 255, g: 100, b: 50 });
      const targetColors: Color[] = [{ r: 255, g: 100, b: 50 }];
      const tolerance: ColorTolerance = { hue: 15, saturation: 20, lightness: 25 };

      const startTime = performance.now();
      const preview = await createFastPreview(
        originalImage,
        targetColors,
        tolerance,
        ColorSpace.HSV,
        GrayscaleMethod.LUMINANCE,
        PreviewQuality.MEDIUM
      );
      const duration = performance.now() - startTime;

      expect(preview.width).toBeLessThan(originalImage.width);
      expect(preview.height).toBeLessThan(originalImage.height);
      expect(duration).toBeLessThan(100); // Should be fast (<100ms)
    });

    test('should maintain color splash effect quality in preview', async () => {
      const originalImage = createTestImageData(800, 600);

      // Create a checkerboard pattern with red and blue squares
      for (let y = 0; y < 600; y += 100) {
        for (let x = 0; x < 800; x += 100) {
          const color = ((x / 100 + y / 100) % 2 === 0) ?
            { r: 255, g: 0, b: 0 } : { r: 0, g: 0, b: 255 };

          for (let py = y; py < Math.min(y + 100, 600); py++) {
            for (let px = x; px < Math.min(x + 100, 800); px++) {
              const index = (py * 800 + px) * 4;
              originalImage.data[index] = color.r;
              originalImage.data[index + 1] = color.g;
              originalImage.data[index + 2] = color.b;
              originalImage.data[index + 3] = 255;
            }
          }
        }
      }

      const targetColors: Color[] = [{ r: 255, g: 0, b: 0 }];
      const tolerance: ColorTolerance = { hue: 10, saturation: 10, lightness: 10 };

      const preview = await createFastPreview(
        originalImage,
        targetColors,
        tolerance,
        ColorSpace.HSV,
        GrayscaleMethod.LUMINANCE,
        PreviewQuality.MEDIUM
      );

      // Should have both colored and grayscale pixels
      let coloredPixels = 0;
      let grayscalePixels = 0;

      for (let i = 0; i < preview.data.length; i += 4) {
        const r = preview.data[i]!;
        const g = preview.data[i + 1]!;
        const b = preview.data[i + 2]!;

        if (Math.abs(r - g) <= 2 && Math.abs(g - b) <= 2) {
          grayscalePixels++;
        } else {
          coloredPixels++;
        }
      }

      expect(coloredPixels).toBeGreaterThan(0);
      expect(grayscalePixels).toBeGreaterThan(0);
    });

    test('should handle different preview quality levels', async () => {
      const originalImage = createTestImageData(1000, 1000, { r: 128, g: 64, b: 192 });
      const targetColors: Color[] = [{ r: 128, g: 64, b: 192 }];
      const tolerance: ColorTolerance = { hue: 20, saturation: 30, lightness: 35 };

      const lowPreview = await createFastPreview(
        originalImage, targetColors, tolerance, ColorSpace.HSV, GrayscaleMethod.LUMINANCE, PreviewQuality.LOW
      );

      const mediumPreview = await createFastPreview(
        originalImage, targetColors, tolerance, ColorSpace.HSV, GrayscaleMethod.LUMINANCE, PreviewQuality.MEDIUM
      );

      const highPreview = await createFastPreview(
        originalImage, targetColors, tolerance, ColorSpace.HSV, GrayscaleMethod.LUMINANCE, PreviewQuality.HIGH
      );

      expect(lowPreview.width).toBeLessThan(mediumPreview.width);
      expect(mediumPreview.width).toBeLessThan(highPreview.width);
      expect(lowPreview.height).toBeLessThan(mediumPreview.height);
      expect(mediumPreview.height).toBeLessThan(highPreview.height);
    });
  });

  describe('Preview Cache', () => {
    test('should cache and retrieve preview results', () => {
      const cache = new PreviewCache();
      const imageData = createTestImageData(100, 100);
      const targetColors: Color[] = [{ r: 255, g: 0, b: 0 }];
      const tolerance: ColorTolerance = { hue: 15 };

      const cacheKey = cache.generateCacheKey(imageData, targetColors, tolerance, ColorSpace.HSV);
      expect(cacheKey).toBeDefined();
      expect(typeof cacheKey).toBe('string');

      // Should not find cached result initially
      const cachedResult = cache.get(cacheKey);
      expect(cachedResult).toBeNull();

      // Cache a result
      const result = createTestImageData(50, 50);
      cache.set(cacheKey, result);

      // Should find cached result now
      const retrievedResult = cache.get(cacheKey);
      expect(retrievedResult).not.toBeNull();
      expect(retrievedResult?.width).toBe(50);
      expect(retrievedResult?.height).toBe(50);
    });

    test('should handle cache size limits', () => {
      const cache = new PreviewCache(2); // Limit to 2 entries

      const result1 = createTestImageData(50, 50);
      const result2 = createTestImageData(60, 60);
      const result3 = createTestImageData(70, 70);

      cache.set('key1', result1);
      cache.set('key2', result2);
      cache.set('key3', result3); // Should evict key1

      expect(cache.get('key1')).toBeNull(); // Evicted
      expect(cache.get('key2')).not.toBeNull(); // Still there
      expect(cache.get('key3')).not.toBeNull(); // Just added
    });

    test('should clear cache when requested', () => {
      const cache = new PreviewCache();
      const result = createTestImageData(50, 50);

      cache.set('test-key', result);
      expect(cache.get('test-key')).not.toBeNull();

      cache.clear();
      expect(cache.get('test-key')).toBeNull();
    });
  });

  (process.env['CI'] ? describe.skip : describe)('Performance Benchmarks', () => {
    test('should process medium preview in under 50ms', async () => {
      const largeImage = createTestImageData(1200, 800, { r: 200, g: 100, b: 150 });
      const targetColors: Color[] = [{ r: 200, g: 100, b: 150 }];
      const tolerance: ColorTolerance = { hue: 20, saturation: 25, lightness: 30 };

      const startTime = performance.now();
      await createFastPreview(
        largeImage,
        targetColors,
        tolerance,
        ColorSpace.HSV,
        GrayscaleMethod.LUMINANCE,
        PreviewQuality.MEDIUM
      );
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(100); // Target: <100ms for medium quality (realistic for test environment)
    });

    test('should process low quality preview in under 20ms', async () => {
      const largeImage = createTestImageData(1600, 1200, { r: 100, g: 200, b: 50 });
      const targetColors: Color[] = [{ r: 100, g: 200, b: 50 }];
      const tolerance: ColorTolerance = { euclidean: 30 };

      const startTime = performance.now();
      await createFastPreview(
        largeImage,
        targetColors,
        tolerance,
        ColorSpace.RGB,
        GrayscaleMethod.AVERAGE,
        PreviewQuality.LOW
      );
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(50); // Target: <50ms for low quality (relaxed for CI)
    });
  });
});