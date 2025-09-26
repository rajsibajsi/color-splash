# 🎨 Color Splash Interactive Demo Instructions

Welcome to the Color Splash library interactive demo! This guide will walk you through using the demo to test real-time color splash effects with your own images.

## 🚀 Quick Start

### 1. Start the Demo Server
```bash
cd demo
node serve.js
```

The server will start on port 8080 by default. You'll see:
```
🎨 Color Splash Demo Server running at:
   http://localhost:8080

📁 Serving files from: /path/to/color-splash/demo
📊 Sample image available: sample-image.png
```

### 2. Open in Browser
Navigate to `http://localhost:8080` in your web browser.

### 3. Upload an Image
- **Method 1**: Drag and drop any image file onto the upload area
- **Method 2**: Click the upload area to browse and select a file
- **Supported formats**: JPG, PNG, WebP, and other web-compatible formats

## 📖 Step-by-Step Tutorial

### Step 1: Load the Sample Image
1. The demo includes a sample climbing wall image (`sample-image.png`)
2. You can use any image, but colorful images work best for demonstration
3. The image will be automatically scaled for display while preserving original resolution

### Step 2: Select Colors to Preserve
1. **Click anywhere on the uploaded image** to select a color
2. The selected color will be displayed with its RGB values
3. You can click multiple times to select different colors
4. Only the selected colors will remain in color - everything else becomes grayscale

### Step 3: Adjust Color Tolerance
Use the sliders to fine-tune color matching:

- **Hue Tolerance (0-60°)**: How much hue variation is accepted
  - Lower values = more precise color selection
  - Higher values = broader color range

- **Saturation Tolerance (0-100%)**: Saturation matching sensitivity
  - Controls how vibrant the selected colors need to be

- **Lightness Tolerance (0-100%)**: Brightness matching sensitivity
  - Controls how light or dark the selected colors can be

### Step 4: Choose Quality Settings

#### Preview Quality:
- **LOW**: Fastest processing (~10-20ms) for real-time adjustments
- **MEDIUM**: Balanced speed and quality (~20-50ms)
- **HIGH**: Best preview quality (~40-100ms)
- **REALTIME**: Dynamic quality based on image size

#### Color Space:
- **HSV (Recommended)**: Best for intuitive color selection
- **LAB**: Most perceptually accurate for human vision
- **RGB**: Fastest but less accurate color matching

### Step 5: Apply Effects
- **Apply Preview**: Generate fast, lower-resolution preview
- **Apply Full Resolution**: Process at original image quality
- **Reset**: Return to original image
- **Download**: Save the processed result as PNG

## 🎯 Usage Tips

### For Best Results:
1. **Start with HIGH quality** for preview to see accurate results
2. **Use HSV color space** for most natural color selection
3. **Begin with moderate tolerance** (Hue: 20, Sat: 30, Light: 25)
4. **Fine-tune with sliders** while watching the real-time preview

### Performance Tips:
1. **Use REALTIME quality** when adjusting sliders for smooth interaction
2. **Switch to HIGH quality** when you want to see the final result
3. **Large images** (>2MP) automatically use optimized preview sizes
4. **Check performance stats** to monitor processing times

### Common Workflows:

#### Portrait Photography:
1. Upload a portrait photo
2. Click on skin tones to preserve them
3. Use low hue tolerance (10-15°) for precise skin selection
4. Adjust saturation tolerance for natural skin variation

#### Landscape Photography:
1. Upload a landscape image
2. Click on specific elements (sky, flowers, etc.)
3. Use higher tolerances for broader color ranges
4. Experiment with different color spaces (LAB for sky colors)

#### Sports/Team Photos:
1. Upload team photo
2. Click on team colors (jerseys, logos)
3. Use medium tolerances to catch color variations
4. Apply full resolution for final result

## 📊 Understanding the Interface

### Performance Monitoring:
- **Preview Time**: How long fast previews take (target: <50ms)
- **Full Process Time**: Complete processing time (target: <200ms)
- **Image Size**: Original image dimensions
- **Preview Size**: Scaled preview dimensions for real-time processing

### Cache Information:
- Shows how many processed results are cached
- Repeated operations with same parameters return instantly
- Cache automatically clears when you change quality or color space

### Color Information:
- Displays RGB values of selected color
- Shows exact coordinates of last click
- Updates in real-time as you select different colors

## 🛠️ Troubleshooting

### Image Won't Upload:
- **Check file format**: Ensure it's a web-compatible image (JPG, PNG, WebP)
- **Check file size**: Very large files (>10MB) may be slow to process
- **Browser compatibility**: Ensure your browser supports HTML5 Canvas and File API

### Slow Performance:
- **Lower the preview quality** to LOW or REALTIME
- **Use smaller images** or let the demo auto-scale large ones
- **Close other browser tabs** to free up memory
- **Check the performance stats** to identify bottlenecks

### Colors Not Selected Properly:
- **Adjust tolerance values**: Increase for broader selection, decrease for precision
- **Try different color spaces**: LAB for perceptual accuracy, HSV for intuitive control
- **Click on representative areas**: Avoid edges or shadows
- **Check the selected color display** to see what color was actually picked

### JavaScript Errors:
1. **Open Developer Console** (F12) to see error messages
2. **Refresh the page** to reload the library
3. **Check network tab** to ensure all files loaded correctly
4. **Verify server is running** on the correct port

## 🧪 Advanced Testing

### Test Library Functions:
Visit `http://localhost:8080/test-library.html` to run automated tests that verify:
- Library loads correctly
- All enums and functions are available
- Image processing works as expected
- Performance monitoring functions properly

### Custom Server Port:
```bash
node serve.js 3000  # Run on port 3000 instead
```

### Development Mode:
The server automatically serves files with no-cache headers for development, so changes to the library will be reflected immediately after rebuilding.

## 📱 Mobile Usage

The demo is responsive and works on mobile devices:
- **Touch to select colors** instead of clicking
- **Pinch to zoom** on the canvas for precise selection
- **Portrait orientation** stacks controls vertically
- **Reduced complexity** on smaller screens for better performance

## 🎨 Creative Ideas

### Artistic Effects:
- **Selective colorization**: Make black & white photos with specific color highlights
- **Brand emphasis**: Highlight brand colors in product photos
- **Mood creation**: Isolate warm or cool tones for emotional impact

### Technical Applications:
- **Quality assessment**: Test color matching accuracy across different images
- **Performance benchmarking**: Compare processing times across devices
- **Algorithm comparison**: Test different color spaces for various image types

## 🔧 Development Integration

This demo shows how to integrate the Color Splash library into web applications:

```javascript
// Initialize the library
const colorSplash = new ColorSplash.ColorSplash({
    previewQuality: ColorSplash.PreviewQuality.HIGH,
    defaultColorSpace: ColorSplash.ColorSpace.HSV
});

// Select colors from user clicks
const color = colorSplash.selectColor(imageData, x, y);

// Create real-time previews
const preview = await colorSplash.createFastPreview(
    imageData, [color], tolerance
);

// Apply full resolution effects
const result = await colorSplash.applyColorSplash(imageData, config);
```

## 📞 Support

If you encounter issues:

1. **Check the browser console** for error messages
2. **Verify the server is running** and accessible
3. **Try the test page** to verify library functionality
4. **Use different images** to isolate image-specific issues
5. **Check the GitHub repository** for known issues and updates

---

**Enjoy experimenting with real-time color splash effects!** 🎨✨

*This demo showcases the full capabilities of the Color Splash TypeScript library with interactive controls and real-time performance monitoring.*