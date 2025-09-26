/**
 * Basic Color Splash Example
 *
 * This example demonstrates how to use the core image processing functions
 * to create a color splash effect on an image.
 */

import {
  Color,
  ColorTolerance,
  ColorSpace,
  GrayscaleMethod,
  applyColorSplash,
  rgbToHsv
} from '../src/index';

// Example usage function
export function createColorSplashExample() {
  // Create a sample 3x2 image with colorful pixels
  const imageData = createSampleImageData();

  // Define target colors to preserve (red and blue)
  const targetColors: Color[] = [
    { r: 255, g: 0, b: 0 },   // Pure red
    { r: 0, g: 0, b: 255 }    // Pure blue
  ];

  // Set tolerance for color matching
  const tolerance: ColorTolerance = {
    hue: 15,        // ±15 degrees hue tolerance
    saturation: 20, // ±20% saturation tolerance
    lightness: 25   // ±25% lightness tolerance
  };

  // Apply color splash effect using HSV color space and luminance grayscale
  const result = applyColorSplash(
    imageData,
    targetColors,
    tolerance,
    ColorSpace.HSV,
    GrayscaleMethod.LUMINANCE
  );

  return {
    original: imageData,
    result: result,
    preservedColors: targetColors,
    tolerance: tolerance
  };
}

// Helper function to create sample ImageData for demonstration
function createSampleImageData(): ImageData {
  // Create a 3x2 image with different colored pixels
  const width = 3;
  const height = 2;
  const data = new Uint8ClampedArray(width * height * 4);

  // Define pixel colors [R, G, B, A]
  const pixels = [
    [255, 0, 0, 255],     // Red (will be preserved)
    [0, 255, 0, 255],     // Green (will become grayscale)
    [0, 0, 255, 255],     // Blue (will be preserved)
    [255, 255, 0, 255],   // Yellow (will become grayscale)
    [255, 0, 255, 255],   // Magenta (will become grayscale)
    [0, 255, 255, 255]    // Cyan (will become grayscale)
  ];

  // Fill the data array
  pixels.forEach((pixel, index) => {
    const dataIndex = index * 4;
    data[dataIndex] = pixel[0]!;     // R
    data[dataIndex + 1] = pixel[1]!; // G
    data[dataIndex + 2] = pixel[2]!; // B
    data[dataIndex + 3] = pixel[3]!; // A
  });

  return new ImageData(data, width, height);
}

// Example of color analysis
export function analyzeImageColors(imageData: ImageData): void {
  console.log('Image Analysis:');
  console.log(`Dimensions: ${imageData.width}x${imageData.height}`);
  console.log(`Total pixels: ${imageData.width * imageData.height}`);

  const colorSummary: { [key: string]: number } = {};

  for (let i = 0; i < imageData.data.length; i += 4) {
    const r = imageData.data[i]!;
    const g = imageData.data[i + 1]!;
    const b = imageData.data[i + 2]!;

    // Convert to HSV for better color description
    const hsv = rgbToHsv({ r, g, b });

    // Create a color key for grouping
    const colorKey = `RGB(${r},${g},${b}) HSV(${Math.round(hsv.h)}°,${Math.round(hsv.s)}%,${Math.round(hsv.v)}%)`;
    colorSummary[colorKey] = (colorSummary[colorKey] || 0) + 1;
  }

  console.log('Colors found:');
  Object.entries(colorSummary).forEach(([color, count]) => {
    console.log(`  ${color}: ${count} pixel${count > 1 ? 's' : ''}`);
  });
}

// Usage example
if (typeof window === 'undefined') {
  // Node.js environment example
  console.log('Color Splash Library Example\n');

  const example = createColorSplashExample();

  console.log('Original image:');
  analyzeImageColors(example.original);

  console.log('\nAfter color splash effect:');
  analyzeImageColors(example.result);

  console.log(`\nPreserved colors: ${example.preservedColors.length}`);
  example.preservedColors.forEach((color, index) => {
    console.log(`  Color ${index + 1}: RGB(${color.r}, ${color.g}, ${color.b})`);
  });
}