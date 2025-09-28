/**
 * Core image processing operations
 */

import { Color, ColorTolerance, ColorSpace, GrayscaleMethod } from '../types';
import { isColorSimilar } from '../algorithms/color-similarity';

/**
 * Convert image to grayscale using specified method
 * @param imageData Source image data
 * @param method Grayscale conversion method
 * @returns New grayscale ImageData
 */
export function convertToGrayscale(imageData: ImageData, method: GrayscaleMethod): ImageData {
  const { data, width, height } = imageData;
  const result = new ImageData(width, height);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;
    const a = data[i + 3]!;

    let gray: number;

    switch (method) {
      case GrayscaleMethod.LUMINANCE:
        // Standard luminance formula
        gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        break;

      case GrayscaleMethod.AVERAGE:
        // Simple average
        gray = Math.round((r + g + b) / 3);
        break;

      case GrayscaleMethod.DESATURATION:
        // Average of min and max
        gray = Math.round((Math.max(r, g, b) + Math.min(r, g, b)) / 2);
        break;

      default:
        throw new Error(`Unsupported grayscale method: ${method}`);
    }

    result.data[i] = gray; // R
    result.data[i + 1] = gray; // G
    result.data[i + 2] = gray; // B
    result.data[i + 3] = a; // A (preserve alpha)
  }

  return result;
}

/**
 * Generate boolean mask for pixels matching target colors
 * @param imageData Source image data
 * @param targetColors Array of target colors to match
 * @param tolerance Color matching tolerance
 * @param colorSpace Color space for comparison
 * @returns Boolean array where true = pixel matches target colors
 */
export function extractColorMask(
  imageData: ImageData,
  targetColors: Color[],
  tolerance: ColorTolerance,
  colorSpace: ColorSpace
): boolean[] {
  const { data } = imageData;
  const mask: boolean[] = [];

  // Handle empty target colors
  if (targetColors.length === 0) {
    return new Array(data.length / 4).fill(false);
  }

  for (let i = 0; i < data.length; i += 4) {
    const pixelColor: Color = {
      r: data[i]!,
      g: data[i + 1]!,
      b: data[i + 2]!,
    };

    // Check if pixel matches any target color
    const matches = targetColors.some((targetColor) =>
      isColorSimilar(pixelColor, targetColor, tolerance, colorSpace)
    );

    mask.push(matches);
  }

  return mask;
}

/**
 * Apply color splash effect to image
 * @param imageData Source image data
 * @param targetColors Colors to preserve (not convert to grayscale)
 * @param tolerance Color matching tolerance
 * @param colorSpace Color space for comparison
 * @param grayscaleMethod Method for grayscale conversion
 * @returns New ImageData with color splash effect applied
 */
export function applyColorSplash(
  imageData: ImageData,
  targetColors: Color[],
  tolerance: ColorTolerance,
  colorSpace: ColorSpace,
  grayscaleMethod: GrayscaleMethod
): ImageData {
  const { data, width, height } = imageData;
  const result = new ImageData(width, height);

  // Generate mask for target colors
  const mask = extractColorMask(imageData, targetColors, tolerance, colorSpace);

  // Convert to grayscale first
  const grayscaleImage = convertToGrayscale(imageData, grayscaleMethod);

  for (let i = 0; i < data.length; i += 4) {
    const pixelIndex = i / 4;

    if (mask[pixelIndex]) {
      // Preserve original color for matched pixels
      result.data[i] = data[i]!; // R
      result.data[i + 1] = data[i + 1]!; // G
      result.data[i + 2] = data[i + 2]!; // B
      result.data[i + 3] = data[i + 3]!; // A
    } else {
      // Use grayscale for non-matched pixels
      result.data[i] = grayscaleImage.data[i]!; // R
      result.data[i + 1] = grayscaleImage.data[i + 1]!; // G
      result.data[i + 2] = grayscaleImage.data[i + 2]!; // B
      result.data[i + 3] = data[i + 3]!; // A (preserve original alpha)
    }
  }

  return result;
}
