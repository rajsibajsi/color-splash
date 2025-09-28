/**
 * Area Processing Backend for Selection Area Functionality
 * Supports rectangle, circle, polygon, and freehand selection areas
 */

import { Point, SelectionArea, AreaProcessor } from '../types';

export class SelectionAreaProcessor implements AreaProcessor {
  /**
   * Check if a point is inside the specified selection area
   * @param x X coordinate of the point
   * @param y Y coordinate of the point
   * @param area Selection area definition
   * @returns true if point is inside the area
   */
  isPointInArea(x: number, y: number, area: SelectionArea): boolean {
    switch (area.type) {
      case 'rectangle':
        return this.isPointInRectangle(x, y, area.coordinates);
      case 'circle':
        return this.isPointInCircle(x, y, area.coordinates);
      case 'polygon':
        return this.isPointInPolygon(x, y, area.coordinates);
      case 'freehand':
        return this.isPointInFreehand(x, y, area.coordinates);
      default:
        throw new Error(`Unsupported area type: ${area.type}`);
    }
  }

  /**
   * Apply feathering (soft edge transition) to a boolean mask
   * @param mask Boolean mask array (true for selected pixels)
   * @param featherRadius Radius of feathering in pixels
   * @param width Image width
   * @param height Image height
   * @returns Array of alpha values (0-1) with feathered edges
   */
  applyFeathering(mask: boolean[], featherRadius: number, width: number, height: number): number[] {
    if (featherRadius <= 0) {
      return mask.map(value => value ? 1 : 0);
    }

    const result = new Array(mask.length).fill(0);

    for (let i = 0; i < mask.length; i++) {
      const x = i % width;
      const y = Math.floor(i / width);

      if (mask[i]) {
        result[i] = 1;
      } else {
        // Calculate distance to nearest selected pixel
        const distance = this.distanceToNearestSelected(x, y, mask, width, height, featherRadius);

        if (distance <= featherRadius) {
          // Apply smooth falloff (cosine interpolation)
          const ratio = distance / featherRadius;
          result[i] = 0.5 * (1 + Math.cos(ratio * Math.PI));
        }
      }
    }

    return result;
  }

  /**
   * Check if point is inside rectangle defined by coordinates
   * Expected coordinates: [topLeft, bottomRight] or [topLeft, topRight, bottomRight, bottomLeft]
   */
  private isPointInRectangle(x: number, y: number, coordinates: Point[]): boolean {
    if (coordinates.length < 2) {
      throw new Error('Rectangle requires at least 2 coordinates (topLeft, bottomRight)');
    }

    if (coordinates.length === 2) {
      // Simple axis-aligned rectangle
      const [topLeft, bottomRight] = coordinates;
      return x >= topLeft!.x && x <= bottomRight!.x &&
             y >= topLeft!.y && y <= bottomRight!.y;
    } else {
      // Rotated rectangle - treat as polygon
      return this.isPointInPolygon(x, y, coordinates);
    }
  }

  /**
   * Check if point is inside circle defined by coordinates
   * Expected coordinates: [center] with radius calculated from second point, or [center, edgePoint]
   */
  private isPointInCircle(x: number, y: number, coordinates: Point[]): boolean {
    if (coordinates.length < 1) {
      throw new Error('Circle requires at least 1 coordinate (center)');
    }

    const center = coordinates[0];
    let radius: number;

    if (coordinates.length >= 2) {
      // Calculate radius from center to edge point
      const edgePoint = coordinates[1]!;
      radius = Math.sqrt(
        Math.pow(edgePoint.x - center!.x, 2) +
        Math.pow(edgePoint.y - center!.y, 2)
      );
    } else {
      throw new Error('Circle requires center and edge point to determine radius');
    }

    // Check if point is within radius
    const distance = Math.sqrt(
      Math.pow(x - center!.x, 2) +
      Math.pow(y - center!.y, 2)
    );

    return distance <= radius;
  }

  /**
   * Check if point is inside polygon using ray casting algorithm
   */
  private isPointInPolygon(x: number, y: number, coordinates: Point[]): boolean {
    if (coordinates.length < 3) {
      throw new Error('Polygon requires at least 3 coordinates');
    }

    let inside = false;
    const n = coordinates.length;

    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = coordinates[i]!.x;
      const yi = coordinates[i]!.y;
      const xj = coordinates[j]!.x;
      const yj = coordinates[j]!.y;

      if (((yi > y) !== (yj > y)) &&
          (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }

    return inside;
  }

  /**
   * Check if point is inside freehand area using path interpolation
   */
  private isPointInFreehand(x: number, y: number, coordinates: Point[]): boolean {
    if (coordinates.length < 3) {
      return false;
    }

    // For freehand, we need to create a polygon from the path points
    // and then use polygon containment check
    return this.isPointInPolygon(x, y, coordinates);
  }

  /**
   * Calculate distance to nearest selected pixel for feathering
   */
  private distanceToNearestSelected(
    x: number,
    y: number,
    mask: boolean[],
    width: number,
    height: number,
    maxDistance: number
  ): number {
    let minDistance = maxDistance + 1;

    // Search in a square around the point, limited by maxDistance
    const searchRadius = Math.ceil(maxDistance);

    for (let dy = -searchRadius; dy <= searchRadius; dy++) {
      for (let dx = -searchRadius; dx <= searchRadius; dx++) {
        const nx = x + dx;
        const ny = y + dy;

        // Check bounds
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
          continue;
        }

        const index = ny * width + nx;
        if (mask[index]) {
          const distance = Math.sqrt(dx * dx + dy * dy);
          minDistance = Math.min(minDistance, distance);
        }
      }
    }

    return minDistance;
  }

