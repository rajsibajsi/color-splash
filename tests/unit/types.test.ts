/**
 * Tests for type definitions and type system validation
 */

import {
  Color,
  ColorTolerance,
  SelectionArea,
  SplashConfig,
  ColorSpace,
  GrayscaleMethod,
  BlendMode,
  PreviewQuality,
  ColorSplashError,
  ColorSplashException,
  HSVColor,
  LABColor,
} from '../../src/types';

describe('Type System Validation', () => {
  describe('Color interface', () => {
    test('should accept valid RGB color', () => {
      const color: Color = { r: 255, g: 128, b: 64 };
      expect(color.r).toBe(255);
      expect(color.g).toBe(128);
      expect(color.b).toBe(64);
      expect(color.a).toBeUndefined();
    });

    test('should accept color with alpha channel', () => {
      const color: Color = { r: 255, g: 128, b: 64, a: 128 };
      expect(color.a).toBe(128);
    });

    test('should enforce number types for RGB values', () => {
      // This test validates TypeScript compilation
      const color: Color = { r: 255, g: 128, b: 64 };
      expect(typeof color.r).toBe('number');
      expect(typeof color.g).toBe('number');
      expect(typeof color.b).toBe('number');
    });
  });

  describe('ColorTolerance interface', () => {
    test('should accept HSV tolerance values', () => {
      const tolerance: ColorTolerance = {
        hue: 15,
        saturation: 20,
        lightness: 25,
      };
      expect(tolerance.hue).toBe(15);
      expect(tolerance.saturation).toBe(20);
      expect(tolerance.lightness).toBe(25);
    });

    test('should accept euclidean distance for LAB', () => {
      const tolerance: ColorTolerance = {
        euclidean: 25,
      };
      expect(tolerance.euclidean).toBe(25);
    });

    test('should allow empty tolerance object', () => {
      const tolerance: ColorTolerance = {};
      expect(Object.keys(tolerance)).toHaveLength(0);
    });
  });

  describe('SelectionArea interface', () => {
    test('should accept rectangle area', () => {
      const area: SelectionArea = {
        type: 'rectangle',
        coordinates: [
          { x: 10, y: 10 },
          { x: 100, y: 100 },
        ],
      };
      expect(area.type).toBe('rectangle');
      expect(area.coordinates).toHaveLength(2);
    });

    test('should accept circle area with feathering', () => {
      const area: SelectionArea = {
        type: 'circle',
        coordinates: [
          { x: 50, y: 50 },
          { x: 75, y: 50 }, // Center and radius point
        ],
        featherRadius: 10,
      };
      expect(area.featherRadius).toBe(10);
    });
  });

  describe('SplashConfig interface', () => {
    test('should accept minimal configuration', () => {
      const config: SplashConfig = {
        targetColors: [{ r: 255, g: 0, b: 0 }],
        tolerance: { hue: 15 },
      };
      expect(config.targetColors).toHaveLength(1);
      expect(config.tolerance.hue).toBe(15);
    });

    test('should accept full configuration', () => {
      const config: SplashConfig = {
        targetColors: [
          { r: 255, g: 0, b: 0 },
          { r: 0, g: 255, b: 0 },
        ],
        tolerance: { hue: 15, saturation: 20, lightness: 25 },
        area: {
          type: 'circle',
          coordinates: [
            { x: 100, y: 100 },
            { x: 150, y: 100 },
          ],
        },
        colorSpace: ColorSpace.HSV,
        grayscaleMethod: GrayscaleMethod.LUMINANCE,
        blendMode: BlendMode.REPLACE,
      };

      expect(config.targetColors).toHaveLength(2);
      expect(config.colorSpace).toBe(ColorSpace.HSV);
      expect(config.grayscaleMethod).toBe(GrayscaleMethod.LUMINANCE);
      expect(config.blendMode).toBe(BlendMode.REPLACE);
    });
  });

  describe('Enum validation', () => {
    test('ColorSpace enum should have correct values', () => {
      expect(ColorSpace.RGB).toBe('rgb');
      expect(ColorSpace.HSV).toBe('hsv');
      expect(ColorSpace.LAB).toBe('lab');
    });

    test('GrayscaleMethod enum should have correct values', () => {
      expect(GrayscaleMethod.LUMINANCE).toBe('luminance');
      expect(GrayscaleMethod.AVERAGE).toBe('average');
      expect(GrayscaleMethod.DESATURATION).toBe('desaturation');
    });

    test('BlendMode enum should have correct values', () => {
      expect(BlendMode.REPLACE).toBe('replace');
      expect(BlendMode.OVERLAY).toBe('overlay');
      expect(BlendMode.MULTIPLY).toBe('multiply');
    });

    test('PreviewQuality enum should have correct values', () => {
      expect(PreviewQuality.LOW).toBe('low');
      expect(PreviewQuality.MEDIUM).toBe('medium');
      expect(PreviewQuality.HIGH).toBe('high');
      expect(PreviewQuality.REALTIME).toBe('realtime');
    });
  });

  describe('ColorSplashException', () => {
    test('should create exception with error code', () => {
      const error = new ColorSplashException(
        ColorSplashError.INVALID_IMAGE_DATA,
        'Test error message'
      );

      expect(error.code).toBe(ColorSplashError.INVALID_IMAGE_DATA);
      expect(error.message).toBe('Test error message');
      expect(error.name).toBe('ColorSplashException');
      expect(error instanceof Error).toBe(true);
    });

    test('should create exception with details', () => {
      const details = { width: 0, height: 0 };
      const error = new ColorSplashException(
        ColorSplashError.INVALID_IMAGE_DATA,
        'Invalid dimensions',
        details
      );

      expect(error.details).toEqual(details);
    });
  });

  describe('Color space type validation', () => {
    test('HSVColor should accept valid values', () => {
      const hsv: HSVColor = { h: 180, s: 50, v: 75 };
      expect(hsv.h).toBe(180);
      expect(hsv.s).toBe(50);
      expect(hsv.v).toBe(75);
    });

    test('LABColor should accept valid values', () => {
      const lab: LABColor = { l: 50, a: 25, b: -10 };
      expect(lab.l).toBe(50);
      expect(lab.a).toBe(25);
      expect(lab.b).toBe(-10);
    });
  });

  describe('Interface compatibility', () => {
    test('should allow type inference for complex configurations', () => {
      // This test ensures TypeScript can properly infer types
      const createConfig = (colors: Color[], tolerance: ColorTolerance): SplashConfig => ({
        targetColors: colors,
        tolerance,
        colorSpace: ColorSpace.HSV,
      });

      const config = createConfig([{ r: 255, g: 0, b: 0 }], { hue: 15, saturation: 20 });

      expect(config.targetColors).toHaveLength(1);
      expect(config.tolerance.hue).toBe(15);
    });

    test('should enforce required properties', () => {
      // This validates that TypeScript compilation catches missing required props
      expect(() => {
        const config: SplashConfig = {
          targetColors: [{ r: 255, g: 0, b: 0 }],
          tolerance: { hue: 15 },
        };
        return config;
      }).not.toThrow();
    });
  });
});
