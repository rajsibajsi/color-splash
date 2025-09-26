# Color Splash Library - Test-Driven Development Strategy

## Test Categories

### 1. Unit Tests (Algorithm Accuracy)

#### Color Space Conversion Tests
```typescript
describe('Color Space Conversions', () => {
  test('RGB to HSV conversion accuracy', () => {
    // Test known color conversions
    expect(rgbToHsv(255, 0, 0)).toEqual({ h: 0, s: 100, v: 100 }); // Pure red
    expect(rgbToHsv(0, 255, 0)).toEqual({ h: 120, s: 100, v: 100 }); // Pure green
    expect(rgbToHsv(128, 128, 128)).toEqual({ h: 0, s: 0, v: 50 }); // Gray
  });

  test('RGB to LAB conversion accuracy', () => {
    // Test with reference values from colorimetry standards
    expect(rgbToLab(255, 255, 255)).toBeCloseTo([100, 0, 0], 1); // White
    expect(rgbToLab(0, 0, 0)).toBeCloseTo([0, 0, 0], 1); // Black
  });
});
```

#### Color Similarity Algorithm Tests
```typescript
describe('Color Similarity Detection', () => {
  test('HSV color matching with tolerance', () => {
    const targetColor = { r: 255, g: 0, b: 0 }; // Pure red
    const similarColor = { r: 255, g: 20, b: 10 }; // Nearly red
    const differentColor = { r: 0, g: 255, b: 0 }; // Green

    const tolerance = { hue: 15, saturation: 20, lightness: 25 };

    expect(isColorSimilar(targetColor, similarColor, tolerance, 'hsv')).toBe(true);
    expect(isColorSimilar(targetColor, differentColor, tolerance, 'hsv')).toBe(false);
  });

  test('LAB euclidean distance matching', () => {
    const targetColor = { r: 100, g: 150, b: 200 };
    const similarColor = { r: 105, g: 155, b: 205 };
    const differentColor = { r: 200, g: 50, b: 100 };

    const tolerance = { euclidean: 25 };

    expect(isColorSimilar(targetColor, similarColor, tolerance, 'lab')).toBe(true);
    expect(isColorSimilar(targetColor, differentColor, tolerance, 'lab')).toBe(false);
  });

  test('Edge cases - hue wrap-around at 0/360 degrees', () => {
    const redColor1 = { r: 255, g: 0, b: 0 }; // 0° hue
    const redColor2 = { r: 255, g: 0, b: 10 }; // ~358° hue

    const tolerance = { hue: 15, saturation: 20, lightness: 25 };

    expect(isColorSimilar(redColor1, redColor2, tolerance, 'hsv')).toBe(true);
  });
});
```

### 2. Integration Tests (Full Workflow)

#### Image Processing Pipeline Tests
```typescript
describe('Color Splash Integration', () => {
  let testImageData: ImageData;
  let colorSplash: ColorSplash;

  beforeEach(async () => {
    // Load test image
    testImageData = await loadImageData('./fixtures/test.webp');
    colorSplash = new ColorSplash();
  });

  test('Complete color splash workflow', async () => {
    // Select blue climbing holds (approximate coordinates from test image)
    const blueHoldColor = colorSplash.selectColor(testImageData, 400, 300);

    const config: SplashConfig = {
      targetColors: [blueHoldColor],
      tolerance: { hue: 20, saturation: 30, lightness: 35 },
      colorSpace: ColorSpace.HSV
    };

    const result = await colorSplash.applyColorSplash(testImageData, config);

    // Verify result properties
    expect(result.width).toBe(testImageData.width);
    expect(result.height).toBe(testImageData.height);
    expect(result.data.length).toBe(testImageData.data.length);

    // Verify some pixels retained color (blue holds)
    const bluePixels = countColoredPixels(result);
    expect(bluePixels).toBeGreaterThan(1000); // Should have significant blue area

    // Verify some pixels converted to grayscale
    const grayPixels = countGrayscalePixels(result);
    expect(grayPixels).toBeGreaterThan(10000); // Most pixels should be gray
  });
});
```

### 3. Visual Regression Tests (Accuracy Verification)

