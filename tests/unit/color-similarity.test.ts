/**
 * Tests for color similarity detection algorithms (TDD approach)
 */

import { isColorSimilar, calculateColorDistance } from '../../src/algorithms/color-similarity';
import { Color, ColorTolerance, ColorSpace } from '../../src/types';

describe('Color Similarity Detection', () => {
  describe('HSV Color Matching', () => {
    test('should match similar red colors within hue tolerance', () => {
      const targetColor: Color = { r: 255, g: 0, b: 0 }; // Pure red (0°)
      const similarColor: Color = { r: 255, g: 20, b: 10 }; // Nearly red (~5°)
      const tolerance: ColorTolerance = { hue: 15, saturation: 20, lightness: 25 };

      const result = isColorSimilar(targetColor, similarColor, tolerance, ColorSpace.HSV);
      expect(result).toBe(true);
    });

    test('should reject different colors outside hue tolerance', () => {
      const targetColor: Color = { r: 255, g: 0, b: 0 }; // Red (0°)
      const differentColor: Color = { r: 0, g: 255, b: 0 }; // Green (120°)
      const tolerance: ColorTolerance = { hue: 15, saturation: 20, lightness: 25 };

      const result = isColorSimilar(targetColor, differentColor, tolerance, ColorSpace.HSV);
      expect(result).toBe(false);
    });

    test('should handle hue wrap-around at 0°/360° boundary', () => {
      const redColor1: Color = { r: 255, g: 0, b: 0 }; // 0° hue
      const redColor2: Color = { r: 255, g: 0, b: 10 }; // ~358° hue
      const tolerance: ColorTolerance = { hue: 15, saturation: 20, lightness: 25 };

      const result = isColorSimilar(redColor1, redColor2, tolerance, ColorSpace.HSV);
      expect(result).toBe(true);
    });

    test('should respect saturation tolerance', () => {
      const vibrantRed: Color = { r: 255, g: 0, b: 0 }; // High saturation
      const mutedRed: Color = { r: 200, g: 100, b: 100 }; // Lower saturation
      const tolerance: ColorTolerance = { hue: 15, saturation: 10, lightness: 25 };

      const result = isColorSimilar(vibrantRed, mutedRed, tolerance, ColorSpace.HSV);
      expect(result).toBe(false); // Should reject due to saturation difference
    });

    test('should respect value/brightness tolerance', () => {
      const brightRed: Color = { r: 255, g: 0, b: 0 }; // Bright
      const darkRed: Color = { r: 100, g: 0, b: 0 }; // Dark
      const tolerance: ColorTolerance = { hue: 15, saturation: 20, lightness: 20 };

      const result = isColorSimilar(brightRed, darkRed, tolerance, ColorSpace.HSV);
      expect(result).toBe(false); // Should reject due to brightness difference
    });
  });

  describe('LAB Euclidean Distance Matching', () => {
    test('should match similar colors within euclidean distance', () => {
      const targetColor: Color = { r: 100, g: 150, b: 200 };
      const similarColor: Color = { r: 105, g: 155, b: 205 };
      const tolerance: ColorTolerance = { euclidean: 25 };

      const result = isColorSimilar(targetColor, similarColor, tolerance, ColorSpace.LAB);
      expect(result).toBe(true);
    });

    test('should reject colors outside euclidean distance', () => {
      const targetColor: Color = { r: 100, g: 150, b: 200 };
      const differentColor: Color = { r: 200, g: 50, b: 100 };
      const tolerance: ColorTolerance = { euclidean: 25 };

      const result = isColorSimilar(targetColor, differentColor, tolerance, ColorSpace.LAB);
      expect(result).toBe(false);
    });
  });

  describe('RGB Simple Distance Matching', () => {
    test('should match similar colors in RGB space', () => {
      const targetColor: Color = { r: 128, g: 128, b: 128 };
      const similarColor: Color = { r: 135, g: 125, b: 130 };
      const tolerance: ColorTolerance = { euclidean: 20 };

      const result = isColorSimilar(targetColor, similarColor, tolerance, ColorSpace.RGB);
      expect(result).toBe(true);
    });

    test('should reject colors outside RGB tolerance', () => {
      const targetColor: Color = { r: 128, g: 128, b: 128 };
      const differentColor: Color = { r: 255, g: 0, b: 0 };
      const tolerance: ColorTolerance = { euclidean: 50 };

      const result = isColorSimilar(targetColor, differentColor, tolerance, ColorSpace.RGB);
      expect(result).toBe(false);
    });
  });

  describe('Color Distance Calculation', () => {
    test('should calculate HSV color distance correctly', () => {
      const color1: Color = { r: 255, g: 0, b: 0 }; // Red
      const color2: Color = { r: 255, g: 255, b: 0 }; // Yellow (60° difference)

      const distance = calculateColorDistance(color1, color2, ColorSpace.HSV);

      // Should return object with hue, saturation, value differences
      expect(distance).toHaveProperty('hue');
      expect(distance).toHaveProperty('saturation');
      expect(distance).toHaveProperty('value');
      expect(distance.hue).toBeCloseTo(60, 1);
    });

    test('should calculate LAB euclidean distance', () => {
      const color1: Color = { r: 255, g: 255, b: 255 }; // White
      const color2: Color = { r: 0, g: 0, b: 0 }; // Black

      const distance = calculateColorDistance(color1, color2, ColorSpace.LAB);

      expect(distance).toHaveProperty('euclidean');
      expect(distance.euclidean).toBeGreaterThan(90); // Should be close to 100
    });

    test('should calculate RGB euclidean distance', () => {
      const color1: Color = { r: 0, g: 0, b: 0 };
      const color2: Color = { r: 255, g: 255, b: 255 };

      const distance = calculateColorDistance(color1, color2, ColorSpace.RGB);

      expect(distance).toHaveProperty('euclidean');
      expect(distance.euclidean).toBeCloseTo(441.67, 1); // sqrt(255² + 255² + 255²)
    });
  });

  describe('Edge Cases', () => {
    test('should handle identical colors', () => {
      const color: Color = { r: 128, g: 64, b: 192 };
      const tolerance: ColorTolerance = { hue: 1, saturation: 1, lightness: 1 };

      const result = isColorSimilar(color, color, tolerance, ColorSpace.HSV);
      expect(result).toBe(true);
    });

    test('should handle grayscale colors in HSV', () => {
      const gray1: Color = { r: 128, g: 128, b: 128 };
      const gray2: Color = { r: 130, g: 130, b: 130 };
      const tolerance: ColorTolerance = { hue: 15, saturation: 10, lightness: 10 };

      const result = isColorSimilar(gray1, gray2, tolerance, ColorSpace.HSV);
      expect(result).toBe(true);
    });

    test('should handle pure black and white', () => {
      const black: Color = { r: 0, g: 0, b: 0 };
      const white: Color = { r: 255, g: 255, b: 255 };
      const tolerance: ColorTolerance = { hue: 360, saturation: 100, lightness: 50 };

      const result = isColorSimilar(black, white, tolerance, ColorSpace.HSV);
      expect(result).toBe(false); // Different brightness
    });
  });
});
