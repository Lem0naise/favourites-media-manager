import { describe, it, expect } from 'vitest';
import { detectRatingScaleAndConvert } from '../utils/ratingscaler';

describe('ratingscaler utility functions', () => {
  describe('detectRatingScaleAndConvert', () => {
    it('should return empty array when given empty array', () => {
      const result = detectRatingScaleAndConvert([]);
      expect(result).toEqual([]);
    });

    it('should detect and convert 0-5 scale ratings', () => {
      const ratings = [1, 2, 3, 4, 5];
      const result = detectRatingScaleAndConvert(ratings);
      
      expect(result).toEqual([20, 40, 60, 80, 100]);
    });

    it('should detect and convert 0-5 scale with decimals', () => {
      const ratings = [1.5, 2.5, 3.5, 4.5];
      const result = detectRatingScaleAndConvert(ratings);
      
      expect(result).toEqual([30, 50, 70, 90]);
    });

    it('should detect and convert 0-5 scale with zero', () => {
      const ratings = [0, 1, 2, 3, 4, 5];
      const result = detectRatingScaleAndConvert(ratings);
      
      expect(result).toEqual([0, 20, 40, 60, 80, 100]);
    });

    it('should detect and convert 0-10 scale ratings', () => {
      const ratings = [1, 5, 7, 9, 10];
      const result = detectRatingScaleAndConvert(ratings);
      
      expect(result).toEqual([10, 50, 70, 90, 100]);
    });

    it('should detect and convert 0-10 scale with decimals', () => {
      const ratings = [6.5, 7.8, 8.2, 9.1];
      const result = detectRatingScaleAndConvert(ratings);
      
      expect(result).toEqual([65, 78, 82, 91]);
    });

    it('should detect and convert 0-10 scale with zero', () => {
      const ratings = [0, 3, 6, 8, 10];
      const result = detectRatingScaleAndConvert(ratings);
      
      expect(result).toEqual([0, 30, 60, 80, 100]);
    });

    it('should handle 0-100 scale without conversion', () => {
      const ratings = [25, 50, 75, 90, 100];
      const result = detectRatingScaleAndConvert(ratings);
      
      expect(result).toEqual([25, 50, 75, 90, 100]);
    });

    it('should handle 0-100 scale with values below max', () => {
      const ratings = [15, 45, 67, 82];
      const result = detectRatingScaleAndConvert(ratings);
      
      expect(result).toEqual([15, 45, 67, 82]);
    });

    it('should clamp values to 0-100 range for 5-point scale', () => {
      const ratings = [-1, 6, 7];
      const result = detectRatingScaleAndConvert(ratings);
      
      // Max is 7, so it's treated as > 5, so 10-point scale
      expect(result).toEqual([0, 60, 70]);
    });

    it('should clamp values to 0-100 range for 10-point scale', () => {
      const ratings = [-2, 11, 12];
      const result = detectRatingScaleAndConvert(ratings);
      
      // Max is 12, so it's treated as > 10, so 100-point scale
      expect(result).toEqual([0, 11, 12]);
    });

    it('should clamp values to 0-100 range for 100-point scale', () => {
      const ratings = [-10, 105, 150];
      const result = detectRatingScaleAndConvert(ratings);
      
      expect(result).toEqual([0, 100, 100]);
    });

    it('should handle single rating value', () => {
      expect(detectRatingScaleAndConvert([3])).toEqual([60]); // 5-point scale
      expect(detectRatingScaleAndConvert([7])).toEqual([70]); // 10-point scale
      expect(detectRatingScaleAndConvert([85])).toEqual([85]); // 100-point scale
    });

    it('should handle mixed ratings that determine scale by maximum', () => {
      // Max is 5, so 5-point scale
      const ratings1 = [1, 2, 3, 4, 5];
      expect(detectRatingScaleAndConvert(ratings1)).toEqual([20, 40, 60, 80, 100]);

      // Max is 10, so 10-point scale
      const ratings2 = [1, 2, 3, 10];
      expect(detectRatingScaleAndConvert(ratings2)).toEqual([10, 20, 30, 100]);

      // Max is 50, so 100-point scale
      const ratings3 = [1, 2, 3, 50];
      expect(detectRatingScaleAndConvert(ratings3)).toEqual([1, 2, 3, 50]);
    });

    it('should handle boundary values correctly', () => {
      // Exactly 5 should trigger 5-point scale
      const exactly5 = [1, 3, 5];
      expect(detectRatingScaleAndConvert(exactly5)).toEqual([20, 60, 100]);

      // Exactly 10 should trigger 10-point scale
      const exactly10 = [2, 5, 10];
      expect(detectRatingScaleAndConvert(exactly10)).toEqual([20, 50, 100]);

      // 5.1 should trigger 10-point scale
      const just_over_5 = [1, 3, 5.1];
      expect(detectRatingScaleAndConvert(just_over_5)).toEqual([10, 30, 51]);

      // 10.1 should trigger 100-point scale
      const just_over_10 = [1, 5, 10.1];
      expect(detectRatingScaleAndConvert(just_over_10)).toEqual([1, 5, 10.1]);
    });

    it('should handle all zero ratings', () => {
      const ratings = [0, 0, 0];
      const result = detectRatingScaleAndConvert(ratings);
      
      expect(result).toEqual([0, 0, 0]);
    });

    it('should handle very small positive ratings', () => {
      const ratings = [0.1, 0.2, 0.5];
      const result = detectRatingScaleAndConvert(ratings);
      
      // Max is 0.5, which is <= 5, so 5-point scale
      expect(result).toEqual([2, 4, 10]);
    });

    it('should handle very large ratings', () => {
      const ratings = [500, 750, 1000];
      const result = detectRatingScaleAndConvert(ratings);
      
      // Max is 1000, which is > 10, so 100-point scale (clamped to 100)
      expect(result).toEqual([100, 100, 100]);
    });

    it('should handle negative ratings correctly', () => {
      const ratings = [-5, -2, 0, 3];
      const result = detectRatingScaleAndConvert(ratings);
      
      // Max is 3, which is <= 5, so 5-point scale
      // All negatives get clamped to 0
      expect(result).toEqual([0, 0, 0, 60]);
    });

    it('should handle floating point precision edge cases', () => {
      const ratings = [4.999999, 5.000001];
      const result = detectRatingScaleAndConvert(ratings);
      
      // Max is 5.000001, which is > 5, so 10-point scale
      expect(result).toEqual([49.99999, 50.00001]);
    });

    it('should handle duplicate ratings', () => {
      const ratings = [3, 3, 3, 5];
      const result = detectRatingScaleAndConvert(ratings);
      
      // Max is 5, so 5-point scale
      expect(result).toEqual([60, 60, 60, 100]);
    });

    it('should handle unsorted ratings', () => {
      const ratings = [10, 2, 8, 1, 5];
      const result = detectRatingScaleAndConvert(ratings);
      
      // Max is 10, so 10-point scale
      expect(result).toEqual([100, 20, 80, 10, 50]);
    });

    it('should maintain order of input ratings', () => {
      const ratings = [5, 1, 3, 2, 4];
      const result = detectRatingScaleAndConvert(ratings);
      
      // Max is 5, so 5-point scale
      expect(result).toEqual([100, 20, 60, 40, 80]);
    });

    it('should handle edge case where max is exactly between thresholds', () => {
      // Test various boundary conditions
      const ratings_5 = [5];
      expect(detectRatingScaleAndConvert(ratings_5)).toEqual([100]); // 5-point

      const ratings_5_point_1 = [5.0000001];
      expect(detectRatingScaleAndConvert(ratings_5_point_1)).toBeCloseTo(50.000001); // 10-point

      const ratings_10 = [10];
      expect(detectRatingScaleAndConvert(ratings_10)).toEqual([100]); // 10-point

      const ratings_10_point_1 = [10.0000001];
      expect(detectRatingScaleAndConvert(ratings_10_point_1)).toEqual([10.0000001]); // 100-point
    });

    describe('performance and stress tests', () => {
      it('should handle large arrays efficiently', () => {
        const largeArray = Array.from({ length: 10000 }, (_, i) => (i % 5) + 1);
        const result = detectRatingScaleAndConvert(largeArray);
        
        expect(result).toHaveLength(10000);
        expect(Math.max(...result)).toBe(100);
        expect(Math.min(...result)).toBe(20);
      });

      it('should handle arrays with extreme values', () => {
        const extremeArray = [-Infinity, -1000, 0, 1000, Infinity];
        const result = detectRatingScaleAndConvert(extremeArray);
        
        // All values should be clamped to 0-100
        expect(result.every(val => val >= 0 && val <= 100)).toBe(true);
        expect(result).toEqual([0, 0, 0, 100, 100]);
      });
    });
  });
});
