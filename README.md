# Color Splash Library

A TypeScript library for creating color splash effects on images with real-time preview support and multiple color space algorithms.

## 🚀 Current Implementation Status

### ✅ Completed Features

**Phase 1: Project Foundation**
- ✅ TypeScript + Jest + Rollup build system
- ✅ Comprehensive type definitions with 20 passing tests
- ✅ Project structure with proper module organization

**Phase 2: Core Algorithms (TDD Approach)**
- ✅ RGB ↔ HSV color space conversion (14 passing tests)
- ✅ RGB → LAB color space conversion
- ✅ Color similarity detection algorithms (15 passing tests)
  - HSV-based similarity with hue wrap-around handling
  - LAB Euclidean distance matching
  - RGB simple distance matching

**Phase 3: Build & Distribution**
- ✅ ES Module + CommonJS builds generated
- ✅ TypeScript declaration files generated
- ✅ All 49 tests passing

## 📊 Test Coverage

```
Test Suites: 3 passed
Tests:       49 passed
- Type definitions: 20 tests
- Color conversion: 14 tests
- Color similarity: 15 tests
```

## 🎯 API Preview

```typescript
// Color space conversion
import { rgbToHsv, hsvToRgb, isColorSimilar, ColorSpace } from 'color-splash';

const rgb = { r: 255, g: 0, b: 0 };
const hsv = rgbToHsv(rgb); // { h: 0, s: 100, v: 100 }

// Color similarity detection
const similar = isColorSimilar(
  { r: 255, g: 0, b: 0 },     // Target red
  { r: 255, g: 20, b: 10 },   // Similar red
  { hue: 15, saturation: 20, lightness: 25 },
  ColorSpace.HSV
); // true
```

## 🏗️ Next Implementation Steps

Following the [PROJECT_CHECKLIST.md](./PROJECT_CHECKLIST.md):

**Phase 4: Core Image Processing Engine**
- Basic image operations (grayscale conversion)
- Color mask generation
- Color splash application

**Phase 5: Performance Optimization**
- Multi-resolution processing for real-time previews
- WebGL GPU acceleration
- Incremental update system

**Phase 6: Main ColorSplash Class**
- Complete API implementation
- Real-time preview methods
- Area-based selection features

## 🧪 Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build library
npm run build

# Type checking
npm run type-check
```

## 📋 Project Files

- `COLOR_SPLASH_SPEC.md` - Complete library specification
- `TEST_STRATEGY.md` - TDD testing approach
- `PROJECT_CHECKLIST.md` - Implementation roadmap
- `tests/fixtures/test.webp` - Climbing wall test image

## 🎨 Test Image

The library uses a colorful climbing wall image for testing, featuring:
- Vibrant blue walls and holds
- Orange, red, yellow, and purple climbing holds
- Perfect for testing color splash effects with different tolerances

---

*Built with Test-Driven Development principles for reliability and maintainability.*