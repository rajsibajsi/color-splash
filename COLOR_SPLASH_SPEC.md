# Color Splash TypeScript Library Specification

## Overview

A TypeScript library that creates color splash/color select effects on images by retaining specified colors while converting the rest to grayscale. The library supports area-based selection, color similarity tolerance adjustment, and multiple color spaces for optimal color matching.

## Core Functionality

### Primary Features

1. **Color Splash Effect**: Convert image to grayscale while preserving selected colors
2. **Area-Based Selection**: Apply effects only within specified regions
3. **Color Similarity Tolerance**: Adjustable parameters to include similar colors
4. **Multiple Color Spaces**: Support for RGB, HSV, and LAB color spaces for better color matching

## API Specification

### Main Class: `ColorSplash`

```typescript
class ColorSplash {
  constructor(options?: ColorSplashOptions);

  // Primary methods
  applyColorSplash(image: ImageData, config: SplashConfig): Promise<ImageData>;
  selectColor(image: ImageData, x: number, y: number): Color;

  // Real-time preview methods
  createFastPreview(image: ImageData, config: SplashConfig): Promise<ImageData>;
  updatePreview(config: Partial<SplashConfig>): Promise<ImageData>;

  // Performance-optimized methods
  preloadImage(image: ImageData): Promise<void>; // Prepare GPU textures
  setPreviewQuality(quality: PreviewQuality): void;
  enableGPUAcceleration(canvas: HTMLCanvasElement): Promise<boolean>;

  // Utility methods
  convertToGrayscale(image: ImageData): ImageData;
  extractColorMask(image: ImageData, targetColors: Color[], tolerance: ColorTolerance): boolean[];
}
```

### Configuration Interfaces

```typescript
interface ColorSplashOptions {
  defaultColorSpace?: ColorSpace;
  defaultTolerance?: ColorTolerance;
  processingChunkSize?: number; // For large images
  webWorkers?: boolean; // Enable web worker processing
  gpuAcceleration?: boolean; // Enable WebGL processing
  previewQuality?: PreviewQuality; // Default preview quality
  maxPreviewSize?: number; // Max pixels for preview (default: 500x500)
}

interface SplashConfig {
  targetColors: Color[];
  tolerance: ColorTolerance;
  area?: SelectionArea;
  colorSpace?: ColorSpace;
  grayscaleMethod?: GrayscaleMethod;
  blendMode?: BlendMode;
}

interface Color {
  r: number;
  g: number;
  b: number;
  a?: number;
}

interface ColorTolerance {
  hue?: number;        // 0-360 degrees
  saturation?: number; // 0-100%
  lightness?: number;  // 0-100%
  euclidean?: number;  // For LAB color space
}

interface SelectionArea {
  type: 'rectangle' | 'circle' | 'polygon' | 'freehand';
  coordinates: Point[];
  featherRadius?: number; // Soft edge transition
}

interface Point {
  x: number;
  y: number;
}

enum ColorSpace {
  RGB = 'rgb',
  HSV = 'hsv',
  LAB = 'lab'
}

enum GrayscaleMethod {
  LUMINANCE = 'luminance',    // 0.299*R + 0.587*G + 0.114*B
  AVERAGE = 'average',        // (R + G + B) / 3
  DESATURATION = 'desaturation' // (max(R,G,B) + min(R,G,B)) / 2
}

enum BlendMode {
  REPLACE = 'replace',        // Direct replacement
  OVERLAY = 'overlay',        // Blend with original
  MULTIPLY = 'multiply'       // Multiply blend
}

enum PreviewQuality {
  LOW = 'low',           // 1/8 resolution, pixel sampling
  MEDIUM = 'medium',     // 1/4 resolution, basic filtering
  HIGH = 'high',         // 1/2 resolution, full processing
  REALTIME = 'realtime'  // Dynamic quality based on performance
}
```

## Algorithm Implementation Details

### Color Similarity Detection

The library uses different algorithms based on the selected color space:

#### HSV Color Space (Recommended)
- **Hue Tolerance**: Circular distance calculation (handles 0°/360° wrap-around)
- **Saturation/Value Tolerance**: Linear distance within specified thresholds
- **Formula**: `|h1 - h2| < hue_tolerance && |s1 - s2| < sat_tolerance && |v1 - v2| < val_tolerance`

