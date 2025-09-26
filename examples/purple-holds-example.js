/**
 * Purple Holds Color Splash Example
 *
 * This script loads the climbing wall test image and creates a color splash
 * effect preserving only the purple climbing holds while converting
 * everything else to grayscale.
 */

const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage, ImageData } = require('canvas');

// Make ImageData globally available for our library
global.ImageData = ImageData;

// Import our color splash functions (need to compile TypeScript first)
const {
  applyColorSplash,
  ColorSpace,
  GrayscaleMethod
} = require('../dist/index.js');

async function createPurpleHoldsColorSplash() {
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

    console.log('🎨 Analyzing purple colors in image...');

    // Analyze a few sample purple pixels to understand the color range
    const purplePixels = samplePurplePixels(imageData);
    console.log('Purple pixel samples found:', purplePixels.length);
    purplePixels.forEach((pixel, index) => {
      console.log(`  Sample ${index + 1}: RGB(${pixel.r}, ${pixel.g}, ${pixel.b})`);
    });

    // Define target purple colors based on visual analysis of the climbing wall
    // These values are estimated based on typical purple climbing holds
    const targetPurpleColors = [
      { r: 128, g: 0, b: 128 },   // Standard purple/magenta
      { r: 147, g: 112, b: 219 }, // Medium slate blue
      { r: 138, g: 43, b: 226 },  // Blue violet
      { r: 160, g: 32, b: 240 },  // Purple
      { r: 75, g: 0, b: 130 },    // Indigo
    ];

    console.log('🎯 Target purple colors:');
    targetPurpleColors.forEach((color, index) => {
      console.log(`  Color ${index + 1}: RGB(${color.r}, ${color.g}, ${color.b})`);
    });

    // Set tolerance to capture similar purple shades
    const tolerance = {
      hue: 30,        // ±30 degrees to catch purple-pink and purple-blue variations
      saturation: 40, // ±40% to include both vibrant and muted purples
      lightness: 35   // ±35% to include light and dark purple holds
    };

    console.log('⚙️  Color matching tolerance:');
    console.log(`  Hue: ±${tolerance.hue}°`);
    console.log(`  Saturation: ±${tolerance.saturation}%`);
    console.log(`  Lightness: ±${tolerance.lightness}%`);

    console.log('🔄 Applying color splash effect...');

    // Apply color splash effect using HSV color space for better purple detection
    const result = applyColorSplash(
      imageData,
      targetPurpleColors,
      tolerance,
      ColorSpace.HSV,
      GrayscaleMethod.LUMINANCE
    );

    console.log('✅ Color splash effect applied successfully!');

    // Create output canvas and draw result
    const outputCanvas = createCanvas(result.width, result.height);
    const outputCtx = outputCanvas.getContext('2d');
    outputCtx.putImageData(result, 0, 0);

    // Save the output image
    const outputPath = path.join(__dirname, '../tests/references/purple-holds-output.png');
    const outputDir = path.dirname(outputPath);

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save as PNG
    const buffer = outputCanvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);

    console.log(`💾 Output saved to: ${outputPath}`);

    // Generate statistics
    const stats = analyzeColorSplashResult(imageData, result);
    console.log('\n📊 Color Splash Statistics:');
    console.log(`  Original pixels: ${stats.totalPixels.toLocaleString()}`);
    console.log(`  Preserved (purple): ${stats.coloredPixels.toLocaleString()} (${stats.coloredPercentage.toFixed(2)}%)`);
    console.log(`  Converted to grayscale: ${stats.grayscalePixels.toLocaleString()} (${stats.grayscalePercentage.toFixed(2)}%)`);

    return {
      originalPath: imagePath,
      outputPath: outputPath,
      dimensions: { width: result.width, height: result.height },
      stats: stats
    };

  } catch (error) {
    console.error('❌ Error creating purple holds color splash:', error);
    throw error;
  }
}

/**
 * Sample purple-ish pixels from the image for analysis
 */
function samplePurplePixels(imageData, maxSamples = 10) {
  const purplePixels = [];
  const { data } = imageData;

  for (let i = 0; i < data.length && purplePixels.length < maxSamples; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Simple purple detection: more blue than green, some red
    if (b > g && (r > 50 || b > 100) && Math.abs(r - b) < 100) {
      purplePixels.push({ r, g, b });
    }
  }

  return purplePixels;
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

// Run the example
if (require.main === module) {
  console.log('🎨 Purple Holds Color Splash Generator\n');

  createPurpleHoldsColorSplash()
    .then(result => {
      console.log('\n🎉 Success! Purple holds color splash created.');
      console.log(`📁 Check the output at: ${result.outputPath}`);
    })
    .catch(error => {
      console.error('💥 Failed to create color splash:', error.message);
      process.exit(1);
    });
}

module.exports = { createPurpleHoldsColorSplash };