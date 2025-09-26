/**
 * Tests for color space conversion algorithms (TDD approach)
 * RED -> GREEN -> REFACTOR cycle
 */

import { rgbToHsv, hsvToRgb } from '../../src/algorithms/color-conversion';
import { Color, HSVColor } from '../../src/types';

describe('Color Space Conversion Algorithms', () => {
  describe('RGB to HSV Conversion', () => {
    test('should convert pure red RGB(255,0,0) to HSV(0°,100%,100%)', () => {
      const rgb: Color = { r: 255, g: 0, b: 0 };
      const hsv = rgbToHsv(rgb);

      expect(hsv.h).toBeCloseTo(0, 1);
      expect(hsv.s).toBeCloseTo(100, 1);
      expect(hsv.v).toBeCloseTo(100, 1);
    });

    test('should convert pure green RGB(0,255,0) to HSV(120°,100%,100%)', () => {
      const rgb: Color = { r: 0, g: 255, b: 0 };
      const hsv = rgbToHsv(rgb);

      expect(hsv.h).toBeCloseTo(120, 1);
      expect(hsv.s).toBeCloseTo(100, 1);
      expect(hsv.v).toBeCloseTo(100, 1);
    });

    test('should convert pure blue RGB(0,0,255) to HSV(240°,100%,100%)', () => {
      const rgb: Color = { r: 0, g: 0, b: 255 };
      const hsv = rgbToHsv(rgb);

      expect(hsv.h).toBeCloseTo(240, 1);
      expect(hsv.s).toBeCloseTo(100, 1);
      expect(hsv.v).toBeCloseTo(100, 1);
    });

    test('should convert grayscale RGB(128,128,128) to HSV(0°,0%,50%)', () => {
      const rgb: Color = { r: 128, g: 128, b: 128 };
      const hsv = rgbToHsv(rgb);

      expect(hsv.h).toBeCloseTo(0, 1);
      expect(hsv.s).toBeCloseTo(0, 1);
      expect(hsv.v).toBeCloseTo(50.2, 1); // 128/255 * 100 ≈ 50.2
    });

    test('should convert black RGB(0,0,0) to HSV(0°,0%,0%)', () => {
      const rgb: Color = { r: 0, g: 0, b: 0 };
      const hsv = rgbToHsv(rgb);

      expect(hsv.h).toBeCloseTo(0, 1);
      expect(hsv.s).toBeCloseTo(0, 1);
      expect(hsv.v).toBeCloseTo(0, 1);
    });

    test('should convert white RGB(255,255,255) to HSV(0°,0%,100%)', () => {
      const rgb: Color = { r: 255, g: 255, b: 255 };
      const hsv = rgbToHsv(rgb);

      expect(hsv.h).toBeCloseTo(0, 1);
      expect(hsv.s).toBeCloseTo(0, 1);
      expect(hsv.v).toBeCloseTo(100, 1);
    });

    test('should convert cyan RGB(0,255,255) to HSV(180°,100%,100%)', () => {
      const rgb: Color = { r: 0, g: 255, b: 255 };
      const hsv = rgbToHsv(rgb);

      expect(hsv.h).toBeCloseTo(180, 1);
      expect(hsv.s).toBeCloseTo(100, 1);
      expect(hsv.v).toBeCloseTo(100, 1);
    });

    test('should convert magenta RGB(255,0,255) to HSV(300°,100%,100%)', () => {
      const rgb: Color = { r: 255, g: 0, b: 255 };
      const hsv = rgbToHsv(rgb);

      expect(hsv.h).toBeCloseTo(300, 1);
      expect(hsv.s).toBeCloseTo(100, 1);
      expect(hsv.v).toBeCloseTo(100, 1);
    });

    test('should convert yellow RGB(255,255,0) to HSV(60°,100%,100%)', () => {
      const rgb: Color = { r: 255, g: 255, b: 0 };
      const hsv = rgbToHsv(rgb);

      expect(hsv.h).toBeCloseTo(60, 1);
      expect(hsv.s).toBeCloseTo(100, 1);
      expect(hsv.v).toBeCloseTo(100, 1);
    });
  });

  describe('HSV to RGB Conversion', () => {
    test('should convert HSV(0°,100%,100%) to RGB(255,0,0)', () => {
      const hsv: HSVColor = { h: 0, s: 100, v: 100 };
      const rgb = hsvToRgb(hsv);

      expect(rgb.r).toBeCloseTo(255, 0);
      expect(rgb.g).toBeCloseTo(0, 0);
      expect(rgb.b).toBeCloseTo(0, 0);
    });

    test('should convert HSV(120°,100%,100%) to RGB(0,255,0)', () => {
      const hsv: HSVColor = { h: 120, s: 100, v: 100 };
      const rgb = hsvToRgb(hsv);

      expect(rgb.r).toBeCloseTo(0, 0);
      expect(rgb.g).toBeCloseTo(255, 0);
      expect(rgb.b).toBeCloseTo(0, 0);
    });

    test('should convert HSV(240°,100%,100%) to RGB(0,0,255)', () => {
      const hsv: HSVColor = { h: 240, s: 100, v: 100 };
      const rgb = hsvToRgb(hsv);

      expect(rgb.r).toBeCloseTo(0, 0);
      expect(rgb.g).toBeCloseTo(0, 0);
      expect(rgb.b).toBeCloseTo(255, 0);
    });
  });

  describe('Round-trip Conversion Accuracy', () => {
    test('should maintain accuracy in RGB -> HSV -> RGB conversion', () => {
      const originalRgb: Color = { r: 128, g: 192, b: 64 };

      const hsv = rgbToHsv(originalRgb);
      const convertedRgb = hsvToRgb(hsv);

      expect(convertedRgb.r).toBeCloseTo(originalRgb.r, 1);
      expect(convertedRgb.g).toBeCloseTo(originalRgb.g, 1);
      expect(convertedRgb.b).toBeCloseTo(originalRgb.b, 1);
    });

    test('should handle edge case with very low saturation', () => {
      const rgb: Color = { r: 100, g: 101, b: 100 };
      const hsv = rgbToHsv(rgb);
      const convertedRgb = hsvToRgb(hsv);

      expect(convertedRgb.r).toBeCloseTo(rgb.r, 1);
      expect(convertedRgb.g).toBeCloseTo(rgb.g, 1);
      expect(convertedRgb.b).toBeCloseTo(rgb.b, 1);
    });
  });
});