/**
 * Test the complete ColorSplash class implementation with climbing wall image
 */

const { createCanvas, loadImage, ImageData } = require('canvas');
const fs = require('fs');

// Make ImageData globally available for Node.js
global.ImageData = ImageData;

// Import the built library
const { ColorSplash, PreviewQuality, ColorSpace } = require('../dist/index.js');

async function testColorSplashClass() {
  console.log('🧗 Testing ColorSplash class with climbing wall image...\n');

  try {
    // Load the test image
    const image = await loadImage('./tests/fixtures/test.png');

    // Create canvas and get image data
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);
    const imageData = ctx.getImageData(0, 0, image.width, image.height);

    console.log(`📊 Original image: ${imageData.width}x${imageData.height} pixels`);

    // Initialize ColorSplash with custom settings
    const colorSplash = new ColorSplash({
      defaultColorSpace: ColorSpace.HSV,
      previewQuality: PreviewQuality.HIGH,
      maxPreviewSize: 600
    });

    // Select a purple color from the climbing holds
    const selectedColor = colorSplash.selectColor(imageData, 450, 300);
    console.log(`🎨 Selected color at (450,300): RGB(${selectedColor.r}, ${selectedColor.g}, ${selectedColor.b})`);

    // Preload image for faster operations
    console.log('⚡ Preloading image for performance...');
    await colorSplash.preloadImage(imageData);

    // Create fast preview
    console.log('🖼️  Creating fast preview...');
    const startTime = performance.now();
    const preview = await colorSplash.createFastPreview(
      imageData,
      [selectedColor],
      { hue: 20, saturation: 30, lightness: 25 },
      PreviewQuality.HIGH
    );
    const previewTime = performance.now() - startTime;

    console.log(`✨ Fast preview created: ${preview.width}x${preview.height} in ${previewTime.toFixed(1)}ms`);

    // Test incremental update
    console.log('🔄 Testing incremental update...');
    const updateStart = performance.now();
    const updatedPreview = await colorSplash.updatePreview({
      tolerance: { hue: 15, saturation: 25, lightness: 20 }
    });
    const updateTime = performance.now() - updateStart;

    console.log(`⚡ Incremental update completed in ${updateTime.toFixed(1)}ms`);

    // Apply full resolution color splash
    console.log('🎯 Applying full resolution color splash...');
    const fullStart = performance.now();
    const fullResult = await colorSplash.applyColorSplash(imageData, {
      targetColors: [selectedColor],
      tolerance: { hue: 20, saturation: 30, lightness: 25 },
      colorSpace: ColorSpace.HSV,
      grayscaleMethod: 'luminance'
    });
    const fullTime = performance.now() - fullStart;

    console.log(`🏔️  Full resolution processing completed in ${fullTime.toFixed(1)}ms`);

    // Get performance statistics
    const stats = colorSplash.getPerformanceStats();
    console.log('\n📈 Performance Statistics:');
    Object.entries(stats).forEach(([operation, stat]) => {
      if (stat) {
        console.log(`  ${operation}: avg ${stat.average}ms (${stat.count} calls, min ${stat.min}ms, max ${stat.max}ms)`);
      }
    });

    // Get cache statistics
    const cacheStats = colorSplash.getCacheStats();
    console.log(`\n💾 Cache: ${cacheStats.size}/${cacheStats.maxSize} entries`);

    // Save preview result
    const previewCanvas = createCanvas(preview.width, preview.height);
    const previewCtx = previewCanvas.getContext('2d');
    previewCtx.putImageData(preview, 0, 0);

    const previewBuffer = previewCanvas.toBuffer('image/png');
    fs.writeFileSync('./examples/colorsplash-preview.png', previewBuffer);
    console.log('💾 Preview saved to: examples/colorsplash-preview.png');

    // Save full result
    const fullCanvas = createCanvas(fullResult.width, fullResult.height);
    const fullCtx = fullCanvas.getContext('2d');
    fullCtx.putImageData(fullResult, 0, 0);

    const fullBuffer = fullCanvas.toBuffer('image/png');
    fs.writeFileSync('./examples/colorsplash-full.png', fullBuffer);
    console.log('💾 Full result saved to: examples/colorsplash-full.png');

    console.log('\n✅ ColorSplash class test completed successfully!');

  } catch (error) {
    console.error('❌ Error testing ColorSplash class:', error);
    process.exit(1);
  }
}

// Run the test
testColorSplashClass();