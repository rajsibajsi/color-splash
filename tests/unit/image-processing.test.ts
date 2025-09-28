/**
 * Tests for image processing operations (TDD approach)
 * Phase 4: Core Image Processing Engine
 */

import {
  convertToGrayscale,
  extractColorMask,
  applyColorSplash,
} from '../../src/core/image-processing';
import { Color, ColorTolerance, ColorSpace, GrayscaleMethod } from '../../src/types';

describe('Image Processing Operations', () => {
  // Helper function to create test ImageData
  function createTestImageData(width: number, height: number, pixels: number[][]): ImageData {
    const data = new Uint8ClampedArray(width * height * 4);
    let index = 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pixelIndex = y * width + x;
        const pixel = pixels[pixelIndex] || [0, 0, 0, 255];
        data[index++] = pixel[0]!; // R
        data[index++] = pixel[1]!; // G
        data[index++] = pixel[2]!; // B
        data[index++] = pixel[3] !== undefined ? pixel[3] : 255; // A
      }
    }

    return new ImageData(data, width, height);
  }

  describe('Grayscale Conversion', () => {
    test('should convert RGB to grayscale using luminance method', () => {
      const imageData = createTestImageData(2, 1, [
        [255, 0, 0, 255], // Pure red
        [0, 255, 0, 255], // Pure green
      ]);

      const result = convertToGrayscale(imageData, GrayscaleMethod.LUMINANCE);

      // Luminance formula: 0.299*R + 0.587*G + 0.114*B
      const expectedRed = Math.round(0.299 * 255); // ~76
      const expectedGreen = Math.round(0.587 * 255); // ~150

      expect(result.data[0]).toBe(expectedRed); // R
      expect(result.data[1]).toBe(expectedRed); // G
      expect(result.data[2]).toBe(expectedRed); // B
      expect(result.data[3]).toBe(255); // A

      expect(result.data[4]).toBe(expectedGreen); // R
      expect(result.data[5]).toBe(expectedGreen); // G
      expect(result.data[6]).toBe(expectedGreen); // B
      expect(result.data[7]).toBe(255); // A
    });

    test('should convert RGB to grayscale using average method', () => {
      const imageData = createTestImageData(1, 1, [[120, 180, 60, 255]]);

      const result = convertToGrayscale(imageData, GrayscaleMethod.AVERAGE);

      const expected = Math.round((120 + 180 + 60) / 3); // 120

      expect(result.data[0]).toBe(expected);
      expect(result.data[1]).toBe(expected);
      expect(result.data[2]).toBe(expected);
      expect(result.data[3]).toBe(255);
    });

    test('should convert RGB to grayscale using desaturation method', () => {
      const imageData = createTestImageData(1, 1, [[100, 200, 50, 255]]);

      const result = convertToGrayscale(imageData, GrayscaleMethod.DESATURATION);

      const expected = Math.round((200 + 50) / 2); // (max + min) / 2 = 125

      expect(result.data[0]).toBe(expected);
      expect(result.data[1]).toBe(expected);
      expect(result.data[2]).toBe(expected);
      expect(result.data[3]).toBe(255);
    });

    test('should preserve image dimensions and alpha channel', () => {
      const imageData = createTestImageData(3, 2, [
        [255, 0, 0, 128],
        [0, 255, 0, 200],
        [0, 0, 255, 255],
        [128, 128, 128, 50],
        [64, 192, 32, 100],
        [200, 100, 150, 75],
      ]);

      const result = convertToGrayscale(imageData, GrayscaleMethod.LUMINANCE);

      expect(result.width).toBe(3);
      expect(result.height).toBe(2);
      expect(result.data.length).toBe(24); // 3 * 2 * 4

      // Check alpha preservation
      expect(result.data[3]).toBe(128);
      expect(result.data[7]).toBe(200);
      expect(result.data[23]).toBe(75);
    });
  });

  describe('Color Mask Generation', () => {
    test('should generate mask for single target color in HSV space', () => {
      const imageData = createTestImageData(3, 1, [
        [255, 0, 0, 255], // Pure red (target)
        [255, 20, 10, 255], // Similar red
        [0, 255, 0, 255], // Green (different)
      ]);

      const targetColors: Color[] = [{ r: 255, g: 0, b: 0 }];
      const tolerance: ColorTolerance = { hue: 15, saturation: 20, lightness: 25 };

      const mask = extractColorMask(imageData, targetColors, tolerance, ColorSpace.HSV);

      expect(mask.length).toBe(3);
      expect(mask[0]).toBe(true); // Pure red matches
      expect(mask[1]).toBe(true); // Similar red matches
      expect(mask[2]).toBe(false); // Green doesn't match
    });

    test('should generate mask for multiple target colors', () => {
      const imageData = createTestImageData(4, 1, [
        [255, 0, 0, 255], // Red
        [0, 255, 0, 255], // Green
        [0, 0, 255, 255], // Blue
        [128, 128, 128, 255], // Gray
      ]);

      const targetColors: Color[] = [
        { r: 255, g: 0, b: 0 }, // Red
        { r: 0, g: 0, b: 255 }, // Blue
      ];
      const tolerance: ColorTolerance = { hue: 10, saturation: 10, lightness: 10 };

      const mask = extractColorMask(imageData, targetColors, tolerance, ColorSpace.HSV);

      expect(mask[0]).toBe(true); // Red matches
      expect(mask[1]).toBe(false); // Green doesn't match
      expect(mask[2]).toBe(true); // Blue matches
      expect(mask[3]).toBe(false); // Gray doesn't match
    });

    test('should handle LAB color space for mask generation', () => {
      const imageData = createTestImageData(2, 1, [
        [100, 150, 200, 255], // Target color
        [105, 155, 205, 255], // Similar color
      ]);

      const targetColors: Color[] = [{ r: 100, g: 150, b: 200 }];
      const tolerance: ColorTolerance = { euclidean: 25 };

      const mask = extractColorMask(imageData, targetColors, tolerance, ColorSpace.LAB);

      expect(mask[0]).toBe(true); // Exact match
      expect(mask[1]).toBe(true); // Similar within tolerance
    });
  });

  describe('Color Splash Application', () => {
    test('should apply color splash effect with single target color', () => {
      const imageData = createTestImageData(3, 1, [
        [255, 0, 0, 255], // Red (preserve)
        [0, 255, 0, 255], // Green (convert to gray)
        [0, 0, 255, 255], // Blue (convert to gray)
      ]);

      const targetColors: Color[] = [{ r: 255, g: 0, b: 0 }];
      const tolerance: ColorTolerance = { hue: 10, saturation: 10, lightness: 10 };

      const result = applyColorSplash(
        imageData,
        targetColors,
        tolerance,
        ColorSpace.HSV,
        GrayscaleMethod.LUMINANCE
      );

      // Red pixel should remain unchanged
      expect(result.data[0]).toBe(255); // R
      expect(result.data[1]).toBe(0); // G
      expect(result.data[2]).toBe(0); // B

      // Green pixel should be converted to grayscale
      const greenLuminance = Math.round(0.587 * 255);
      expect(result.data[4]).toBe(greenLuminance); // R
      expect(result.data[5]).toBe(greenLuminance); // G
      expect(result.data[6]).toBe(greenLuminance); // B

      // Blue pixel should be converted to grayscale
      const blueLuminance = Math.round(0.114 * 255);
      expect(result.data[8]).toBe(blueLuminance); // R
      expect(result.data[9]).toBe(blueLuminance); // G
      expect(result.data[10]).toBe(blueLuminance); // B
    });

    test('should preserve alpha channel in color splash result', () => {
      const imageData = createTestImageData(2, 1, [
        [255, 0, 0, 128], // Red with 50% alpha
        [0, 255, 0, 200], // Green with ~78% alpha
      ]);

      const targetColors: Color[] = [{ r: 255, g: 0, b: 0 }];
      const tolerance: ColorTolerance = { hue: 10, saturation: 10, lightness: 10 };

      const result = applyColorSplash(
        imageData,
        targetColors,
        tolerance,
        ColorSpace.HSV,
        GrayscaleMethod.LUMINANCE
      );

      expect(result.data[3]).toBe(128); // Red alpha preserved
      expect(result.data[7]).toBe(200); // Green alpha preserved
    });

    test('should maintain original dimensions', () => {
      const imageData = createTestImageData(4, 3, [
        [255, 0, 0, 255],
        [0, 255, 0, 255],
        [0, 0, 255, 255],
        [255, 255, 0, 255],
        [255, 0, 255, 255],
        [0, 255, 255, 255],
        [128, 128, 128, 255],
        [64, 192, 32, 255],
        [200, 100, 50, 255],
        [50, 150, 200, 255],
        [100, 100, 100, 255],
        [255, 128, 64, 255],
      ]);

      const targetColors: Color[] = [{ r: 255, g: 0, b: 0 }];
      const tolerance: ColorTolerance = { hue: 15, saturation: 20, lightness: 25 };

      const result = applyColorSplash(
        imageData,
        targetColors,
        tolerance,
        ColorSpace.HSV,
        GrayscaleMethod.LUMINANCE
      );

      expect(result.width).toBe(4);
      expect(result.height).toBe(3);
      expect(result.data.length).toBe(48); // 4 * 3 * 4
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty target colors array', () => {
      const imageData = createTestImageData(2, 1, [
        [255, 0, 0, 255],
        [0, 255, 0, 255],
      ]);

      const mask = extractColorMask(imageData, [], {}, ColorSpace.HSV);

      expect(mask.every((val: boolean) => val === false)).toBe(true);
    });

    test('should handle single pixel image', () => {
      const imageData = createTestImageData(1, 1, [[128, 64, 192, 255]]);

      const result = convertToGrayscale(imageData, GrayscaleMethod.AVERAGE);

      const expected = Math.round((128 + 64 + 192) / 3);
      expect(result.data[0]).toBe(expected);
      expect(result.data[1]).toBe(expected);
      expect(result.data[2]).toBe(expected);
      expect(result.data[3]).toBe(255);
    });

    test('should handle transparent pixels', () => {
      const imageData = createTestImageData(2, 1, [
        [255, 0, 0, 0], // Fully transparent red
        [0, 255, 0, 255], // Opaque green
      ]);

      const result = convertToGrayscale(imageData, GrayscaleMethod.LUMINANCE);

      // Transparent pixel should still be processed
      expect(result.data[3]).toBe(0); // Alpha preserved
      expect(result.data[7]).toBe(255); // Opaque alpha preserved
    });
  });
});
