/**
 * Tests for WebGL GPU acceleration backend
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
// @ts-nocheck

import { WebGLBackend } from '../../src/core/webgl-backend';
import { ColorSpace } from '../../src/types';

// Mock canvas and WebGL context
class MockCanvas {
  width = 100;
  height = 100;

  getContext(contextType: string): MockWebGLContext | null {
    if (contextType === 'webgl2' || contextType === 'webgl') {
      return new MockWebGLContext();
    }
    return null;
  }
}

class MockWebGLContext {
  VERTEX_SHADER = 35633;
  FRAGMENT_SHADER = 35632;
  COMPILE_STATUS = 35713;
  LINK_STATUS = 35714;
  ARRAY_BUFFER = 34962;
  STATIC_DRAW = 35044;
  TRIANGLE_STRIP = 5;
  TEXTURE_2D = 3553;
  TEXTURE0 = 33984;
  RGBA = 6408;
  UNSIGNED_BYTE = 5121;
  LINEAR = 9729;
  CLAMP_TO_EDGE = 33071;
  TEXTURE_WRAP_S = 10242;
  TEXTURE_WRAP_T = 10243;
  TEXTURE_MIN_FILTER = 10241;
  TEXTURE_MAG_FILTER = 10240;
  FLOAT = 5126;

  private shaders: Map<WebGLShader, boolean> = new Map();
  private programs: Map<WebGLProgram, boolean> = new Map();

  createShader(type: number): WebGLShader {
    const shader = { type } as WebGLShader;
    this.shaders.set(shader, true);
    return shader;
  }

  shaderSource(shader: WebGLShader, source: string): void {
    // Mock implementation
  }

  compileShader(shader: WebGLShader): void {
    // Mock successful compilation
  }

  getShaderParameter(shader: WebGLShader, pname: number): boolean {
    return pname === this.COMPILE_STATUS;
  }

  getShaderInfoLog(shader: WebGLShader): string {
    return '';
  }

  deleteShader(shader: WebGLShader): void {
    this.shaders.delete(shader);
  }

  createProgram(): WebGLProgram {
    const program = {} as WebGLProgram;
    this.programs.set(program, true);
    return program;
  }

  attachShader(program: WebGLProgram, shader: WebGLShader): void {
    // Mock implementation
  }

  linkProgram(program: WebGLProgram): void {
    // Mock implementation
  }

  getProgramParameter(program: WebGLProgram, pname: number): boolean {
    return pname === this.LINK_STATUS;
  }

  getProgramInfoLog(program: WebGLProgram): string {
    return '';
  }

  deleteProgram(program: WebGLProgram): void {
    this.programs.delete(program);
  }

  getUniformLocation(program: WebGLProgram, name: string): WebGLUniformLocation {
    return { name } as WebGLUniformLocation;
  }

  getAttribLocation(program: WebGLProgram, name: string): number {
    return 0;
  }

  createBuffer(): WebGLBuffer {
    return {} as WebGLBuffer;
  }

  bindBuffer(target: number, buffer: WebGLBuffer | null): void {
    // Mock implementation
  }

  bufferData(target: number, data: ArrayBuffer | ArrayBufferView, usage: number): void {
    // Mock implementation
  }

  deleteBuffer(buffer: WebGLBuffer): void {
    // Mock implementation
  }

  createTexture(): WebGLTexture {
    return {} as WebGLTexture;
  }

  bindTexture(target: number, texture: WebGLTexture | null): void {
    // Mock implementation
  }

  texParameteri(target: number, pname: number, param: number): void {
    // Mock implementation
  }

  texImage2D(
    target: number,
    level: number,
    internalformat: number,
    width: number,
    height: number,
    border: number,
    format: number,
    type: number,
    pixels: ArrayBufferView | null
  ): void {
    // Mock implementation
  }

  deleteTexture(texture: WebGLTexture): void {
    // Mock implementation
  }

  useProgram(program: WebGLProgram | null): void {
    // Mock implementation
  }

  enableVertexAttribArray(index: number): void {
    // Mock implementation
  }

  vertexAttribPointer(index: number, size: number, type: number, normalized: boolean, stride: number, offset: number): void {
    // Mock implementation
  }

  activeTexture(texture: number): void {
    // Mock implementation
  }

  uniform1i(location: WebGLUniformLocation | null, x: number): void {
    // Mock implementation
  }

  uniform3f(location: WebGLUniformLocation | null, x: number, y: number, z: number): void {
    // Mock implementation
  }

  uniform3fv(location: WebGLUniformLocation | null, v: Float32Array): void {
    // Mock implementation
  }

  viewport(x: number, y: number, width: number, height: number): void {
    // Mock implementation
  }

  drawArrays(mode: number, first: number, count: number): void {
    // Mock implementation
  }

  readPixels(x: number, y: number, width: number, height: number, format: number, type: number, pixels: ArrayBufferView): void {
    // Fill with test data
    const data = pixels as Uint8ClampedArray;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 128;     // R
      data[i + 1] = 128; // G
      data[i + 2] = 128; // B
      data[i + 3] = 255; // A
    }
  }

  getExtension(name: string): object | null {
    return {};
  }
}

// Helper function to create test image data
function createTestImageData(width: number, height: number, color = { r: 255, g: 0, b: 0 }): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);

  for (let i = 0; i < data.length; i += 4) {
    data[i] = color.r;     // R
    data[i + 1] = color.g; // G
    data[i + 2] = color.b; // B
    data[i + 3] = 255;     // A
  }

  return new ImageData(data, width, height);
}

describe('WebGLBackend', () => {
  let webglBackend: WebGLBackend;
  let mockCanvas: MockCanvas;

  beforeEach(() => {
    webglBackend = new WebGLBackend();
    mockCanvas = new MockCanvas();
  });

  afterEach(() => {
    webglBackend.dispose();
  });

  describe('Initialization', () => {
    test('should initialize successfully with WebGL support', async () => {
      const success = await webglBackend.initialize(mockCanvas as unknown as HTMLCanvasElement);
      expect(success).toBe(true);
      expect(webglBackend.isAvailable()).toBe(true);
    });

    test('should fail gracefully without WebGL support', async () => {
      const canvasWithoutWebGL = {
        getContext: () => null
      } as unknown as HTMLCanvasElement;

      const success = await webglBackend.initialize(canvasWithoutWebGL);
      expect(success).toBe(false);
      expect(webglBackend.isAvailable()).toBe(false);
    });

    test('should handle initialization errors gracefully', async () => {
      const errorCanvas = {
        getContext: () => {
          throw new Error('WebGL context creation failed');
        }
      } as unknown as HTMLCanvasElement;

      const success = await webglBackend.initialize(errorCanvas);
      expect(success).toBe(false);
      expect(webglBackend.isAvailable()).toBe(false);
    });
  });

  describe('Color Splash Processing', () => {
    beforeEach(async () => {
      await webglBackend.initialize(mockCanvas as unknown as HTMLCanvasElement);
    });

    test('should process color splash effect', async () => {
      const imageData = createTestImageData(10, 10, { r: 255, g: 0, b: 0 });
      const targetColors = [{ r: 255, g: 0, b: 0 }];
      const tolerance = { hue: 15, saturation: 20, lightness: 25 };

      const result = await webglBackend.applyColorSplash(
        imageData,
        targetColors,
        tolerance,
        ColorSpace.HSV
      );

      expect(result).toBeInstanceOf(ImageData);
      expect(result.width).toBe(imageData.width);
      expect(result.height).toBe(imageData.height);
      expect(result.data.length).toBe(imageData.data.length);
    });

    test('should handle multiple target colors', async () => {
      const imageData = createTestImageData(10, 10);
      const targetColors = [
        { r: 255, g: 0, b: 0 },
        { r: 0, g: 255, b: 0 },
        { r: 0, g: 0, b: 255 }
      ];
      const tolerance = { hue: 15, saturation: 20, lightness: 25 };

      const result = await webglBackend.applyColorSplash(
        imageData,
        targetColors,
        tolerance,
        ColorSpace.HSV
      );

      expect(result).toBeInstanceOf(ImageData);
      expect(result.width).toBe(imageData.width);
      expect(result.height).toBe(imageData.height);
    });

    test('should handle RGB color space', async () => {
      const imageData = createTestImageData(10, 10);
      const targetColors = [{ r: 255, g: 0, b: 0 }];
      const tolerance = { euclidean: 30 };

      const result = await webglBackend.applyColorSplash(
        imageData,
        targetColors,
        tolerance,
        ColorSpace.RGB
      );

      expect(result).toBeInstanceOf(ImageData);
      expect(result.width).toBe(imageData.width);
      expect(result.height).toBe(imageData.height);
    });

    test('should handle empty target colors array', async () => {
      const imageData = createTestImageData(10, 10);
      const targetColors: { r: number; g: number; b: number }[] = [];
      const tolerance = { hue: 15 };

      const result = await webglBackend.applyColorSplash(
        imageData,
        targetColors,
        tolerance,
        ColorSpace.HSV
      );

      expect(result).toBeInstanceOf(ImageData);
      expect(result.width).toBe(imageData.width);
      expect(result.height).toBe(imageData.height);
    });

    test('should throw error if not initialized', async () => {
      const uninitializedBackend = new WebGLBackend();
      const imageData = createTestImageData(10, 10);
      const targetColors = [{ r: 255, g: 0, b: 0 }];
      const tolerance = { hue: 15 };

      await expect(
        uninitializedBackend.applyColorSplash(imageData, targetColors, tolerance, ColorSpace.HSV)
      ).rejects.toThrow('WebGL backend not initialized');
    });

    test('should handle large images', async () => {
      const imageData = createTestImageData(512, 512);
      const targetColors = [{ r: 255, g: 0, b: 0 }];
      const tolerance = { hue: 15, saturation: 20, lightness: 25 };

      const result = await webglBackend.applyColorSplash(
        imageData,
        targetColors,
        tolerance,
        ColorSpace.HSV
      );

      expect(result).toBeInstanceOf(ImageData);
      expect(result.width).toBe(512);
      expect(result.height).toBe(512);
    });
  });

  describe('Resource Management', () => {
    test('should clean up resources on dispose', async () => {
      await webglBackend.initialize(mockCanvas as unknown as HTMLCanvasElement);
      expect(webglBackend.isAvailable()).toBe(true);

      webglBackend.dispose();
      expect(webglBackend.isAvailable()).toBe(false);
    });

    test('should handle multiple dispose calls', async () => {
      await webglBackend.initialize(mockCanvas as unknown as HTMLCanvasElement);

      webglBackend.dispose();
      expect(webglBackend.isAvailable()).toBe(false);

      // Should not throw on second dispose
      expect(() => webglBackend.dispose()).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    test('should handle shader compilation errors', async () => {
      const errorCanvas = {
        getContext: (type: string) => {
          if (type === 'webgl' || type === 'webgl2') {
            const mockContext = new MockCanvas().getContext('webgl') as MockWebGLContext;
            // Override to simulate shader compilation failure
            mockContext.getShaderParameter = (shader: WebGLShader, pname: number) => {
              return pname !== mockContext.COMPILE_STATUS;
            };
            mockContext.getShaderInfoLog = () => 'Shader compilation failed';
            return mockContext;
          }
          return null;
        }
      };

      const success = await webglBackend.initialize(errorCanvas as unknown as HTMLCanvasElement);
      expect(success).toBe(false);
    });

    test('should handle program linking errors', async () => {
      const errorCanvas = {
        getContext: (type: string) => {
          if (type === 'webgl' || type === 'webgl2') {
            const mockContext = new MockCanvas().getContext('webgl') as MockWebGLContext;
            // Override to simulate program linking failure
            mockContext.getProgramParameter = (program: WebGLProgram, pname: number) => {
              return pname !== mockContext.LINK_STATUS;
            };
            mockContext.getProgramInfoLog = () => 'Program linking failed';
            return mockContext;
          }
          return null;
        }
      };

      const success = await webglBackend.initialize(errorCanvas as unknown as HTMLCanvasElement);
      expect(success).toBe(false);
    });
  });

  describe('Performance', () => {
    beforeEach(async () => {
      await webglBackend.initialize(mockCanvas as unknown as HTMLCanvasElement);
    });

    test('should process images efficiently', async () => {
      const imageData = createTestImageData(100, 100);
      const targetColors = [{ r: 255, g: 0, b: 0 }];
      const tolerance = { hue: 15, saturation: 20, lightness: 25 };

      const startTime = performance.now();

      await webglBackend.applyColorSplash(
        imageData,
        targetColors,
        tolerance,
        ColorSpace.HSV
      );

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      // Should complete in reasonable time (adjust threshold as needed)
      expect(processingTime).toBeLessThan(1000); // 1 second
    });
  });
});