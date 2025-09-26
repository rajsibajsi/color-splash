/**
 * Precise Purple Holds Color Splash
 *
 * This version uses tighter tolerances and better color filtering
 * to select ONLY purple holds, excluding blue areas.
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
  GrayscaleMethod,
  rgbToHsv
} = require('../dist/index.js');

async function createPrecisePurpleHoldsColorSplash() {
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

    console.log('🎨 Analyzing purple vs blue separation...');

    // Sample and analyze colors to understand purple vs blue distinction
    const colorAnalysis = analyzeColorsInImage(imageData);
    console.log('Color analysis results:');
    console.log(`  Purple-like pixels: ${colorAnalysis.purpleLike.length}`);
    console.log(`  Blue-like pixels: ${colorAnalysis.blueLike.length}`);

    // Use only the most purple-like colors, excluding blue-ish ones
    const targetPurpleColors = [
      // Only the most purple samples (avoiding blue-ish ones)
      { r: 51, g: 47, b: 75 },   // True purple-ish
      { r: 52, g: 54, b: 87 },   // Muted purple
      { r: 65, g: 55, b: 85 },   // Medium purple
      { r: 70, g: 50, b: 80 },   // Purple variation
      { r: 45, g: 40, b: 70 },   // Dark purple
      { r: 75, g: 65, b: 95 },   // Light purple
    ];

    console.log('🎯 Precise purple-only target colors:');
    targetPurpleColors.forEach((color, index) => {
      const hsv = rgbToHsv(color);
      console.log(`  Color ${index + 1}: RGB(${color.r}, ${color.g}, ${color.b}) HSV(${Math.round(hsv.h)}°, ${Math.round(hsv.s)}%, ${Math.round(hsv.v)}%)`);
    });

    // Much tighter tolerance to avoid blue contamination
    const tolerance = {
      hue: 20,        // Reduced from 40° to 20° to avoid blue
      saturation: 35, // Reduced from 50% to 35%
      lightness: 30   // Reduced from 40% to 30%
    };

    console.log('⚙️  Precise color matching tolerance:');
    console.log(`  Hue: ±${tolerance.hue}° (tighter to exclude blue)`);
    console.log(`  Saturation: ±${tolerance.saturation}%`);
    console.log(`  Lightness: ±${tolerance.lightness}%`);

    console.log('🔄 Applying precise color splash effect...');

    // Apply color splash effect with tighter constraints
    const result = applyColorSplash(
      imageData,
      targetPurpleColors,
      tolerance,
      ColorSpace.HSV,
      GrayscaleMethod.LUMINANCE
    );

    console.log('✅ Precise color splash effect applied successfully!');

    // Create output canvas and draw result
    const outputCanvas = createCanvas(result.width, result.height);
    const outputCtx = outputCanvas.getContext('2d');
    outputCtx.putImageData(result, 0, 0);

    // Save the precise output image
    const outputPath = path.join(__dirname, '../tests/references/precise-purple-holds-output.png');

    // Save as PNG
    const buffer = outputCanvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);

    console.log(`💾 Precise output saved to: ${outputPath}`);

    // Generate statistics
    const stats = analyzeColorSplashResult(imageData, result);
    console.log('\n📊 Precise Purple-Only Statistics:');
    console.log(`  Original pixels: ${stats.totalPixels.toLocaleString()}`);
    console.log(`  Preserved (purple only): ${stats.coloredPixels.toLocaleString()} (${stats.coloredPercentage.toFixed(2)}%)`);
    console.log(`  Converted to grayscale: ${stats.grayscalePixels.toLocaleString()} (${stats.grayscalePercentage.toFixed(2)}%)`);

    // Create comparison with previous version
    await createThreeWayComparison(imagePath, outputPath);

    return {
      originalPath: imagePath,
      outputPath: outputPath,
      dimensions: { width: result.width, height: result.height },
      stats: stats
    };

  } catch (error) {
    console.error('❌ Error creating precise purple holds color splash:', error);
    throw error;
  }
}

/**
 * Analyze colors to distinguish purple from blue
 */
function analyzeColorsInImage(imageData, sampleSize = 1000) {
  const { data } = imageData;
  const purpleLike = [];
  const blueLike = [];

  // Sample pixels across the image
  const step = Math.floor(data.length / (sampleSize * 4));

  for (let i = 0; i < data.length; i += step * 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    if (r > 30 && g > 30 && b > 50) { // Only consider non-black pixels
      const hsv = rgbToHsv({ r, g, b });

      // Purple: hue around 270-320° (magenta to violet)
      if (hsv.h >= 270 && hsv.h <= 320 && hsv.s > 10) {
        purpleLike.push({ r, g, b, h: hsv.h, s: hsv.s, v: hsv.v });
      }
      // Blue: hue around 200-260°
      else if (hsv.h >= 200 && hsv.h <= 260 && hsv.s > 10) {
        blueLike.push({ r, g, b, h: hsv.h, s: hsv.s, v: hsv.v });
      }
    }
  }

  return { purpleLike, blueLike };
}

/**
 * Create a three-way comparison image (original, enhanced, precise)
 */
async function createThreeWayComparison(originalPath, precisePath) {
  try {
    const original = await loadImage(originalPath);
    const enhanced = await loadImage(path.join(__dirname, '../tests/references/enhanced-purple-holds-output.png'));
    const precise = await loadImage(precisePath);

    // Create canvas for three-way comparison
    const compCanvas = createCanvas(original.width * 3, original.height);
    const compCtx = compCanvas.getContext('2d');

    // Draw all three images
    compCtx.drawImage(original, 0, 0);
    compCtx.drawImage(enhanced, original.width, 0);
    compCtx.drawImage(precise, original.width * 2, 0);

    // Add labels
    compCtx.fillStyle = 'white';
    compCtx.font = 'bold 20px Arial';

    // Original label
    compCtx.fillRect(10, 10, 100, 30);
    compCtx.fillStyle = 'black';
    compCtx.fillText('Original', 15, 28);

    // Enhanced label (with blue contamination)
    compCtx.fillStyle = 'white';
    compCtx.fillRect(original.width + 10, 10, 180, 30);
    compCtx.fillStyle = 'black';
    compCtx.fillText('Enhanced (±40°)', original.width + 15, 28);

    // Precise label (purple only)
    compCtx.fillStyle = 'white';
    compCtx.fillRect(original.width * 2 + 10, 10, 160, 30);
    compCtx.fillStyle = 'black';
    compCtx.fillText('Precise (±20°)', original.width * 2 + 15, 28);

    // Save comparison
    const comparisonPath = path.join(path.dirname(precisePath), 'purple-precision-comparison.png');
    const buffer = compCanvas.toBuffer('image/png');
    fs.writeFileSync(comparisonPath, buffer);

    console.log(`📊 Three-way comparison saved to: ${comparisonPath}`);
  } catch (error) {
    console.warn('⚠️  Could not create three-way comparison image:', error.message);
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

// Run the precise example
if (require.main === module) {
  console.log('🎨 Precise Purple-Only Color Splash Generator\n');

  createPrecisePurpleHoldsColorSplash()
    .then(result => {
      console.log('\n🎉 Success! Precise purple-only color splash created.');
      console.log(`📁 Check the output at: ${result.outputPath}`);
      console.log(`📊 Purple preservation: ${result.stats.coloredPercentage.toFixed(2)}%`);
    })
    .catch(error => {
      console.error('💥 Failed to create precise color splash:', error.message);
      process.exit(1);
    });
}

module.exports = { createPrecisePurpleHoldsColorSplash };