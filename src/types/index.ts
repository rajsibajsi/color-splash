/**
 * Core type definitions for Color Splash library
 */

export interface Color {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export interface ColorTolerance {
  hue?: number;        // 0-360 degrees
  saturation?: number; // 0-100%
  lightness?: number;  // 0-100%
  euclidean?: number;  // For LAB color space
}

export interface Point {
  x: number;
  y: number;
}

export interface SelectionArea {
  type: 'rectangle' | 'circle' | 'polygon' | 'freehand';
  coordinates: Point[];
  featherRadius?: number; // Soft edge transition
}

export interface SplashConfig {
  targetColors: Color[];
  tolerance: ColorTolerance;
  area?: SelectionArea;
  colorSpace?: ColorSpace;
  grayscaleMethod?: GrayscaleMethod;
  blendMode?: BlendMode;
}

export interface ColorSplashOptions {
  defaultColorSpace?: ColorSpace;
  defaultTolerance?: ColorTolerance;
  processingChunkSize?: number; // For large images
  webWorkers?: boolean; // Enable web worker processing
  gpuAcceleration?: boolean; // Enable WebGL processing
  previewQuality?: PreviewQuality; // Default preview quality
  maxPreviewSize?: number; // Max pixels for preview (default: 500x500)
}

export enum ColorSpace {
  RGB = 'rgb',
  HSV = 'hsv',
  LAB = 'lab'
}

export enum GrayscaleMethod {
  LUMINANCE = 'luminance',    // 0.299*R + 0.587*G + 0.114*B
  AVERAGE = 'average',        // (R + G + B) / 3
  DESATURATION = 'desaturation' // (max(R,G,B) + min(R,G,B)) / 2
}

export enum BlendMode {
  REPLACE = 'replace',        // Direct replacement
  OVERLAY = 'overlay',        // Blend with original
  MULTIPLY = 'multiply'       // Multiply blend
}

export enum PreviewQuality {
  LOW = 'low',           // 1/8 resolution, pixel sampling
  MEDIUM = 'medium',     // 1/4 resolution, basic filtering
  HIGH = 'high',         // 1/2 resolution, full processing
  REALTIME = 'realtime'  // Dynamic quality based on performance
}

export enum ColorSplashError {
  INVALID_IMAGE_DATA = 'INVALID_IMAGE_DATA',
  UNSUPPORTED_COLOR_SPACE = 'UNSUPPORTED_COLOR_SPACE',
  INVALID_TOLERANCE_VALUES = 'INVALID_TOLERANCE_VALUES',
  PROCESSING_FAILED = 'PROCESSING_FAILED',
  WEBGL_NOT_SUPPORTED = 'WEBGL_NOT_SUPPORTED'
}

export class ColorSplashException extends Error {
  constructor(
    public code: ColorSplashError,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ColorSplashException';
  }
}

// Utility types for internal use
export interface HSVColor {
  h: number; // 0-360
  s: number; // 0-100
  v: number; // 0-100
}

export interface LABColor {
  l: number; // 0-100
  a: number; // -128 to 127
  b: number; // -128 to 127
}

export interface ImageComparison {
  percentDifferent: number;
  maxColorDistance: number;
}

export interface ColorAnalysis {
  coloredPixelPercentage: number;
  distinctColorRegions: number;
  dominantColors: Array<[string, number]>;
}

export interface AreaProcessor {
  isPointInArea(x: number, y: number, area: SelectionArea): boolean;
  applyFeathering(mask: boolean[], featherRadius: number): number[];
}