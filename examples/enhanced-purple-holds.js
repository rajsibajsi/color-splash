/**
 * Enhanced Purple Holds Color Splash
 *
 * This version uses the actual purple colors detected from the climbing wall
 * to create a more accurate color splash effect.
 */

const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage, ImageData } = require('canvas');

// Make ImageData globally available for our library
global.ImageData = ImageData;

// Import our color splash functions
const {
  applyColorSplash,
  ColorSpace,
  GrayscaleMethod
} = require('../dist/index.js');

async function createEnhancedPurpleHoldsColorSplash() {
  try {
    console.log('🔍 Loading climbing wall test image...');

    // Load the test image
    const imagePath = path.join(__dirname, '../tests/fixtures/test.png');
    const image = await loadImage(imagePath);

    console.log(`📐 Image dimensions: ${image.width}x${image.height}`);

    // Create canvas and get image data
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);
    const imageData = ctx.getImageData(0, 0, image.width, image.height);

    console.log('🎨 Using enhanced purple color detection...');

    // Based on the actual samples found, use more realistic purple hold colors
    // These are based on the actual climbing wall purple holds detected
    const targetPurpleColors = [
      // Dark muted purples (actual holds detected)
      { r: 53, g: 62, b: 63 },   // Sample 1 from detection
      { r: 51, g: 47, b: 75 },   // Sample 5 - more purple
      { r: 60, g: 59, b: 91 },   // Sample 6 - bluish purple
      { r: 52, g: 54, b: 87 },   // Sample 7 - muted purple

      // Add some variations for better coverage
      { r: 65, g: 55, b: 85 },   // Slightly brighter purple
      { r: 70, g: 60, b: 95 },   // Medium purple
      { r: 45, g: 40, b: 70 },   // Dark purple
      { r: 80, g: 70, b: 100 },  // Lighter purple
    ];

    console.log('🎯 Enhanced target purple colors:');
    targetPurpleColors.forEach((color, index) => {
      console.log(`  Color ${index + 1}: RGB(${color.r}, ${color.g}, ${color.b})`);
    });

    // Use more generous tolerance for muted colors
    const tolerance = {
      hue: 40,        // ±40 degrees for broader purple range
      saturation: 50, // ±50% to catch low-saturation purple holds
      lightness: 40   // ±40% for various lighting conditions
    };

    console.log('⚙️  Enhanced color matching tolerance:');
    console.log(`  Hue: ±${tolerance.hue}°`);
    console.log(`  Saturation: ±${tolerance.saturation}%`);
    console.log(`  Lightness: ±${tolerance.lightness}%`);

    console.log('🔄 Applying enhanced color splash effect...');

    // Apply color splash effect
    const result = applyColorSplash(
      imageData,
      targetPurpleColors,
      tolerance,
      ColorSpace.HSV,
      GrayscaleMethod.LUMINANCE
    );

    console.log('✅ Enhanced color splash effect applied successfully!');

    // Create output canvas and draw result
    const outputCanvas = createCanvas(result.width, result.height);
    const outputCtx = outputCanvas.getContext('2d');
    outputCtx.putImageData(result, 0, 0);

    // Save the enhanced output image
    const outputPath = path.join(__dirname, '../tests/references/enhanced-purple-holds-output.png');
    const outputDir = path.dirname(outputPath);

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save as PNG
    const buffer = outputCanvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);

    console.log(`💾 Enhanced output saved to: ${outputPath}`);

    // Generate statistics
    const stats = analyzeColorSplashResult(imageData, result);
    console.log('\n📊 Enhanced Color Splash Statistics:');
    console.log(`  Original pixels: ${stats.totalPixels.toLocaleString()}`);
    console.log(`  Preserved (purple): ${stats.coloredPixels.toLocaleString()} (${stats.coloredPercentage.toFixed(2)}%)`);
    console.log(`  Converted to grayscale: ${stats.grayscalePixels.toLocaleString()} (${stats.grayscalePercentage.toFixed(2)}%)`);

    // Create side-by-side comparison
    await createComparisonImage(imagePath, outputPath);

    return {
      originalPath: imagePath,
      outputPath: outputPath,
      dimensions: { width: result.width, height: result.height },
      stats: stats
    };

  } catch (error) {
    console.error('❌ Error creating enhanced purple holds color splash:', error);
    throw error;
  }
}

/**
 * Create a side-by-side comparison image
 */
async function createComparisonImage(originalPath, processedPath) {
  try {
    const original = await loadImage(originalPath);
    const processed = await loadImage(processedPath);

    // Create canvas for side-by-side comparison
    const compCanvas = createCanvas(original.width * 2, original.height);
    const compCtx = compCanvas.getContext('2d');

    // Draw original on left
    compCtx.drawImage(original, 0, 0);

    // Draw processed on right
    compCtx.drawImage(processed, original.width, 0);

    // Add labels
    compCtx.fillStyle = 'white';
    compCtx.font = 'bold 24px Arial';
    compCtx.fillRect(10, 10, 120, 35);
    compCtx.fillRect(original.width + 10, 10, 200, 35);

    compCtx.fillStyle = 'black';
    compCtx.fillText('Original', 15, 32);
    compCtx.fillText('Purple Holds Only', original.width + 15, 32);

    // Save comparison
    const comparisonPath = path.join(path.dirname(processedPath), 'purple-holds-comparison.png');
    const buffer = compCanvas.toBuffer('image/png');
    fs.writeFileSync(comparisonPath, buffer);

    console.log(`📊 Comparison image saved to: ${comparisonPath}`);
  } catch (error) {
    console.warn('⚠️  Could not create comparison image:', error.message);
  }
}

/**
 * Analyze the color splash result to generate statistics
 */
function analyzeColorSplashResult(original, result) {
  const totalPixels = original.data.length / 4;
  let coloredPixels = 0;
  let grayscalePixels = 0;

  for (let i = 0; i < result.data.length; i += 4) {
    const r = result.data[i];
    const g = result.data[i + 1];
    const b = result.data[i + 2];

    // Check if pixel is grayscale (R = G = B)
    if (Math.abs(r - g) <= 2 && Math.abs(g - b) <= 2 && Math.abs(r - b) <= 2) {
      grayscalePixels++;
    } else {
      coloredPixels++;
    }
  }

  return {
    totalPixels,
    coloredPixels,
    grayscalePixels,
    coloredPercentage: (coloredPixels / totalPixels) * 100,
    grayscalePercentage: (grayscalePixels / totalPixels) * 100
  };
}

// Run the enhanced example
if (require.main === module) {
  console.log('🎨 Enhanced Purple Holds Color Splash Generator\n');

  createEnhancedPurpleHoldsColorSplash()
    .then(result => {
      console.log('\n🎉 Success! Enhanced purple holds color splash created.');
      console.log(`📁 Check the output at: ${result.outputPath}`);
    })
    .catch(error => {
      console.error('💥 Failed to create enhanced color splash:', error.message);
      process.exit(1);
    });
}

module.exports = { createEnhancedPurpleHoldsColorSplash };