#### LAB Color Space (Perceptually Accurate)
- **Euclidean Distance**: `sqrt((L1-L2)² + (a1-a2)² + (b1-b2)²)`
- **Perceptual Uniformity**: Better matches human color perception
- **Threshold**: Single euclidean distance value

#### RGB Color Space (Simple)
- **Euclidean Distance**: `sqrt((R1-R2)² + (G1-G2)² + (B1-B2)²)`
- **Fast Processing**: Direct pixel comparison without color space conversion

### Performance Optimizations

#### For Real-time Web Previews

1. **GPU Acceleration (WebGL)**:
   - Fragment shaders for parallel pixel processing
   - 50-100x faster than CPU for large images
   - Automatic fallback to CPU when WebGL unavailable

2. **Multi-Resolution Processing**:
   - Low-res previews (1/8 to 1/2 resolution) for real-time feedback
   - Full resolution only for final output
   - Adaptive quality based on image size and device performance

3. **Incremental Updates**:
   - Cache processed base image and color masks
   - Only reprocess when tolerance or colors change
   - Differential rendering for parameter tweaks

4. **Smart Sampling**:
   - Process every Nth pixel for ultra-fast previews
   - Interpolation for smooth preview display
   - Progressive enhancement as user stops interacting

#### Traditional CPU Optimizations

5. **Hash Set Pre-calculation**: Pre-compute acceptable color ranges for faster pixel processing
6. **Web Worker Support**: Process large images in background threads
7. **Chunked Processing**: Process images in segments to prevent UI blocking
8. **Memoization**: Cache color space conversions for repeated colors

### Area-Based Processing

```typescript
interface AreaProcessor {
  isPointInArea(x: number, y: number, area: SelectionArea): boolean;
  applyFeathering(mask: boolean[], featherRadius: number): number[];
}
```

## Usage Examples

### Real-time Web Preview Setup

```typescript
// Initialize with GPU acceleration for fast previews
const colorSplash = new ColorSplash({
  gpuAcceleration: true,
  previewQuality: PreviewQuality.REALTIME,
  maxPreviewSize: 500 * 500 // 500x500 max for previews
});

// Setup canvas for WebGL acceleration
const canvas = document.getElementById('preview-canvas') as HTMLCanvasElement;
await colorSplash.enableGPUAcceleration(canvas);

// Preload image once for multiple preview operations
const imageData = canvas.getImageData(0, 0, width, height);
await colorSplash.preloadImage(imageData);

// Handle color selection with immediate preview
canvas.addEventListener('click', async (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  // Select color and show preview immediately
  const selectedColor = colorSplash.selectColor(imageData, x, y);

  const config: SplashConfig = {
    targetColors: [selectedColor],
    tolerance: { hue: 15, saturation: 20, lightness: 25 },
    colorSpace: ColorSpace.HSV
  };

  // Fast preview - typically <50ms for 500x500 images
  const preview = await colorSplash.createFastPreview(imageData, config);

  // Display preview immediately
  const previewCanvas = document.getElementById('preview');
  const ctx = previewCanvas.getContext('2d');
  ctx.putImageData(preview, 0, 0);
});

// Handle tolerance adjustments with incremental updates
document.getElementById('tolerance-slider').addEventListener('input', async (event) => {
  const tolerance = parseInt(event.target.value);

  // Update preview with new tolerance - uses cached data for speed
  const preview = await colorSplash.updatePreview({
    tolerance: { hue: tolerance, saturation: tolerance + 5, lightness: tolerance + 10 }
  });

  // Update display
  const ctx = previewCanvas.getContext('2d');
  ctx.putImageData(preview, 0, 0);
});
```

### Basic Color Splash

```typescript
const colorSplash = new ColorSplash();

// Load image data (from canvas or file)
const imageData = canvas.getImageData(0, 0, width, height);

// Select target color (e.g., from user click)
const targetColor = colorSplash.selectColor(imageData, clickX, clickY);

// Apply color splash effect
const config: SplashConfig = {
  targetColors: [targetColor],
  tolerance: {
    hue: 15,        // ±15 degrees
    saturation: 20, // ±20%
    lightness: 25   // ±25%
  },
  colorSpace: ColorSpace.HSV
};

const result = await colorSplash.applyColorSplash(imageData, config);
```

