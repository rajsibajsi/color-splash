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

// Export core image processing functions
export { convertToGrayscale, extractColorMask, applyColorSplash } from './core/image-processing';

// Export performance optimization functions
export { createFastPreview, resizeImageData, calculateOptimalPreviewSize } from './core/performance-optimization';

// Export main ColorSplash class
export { ColorSplash } from './core/ColorSplash';