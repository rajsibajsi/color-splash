/**
 * Tests for the main ColorSplash class (TDD approach)
 * Integration of all features into a unified API
 */

import { ColorSplash } from '../../src/core/ColorSplash';
import { Color, ColorSpace, GrayscaleMethod, PreviewQuality } from '../../src/types';

describe('ColorSplash Class', () => {
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

  describe('Initialization', () => {
    test('should initialize with default options', () => {
      const colorSplash = new ColorSplash();

      expect(colorSplash).toBeDefined();
      expect(colorSplash.getOptions().defaultColorSpace).toBe(ColorSpace.HSV);
      expect(colorSplash.getOptions().previewQuality).toBe(PreviewQuality.MEDIUM);
    });

    test('should initialize with custom options', () => {
      const options = {
        defaultColorSpace: ColorSpace.LAB,
        previewQuality: PreviewQuality.HIGH,
        maxPreviewSize: 600,
        gpuAcceleration: true
      };

      const colorSplash = new ColorSplash(options);

      expect(colorSplash.getOptions().defaultColorSpace).toBe(ColorSpace.LAB);
      expect(colorSplash.getOptions().previewQuality).toBe(PreviewQuality.HIGH);
      expect(colorSplash.getOptions().maxPreviewSize).toBe(600);
      expect(colorSplash.getOptions().gpuAcceleration).toBe(true);
    });
  });

  describe('Color Selection', () => {
    test('should select color at specified coordinates', () => {
      const colorSplash = new ColorSplash();
      const imageData = createTestImageData(100, 100, { r: 255, g: 100, b: 50 });

      const selectedColor = colorSplash.selectColor(imageData, 50, 50);

      expect(selectedColor.r).toBe(255);
      expect(selectedColor.g).toBe(100);
      expect(selectedColor.b).toBe(50);
    });

    test('should handle edge coordinates', () => {
      const colorSplash = new ColorSplash();
      const imageData = createTestImageData(10, 10, { r: 0, g: 200, b: 100 });

      const cornerColor = colorSplash.selectColor(imageData, 0, 0);
      const edgeColor = colorSplash.selectColor(imageData, 9, 9);

      expect(cornerColor.r).toBe(0);
      expect(cornerColor.g).toBe(200);
      expect(cornerColor.b).toBe(100);

      expect(edgeColor.r).toBe(0);
      expect(edgeColor.g).toBe(200);
      expect(edgeColor.b).toBe(100);
    });

    test('should handle out-of-bounds coordinates gracefully', () => {
      const colorSplash = new ColorSplash();
      const imageData = createTestImageData(10, 10, { r: 50, g: 150, b: 250 });

      const color1 = colorSplash.selectColor(imageData, -1, 5);
      const color2 = colorSplash.selectColor(imageData, 15, 5);
      const color3 = colorSplash.selectColor(imageData, 5, -1);
      const color4 = colorSplash.selectColor(imageData, 5, 15);

      // Should clamp to valid coordinates
      expect(color1).toEqual({ r: 50, g: 150, b: 250 });
      expect(color2).toEqual({ r: 50, g: 150, b: 250 });
      expect(color3).toEqual({ r: 50, g: 150, b: 250 });
      expect(color4).toEqual({ r: 50, g: 150, b: 250 });
    });
  });

  describe('Fast Preview Generation', () => {
    test('should create fast preview with default settings', async () => {
      const colorSplash = new ColorSplash();
      const imageData = createTestImageData(800, 600, { r: 100, g: 200, b: 150 });
      const targetColor = { r: 100, g: 200, b: 150 };

      const startTime = performance.now();
      const preview = await colorSplash.createFastPreview(imageData, [targetColor]);
      const duration = performance.now() - startTime;

      expect(preview.width).toBeLessThan(imageData.width);
      expect(preview.height).toBeLessThan(imageData.height);
      if (!process.env['CI']) {
        expect(duration).toBeLessThan(100); // Should be fast (disabled in CI)
      }
    });

    test('should create different quality previews', async () => {
      const colorSplash = new ColorSplash({ maxPreviewSize: 800 });
      const imageData = createTestImageData(2000, 1500, { r: 255, g: 0, b: 0 });
      const targetColor = { r: 255, g: 0, b: 0 };

      const lowPreview = await colorSplash.createFastPreview(
        imageData, [targetColor], { hue: 15 }, PreviewQuality.LOW
      );

      const highPreview = await colorSplash.createFastPreview(
        imageData, [targetColor], { hue: 15 }, PreviewQuality.HIGH
      );

      expect(lowPreview.width).toBeLessThan(highPreview.width);
      expect(lowPreview.height).toBeLessThan(highPreview.height);
    });

    test('should use caching for identical parameters', async () => {
      const colorSplash = new ColorSplash();
      const imageData = createTestImageData(400, 300, { r: 0, g: 255, b: 255 });
      const targetColor = { r: 0, g: 255, b: 255 };
      const tolerance = { hue: 20, saturation: 30, lightness: 25 };

      // First call - should process
      const startTime1 = performance.now();
      const preview1 = await colorSplash.createFastPreview(imageData, [targetColor], tolerance);
      const duration1 = performance.now() - startTime1;

      // Second call with same parameters - should be faster (cached)
      const startTime2 = performance.now();
      const preview2 = await colorSplash.createFastPreview(imageData, [targetColor], tolerance);
      const duration2 = performance.now() - startTime2;

      expect(preview2.width).toBe(preview1.width);
      expect(preview2.height).toBe(preview1.height);
      expect(duration2).toBeLessThan(duration1 * 0.5); // Should be significantly faster
    });
  });

  describe('Incremental Updates', () => {
    test('should update preview with tolerance changes', async () => {
      const colorSplash = new ColorSplash();
      const imageData = createTestImageData(400, 300);

      // Preload image for incremental updates
      await colorSplash.preloadImage(imageData);

      // Initial preview
      await colorSplash.createFastPreview(imageData, [{ r: 128, g: 128, b: 128 }], { hue: 15 });

      // Update tolerance
      const startTime = performance.now();
      const updatedPreview = await colorSplash.updatePreview({ tolerance: { hue: 25 } });
      const duration = performance.now() - startTime;

      expect(updatedPreview).toBeDefined();
      if (!process.env['CI']) {
        expect(duration).toBeLessThan(200); // Should be fast incremental update (disabled in CI)
      }
    });

    test('should handle color changes in updates', async () => {
      const colorSplash = new ColorSplash();
      const imageData = createTestImageData(300, 200);

      await colorSplash.preloadImage(imageData);
      await colorSplash.createFastPreview(imageData, [{ r: 255, g: 0, b: 0 }], { hue: 15 });

      // Update with different colors
      const updatedPreview = await colorSplash.updatePreview({
        targetColors: [{ r: 0, g: 255, b: 0 }],
        tolerance: { hue: 20 }
      });

      expect(updatedPreview).toBeDefined();
    });
  });

  describe('Full Quality Processing', () => {
    test('should apply color splash at full resolution', async () => {
      const colorSplash = new ColorSplash();
      const imageData = createTestImageData(200, 150, { r: 200, g: 100, b: 50 });
      const targetColor = { r: 200, g: 100, b: 50 };

      const result = await colorSplash.applyColorSplash(imageData, {
        targetColors: [targetColor],
        tolerance: { hue: 15, saturation: 20, lightness: 25 },
        colorSpace: ColorSpace.HSV,
        grayscaleMethod: GrayscaleMethod.LUMINANCE
      });

      expect(result.width).toBe(imageData.width);
      expect(result.height).toBe(imageData.height);
      expect(result.data.length).toBe(imageData.data.length);
    });

    test('should handle complex color splash configurations', async () => {
      const colorSplash = new ColorSplash();

      // Create a more complex test image
      const imageData = createTestImageData(100, 100);

      // Add some color variation
      for (let i = 0; i < imageData.data.length; i += 16) {
        imageData.data[i] = 255;     // Red pixel
        imageData.data[i + 1] = 0;
        imageData.data[i + 2] = 0;
        imageData.data[i + 3] = 255;
      }

      const config = {
        targetColors: [
          { r: 255, g: 0, b: 0 },
          { r: 0, g: 255, b: 0 }
        ],
        tolerance: { hue: 20, saturation: 30, lightness: 35 },
        colorSpace: ColorSpace.HSV,
        grayscaleMethod: GrayscaleMethod.LUMINANCE
      };

      const result = await colorSplash.applyColorSplash(imageData, config);

      expect(result).toBeDefined();
      expect(result.width).toBe(100);
      expect(result.height).toBe(100);
    });
  });

  describe('Configuration Management', () => {
    test('should allow configuration updates', () => {
      const colorSplash = new ColorSplash();

      colorSplash.setPreviewQuality(PreviewQuality.HIGH);
      expect(colorSplash.getOptions().previewQuality).toBe(PreviewQuality.HIGH);

      colorSplash.setDefaultColorSpace(ColorSpace.LAB);
      expect(colorSplash.getOptions().defaultColorSpace).toBe(ColorSpace.LAB);
    });

    test('should provide performance statistics', async () => {
      const colorSplash = new ColorSplash();
      const imageData = createTestImageData(200, 200);

      // Perform some operations to generate stats
      await colorSplash.createFastPreview(imageData, [{ r: 128, g: 128, b: 128 }]);
      await colorSplash.createFastPreview(imageData, [{ r: 64, g: 192, b: 32 }]);

      const stats = colorSplash.getPerformanceStats();
      expect(stats).toBeDefined();
      expect(typeof stats).toBe('object');
    });

    test('should clear cache when requested', async () => {
      const colorSplash = new ColorSplash();
      const imageData = createTestImageData(100, 100);

      // Create a preview to populate cache
      await colorSplash.createFastPreview(imageData, [{ r: 255, g: 255, b: 255 }]);

      // Clear cache
      colorSplash.clearCache();

      // Next operation should not use cache (will be slower)
      const startTime = performance.now();
      await colorSplash.createFastPreview(imageData, [{ r: 255, g: 255, b: 255 }]);
      const duration = performance.now() - startTime;

      expect(duration).toBeGreaterThan(10); // Should take some time since no cache
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid image coordinates gracefully', () => {
      const colorSplash = new ColorSplash();
      const imageData = createTestImageData(50, 50);

      expect(() => {
        colorSplash.selectColor(imageData, NaN, 25);
      }).not.toThrow();

      expect(() => {
        colorSplash.selectColor(imageData, 25, Infinity);
      }).not.toThrow();
    });

    test('should handle empty target colors', async () => {
      const colorSplash = new ColorSplash();
      const imageData = createTestImageData(100, 100);

      const result = await colorSplash.createFastPreview(imageData, []);

      expect(result).toBeDefined();
      // All pixels should be grayscale with empty target colors
    });

    test('should handle malformed tolerance values', async () => {
      const colorSplash = new ColorSplash();
      const imageData = createTestImageData(50, 50);

      const result = await colorSplash.createFastPreview(
        imageData,
        [{ r: 128, g: 128, b: 128 }],
        { hue: -10 } // Invalid negative value
      );

      expect(result).toBeDefined();
    });
  });
});