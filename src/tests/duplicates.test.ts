import { describe, it, expect } from 'vitest';
import { createDuplicateKey, DuplicateCheckOptions } from '../utils/duplicates';
import type { MediaItem } from '../core/types';

describe('duplicates utility functions', () => {
  const baseItem: MediaItem = {
    id: '1',
    title: 'Inception',
    type: 'film',
    rating: 9,
    review: 'Amazing sci-fi thriller',
    status: 'watched',
    dateAdded: new Date('2023-01-01')
  };

  const duplicateItem: MediaItem = {
    id: '2',
    title: 'INCEPTION',
    type: 'film',
    rating: 8,
    review: 'Great movie',
    status: 'watchlist',
    dateAdded: new Date('2023-02-01')
  };

  const exactDuplicateItem: MediaItem = {
    id: '3',
    title: 'Inception',
    type: 'film',
    rating: 9,
    review: 'Amazing sci-fi thriller',
    status: 'watched',
    dateAdded: new Date('2023-01-01')
  };

  const differentTypeItem: MediaItem = {
    id: '4',
    title: 'Inception',
    type: 'book',
    rating: 9,
    review: 'Amazing sci-fi thriller',
    status: 'watched',
    dateAdded: new Date('2023-01-01')
  };

  describe('createDuplicateKey', () => {
    it('should create exact duplicate keys correctly', () => {
      const options: DuplicateCheckOptions = { exact: true };
      const key1 = createDuplicateKey(baseItem, options);
      const key2 = createDuplicateKey(exactDuplicateItem, options);
      const key3 = createDuplicateKey(duplicateItem, options);

      expect(key1).toBe(key2);
      expect(key1).not.toBe(key3);
      expect(key1).toBe('inception|film|9|amazing sci-fi thriller|watched');
    });

    it('should create title and type duplicate keys correctly', () => {
      const options: DuplicateCheckOptions = { titleAndType: true };
      const key1 = createDuplicateKey(baseItem, options);
      const key2 = createDuplicateKey(duplicateItem, options);
      const key3 = createDuplicateKey(differentTypeItem, options);

      expect(key1).toBe(key2);
      expect(key1).not.toBe(key3);
      expect(key1).toBe('inception|film');
    });

    it('should create title, type, and status duplicate keys correctly', () => {
      const options: DuplicateCheckOptions = { titleTypeStatus: true };
      const key1 = createDuplicateKey(baseItem, options);
      const key2 = createDuplicateKey(duplicateItem, options);
      const key3 = createDuplicateKey({ ...baseItem, status: 'watchlist' }, options);

      expect(key1).not.toBe(key2);
      expect(key1).not.toBe(key3);
      expect(key1).toBe('inception|film|watched');
      expect(key2).toBe('inception|film|watchlist');
    });

    it('should default to title and type when no options specified', () => {
      const options: DuplicateCheckOptions = {};
      const key1 = createDuplicateKey(baseItem, options);
      const key2 = createDuplicateKey(duplicateItem, options);

      expect(key1).toBe(key2);
      expect(key1).toBe('inception|film');
    });

    it('should handle items with empty/whitespace titles and reviews', () => {
      const emptyItem: MediaItem = {
        id: '5',
        title: '   ',
        type: 'film',
        rating: 5,
        review: '   \n\t   ',
        status: 'watched',
        dateAdded: new Date()
      };

      const options: DuplicateCheckOptions = { exact: true };
      const key = createDuplicateKey(emptyItem, options);
      expect(key).toBe('|film|5||watched');
    });

    it('should normalize case and whitespace consistently', () => {
      const messyItem: MediaItem = {
        id: '6',
        title: '  THE MATRIX  ',
        type: 'film',
        rating: 10,
        review: '  GREAT MOVIE  ',
        status: 'watched',
        dateAdded: new Date()
      };

      const cleanItem: MediaItem = {
        id: '7',
        title: 'the matrix',
        type: 'film',
        rating: 10,
        review: 'great movie',
        status: 'watched',
        dateAdded: new Date()
      };

      const options: DuplicateCheckOptions = { exact: true };
      const key1 = createDuplicateKey(messyItem, options);
      const key2 = createDuplicateKey(cleanItem, options);

      expect(key1).toBe(key2);
    });

    it('should handle special characters in titles and reviews', () => {
      const specialItem: MediaItem = {
        id: '8',
        title: 'The "Amazing" Movie: Part 1',
        type: 'film',
        rating: 7,
        review: 'Contains "quotes" and symbols!@#$%',
        status: 'watched',
        dateAdded: new Date()
      };

      const options: DuplicateCheckOptions = { exact: true };
      const key = createDuplicateKey(specialItem, options);
      expect(key).toContain('the "amazing" movie: part 1');
      expect(key).toContain('contains "quotes" and symbols!@#$%');
    });

    it('should handle all media types correctly', () => {
      const mediaTypes = ['film', 'tv', 'game', 'book', 'boardgame'] as const;
      const options: DuplicateCheckOptions = { titleAndType: true };
      
      mediaTypes.forEach(type => {
        const item: MediaItem = {
          ...baseItem,
          type: type
        };
        const key = createDuplicateKey(item, options);
        expect(key).toBe(`inception|${type}`);
      });
    });

    it('should handle all status types correctly', () => {
      const statuses = ['watched', 'watching', 'watchlist'] as const;
      const options: DuplicateCheckOptions = { titleTypeStatus: true };
      
      statuses.forEach(status => {
        const item: MediaItem = {
          ...baseItem,
          status: status
        };
        const key = createDuplicateKey(item, options);
        expect(key).toBe(`inception|film|${status}`);
      });
    });

    it('should handle boundary rating values', () => {
      const options: DuplicateCheckOptions = { exact: true };
      
      const zeroRating = createDuplicateKey({ ...baseItem, rating: 0 }, options);
      const maxRating = createDuplicateKey({ ...baseItem, rating: 100 }, options);
      const negativeRating = createDuplicateKey({ ...baseItem, rating: -5 }, options);
      
      expect(zeroRating).toContain('|0|');
      expect(maxRating).toContain('|100|');
      expect(negativeRating).toContain('|-5|');
    });
  });
});
