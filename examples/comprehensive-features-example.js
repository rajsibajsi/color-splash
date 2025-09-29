/**
 * Comprehensive Color Splash Features Example
 *
 * This example demonstrates all the new features added to the Color Splash library:
 * - File I/O Backend (direct file loading and saving)
 * - WebGL GPU Acceleration
 * - Selection Area Processing with feathering
 * - Performance monitoring and caching
 * - Multiple color spaces and file formats
 */

// This example assumes the library is loaded globally as ColorSplash
// In Node.js, you would import: const ColorSplash = require('../dist/index.js');

async function demonstrateFileIO() {
    console.log('=== File I/O Backend Demo ===');

    const colorSplash = new ColorSplash.ColorSplash({
        previewQuality: ColorSplash.PreviewQuality.HIGH,
        defaultColorSpace: ColorSplash.ColorSpace.HSV
    });

    // Check supported formats
    const formats = colorSplash.getSupportedFormats();
    console.log('Supported formats:', formats);

    // Example: Load from URL
    try {
        const imageData = await colorSplash.loadFromUrl('./examples/colorsplash-full.png', {
            maxWidth: 800,
            maxHeight: 600
        });
        console.log(`Loaded image: ${imageData.width}x${imageData.height}`);
        return { colorSplash, imageData };
    } catch (error) {
        console.log('Note: Image loading requires a web browser environment');
        return { colorSplash, imageData: null };
    }
}

async function demonstrateGPUAcceleration(colorSplash, imageData) {
    console.log('\n=== GPU Acceleration Demo ===');

    if (!imageData) {
        console.log('Skipping GPU demo - no image data available');
        return;
    }

    // Create a canvas for WebGL context
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;

    try {
        // Enable GPU acceleration
        const gpuEnabled = await colorSplash.enableGPUAcceleration(canvas);
        console.log('GPU acceleration enabled:', gpuEnabled);

        if (gpuEnabled) {
            // Measure performance with GPU
            const startTime = performance.now();

            const targetColors = [{ r: 128, g: 0, b: 128 }]; // Purple
            const result = await colorSplash.applyColorSplash(imageData, {
                targetColors,
                tolerance: { hue: 20, saturation: 30, lightness: 25 },
                colorSpace: ColorSplash.ColorSpace.HSV
            });

            const gpuTime = performance.now() - startTime;
            console.log(`GPU processing time: ${gpuTime.toFixed(2)}ms`);

            // Disable GPU and compare
            colorSplash.disableGPUAcceleration();

            const cpuStartTime = performance.now();
            await colorSplash.applyColorSplash(imageData, {
                targetColors,
                tolerance: { hue: 20, saturation: 30, lightness: 25 },
                colorSpace: ColorSplash.ColorSpace.HSV
            });
            const cpuTime = performance.now() - cpuStartTime;
            console.log(`CPU processing time: ${cpuTime.toFixed(2)}ms`);

            const speedup = (cpuTime / gpuTime).toFixed(2);
            console.log(`GPU speedup: ${speedup}x faster`);

            return result;
        }
    } catch (error) {
        console.log('GPU acceleration not available:', error.message);
    }
}

async function demonstrateSelectionAreas(colorSplash, imageData) {
    console.log('\n=== Selection Area Processing Demo ===');

    if (!imageData) {
        console.log('Skipping selection demo - no image data available');
        return;
    }

    // Define different types of selection areas
    const rectangularSelection = {
        type: 'rectangle',
        x: Math.floor(imageData.width * 0.25),
        y: Math.floor(imageData.height * 0.25),
        width: Math.floor(imageData.width * 0.5),
        height: Math.floor(imageData.height * 0.5),
        feather: 10
    };

    const circularSelection = {
        type: 'circle',
        centerX: Math.floor(imageData.width * 0.5),
        centerY: Math.floor(imageData.height * 0.5),
        radius: Math.min(imageData.width, imageData.height) * 0.3,
        feather: 15
    };

    // Create selection masks
    const rectMask = colorSplash.createSelectionMask(imageData.width, imageData.height, rectangularSelection);
    const circleMask = colorSplash.createAlphaMask(imageData.width, imageData.height, circularSelection);

    console.log(`Rectangular selection: ${rectMask.filter(m => m).length} pixels selected`);
    console.log(`Circular selection with feathering: alpha mask created`);

    // Apply color splash only within selection areas
    const targetColors = [{ r: 255, g: 0, b: 0 }]; // Red
    const splashConfig = {
        targetColors,
        tolerance: { hue: 15, saturation: 25, lightness: 20 },
        colorSpace: ColorSplash.ColorSpace.HSV
    };

    // Process rectangular selection
    const rectResult = await colorSplash.applyColorSplashInSelection(
        imageData,
        rectangularSelection,
        splashConfig
    );

    // Process circular selection
    const circleResult = await colorSplash.applyColorSplashInSelection(
        imageData,
        circularSelection,
        splashConfig
    );

    console.log('Selection area processing completed');
    return { rectResult, circleResult };
}