### Area-Based Color Splash

```typescript
// Define circular selection area
const area: SelectionArea = {
  type: 'circle',
  coordinates: [
    { x: centerX, y: centerY },
    { x: centerX + radius, y: centerY }
  ],
  featherRadius: 10
};

const config: SplashConfig = {
  targetColors: [redColor, blueColor],
  tolerance: { euclidean: 25 },
  area: area,
  colorSpace: ColorSpace.LAB
};

const result = await colorSplash.applyColorSplash(imageData, config);
```

### Multiple Colors with Different Tolerances

```typescript
const config: SplashConfig = {
  targetColors: [
    { r: 255, g: 0, b: 0 },   // Pure red
    { r: 0, g: 255, b: 0 },   // Pure green
    { r: 0, g: 0, b: 255 }    // Pure blue
  ],
  tolerance: {
    hue: 20,
    saturation: 30,
    lightness: 35
  },
  colorSpace: ColorSpace.HSV,
  grayscaleMethod: GrayscaleMethod.LUMINANCE
};
```

## Browser Compatibility

- **Modern Browsers**: Full support with ImageData API
- **Web Workers**: Optional for performance enhancement
- **Canvas 2D Context**: Required for image processing
- **File API**: For image loading from files

## Performance Considerations

### Real-time Preview Performance

**Target Performance Metrics:**
- **Preview Generation**: <50ms for 500x500 images
- **Color Selection**: <10ms response time
- **Tolerance Updates**: <30ms for incremental changes
- **UI Responsiveness**: 60fps during interactions

### Image Size Recommendations

**For Real-time Previews:**
- **Preview Resolution**: Max 500x500 pixels (250k pixels)
- **GPU Processing**: Up to 2000x2000 pixels (4MP) at 60fps
- **CPU Fallback**: Max 800x800 pixels (640k pixels) for smooth previews

**For Final Processing:**
- **Small Images** (< 1MP): Direct processing
- **Medium Images** (1-5MP): Chunked processing recommended
- **Large Images** (> 5MP): Web worker + chunked processing required

### Memory Usage
- **Original Image**: `width × height × 4 bytes`
- **Preview Cache**: Additional 1x memory for low-res preview
- **GPU Textures**: Additional 2x memory when using WebGL
- **Working Copies**: Additional 1-2x memory for processing
- **Optimization**: Process in-place where possible, release GPU memory when idle

## Error Handling

```typescript
enum ColorSplashError {
  INVALID_IMAGE_DATA = 'INVALID_IMAGE_DATA',
  UNSUPPORTED_COLOR_SPACE = 'UNSUPPORTED_COLOR_SPACE',
  INVALID_TOLERANCE_VALUES = 'INVALID_TOLERANCE_VALUES',
  PROCESSING_FAILED = 'PROCESSING_FAILED'
}

class ColorSplashException extends Error {
  constructor(
    public code: ColorSplashError,
    message: string,
    public details?: any
  ) {
    super(message);
  }
}
```

## Testing Strategy

### Unit Tests
- Color space conversion accuracy
- Color similarity calculations
- Area boundary detection
- Tolerance threshold validation

### Integration Tests
- Complete color splash workflow
- Performance benchmarks
- Memory usage monitoring
- Browser compatibility testing

### Visual Tests
- Reference image comparisons
- Color accuracy validation
- Edge case handling (pure black/white, high saturation)

## Future Enhancements

1. **GPU Processing**: WebGL-based acceleration for large images
2. **Advanced Selection Tools**: Magic wand, edge detection
3. **Batch Processing**: Multiple images simultaneously
4. **Export Formats**: Direct PNG/JPEG export without canvas
5. **Undo/Redo**: History management for interactive applications
6. **Real-time Preview**: Live updates during parameter adjustment

## Dependencies

- **Core**: No external dependencies (vanilla TypeScript/JavaScript)
- **Optional**: Web Workers API for performance
- **Development**: Jest for testing, Webpack for bundling
- **Types**: Comprehensive TypeScript definitions included

This specification provides a robust foundation for implementing a professional-grade color splash library with flexible configuration options and optimal performance characteristics.