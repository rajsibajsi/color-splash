# Color Splash Library 🎨

A powerful TypeScript library for creating stunning color splash effects on images with real-time preview support. Preserve selected colors while converting others to grayscale, perfect for highlighting specific elements in photographs.

[![Tests](https://img.shields.io/badge/tests-95%20passing-brightgreen)](https://github.com/rajsibajsi/color-splash)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## ✨ Features

- 🚀 **Real-time Preview**: Generate fast previews in <50ms for responsive UIs
- 🎯 **Precise Color Selection**: Advanced HSV, LAB, and RGB color matching algorithms
- 🖼️ **Multi-Resolution Processing**: Optimized performance with smart scaling
- 💾 **Intelligent Caching**: LRU cache system for faster repeated operations
- 📊 **Performance Monitoring**: Built-in timing statistics and optimization
- 🎨 **Multiple Color Spaces**: HSV, LAB, RGB support for accurate color matching
- 🔄 **Incremental Updates**: Change parameters without full reprocessing
- 📱 **Web-Optimized**: Perfect for client-side image editing applications

## 🖼️ Examples

### Original vs Color Splash Effect

<table>
<tr>
<td>
<img src="docs/images/original.png" alt="Original climbing wall image" width="400"/>
<br><em>Original Image</em>
</td>
<td>
<img src="docs/images/colorsplash-full.png" alt="Color splash effect highlighting blue holds" width="400"/>
<br><em>Color Splash Effect</em>
</td>
</tr>
</table>

### Fast Preview Generation

<img src="docs/images/colorsplash-preview.png" alt="Fast preview for real-time interaction" width="400"/>
<br><em>High-Quality Preview (600x400) - Generated in 41ms</em>

## 📦 Installation

```bash
npm install color-splash
```

Or with yarn:

```bash
yarn add color-splash
```

## 🚀 Quick Start

### Basic Usage

```typescript
import { ColorSplash, PreviewQuality, ColorSpace } from 'color-splash';

// Initialize the ColorSplash class
const colorSplash = new ColorSplash({
  previewQuality: PreviewQuality.HIGH,
  defaultColorSpace: ColorSpace.HSV,
  maxPreviewSize: 600
});

// Load your image as ImageData (from canvas, file, etc.)
const imageData = getImageDataFromCanvas(); // Your image loading logic

// Select a color to preserve (e.g., from a click event)
const selectedColor = colorSplash.selectColor(imageData, 450, 300);

// Create a fast preview for real-time interaction
const preview = await colorSplash.createFastPreview(
  imageData,
  [selectedColor], // Colors to preserve
  { hue: 20, saturation: 30, lightness: 25 } // Tolerance
);

// Apply full-resolution color splash when ready
const result = await colorSplash.applyColorSplash(imageData, {
  targetColors: [selectedColor],
  tolerance: { hue: 20, saturation: 30, lightness: 25 },
  colorSpace: ColorSpace.HSV,
  grayscaleMethod: 'luminance'
});
```

### Advanced Usage with Real-time Updates

```typescript
import { ColorSplash, PreviewQuality, ColorSpace } from 'color-splash';

const colorSplash = new ColorSplash({
  previewQuality: PreviewQuality.REALTIME,
  maxPreviewSize: 400
});

// Preload image for faster subsequent operations
await colorSplash.preloadImage(imageData);

// Create initial preview
let preview = await colorSplash.createFastPreview(
  imageData,
  [{ r: 255, g: 0, b: 0 }], // Red color
  { hue: 15 }
);

// Update parameters incrementally (much faster!)
preview = await colorSplash.updatePreview({
  tolerance: { hue: 25 } // Adjust tolerance on the fly
});

// Add more colors
preview = await colorSplash.updatePreview({
  targetColors: [
    { r: 255, g: 0, b: 0 }, // Red
    { r: 0, g: 0, b: 255 }  // Blue
  ]
});
```

## 🎛️ Configuration Options

### ColorSplash Constructor Options

```typescript
interface ColorSplashOptions {
  defaultColorSpace?: ColorSpace;     // HSV | LAB | RGB (default: HSV)
  defaultTolerance?: ColorTolerance;  // Default matching tolerance
  previewQuality?: PreviewQuality;    // LOW | MEDIUM | HIGH | REALTIME
  maxPreviewSize?: number;            // Maximum preview dimension (default: 500)
  processingChunkSize?: number;       // Processing chunk size (default: 50000)
  webWorkers?: boolean;              // Enable web workers (default: false)
  gpuAcceleration?: boolean;         // Enable GPU acceleration (default: false)
}
```

### Color Tolerance

```typescript
interface ColorTolerance {
  hue?: number;        // Hue tolerance in degrees (0-360)
  saturation?: number; // Saturation tolerance (0-100)
  lightness?: number;  // Lightness tolerance (0-100)
  euclidean?: number;  // Euclidean distance for LAB/RGB
}
```

### Preview Quality Levels

- **LOW**: 1/8 resolution, <20ms processing time
- **MEDIUM**: 1/4 resolution, <50ms processing time
- **HIGH**: 1/2 resolution, <100ms processing time
- **REALTIME**: Dynamic scaling based on image size

## 🎨 Color Spaces

### HSV (Hue, Saturation, Value) - Recommended
Best for intuitive color selection and perceptually accurate matching.

```typescript
const tolerance = { hue: 20, saturation: 30, lightness: 25 };
```

### LAB (Perceptually Uniform)
Most accurate for human color perception.

```typescript
const tolerance = { euclidean: 25 };
```

### RGB (Red, Green, Blue)
Simple distance calculation, fastest processing.

```typescript
const tolerance = { euclidean: 30 };
```

## 📊 Performance Optimization

### Caching
The library automatically caches processed results for identical parameters:

```typescript
// First call - processes image
const preview1 = await colorSplash.createFastPreview(imageData, colors, tolerance);

// Second call with same parameters - returns cached result (much faster!)
const preview2 = await colorSplash.createFastPreview(imageData, colors, tolerance);
```

### Performance Monitoring

```typescript
// Get detailed performance statistics
const stats = colorSplash.getPerformanceStats();
console.log(stats);
// Output:
// {
//   create_fast_preview: { average: 41.2, min: 30.1, max: 52.3, count: 5 },
//   apply_color_splash: { average: 89.8, min: 78.2, max: 95.1, count: 2 }
// }

// Check cache utilization
const cacheStats = colorSplash.getCacheStats();
console.log(`Cache: ${cacheStats.size}/${cacheStats.maxSize} entries`);
```

## 🛠️ API Reference

### ColorSplash Class Methods

#### `constructor(options?: ColorSplashOptions)`
Initialize a new ColorSplash instance with optional configuration.

#### `selectColor(imageData: ImageData, x: number, y: number): Color`
Select a color from the image at specified coordinates.

#### `preloadImage(imageData: ImageData): Promise<void>`
Preload an image for faster subsequent operations.

#### `createFastPreview(imageData, targetColors, tolerance?, quality?): Promise<ImageData>`
Generate a fast, lower-resolution preview for real-time interaction.

#### `updatePreview(partialConfig: Partial<SplashConfig>): Promise<ImageData>`
Update the current preview with new parameters (requires preloaded image).

#### `applyColorSplash(imageData, config): Promise<ImageData>`
Apply color splash effect at full resolution.

#### `setPreviewQuality(quality: PreviewQuality): void`
Change the default preview quality.

#### `clearCache(): void`
Clear all cached results.

### Standalone Functions

```typescript
import {
  applyColorSplash,
  createFastPreview,
  convertToGrayscale,
  rgbToHsv,
  isColorSimilar
} from 'color-splash';

// Apply color splash without class wrapper
const result = applyColorSplash(imageData, targetColors, tolerance, ColorSpace.HSV);

// Convert image to grayscale
const grayImage = convertToGrayscale(imageData, GrayscaleMethod.LUMINANCE);

// Color space conversion
const hsvColor = rgbToHsv({ r: 255, g: 128, b: 0 });

// Color similarity testing
const isSimilar = isColorSimilar(color1, color2, tolerance, ColorSpace.HSV);
```

## 🌐 Browser Usage

### With Canvas API

```typescript
// Get ImageData from canvas
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

// Process with ColorSplash
const colorSplash = new ColorSplash();
const result = await colorSplash.applyColorSplash(imageData, config);

// Draw result back to canvas
ctx.putImageData(result, 0, 0);
```

### With File Input

```typescript
function handleImageUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const img = new Image();
  img.onload = async () => {
    // Draw to canvas to get ImageData
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Apply color splash effect
    const colorSplash = new ColorSplash();
    const result = await colorSplash.applyColorSplash(imageData, {
      targetColors: [{ r: 255, g: 0, b: 0 }], // Red
      tolerance: { hue: 20 }
    });

    // Display result
    ctx.putImageData(result, 0, 0);
    document.body.appendChild(canvas);
  };

  img.src = URL.createObjectURL(file);
}
```

## 📱 React Integration Example

```tsx
import React, { useRef, useCallback, useState } from 'react';
import { ColorSplash, PreviewQuality, Color } from 'color-splash';

const ColorSplashEditor: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [colorSplash] = useState(() => new ColorSplash({
    previewQuality: PreviewQuality.HIGH
  }));
  const [selectedColor, setSelectedColor] = useState<Color | null>(null);

  const handleCanvasClick = useCallback(async (event: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Select color at click position
    const color = colorSplash.selectColor(imageData, x, y);
    setSelectedColor(color);

    // Generate fast preview
    const preview = await colorSplash.createFastPreview(
      imageData,
      [color],
      { hue: 20, saturation: 30, lightness: 25 }
    );

    // Display preview
    ctx.putImageData(preview, 0, 0);
  }, [colorSplash]);

  return (
    <div>
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        style={{ cursor: 'crosshair' }}
      />
      {selectedColor && (
        <div style={{
          backgroundColor: `rgb(${selectedColor.r}, ${selectedColor.g}, ${selectedColor.b})`,
          width: 50,
          height: 50
        }} />
      )}
    </div>
  );
};
```

## ⚡ Performance Tips

1. **Use Preview Quality Wisely**:
   - `REALTIME` for interactive sliders and live adjustments
   - `HIGH` for preview before final processing
   - `LOW` for very large images or slow devices

2. **Preload Images**:
   ```typescript
   await colorSplash.preloadImage(imageData);
   // Now all operations will be faster
   ```

3. **Leverage Caching**:
   - Identical parameters will return cached results instantly
   - Clear cache only when necessary

4. **Use Incremental Updates**:
   ```typescript
   // Initial setup
   await colorSplash.preloadImage(imageData);
   await colorSplash.createFastPreview(imageData, colors, tolerance);

   // Fast parameter adjustments
   await colorSplash.updatePreview({ tolerance: { hue: 25 } }); // Much faster!
   ```

## 🧪 Testing

Run the test suite:

```bash
npm test
```

Run specific test categories:

```bash
npm test -- --testPathPattern=color-similarity
npm test -- --testPathPattern=performance-optimization
npm test -- --testPathPattern=color-splash-class
```

## 📝 Development

### Building

```bash
npm run build
```

### Development Mode

```bash
npm run dev
```

### Type Checking

```bash
npm run typecheck
```

### Linting

```bash
npm run lint
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Run tests (`npm test`)
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## 📚 Algorithm Details

This library implements sophisticated color matching algorithms:

- **HSV Color Space**: Separates hue from saturation/lightness for intuitive color selection
- **LAB Color Space**: Perceptually uniform color space for accurate human vision simulation
- **Hue Wrap-around**: Proper handling of the 0°/360° hue boundary
- **Multi-resolution Processing**: Intelligent scaling for performance optimization
- **LRU Caching**: Least Recently Used cache eviction for optimal memory usage

## 🎯 Use Cases

- **Photo Editing Applications**: Highlight specific colors in photographs
- **Sport Analysis**: Isolate team colors in sports footage
- **Medical Imaging**: Highlight specific tissue types or contrast agents
- **Art and Design**: Create selective color effects for artistic purposes
- **E-commerce**: Highlight product colors in marketing images
- **Educational Tools**: Demonstrate color theory and image processing concepts

## 📞 Support

If you have questions or need help:

- 📚 Check the [examples](examples/) directory
- 🐛 [Report bugs](https://github.com/rajsibajsi/color-splash/issues)
- 💬 [Start a discussion](https://github.com/rajsibajsi/color-splash/discussions)

---

<p align="center">
Made with ❤️ by developers, for developers
</p>