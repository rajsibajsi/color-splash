/**
 * Color space conversion algorithms
 */

import { Color, HSVColor, LABColor } from '../types';

/**
 * Convert RGB color to HSV color space
 * @param rgb RGB color values (0-255)
 * @returns HSV color values (H: 0-360°, S: 0-100%, V: 0-100%)
 */
export function rgbToHsv(rgb: Color): HSVColor {
  // Normalize RGB values to 0-1 range
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  // Calculate Value (brightness)
  const v = max * 100;

  // Calculate Saturation
  let s: number;
  if (max === 0) {
    s = 0;
  } else {
    s = (delta / max) * 100;
  }

  // Calculate Hue
  let h: number;
  if (delta === 0) {
    h = 0; // Undefined hue for grayscale
  } else if (max === r) {
    h = ((g - b) / delta) * 60;
    if (h < 0) h += 360;
  } else if (max === g) {
    h = ((b - r) / delta + 2) * 60;
  } else {
    h = ((r - g) / delta + 4) * 60;
  }

  return {
    h: Math.round(h * 10) / 10, // Round to 1 decimal place
    s: Math.round(s * 10) / 10,
    v: Math.round(v * 10) / 10
  };
}

/**
 * Convert HSV color to RGB color space
 * @param hsv HSV color values (H: 0-360°, S: 0-100%, V: 0-100%)
 * @returns RGB color values (0-255)
 */
export function hsvToRgb(hsv: HSVColor): Color {
  const h = hsv.h;
  const s = hsv.s / 100;
  const v = hsv.v / 100;

  const c = v * s; // Chroma
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;

  let rPrime: number, gPrime: number, bPrime: number;

  if (h >= 0 && h < 60) {
    rPrime = c;
    gPrime = x;
    bPrime = 0;
  } else if (h >= 60 && h < 120) {
    rPrime = x;
    gPrime = c;
    bPrime = 0;
  } else if (h >= 120 && h < 180) {
    rPrime = 0;
    gPrime = c;
    bPrime = x;
  } else if (h >= 180 && h < 240) {
    rPrime = 0;
    gPrime = x;
    bPrime = c;
  } else if (h >= 240 && h < 300) {
    rPrime = x;
    gPrime = 0;
    bPrime = c;
  } else {
    rPrime = c;
    gPrime = 0;
    bPrime = x;
  }

  return {
    r: Math.round((rPrime + m) * 255),
    g: Math.round((gPrime + m) * 255),
    b: Math.round((bPrime + m) * 255)
  };
}

/**
 * Convert RGB color to LAB color space
 * @param rgb RGB color values (0-255)
 * @returns LAB color values (L: 0-100, A: -128 to 127, B: -128 to 127)
 */
export function rgbToLab(rgb: Color): LABColor {
  // First convert RGB to XYZ
  let r = rgb.r / 255;
  let g = rgb.g / 255;
  let b = rgb.b / 255;

  // Apply gamma correction
  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  // Convert to XYZ using sRGB matrix
  let x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375;
  let y = r * 0.2126729 + g * 0.7151522 + b * 0.0721750;
  let z = r * 0.0193339 + g * 0.1191920 + b * 0.9503041;

  // Normalize for D65 illuminant
  x = x / 0.95047;
  y = y / 1.00000;
  z = z / 1.08883;

  // Apply LAB conversion
  x = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x + 16/116);
  y = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y + 16/116);
  z = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z + 16/116);

  const l = (116 * y) - 16;
  const a = 500 * (x - y);
  const bLab = 200 * (y - z);

  return {
    l: Math.round(l * 10) / 10,
    a: Math.round(a * 10) / 10,
    b: Math.round(bLab * 10) / 10
  };
}