#### Pixel-Perfect Reference Comparisons
```typescript
describe('Visual Regression Tests', () => {
  test('Orange holds isolation matches reference', async () => {
    const testImage = await loadImageData('./fixtures/test.webp');
    const colorSplash = new ColorSplash();

    // Select orange climbing holds
    const orangeColor = colorSplash.selectColor(testImage, 300, 400);

    const config: SplashConfig = {
      targetColors: [orangeColor],
      tolerance: { hue: 25, saturation: 40, lightness: 30 },
      colorSpace: ColorSpace.HSV
    };

    const result = await colorSplash.applyColorSplash(testImage, config);

    // Compare against pre-generated reference image
    const referenceImage = await loadImageData('./fixtures/references/orange-holds-reference.webp');
    const pixelDifference = compareImages(result, referenceImage);

    // Allow <1% pixel difference for minor algorithm variations
    expect(pixelDifference.percentDifferent).toBeLessThan(1.0);
    expect(pixelDifference.maxColorDistance).toBeLessThan(5); // RGB distance
  });

  test('Multiple color selection accuracy', async () => {
    const testImage = await loadImageData('./fixtures/test.webp');
    const colorSplash = new ColorSplash();

    // Select multiple hold colors
    const blueColor = colorSplash.selectColor(testImage, 400, 300);
    const redColor = colorSplash.selectColor(testImage, 600, 250);
    const yellowColor = colorSplash.selectColor(testImage, 200, 350);

    const config: SplashConfig = {
      targetColors: [blueColor, redColor, yellowColor],
      tolerance: { hue: 20, saturation: 30, lightness: 25 },
      colorSpace: ColorSpace.HSV
    };

    const result = await colorSplash.applyColorSplash(testImage, config);

    // Verify color distribution
    const colorStats = analyzeColorDistribution(result);
    expect(colorStats.coloredPixelPercentage).toBeCloseTo(15, 2); // ~15% colored
    expect(colorStats.distinctColorRegions).toBe(3); // Should find 3 color groups
  });
});
```

### 4. Performance Tests

#### Speed and Memory Benchmarks
```typescript
describe('Performance Tests', () => {
  test('Preview generation speed', async () => {
    const testImage = await loadImageData('./fixtures/test.webp');
    const colorSplash = new ColorSplash({ previewQuality: PreviewQuality.MEDIUM });

    const startTime = performance.now();

    const config: SplashConfig = {
      targetColors: [{ r: 0, g: 100, b: 200 }],
      tolerance: { hue: 20, saturation: 30, lightness: 25 }
    };

    await colorSplash.createFastPreview(testImage, config);

    const duration = performance.now() - startTime;
    expect(duration).toBeLessThan(50); // <50ms target
  });

  test('Memory usage stays within bounds', async () => {
    const testImage = await loadImageData('./fixtures/test.webp');
    const colorSplash = new ColorSplash();

    const initialMemory = getMemoryUsage();

    // Process multiple times to check for leaks
    for (let i = 0; i < 10; i++) {
      await colorSplash.createFastPreview(testImage, {
        targetColors: [{ r: i * 25, g: 100, b: 200 }],
        tolerance: { hue: 20, saturation: 30, lightness: 25 }
      });
    }

    const finalMemory = getMemoryUsage();
    const memoryIncrease = finalMemory - initialMemory;

    // Memory increase should be reasonable (less than 100MB)
    expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
  });
});
```

### 5. Edge Case Tests

#### Boundary Conditions and Error Handling
```typescript
describe('Edge Cases', () => {
  test('Pure black and white images', async () => {
    const blackWhiteImage = createTestImage(100, 100, [
      [0, 0, 0], [255, 255, 255]
    ]);

    const colorSplash = new ColorSplash();
    const config: SplashConfig = {
      targetColors: [{ r: 0, g: 0, b: 0 }],
      tolerance: { hue: 10, saturation: 10, lightness: 10 }
    };

    const result = await colorSplash.applyColorSplash(blackWhiteImage, config);
    expect(result).toBeDefined();
    expect(() => validateImageData(result)).not.toThrow();
  });

  test('High saturation colors', async () => {
    const vibrantImage = createTestImage(100, 100, [
      [255, 0, 255], [0, 255, 0], [255, 255, 0]
    ]);

    // Test with very tight tolerance
    const config: SplashConfig = {
      targetColors: [{ r: 255, g: 0, b: 255 }],
      tolerance: { hue: 1, saturation: 1, lightness: 1 }
    };

    const result = await colorSplash.applyColorSplash(vibrantImage, config);
    expect(countColoredPixels(result)).toBeGreaterThan(0);
  });

  test('Invalid tolerance values', () => {
    const colorSplash = new ColorSplash();

    expect(() => {
      colorSplash.applyColorSplash(testImage, {
        targetColors: [{ r: 255, g: 0, b: 0 }],
        tolerance: { hue: -10 } // Invalid negative tolerance
      });
    }).toThrow(ColorSplashException);
  });
});
```