async function demonstrateAdvancedFileOperations(colorSplash, processedImage) {
    console.log('\n=== Advanced File Operations Demo ===');

    if (!processedImage) {
        console.log('Skipping file operations demo - no processed image available');
        return;
    }

    try {
        // Save in different formats with different quality settings
        const formats = ['png', 'jpeg', 'webp'];
        const qualities = [0.8, 0.9, 1.0];

        for (const format of formats) {
            if (colorSplash.isFormatSupported(format)) {
                for (const quality of qualities) {
                    const saveOptions = {
                        format,
                        quality,
                        filename: `color-splash-${format}-q${quality}`
                    };

                    // Save as blob
                    const blob = await colorSplash.saveAsBlob(processedImage, saveOptions);
                    console.log(`${format.toUpperCase()} (quality ${quality}): ${blob.size} bytes`);

                    // Save as Base64 (for data URLs)
                    const base64 = colorSplash.saveAsBase64(processedImage, saveOptions);
                    console.log(`Base64 data URL length: ${base64.length} characters`);
                }
            }
        }

        // Demonstrate download functionality (browser only)
        if (typeof document !== 'undefined') {
            await colorSplash.downloadImage(processedImage, {
                format: 'png',
                quality: 0.95,
                filename: 'color-splash-demo-result.png'
            });
            console.log('Image download initiated');
        }

    } catch (error) {
        console.log('File operations error:', error.message);
    }
}

function demonstratePerformanceMonitoring(colorSplash) {
    console.log('\n=== Performance Monitoring Demo ===');

    // Get detailed performance statistics
    const perfStats = colorSplash.getPerformanceStats();
    const cacheStats = colorSplash.getCacheStats();

    console.log('Performance Statistics:');
    Object.entries(perfStats).forEach(([operation, stats]) => {
        if (stats && stats.count > 0) {
            console.log(`  ${operation}:`);
            console.log(`    Average: ${stats.average.toFixed(2)}ms`);
            console.log(`    Min: ${stats.min.toFixed(2)}ms`);
            console.log(`    Max: ${stats.max.toFixed(2)}ms`);
            console.log(`    Total calls: ${stats.count}`);
        }
    });

    console.log('\nCache Statistics:');
    console.log(`  Cached items: ${cacheStats.size}/${cacheStats.maxSize}`);
    console.log(`  Cache hit ratio: Varies by usage pattern`);
}

async function demonstrateColorSpaceComparisons(colorSplash, imageData) {
    console.log('\n=== Color Space Comparison Demo ===');

    if (!imageData) {
        console.log('Skipping color space demo - no image data available');
        return;
    }

    const targetColors = [{ r: 100, g: 50, b: 150 }]; // Dark purple
    const tolerance = { hue: 20, saturation: 30, lightness: 25 };

    const colorSpaces = [
        ColorSplash.ColorSpace.RGB,
        ColorSplash.ColorSpace.HSV,
        ColorSplash.ColorSpace.LAB
    ];

    const results = {};

    for (const colorSpace of colorSpaces) {
        const startTime = performance.now();

        const result = await colorSplash.applyColorSplash(imageData, {
            targetColors,
            tolerance,
            colorSpace
        });

        const processTime = performance.now() - startTime;
        results[colorSpace] = { result, processTime };

        console.log(`${colorSpace} processing: ${processTime.toFixed(2)}ms`);
    }

    return results;
}

// Main demonstration function
async function runComprehensiveDemo() {
    console.log('Color Splash Library - Comprehensive Features Demo');
    console.log('==================================================');

    try {
        // Initialize and demonstrate File I/O
        const { colorSplash, imageData } = await demonstrateFileIO();

        // Demonstrate GPU acceleration
        const gpuResult = await demonstrateGPUAcceleration(colorSplash, imageData);

        // Demonstrate selection area processing
        const selectionResults = await demonstrateSelectionAreas(colorSplash, imageData);

        // Demonstrate advanced file operations
        const processedImage = gpuResult || selectionResults?.rectResult || imageData;
        await demonstrateAdvancedFileOperations(colorSplash, processedImage);

        // Demonstrate color space comparisons
        await demonstrateColorSpaceComparisons(colorSplash, imageData);

        // Show performance monitoring
        demonstratePerformanceMonitoring(colorSplash);

        console.log('\n=== Demo Completed Successfully! ===');

        // Cleanup resources
        colorSplash.dispose();

    } catch (error) {
        console.error('Demo error:', error);
    }
}

// Auto-run demo if in browser environment
if (typeof window !== 'undefined' && window.ColorSplash) {
    // Wait for page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runComprehensiveDemo);
    } else {
        runComprehensiveDemo();
    }
} else if (typeof module !== 'undefined') {
    // Export for Node.js usage
    module.exports = {
        runComprehensiveDemo,
        demonstrateFileIO,
        demonstrateGPUAcceleration,
        demonstrateSelectionAreas,
        demonstrateAdvancedFileOperations,
        demonstratePerformanceMonitoring,
        demonstrateColorSpaceComparisons
    };
}

/**
 * Usage Instructions:
 *
 * In Browser:
 * 1. Include the color-splash library script
 * 2. Include this script
 * 3. The demo will run automatically
 *
 * In Node.js:
 * const demo = require('./comprehensive-features-example.js');
 * demo.runComprehensiveDemo();
 *
 * Features Demonstrated:
 *
 * 1. File I/O Backend:
 *    - Format detection and support checking
 *    - Loading images from URLs with size constraints
 *    - Saving in multiple formats (PNG, JPEG, WebP)
 *    - Quality control for compressed formats
 *    - Base64 data URL generation
 *    - Automatic file download
 *
 * 2. GPU Acceleration:
 *    - WebGL backend initialization
 *    - Performance comparison between CPU and GPU
 *    - Automatic fallback to CPU when GPU unavailable
 *
 * 3. Selection Area Processing:
 *    - Rectangular and circular selection areas
 *    - Feathering for smooth edges
 *    - Boolean and alpha mask generation
 *    - Selective color splash application
 *
 * 4. Performance Features:
 *    - Detailed timing statistics
 *    - Cache utilization monitoring
 *    - Operation-specific performance tracking
 *
 * 5. Color Space Support:
 *    - RGB, HSV, and LAB color space processing
 *    - Performance comparison between color spaces
 *    - Tolerance settings per color space
 */