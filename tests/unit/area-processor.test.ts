/**
 * Tests for Selection Area Processor functionality
 */

// @ts-nocheck
import { SelectionAreaProcessor, createRectangleSelection, createCircleSelection, createPolygonSelection, createFreehandSelection } from '../../src/core/area-processor';
import { SelectionArea, Point } from '../../src/types';

describe('SelectionAreaProcessor', () => {
  let processor: SelectionAreaProcessor;

  beforeEach(() => {
    processor = new SelectionAreaProcessor();
  });

  describe('Rectangle Selection', () => {
    test('should detect point inside axis-aligned rectangle', () => {
      const area = createRectangleSelection(10, 10, 50, 40);

      expect(processor.isPointInArea(30, 25, area)).toBe(true);
      expect(processor.isPointInArea(10, 10, area)).toBe(true);
      expect(processor.isPointInArea(50, 40, area)).toBe(true);
    });

    test('should detect point outside rectangle', () => {
      const area = createRectangleSelection(20, 20, 60, 50);

      expect(processor.isPointInArea(10, 30, area)).toBe(false);
      expect(processor.isPointInArea(70, 30, area)).toBe(false);
      expect(processor.isPointInArea(40, 10, area)).toBe(false);
      expect(processor.isPointInArea(40, 60, area)).toBe(false);
    });

    test('should handle reversed coordinates', () => {
      const area = createRectangleSelection(50, 40, 10, 10);

      expect(processor.isPointInArea(30, 25, area)).toBe(true);
      expect(processor.isPointInArea(5, 25, area)).toBe(false);
    });

    test('should handle rotated rectangle as polygon', () => {
      const area: SelectionArea = {
        type: 'rectangle',
        coordinates: [
          { x: 0, y: 0 },
          { x: 30, y: 20 },
          { x: 20, y: 50 },
          { x: -10, y: 30 }
        ]
      };

      // Test point inside rotated rectangle
      expect(processor.isPointInArea(10, 25, area)).toBe(true);
    });
  });

  describe('Circle Selection', () => {
    test('should detect point inside circle', () => {
      const area = createCircleSelection(50, 50, 20);

      expect(processor.isPointInArea(50, 50, area)).toBe(true); // Center
      expect(processor.isPointInArea(60, 50, area)).toBe(true); // Inside
      expect(processor.isPointInArea(50, 60, area)).toBe(true); // Inside
    });

    test('should detect point outside circle', () => {
      const area = createCircleSelection(30, 30, 15);

      expect(processor.isPointInArea(50, 30, area)).toBe(false);
      expect(processor.isPointInArea(30, 50, area)).toBe(false);
      expect(processor.isPointInArea(10, 10, area)).toBe(false);
    });

    test('should handle point exactly on circle edge', () => {
      const area = createCircleSelection(25, 25, 10);

      expect(processor.isPointInArea(35, 25, area)).toBe(true); // Exactly on edge
    });

    test('should throw error with insufficient coordinates', () => {
      const area: SelectionArea = {
        type: 'circle',
        coordinates: []
      };

      expect(() => processor.isPointInArea(10, 10, area)).toThrow('Circle requires at least 1 coordinate');
    });
  });

  describe('Polygon Selection', () => {
    test('should detect point inside triangle', () => {
      const area = createPolygonSelection([
        { x: 0, y: 0 },
        { x: 40, y: 0 },
        { x: 20, y: 30 }
      ]);

      expect(processor.isPointInArea(20, 10, area)).toBe(true);
      expect(processor.isPointInArea(15, 15, area)).toBe(true);
    });

    test('should detect point outside triangle', () => {
      const area = createPolygonSelection([
        { x: 10, y: 10 },
        { x: 50, y: 10 },
        { x: 30, y: 40 }
      ]);

      expect(processor.isPointInArea(5, 5, area)).toBe(false);
      expect(processor.isPointInArea(60, 20, area)).toBe(false);
      expect(processor.isPointInArea(30, 50, area)).toBe(false);
    });

    test('should handle complex polygon', () => {
      const area = createPolygonSelection([
        { x: 0, y: 0 },
        { x: 20, y: 0 },
        { x: 20, y: 10 },
        { x: 40, y: 10 },
        { x: 40, y: 30 },
        { x: 0, y: 30 }
      ]);

      expect(processor.isPointInArea(10, 5, area)).toBe(true);
      expect(processor.isPointInArea(30, 20, area)).toBe(true);
      expect(processor.isPointInArea(30, 5, area)).toBe(false); // In the "notch"
    });

    test('should throw error with insufficient points', () => {
      expect(() => createPolygonSelection([
        { x: 0, y: 0 },
        { x: 10, y: 10 }
      ])).toThrow('Polygon requires at least 3 points');
    });
  });

  describe('Freehand Selection', () => {
    test('should handle freehand path as polygon', () => {
      const area = createFreehandSelection([
        { x: 0, y: 0 },
        { x: 10, y: 5 },
        { x: 20, y: 0 },
        { x: 25, y: 15 },
        { x: 15, y: 25 },
        { x: 5, y: 20 }
      ]);

      expect(processor.isPointInArea(15, 10, area)).toBe(true);
      expect(processor.isPointInArea(50, 50, area)).toBe(false);
    });

    test('should return false for insufficient points', () => {
      const area: SelectionArea = {
        type: 'freehand',
        coordinates: [
          { x: 0, y: 0 },
          { x: 10, y: 10 }
        ]
      };

      expect(processor.isPointInArea(5, 5, area)).toBe(false);
    });

    test('should throw error when creating with insufficient points', () => {
      expect(() => createFreehandSelection([
        { x: 0, y: 0 }
      ])).toThrow('Freehand path requires at least 2 points');
    });
  });

  describe('Selection Mask Creation', () => {
    test('should create boolean mask for rectangle', () => {
      const area = createRectangleSelection(1, 1, 3, 3);
      const mask = processor.createSelectionMask(5, 5, area);

      expect(mask.length).toBe(25);

      // Check specific positions
      expect(mask[6]).toBe(true);  // (1,1)
      expect(mask[7]).toBe(true);  // (2,1)
      expect(mask[8]).toBe(true);  // (3,1)
      expect(mask[0]).toBe(false); // (0,0)
      expect(mask[24]).toBe(false); // (4,4)
    });

    test('should create boolean mask for circle', () => {
      const area = createCircleSelection(2, 2, 1);
      const mask = processor.createSelectionMask(5, 5, area);

      expect(mask.length).toBe(25);
      expect(mask[12]).toBe(true); // Center (2,2)
      expect(mask[7]).toBe(true);  // (2,1) - inside radius
      expect(mask[0]).toBe(false); // (0,0) - outside radius
    });
  });

  describe('Alpha Mask Creation', () => {
    test('should create alpha mask without feathering', () => {
      const area = createRectangleSelection(0, 0, 1, 1);
      const alphaMask = processor.createAlphaMask(3, 3, area);

      expect(alphaMask.length).toBe(9);
      expect(alphaMask[0]).toBe(1); // Inside (0,0)
      expect(alphaMask[4]).toBe(1); // Inside (1,1)
      expect(alphaMask[8]).toBe(0); // Outside (2,2)
    });

    test('should create alpha mask with feathering', () => {
      const area = createRectangleSelection(1, 1, 1, 1, 1.5);
      const alphaMask = processor.createAlphaMask(3, 3, area);

      expect(alphaMask.length).toBe(9);
      expect(alphaMask[4]).toBe(1); // Center (1,1) - fully inside
      expect(alphaMask[1]).toBeGreaterThan(0); // Adjacent pixel (1,0) should have feathering (distance = 1)
      expect(alphaMask[1]).toBeLessThan(1);
    });
  });

  describe('Feathering', () => {
    test('should return binary mask when feather radius is 0', () => {
      const mask = [true, false, true, false];
      const result = processor.applyFeathering(mask, 0, 2, 2);

      expect(result).toEqual([1, 0, 1, 0]);
    });

    test('should apply smooth feathering', () => {
      const mask = [
        false, true, false,
        false, false, false,
        false, false, false
      ];
      const result = processor.applyFeathering(mask, 1.5, 3, 3);

      expect(result[1]).toBe(1); // Selected pixel at index 1 (0,1)
      expect(result[0]).toBeGreaterThan(0); // Adjacent pixel should have feathering
      expect(result[0]).toBeLessThan(1);
      expect(result[8]).toBe(0); // Too far for feathering
    });
  });

  describe('Apply Selection to ImageData', () => {
    function createTestImageData(width: number, height: number): ImageData {
      const data = new Uint8ClampedArray(width * height * 4);
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255;     // R
        data[i + 1] = 128; // G
        data[i + 2] = 64;  // B
        data[i + 3] = 255; // A
      }
      return new ImageData(data, width, height);
    }

    test('should apply rectangular selection to ImageData', () => {
      const imageData = createTestImageData(4, 4);
      const area = createRectangleSelection(1, 1, 2, 2);

      const result = processor.applySelectionToImageData(imageData, area);

      expect(result.width).toBe(4);
      expect(result.height).toBe(4);

      // Check that selected area preserves original colors
      const centerIndex = (1 * 4 + 1) * 4; // (1,1)
      expect(result.data[centerIndex]).toBe(255);     // R
      expect(result.data[centerIndex + 1]).toBe(128); // G
      expect(result.data[centerIndex + 2]).toBe(64);  // B
      expect(result.data[centerIndex + 3]).toBe(255); // A

      // Check that unselected area uses outside color (transparent)
      const outsideIndex = 0; // (0,0)
      expect(result.data[outsideIndex]).toBe(0);     // R
      expect(result.data[outsideIndex + 1]).toBe(0); // G
      expect(result.data[outsideIndex + 2]).toBe(0); // B
      expect(result.data[outsideIndex + 3]).toBe(0); // A
    });

    test('should apply selection with custom outside color', () => {
      const imageData = createTestImageData(3, 3);
      const area = createRectangleSelection(0, 0, 1, 1);
      const outsideColor = { r: 255, g: 0, b: 0, a: 128 };

      const result = processor.applySelectionToImageData(imageData, area, outsideColor);

      // Check unselected area uses custom outside color
      const outsideIndex = (2 * 3 + 2) * 4; // (2,2)
      expect(result.data[outsideIndex]).toBe(255);     // R
      expect(result.data[outsideIndex + 1]).toBe(0);   // G
      expect(result.data[outsideIndex + 2]).toBe(0);   // B
      expect(result.data[outsideIndex + 3]).toBe(128); // A
    });

    test('should blend colors in feathered areas', () => {
      const imageData = createTestImageData(3, 3);
      const area = createRectangleSelection(1, 1, 1, 1, 1.5); // With feathering - only center pixel

      const result = processor.applySelectionToImageData(imageData, area);

      // Feathered areas should have blended colors
      const featheredIndex = (0 * 3 + 1) * 4; // (1,0) - should be feathered (distance = 1)
      const alpha = result.data[featheredIndex + 3];
      expect(alpha).toBeGreaterThan(0);
      expect(alpha).toBeLessThan(255);
    });
  });

  describe('Utility Functions', () => {
    test('createRectangleSelection should create valid selection area', () => {
      const area = createRectangleSelection(10, 20, 50, 60, 5);

      expect(area.type).toBe('rectangle');
      expect(area.coordinates).toHaveLength(2);
      expect(area.coordinates[0]).toEqual({ x: 10, y: 20 });
      expect(area.coordinates[1]).toEqual({ x: 50, y: 60 });
      expect(area.featherRadius).toBe(5);
    });

    test('createCircleSelection should create valid selection area', () => {
      const area = createCircleSelection(25, 30, 15, 3);

      expect(area.type).toBe('circle');
      expect(area.coordinates).toHaveLength(2);
      expect(area.coordinates[0]).toEqual({ x: 25, y: 30 });
      expect(area.coordinates[1]).toEqual({ x: 40, y: 30 }); // Center + radius
      expect(area.featherRadius).toBe(3);
    });

    test('createPolygonSelection should copy points array', () => {
      const points = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: 10 }];
      const area = createPolygonSelection(points, 2);

      expect(area.type).toBe('polygon');
      expect(area.coordinates).not.toBe(points); // Should be a copy
      expect(area.coordinates).toEqual(points);
      expect(area.featherRadius).toBe(2);
    });

    test('createFreehandSelection should copy points array', () => {
      const points = [{ x: 0, y: 0 }, { x: 5, y: 5 }, { x: 10, y: 0 }];
      const area = createFreehandSelection(points, 1);

      expect(area.type).toBe('freehand');
      expect(area.coordinates).not.toBe(points); // Should be a copy
      expect(area.coordinates).toEqual(points);
      expect(area.featherRadius).toBe(1);
    });
  });

  describe('Error Handling', () => {
    test('should throw error for unsupported area type', () => {
      const area: SelectionArea = {
        type: 'invalid' as any,
        coordinates: []
      };

      expect(() => processor.isPointInArea(0, 0, area)).toThrow('Unsupported area type: invalid');
    });

    test('should handle edge cases in distance calculation', () => {
      const mask = [true];
      const result = processor.applyFeathering(mask, 5);

      expect(result).toEqual([1]);
    });

    test('should handle empty coordinates gracefully', () => {
      const area: SelectionArea = {
        type: 'rectangle',
        coordinates: []
      };

      expect(() => processor.isPointInArea(0, 0, area)).toThrow('Rectangle requires at least 2 coordinates');
    });
  });
});