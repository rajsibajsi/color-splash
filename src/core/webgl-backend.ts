/**
 * WebGL GPU Acceleration Backend for Color Splash Processing
 */

import { Color, ColorTolerance, ColorSpace } from '../types';

export interface WebGLProgramInfo {
  program: WebGLProgram;
  uniforms: {
    u_image: WebGLUniformLocation | null;
    u_targetColors: WebGLUniformLocation | null;
    u_numTargetColors: WebGLUniformLocation | null;
    u_tolerance: WebGLUniformLocation | null;
    u_colorSpace: WebGLUniformLocation | null;
  };
}

export interface WebGLTextureInfo {
  texture: WebGLTexture;
  width: number;
  height: number;
}

export class WebGLBackend {
  private gl: WebGL2RenderingContext | WebGLRenderingContext | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private colorSplashProgram: WebGLProgramInfo | null = null;
  private isInitialized = false;

  // Vertex buffer for full-screen quad
  private quadBuffer: WebGLBuffer | null = null;

  constructor() {}

  /**
   * Initialize WebGL context and shaders
   * @param canvas Canvas element for WebGL context
   * @returns Promise<boolean> Success status
   */
  async initialize(canvas: HTMLCanvasElement): Promise<boolean> {
    try {
      this.canvas = canvas;

      // Try WebGL2 first, fall back to WebGL1
      this.gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

      if (!this.gl) {
        console.warn('WebGL not supported');
        return false;
      }

      // Check for required extensions
      if (!this.checkExtensions()) {
        console.warn('Required WebGL extensions not available');
        return false;
      }

      // Initialize shaders and programs
      await this.initializeShaders();

      // Create vertex buffer for full-screen quad
      this.createQuadBuffer();

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize WebGL backend:', error);
      return false;
    }
  }

  /**
   * Check for required WebGL extensions
   */
  private checkExtensions(): boolean {
    if (!this.gl) return false;

    // Check for OES_texture_float for better precision
    const floatTextureExt = this.gl.getExtension('OES_texture_float');
    if (!floatTextureExt) {
      console.warn('OES_texture_float extension not available');
    }

    return true;
  }

  /**
   * Initialize shader programs
   */
  private async initializeShaders(): Promise<void> {
    if (!this.gl) throw new Error('WebGL context not initialized');

    const vertexShaderSource = this.getVertexShaderSource();
    const fragmentShaderSource = this.getColorSplashFragmentShaderSource();

    const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);