## Test Utilities and Helpers

### Image Processing Test Utilities
```typescript
// Test utility functions
export class TestUtils {
  static async loadImageData(path: string): Promise<ImageData> {
    // Load image from file system and convert to ImageData
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    const img = await loadImage(path);
    ctx.drawImage(img, 0, 0);
    return ctx.getImageData(0, 0, width, height);
  }

  static createTestImage(width: number, height: number, colors: RGB[][]): ImageData {
    // Create synthetic test images with known color patterns
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    // Fill with test pattern
    return ctx.getImageData(0, 0, width, height);
  }

  static compareImages(img1: ImageData, img2: ImageData): ImageComparison {
    // Pixel-by-pixel comparison with tolerance
    let differentPixels = 0;
    let maxDistance = 0;

    for (let i = 0; i < img1.data.length; i += 4) {
      const distance = Math.sqrt(
        Math.pow(img1.data[i] - img2.data[i], 2) +
        Math.pow(img1.data[i+1] - img2.data[i+1], 2) +
        Math.pow(img1.data[i+2] - img2.data[i+2], 2)
      );

      if (distance > 3) differentPixels++; // 3 RGB units tolerance
      maxDistance = Math.max(maxDistance, distance);
    }

    return {
      percentDifferent: (differentPixels / (img1.data.length / 4)) * 100,
      maxColorDistance: maxDistance
    };
  }

  static countColoredPixels(imageData: ImageData): number {
    // Count non-grayscale pixels
    let coloredPixels = 0;
    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];

      // Check if pixel is not grayscale (R≠G≠B)
      if (Math.abs(r - g) > 2 || Math.abs(g - b) > 2 || Math.abs(r - b) > 2) {
        coloredPixels++;
      }
    }
    return coloredPixels;
  }

  static analyzeColorDistribution(imageData: ImageData): ColorAnalysis {
    // Analyze color distribution and clustering
    const colorMap = new Map<string, number>();
    let coloredPixels = 0;

    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];

      if (Math.abs(r - g) > 2 || Math.abs(g - b) > 2 || Math.abs(r - b) > 2) {
        coloredPixels++;
        const colorKey = `${Math.floor(r/10)}${Math.floor(g/10)}${Math.floor(b/10)}`;
        colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1);
      }
    }

    return {
      coloredPixelPercentage: (coloredPixels / (imageData.data.length / 4)) * 100,
      distinctColorRegions: colorMap.size,
      dominantColors: Array.from(colorMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
    };
  }
}
```

## Test Data Generation

### Reference Image Creation
```typescript
// Generate reference images for regression testing
async function generateReferenceImages() {
  const testImage = await TestUtils.loadImageData('./fixtures/test.webp');
  const colorSplash = new ColorSplash();

  // Generate reference for orange holds
  const orangeColor = colorSplash.selectColor(testImage, 300, 400);
  const orangeResult = await colorSplash.applyColorSplash(testImage, {
    targetColors: [orangeColor],
    tolerance: { hue: 25, saturation: 40, lightness: 30 },
    colorSpace: ColorSpace.HSV
  });
  await saveImageData(orangeResult, './fixtures/references/orange-holds-reference.webp');

  // Generate reference for blue holds
  const blueColor = colorSplash.selectColor(testImage, 400, 300);
  const blueResult = await colorSplash.applyColorSplash(testImage, {
    targetColors: [blueColor],
    tolerance: { hue: 20, saturation: 30, lightness: 35 },
    colorSpace: ColorSpace.HSV
  });
  await saveImageData(blueResult, './fixtures/references/blue-holds-reference.webp');
}
```

## Continuous Integration Setup

### Jest Configuration
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95
    }
  },
  // Performance test timeout
  testTimeout: 10000
};
```

This comprehensive testing strategy ensures your color splash library works accurately across different scenarios, maintains performance targets, and catches regressions early in development.