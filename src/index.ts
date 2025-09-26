/**
 * Color Splash Library - Main Entry Point
 *
 * A TypeScript library for creating color splash effects on images
 * with real-time preview support and multiple color space algorithms.
 */

// Export all types
export * from './types';

// Export color conversion algorithms
export { rgbToHsv, hsvToRgb, rgbToLab } from './algorithms/color-conversion';

// Export color similarity algorithms
export { isColorSimilar, calculateColorDistance } from './algorithms/color-similarity';

// Main ColorSplash class will be exported here when implemented
// export { ColorSplash } from './core/ColorSplash';