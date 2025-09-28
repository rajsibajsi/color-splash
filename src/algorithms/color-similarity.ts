/**
 * Color similarity detection algorithms
 */

import { Color, ColorTolerance, ColorSpace } from '../types';
import { rgbToHsv, rgbToLab } from './color-conversion';

export interface ColorDistance {
  hue?: number;
  saturation?: number;
  value?: number;
  euclidean?: number;
}

/**
 * Determine if two colors are similar based on tolerance and color space
 * @param color1 First color to compare
 * @param color2 Second color to compare
 * @param tolerance Tolerance values for similarity matching
 * @param colorSpace Color space to use for comparison
 * @returns True if colors are similar within tolerance
 */
export function isColorSimilar(
  color1: Color,
  color2: Color,
  tolerance: ColorTolerance,
  colorSpace: ColorSpace
): boolean {
  switch (colorSpace) {
    case ColorSpace.HSV:
      return isColorSimilarHSV(color1, color2, tolerance);
    case ColorSpace.LAB:
      return isColorSimilarLAB(color1, color2, tolerance);
    case ColorSpace.RGB:
      return isColorSimilarRGB(color1, color2, tolerance);
    default:
      throw new Error(`Unsupported color space: ${colorSpace}`);
  }
}

/**
 * Calculate color distance between two colors in specified color space
 * @param color1 First color
 * @param color2 Second color
 * @param colorSpace Color space for distance calculation
 * @returns Distance object with relevant metrics
 */
export function calculateColorDistance(
  color1: Color,
  color2: Color,
  colorSpace: ColorSpace
): ColorDistance {
  switch (colorSpace) {
    case ColorSpace.HSV:
      return calculateHSVDistance(color1, color2);
    case ColorSpace.LAB:
      return calculateLABDistance(color1, color2);
    case ColorSpace.RGB:
      return calculateRGBDistance(color1, color2);
    default:
      throw new Error(`Unsupported color space: ${colorSpace}`);
  }
}

/**
 * HSV color similarity comparison
 */
function isColorSimilarHSV(color1: Color, color2: Color, tolerance: ColorTolerance): boolean {
  const hsv1 = rgbToHsv(color1);
  const hsv2 = rgbToHsv(color2);

  // Calculate hue difference with wrap-around handling
  const hueDiff = calculateHueDifference(hsv1.h, hsv2.h);
  const satDiff = Math.abs(hsv1.s - hsv2.s);
  const valDiff = Math.abs(hsv1.v - hsv2.v);

  // Check if within tolerances
  const hueWithinTolerance = tolerance.hue === undefined || hueDiff <= tolerance.hue;
  const satWithinTolerance = tolerance.saturation === undefined || satDiff <= tolerance.saturation;
  const valWithinTolerance = tolerance.lightness === undefined || valDiff <= tolerance.lightness;

  return hueWithinTolerance && satWithinTolerance && valWithinTolerance;
}

/**
 * LAB color similarity comparison using Euclidean distance
 */
function isColorSimilarLAB(color1: Color, color2: Color, tolerance: ColorTolerance): boolean {
  const lab1 = rgbToLab(color1);
  const lab2 = rgbToLab(color2);

  const distance = Math.sqrt(
    Math.pow(lab1.l - lab2.l, 2) + Math.pow(lab1.a - lab2.a, 2) + Math.pow(lab1.b - lab2.b, 2)
  );

  return tolerance.euclidean === undefined || distance <= tolerance.euclidean;
}

/**
 * RGB color similarity comparison using Euclidean distance
 */
function isColorSimilarRGB(color1: Color, color2: Color, tolerance: ColorTolerance): boolean {
  const distance = Math.sqrt(
    Math.pow(color1.r - color2.r, 2) +
      Math.pow(color1.g - color2.g, 2) +
      Math.pow(color1.b - color2.b, 2)
  );

  return tolerance.euclidean === undefined || distance <= tolerance.euclidean;
}

/**
 * Calculate HSV distance components
 */
function calculateHSVDistance(color1: Color, color2: Color): ColorDistance {
  const hsv1 = rgbToHsv(color1);
  const hsv2 = rgbToHsv(color2);

  return {
    hue: calculateHueDifference(hsv1.h, hsv2.h),
    saturation: Math.abs(hsv1.s - hsv2.s),
    value: Math.abs(hsv1.v - hsv2.v),
  };
}

/**
 * Calculate LAB Euclidean distance
 */
function calculateLABDistance(color1: Color, color2: Color): ColorDistance {
  const lab1 = rgbToLab(color1);
  const lab2 = rgbToLab(color2);

  const euclidean = Math.sqrt(
    Math.pow(lab1.l - lab2.l, 2) + Math.pow(lab1.a - lab2.a, 2) + Math.pow(lab1.b - lab2.b, 2)
  );

  return { euclidean: Math.round(euclidean * 10) / 10 };
}

/**
 * Calculate RGB Euclidean distance
 */
function calculateRGBDistance(color1: Color, color2: Color): ColorDistance {
  const euclidean = Math.sqrt(
    Math.pow(color1.r - color2.r, 2) +
      Math.pow(color1.g - color2.g, 2) +
      Math.pow(color1.b - color2.b, 2)
  );

  return { euclidean: Math.round(euclidean * 100) / 100 };
}

/**
 * Calculate hue difference handling 0°/360° wrap-around
 * @param hue1 First hue value (0-360°)
 * @param hue2 Second hue value (0-360°)
 * @returns Minimum angular distance between hues
 */
function calculateHueDifference(hue1: number, hue2: number): number {
  const diff = Math.abs(hue1 - hue2);
  return Math.min(diff, 360 - diff);
}
