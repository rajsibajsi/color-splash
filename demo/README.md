# Color Splash Interactive Demo 🎨

A real-time web demonstration of the Color Splash library featuring drag-and-drop image upload, click-to-select color picker, and live parameter adjustment.

## 🚀 Quick Start

1. **Start the demo server:**
   ```bash
   node serve.js
   ```
   Or with custom port:
   ```bash
   node serve.js 3000
   ```

2. **Open your browser:**
   Navigate to `http://localhost:8080`

3. **Try it out:**
   - Upload an image or drag & drop one onto the upload area
   - Click anywhere on the image to select a color to preserve
   - Adjust tolerance settings in real-time
   - Apply preview or full resolution effects

## ✨ Features

### 🖼️ **Image Handling**
- **Drag & Drop Upload**: Simply drag image files onto the upload area
- **File Browser**: Click to browse and select image files
- **Format Support**: JPG, PNG, WebP, and other web-compatible formats
- **Auto-Scaling**: Large images are automatically scaled for display while preserving original resolution for processing

### 🎯 **Color Selection**
- **Click-to-Select**: Click anywhere on the image to select colors
- **Visual Feedback**: Selected color is displayed with RGB values
- **Real-time Preview**: See effects immediately as you adjust settings

### 🎛️ **Advanced Controls**

#### Color Tolerance Settings:
- **Hue Tolerance** (0-60°): Controls how much hue variation is accepted
- **Saturation Tolerance** (0-100): Controls saturation matching sensitivity
- **Lightness Tolerance** (0-100): Controls brightness matching sensitivity

#### Performance Options:
- **Preview Quality**: LOW (fastest) → MEDIUM → HIGH → REALTIME (dynamic)
- **Color Space**: HSV (recommended) | LAB (perceptual) | RGB (simple)

### 📊 **Real-time Performance Monitoring**
- **Preview Processing Time**: How long fast previews take
- **Full Resolution Time**: Time for complete processing
- **Image Dimensions**: Original and preview sizes
- **Cache Statistics**: Performance optimization metrics

### 💾 **Export Options**
- **Reset Image**: Return to original image
- **Download Result**: Save processed image as PNG
- **Full Resolution Apply**: Process at original image quality

## 🎨 **Usage Examples**

### Basic Usage:
1. Upload the included `sample-image.png` (climbing wall with colorful holds)
2. Click on a blue climbing hold
3. Adjust hue tolerance to ~20° for precise blue selection
4. Apply preview to see real-time results
5. Apply full resolution for final result

### Advanced Techniques:
- **Multiple Colors**: Select and preserve several colors by clicking different areas
- **Fine-tuning**: Use low hue tolerance (5-15°) for precise color matching
- **Performance**: Use REALTIME quality for responsive slider adjustments
- **Color Spaces**: Try LAB for perceptually uniform color matching

## 🏗️ **Technical Implementation**

### Architecture:
- **Frontend**: Pure HTML/CSS/JavaScript (no frameworks)
- **Library**: Color Splash TypeScript library (built to `/dist/`)
- **Server**: Simple Node.js HTTP server for local development
- **Canvas API**: HTML5 Canvas for image processing and display

### Performance Features:
- **Multi-resolution Processing**: Automatic scaling for preview performance
- **Intelligent Caching**: LRU cache for repeated operations
- **Real-time Updates**: Incremental parameter changes without full reprocessing
- **Memory Management**: Efficient ImageData handling

### Browser Compatibility:
- **Modern Browsers**: Chrome, Firefox, Safari, Edge (ES6+ support required)
- **Canvas Support**: HTML5 Canvas API required
- **File API**: Drag & drop and file selection support
- **Performance API**: High-resolution timing for performance metrics

## 📁 **Files Structure**

```
demo/
├── index.html          # Main demo interface
├── serve.js           # Development server
├── sample-image.png   # Sample climbing wall image
└── README.md          # This file

../dist/               # Built library files
├── index.js          # UMD build for browsers
└── index.esm.js      # ES Module build
```

## 🎯 **Sample Images for Testing**

### Included Sample:
- **sample-image.png**: Colorful climbing wall (1200x800)
  - Perfect for testing color selection
  - Contains blue, red, orange, yellow, purple holds
  - Good for demonstrating HSV color space advantages

### Recommended Test Images:
- **Portraits**: Test skin tone preservation
- **Landscapes**: Isolate sky, vegetation, or water
- **Sports**: Team uniforms and equipment
- **Architecture**: Highlight specific building elements
- **Nature**: Flowers, birds, specific natural elements

## 🔧 **Development**

### Building the Library:
```bash
# From project root
npm run build
```

### Running Tests:
```bash
npm test
```

### Making Changes:
1. Modify source files in `/src/`
2. Rebuild with `npm run build`
3. Refresh browser to see changes

## 📊 **Performance Benchmarks**

Typical performance on modern hardware:

- **Fast Preview (HIGH quality)**: 30-50ms for 600x400 preview
- **Full Resolution**: 80-120ms for 1200x800 image
- **Incremental Updates**: 15-30ms for parameter changes
- **Cache Hit**: <1ms for repeated operations

## 🚀 **Integration Examples**

The demo shows how to integrate Color Splash into web applications:

- **File Upload Handling**: Drag & drop and file selection
- **Canvas Integration**: Drawing and processing ImageData
- **Real-time UI Updates**: Responsive parameter controls
- **Performance Monitoring**: Timing and cache statistics
- **Error Handling**: User-friendly error messages

## 📞 **Support**

If you encounter issues:

1. **Check Console**: Open browser developer tools for error messages
2. **Server Issues**: Ensure Node.js is installed and port is available
3. **Image Issues**: Try different image formats or smaller file sizes
4. **Performance**: Try lower quality settings for large images

---

**Happy Color Splashing!** 🎨✨