    this.colorSplashProgram = this.createProgram(vertexShader, fragmentShader);
  }

  /**
   * Vertex shader source for full-screen quad
   */
  private getVertexShaderSource(): string {
    return `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;

      varying vec2 v_texCoord;

      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `;
  }

  /**
   * Fragment shader source for color splash effect
   */
  private getColorSplashFragmentShaderSource(): string {
    return `
      precision mediump float;

      uniform sampler2D u_image;
      uniform vec3 u_targetColors[10]; // Support up to 10 target colors
      uniform int u_numTargetColors;
      uniform vec3 u_tolerance; // hue, saturation, lightness tolerances
      uniform int u_colorSpace; // 0=RGB, 1=HSV, 2=LAB

      varying vec2 v_texCoord;

      // RGB to HSV conversion
      vec3 rgbToHsv(vec3 rgb) {
        float maxVal = max(max(rgb.r, rgb.g), rgb.b);
        float minVal = min(min(rgb.r, rgb.g), rgb.b);
        float delta = maxVal - minVal;

        vec3 hsv;
        hsv.z = maxVal; // Value

        if (maxVal == 0.0) {
          hsv.y = 0.0; // Saturation
        } else {
          hsv.y = delta / maxVal;
        }

        if (delta == 0.0) {
          hsv.x = 0.0; // Hue
        } else if (maxVal == rgb.r) {
          hsv.x = mod(((rgb.g - rgb.b) / delta), 6.0);
        } else if (maxVal == rgb.g) {
          hsv.x = ((rgb.b - rgb.r) / delta) + 2.0;
        } else {
          hsv.x = ((rgb.r - rgb.g) / delta) + 4.0;
        }

        hsv.x = hsv.x * 60.0; // Convert to degrees
        if (hsv.x < 0.0) hsv.x += 360.0;

        return hsv;
      }

      // Calculate hue distance considering wrap-around
      float hueDistance(float h1, float h2) {
        float diff = abs(h1 - h2);
        return min(diff, 360.0 - diff);
      }

      // Check if color matches any target color in HSV space
      bool isColorSimilarHSV(vec3 pixelRGB) {
        vec3 pixelHSV = rgbToHsv(pixelRGB);

        for (int i = 0; i < 10; i++) {
          if (i >= u_numTargetColors) break;

          vec3 targetHSV = rgbToHsv(u_targetColors[i]);

          float hueDiff = hueDistance(pixelHSV.x, targetHSV.x);
          float satDiff = abs(pixelHSV.y * 100.0 - targetHSV.y * 100.0);
          float valDiff = abs(pixelHSV.z * 100.0 - targetHSV.z * 100.0);

          if (hueDiff <= u_tolerance.x &&
              satDiff <= u_tolerance.y &&
              valDiff <= u_tolerance.z) {
            return true;
          }
        }

        return false;
      }

      // Check if color matches any target color in RGB space
      bool isColorSimilarRGB(vec3 pixelRGB) {
        for (int i = 0; i < 10; i++) {
          if (i >= u_numTargetColors) break;

          vec3 diff = pixelRGB - u_targetColors[i];
          float distance = length(diff);

          if (distance <= u_tolerance.x / 255.0) {
            return true;
          }
        }

        return false;
      }

      // Convert to grayscale using luminance formula
      float toGrayscale(vec3 color) {
        return 0.299 * color.r + 0.587 * color.g + 0.114 * color.b;
      }

      void main() {
        vec4 pixel = texture2D(u_image, v_texCoord);
        vec3 pixelRGB = pixel.rgb;

        bool shouldPreserveColor = false;

        if (u_colorSpace == 1) { // HSV
          shouldPreserveColor = isColorSimilarHSV(pixelRGB);
        } else { // RGB or LAB (simplified to RGB for now)
          shouldPreserveColor = isColorSimilarRGB(pixelRGB);
        }

        if (shouldPreserveColor) {
          // Preserve original color
          gl_FragColor = pixel;
        } else {
          // Convert to grayscale
          float gray = toGrayscale(pixelRGB);
          gl_FragColor = vec4(gray, gray, gray, pixel.a);
        }
      }
    `;
  }

  /**
   * Compile a shader
   */
  private compileShader(type: number, source: string): WebGLShader {
    if (!this.gl) throw new Error('WebGL context not initialized');

    const shader = this.gl.createShader(type);
    if (!shader) throw new Error('Failed to create shader');

    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      const error = this.gl.getShaderInfoLog(shader);
      this.gl.deleteShader(shader);
      throw new Error(`Shader compilation failed: ${error}`);
    }

    return shader;
  }

  /**
   * Create shader program
   */
  private createProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgramInfo {
    if (!this.gl) throw new Error('WebGL context not initialized');

    const program = this.gl.createProgram();
    if (!program) throw new Error('Failed to create program');

    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      const error = this.gl.getProgramInfoLog(program);
      this.gl.deleteProgram(program);
      throw new Error(`Program linking failed: ${error}`);
    }

    // Get uniform locations
    const uniforms = {
      u_image: this.gl.getUniformLocation(program, 'u_image'),
      u_targetColors: this.gl.getUniformLocation(program, 'u_targetColors'),
      u_numTargetColors: this.gl.getUniformLocation(program, 'u_numTargetColors'),
      u_tolerance: this.gl.getUniformLocation(program, 'u_tolerance'),
      u_colorSpace: this.gl.getUniformLocation(program, 'u_colorSpace'),
    };

    return { program, uniforms };
  }

  /**
   * Create vertex buffer for full-screen quad
   */
  private createQuadBuffer(): void {
    if (!this.gl) throw new Error('WebGL context not initialized');

    const vertices = new Float32Array([
      // Position, TexCoord
      -1, -1, 0, 0, 1, -1, 1, 0, -1, 1, 0, 1, 1, 1, 1, 1,
    ]);

    this.quadBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);
  }

  /**
   * Create texture from ImageData
   */
  private createTexture(imageData: ImageData): WebGLTexture | null {
    if (!this.gl) return null;

    const texture = this.gl.createTexture();
    if (!texture) return null;

    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

    // Set texture parameters
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);

    // Upload image data
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      imageData.width,
      imageData.height,
      0,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      imageData.data
    );

    return texture;
  }

  /**
   * Apply color splash effect using GPU
   */
  async applyColorSplash(
    imageData: ImageData,
    targetColors: Color[],
    tolerance: ColorTolerance,
    colorSpace: ColorSpace
  ): Promise<ImageData> {
    if (!this.isInitialized || !this.gl || !this.colorSplashProgram || !this.canvas) {
      throw new Error('WebGL backend not initialized');
    }

    // Set canvas size to match image
    this.canvas.width = imageData.width;
    this.canvas.height = imageData.height;
    this.gl.viewport(0, 0, imageData.width, imageData.height);

    // Create texture from input image
    const inputTexture = this.createTexture(imageData);
    if (!inputTexture) {
      throw new Error('Failed to create input texture');
    }

    // Use shader program
    this.gl.useProgram(this.colorSplashProgram.program);

    // Set up vertex attributes
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadBuffer);

    const positionAttrib = this.gl.getAttribLocation(this.colorSplashProgram.program, 'a_position');
    const texCoordAttrib = this.gl.getAttribLocation(this.colorSplashProgram.program, 'a_texCoord');

    this.gl.enableVertexAttribArray(positionAttrib);
    this.gl.enableVertexAttribArray(texCoordAttrib);

    this.gl.vertexAttribPointer(positionAttrib, 2, this.gl.FLOAT, false, 16, 0);
    this.gl.vertexAttribPointer(texCoordAttrib, 2, this.gl.FLOAT, false, 16, 8);

    // Set uniforms
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, inputTexture);
    this.gl.uniform1i(this.colorSplashProgram.uniforms.u_image, 0);

    // Set target colors (limit to 10)
    const colorArray = new Float32Array(30); // 10 colors * 3 components
    const numColors = Math.min(targetColors.length, 10);

    for (let i = 0; i < numColors; i++) {
      colorArray[i * 3] = targetColors[i]!.r / 255;
      colorArray[i * 3 + 1] = targetColors[i]!.g / 255;
      colorArray[i * 3 + 2] = targetColors[i]!.b / 255;
    }

    this.gl.uniform3fv(this.colorSplashProgram.uniforms.u_targetColors, colorArray);
    this.gl.uniform1i(this.colorSplashProgram.uniforms.u_numTargetColors, numColors);

    // Set tolerance
    const toleranceVec: [number, number, number] = [
      tolerance.hue || 15,
      tolerance.saturation || 20,
      tolerance.lightness || 25,
    ];
    this.gl.uniform3f(
      this.colorSplashProgram.uniforms.u_tolerance,
      toleranceVec[0],
      toleranceVec[1],
      toleranceVec[2]
    );

    // Set color space
    const colorSpaceValue = colorSpace === ColorSpace.HSV ? 1 : 0;
    this.gl.uniform1i(this.colorSplashProgram.uniforms.u_colorSpace, colorSpaceValue);

    // Render
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

    // Read back result
    const resultData = new Uint8ClampedArray(imageData.width * imageData.height * 4);
    this.gl.readPixels(
      0,
      0,
      imageData.width,
      imageData.height,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      resultData
    );

    // Clean up
    this.gl.deleteTexture(inputTexture);

    return new ImageData(resultData, imageData.width, imageData.height);
  }

  /**
   * Check if WebGL backend is initialized and available
   */
  isAvailable(): boolean {
    return this.isInitialized && this.gl !== null;
  }

  /**
   * Clean up WebGL resources
   */
  dispose(): void {
    if (this.gl && this.colorSplashProgram) {
      this.gl.deleteProgram(this.colorSplashProgram.program);
    }

    if (this.gl && this.quadBuffer) {
      this.gl.deleteBuffer(this.quadBuffer);
    }

    this.gl = null;
    this.canvas = null;
    this.colorSplashProgram = null;
    this.quadBuffer = null;
    this.isInitialized = false;
  }
}