  /**
   * Create a mask for the entire image based on selection area
   * @param width Image width
   * @param height Image height
   * @param area Selection area
   * @returns Boolean mask array
   */
  createSelectionMask(width: number, height: number, area: SelectionArea): boolean[] {
    const mask = new Array(width * height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = y * width + x;
        mask[index] = this.isPointInArea(x, y, area);
      }
    }

    return mask;
  }

  /**
   * Create an alpha mask with optional feathering
   * @param width Image width
   * @param height Image height
   * @param area Selection area
   * @returns Alpha mask array (0-1 values)
   */
  createAlphaMask(width: number, height: number, area: SelectionArea): number[] {
    const selectionMask = this.createSelectionMask(width, height, area);

    if (area.featherRadius && area.featherRadius > 0) {
      return this.applyFeathering(selectionMask, area.featherRadius, width, height);
    } else {
      return selectionMask.map(value => value ? 1 : 0);
    }
  }

  /**
   * Apply selection area to ImageData, preserving only selected regions
   * @param imageData Source image data
   * @param area Selection area
   * @param outsideColor Color to use for non-selected areas (default: transparent)
   * @returns New ImageData with selection applied
   */
  applySelectionToImageData(
    imageData: ImageData,
    area: SelectionArea,
    outsideColor: { r: number; g: number; b: number; a: number } = { r: 0, g: 0, b: 0, a: 0 }
  ): ImageData {
    const { width, height, data } = imageData;
    const result = new ImageData(width, height);
    const alphaMask = this.createAlphaMask(width, height, area);

    for (let i = 0; i < data.length; i += 4) {
      const pixelIndex = Math.floor(i / 4);
      const alpha = alphaMask[pixelIndex];

      if (alpha === 1) {
        // Fully inside selection - keep original
        result.data[i] = data[i]!;         // R
        result.data[i + 1] = data[i + 1]!; // G
        result.data[i + 2] = data[i + 2]!; // B
        result.data[i + 3] = data[i + 3]!; // A
      } else if (alpha === 0) {
        // Fully outside selection - use outside color
        result.data[i] = outsideColor.r;
        result.data[i + 1] = outsideColor.g;
        result.data[i + 2] = outsideColor.b;
        result.data[i + 3] = outsideColor.a;
      } else {
        // Feathered edge - blend between original and outside color
        const originalR = data[i]!;
        const originalG = data[i + 1]!;
        const originalB = data[i + 2]!;
        const originalA = data[i + 3]!;

        const alphaValue = alphaMask[pixelIndex]!;
        result.data[i] = Math.round(originalR * alphaValue + outsideColor.r * (1 - alphaValue));
        result.data[i + 1] = Math.round(originalG * alphaValue + outsideColor.g * (1 - alphaValue));
        result.data[i + 2] = Math.round(originalB * alphaValue + outsideColor.b * (1 - alphaValue));
        result.data[i + 3] = Math.round(originalA * alphaValue + outsideColor.a * (1 - alphaValue));
      }
    }

    return result;
  }
}

// Utility functions for creating common selection areas

/**
 * Create a rectangular selection area
 * @param x1 Left coordinate
 * @param y1 Top coordinate
 * @param x2 Right coordinate
 * @param y2 Bottom coordinate
 * @param featherRadius Optional feather radius
 * @returns SelectionArea object
 */
export function createRectangleSelection(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  featherRadius?: number
): SelectionArea {
  const result: SelectionArea = {
    type: 'rectangle',
    coordinates: [
      { x: Math.min(x1, x2), y: Math.min(y1, y2) },
      { x: Math.max(x1, x2), y: Math.max(y1, y2) }
    ]
  };
  if (featherRadius !== undefined) {
    result.featherRadius = featherRadius;
  }
  return result;
}

/**
 * Create a circular selection area
 * @param centerX Center X coordinate
 * @param centerY Center Y coordinate
 * @param radius Radius of the circle
 * @param featherRadius Optional feather radius
 * @returns SelectionArea object
 */
export function createCircleSelection(
  centerX: number,
  centerY: number,
  radius: number,
  featherRadius?: number
): SelectionArea {
  const result: SelectionArea = {
    type: 'circle',
    coordinates: [
      { x: centerX, y: centerY },
      { x: centerX + radius, y: centerY } // Edge point to define radius
    ]
  };
  if (featherRadius !== undefined) {
    result.featherRadius = featherRadius;
  }
  return result;
}

/**
 * Create a polygon selection area
 * @param points Array of polygon vertices
 * @param featherRadius Optional feather radius
 * @returns SelectionArea object
 */
export function createPolygonSelection(
  points: Point[],
  featherRadius?: number
): SelectionArea {
  if (points.length < 3) {
    throw new Error('Polygon requires at least 3 points');
  }

  const result: SelectionArea = {
    type: 'polygon',
    coordinates: [...points] // Copy array to avoid mutation
  };
  if (featherRadius !== undefined) {
    result.featherRadius = featherRadius;
  }
  return result;
}

/**
 * Create a freehand selection area
 * @param points Array of path points
 * @param featherRadius Optional feather radius
 * @returns SelectionArea object
 */
export function createFreehandSelection(
  points: Point[],
  featherRadius?: number
): SelectionArea {
  if (points.length < 2) {
    throw new Error('Freehand path requires at least 2 points');
  }

  const result: SelectionArea = {
    type: 'freehand',
    coordinates: [...points] // Copy array to avoid mutation
  };
  if (featherRadius !== undefined) {
    result.featherRadius = featherRadius;
  }
  return result;
}