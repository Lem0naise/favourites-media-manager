import { describe, it, expect } from 'vitest';
import { addNewMediaItems } from '../utils/updating';
import type { MediaItem, UpdateResult } from '../core/types';

describe('updating utility functions', () => {
  const createMediaItem = (overrides: Partial<MediaItem> = {}): MediaItem => ({
    id: '1',
    title: 'Test Movie',
    type: 'film',
    rating: 80,
    review: 'Great movie',
    status: 'watched',
    dateAdded: new Date('2023-01-01'),
    ...overrides
  });

  describe('addNewMediaItems', () => {
    it('should add completely new items', () => {
      const existingItems: MediaItem[] = [
        createMediaItem({ id: '1', title: 'Existing Movie' })
      ];

      const newItems: MediaItem[] = [
        createMediaItem({ title: 'New Movie', id: 'temp' })
      ];

      const result = addNewMediaItems(existingItems, newItems);

      expect(result.success).toBe(true);
      expect(result.added).toHaveLength(1);
      expect(result.updated).toHaveLength(0);
      expect(result.duplicates).toHaveLength(0);
      expect(result.items).toHaveLength(2);
      
      // Check that new item gets a generated ID
      const addedItem = result.added[0];
      expect(addedItem.title).toBe('New Movie');
      expect(addedItem.id).toMatch(/^import-\d+-[a-z0-9]+-\d+$/);
    });

    it('should skip exact duplicates', () => {
      const existingItems: MediaItem[] = [
        createMediaItem({ 
          id: '1', 
          title: 'Inception',
          type: 'film',
          rating: 90,
          review: 'Amazing movie',
          status: 'watched'
        })
      ];

      const newItems: MediaItem[] = [
        createMediaItem({ 
          title: 'Inception',
          type: 'film',
          rating: 90,
          review: 'Amazing movie',
          status: 'watched'
        })
      ];

      const result = addNewMediaItems(existingItems, newItems);

      expect(result.success).toBe(true);
      expect(result.added).toHaveLength(0);
      expect(result.updated).toHaveLength(0);
      expect(result.duplicates).toHaveLength(1);
      expect(result.items).toHaveLength(1);
      expect(result.duplicates[0].title).toBe('Inception');
    });

    it('should update items with same title and type but different other fields', () => {
      const existingItems: MediaItem[] = [
        createMediaItem({ 
          id: 'existing-1', 
          title: 'Inception',
          type: 'film',
          rating: 80,
          review: 'Good movie',
          status: 'watchlist',
          dateAdded: new Date('2023-01-01')
        })
      ];

      const newItems: MediaItem[] = [
        createMediaItem({ 
          id: 'temp',
          title: 'Inception',
          type: 'film',
          rating: 90,
          review: 'Amazing movie',
          status: 'watched',
          dateAdded: new Date('2023-02-01')
        })
      ];

      const result = addNewMediaItems(existingItems, newItems);

      expect(result.success).toBe(true);
      expect(result.added).toHaveLength(0);
      expect(result.updated).toHaveLength(1);
      expect(result.duplicates).toHaveLength(0);
      expect(result.items).toHaveLength(1);
      
      const updatedItem = result.items[0];
      expect(updatedItem.id).toBe('existing-1'); // Should keep original ID
      expect(updatedItem.dateAdded).toEqual(new Date('2023-01-01')); // Should keep original date
      expect(updatedItem.rating).toBe(90); // Should update rating
      expect(updatedItem.review).toBe('Amazing movie'); // Should update review
      expect(updatedItem.status).toBe('watched'); // Should update status
    });

    it('should handle case-insensitive title matching', () => {
      const existingItems: MediaItem[] = [
        createMediaItem({ 
          id: 'existing-1', 
          title: 'INCEPTION',
          type: 'film'
        })
      ];

      const newItems: MediaItem[] = [
        createMediaItem({ 
          title: 'inception',
          type: 'film',
          rating: 95
        })
      ];

      const result = addNewMediaItems(existingItems, newItems);

      expect(result.updated).toHaveLength(1);
      expect(result.items[0].rating).toBe(95);
    });

    it('should handle whitespace in titles', () => {
      const existingItems: MediaItem[] = [
        createMediaItem({ 
          id: 'existing-1', 
          title: '  The Matrix  ',
          type: 'film'
        })
      ];

      const newItems: MediaItem[] = [
        createMediaItem({ 
          title: 'the matrix',
          type: 'film',
          rating: 95
        })
      ];

      const result = addNewMediaItems(existingItems, newItems);

      expect(result.updated).toHaveLength(1);
      expect(result.items[0].rating).toBe(95);
    });

    it('should treat different types as different items', () => {
      const existingItems: MediaItem[] = [
        createMediaItem({ 
          id: 'existing-1', 
          title: 'Dune',
          type: 'book'
        })
      ];

      const newItems: MediaItem[] = [
        createMediaItem({ 
          title: 'Dune',
          type: 'film'
        })
      ];

      const result = addNewMediaItems(existingItems, newItems);

      expect(result.added).toHaveLength(1);
      expect(result.updated).toHaveLength(0);
      expect(result.items).toHaveLength(2);
    });

    it('should handle multiple new items with mixed operations', () => {
      const existingItems: MediaItem[] = [
        createMediaItem({ 
          id: 'existing-1', 
          title: 'Movie A',
          type: 'film',
          rating: 70
        }),
        createMediaItem({ 
          id: 'existing-2', 
          title: 'Movie B',
          type: 'film',
          rating: 80,
          review: 'Original review',
          status: 'watched'
        })
      ];

      const newItems: MediaItem[] = [
        // Exact duplicate - should be skipped
        createMediaItem({ 
          title: 'Movie A',
          type: 'film',
          rating: 70,
          review: 'Great movie',
          status: 'watched'
        }),
        // Update existing - should update
        createMediaItem({ 
          title: 'Movie B',
          type: 'film',
          rating: 85,
          review: 'Updated review',
          status: 'watched'
        }),
        // Completely new - should add
        createMediaItem({ 
          title: 'Movie C',
          type: 'film'
        })
      ];

      const result = addNewMediaItems(existingItems, newItems);

      expect(result.success).toBe(true);
      expect(result.added).toHaveLength(1);
      expect(result.updated).toHaveLength(1);
      expect(result.duplicates).toHaveLength(1);
      expect(result.items).toHaveLength(3);

      // Check duplicates
      expect(result.duplicates[0].title).toBe('Movie A');

      // Check updates
      expect(result.updated[0].title).toBe('Movie B');
      const updatedItem = result.items.find(item => item.title === 'Movie B')!;
      expect(updatedItem.rating).toBe(85);
      expect(updatedItem.review).toBe('Updated review');
      expect(updatedItem.id).toBe('existing-2');

      // Check additions
      expect(result.added[0].title).toBe('Movie C');
      const addedItem = result.items.find(item => item.title === 'Movie C')!;
      expect(addedItem.id).toMatch(/^import-/);
    });

    it('should preserve existing items that are not updated', () => {
      const existingItems: MediaItem[] = [
        createMediaItem({ 
          id: 'existing-1', 
          title: 'Keep Me',
          type: 'film'
        }),
        createMediaItem({ 
          id: 'existing-2', 
          title: 'Update Me',
          type: 'film',
          rating: 70
        })
      ];

      const newItems: MediaItem[] = [
        createMediaItem({ 
          title: 'Update Me',
          type: 'film',
          rating: 90
        })
      ];

      const result = addNewMediaItems(existingItems, newItems);

      expect(result.items).toHaveLength(2);
      const keepItem = result.items.find(item => item.title === 'Keep Me')!;
      expect(keepItem.id).toBe('existing-1');
      
      const updateItem = result.items.find(item => item.title === 'Update Me')!;
      expect(updateItem.rating).toBe(90);
      expect(updateItem.id).toBe('existing-2');
    });

    it('should generate unique IDs for multiple new items', () => {
      const existingItems: MediaItem[] = [];
      const newItems: MediaItem[] = [
        createMediaItem({ title: 'Movie 1' }),
        createMediaItem({ title: 'Movie 2' }),
        createMediaItem({ title: 'Movie 3' })
      ];

      const result = addNewMediaItems(existingItems, newItems);

      expect(result.added).toHaveLength(3);
      const ids = result.added.map(item => item.id);
      
      // All IDs should be unique
      expect(new Set(ids).size).toBe(3);
      
      // All IDs should match the pattern
      ids.forEach(id => {
        expect(id).toMatch(/^import-\d+-[a-z0-9]+-\d+$/);
      });
    });

    it('should handle empty arrays', () => {
      const result1 = addNewMediaItems([], []);
      expect(result1.success).toBe(true);
      expect(result1.items).toEqual([]);
      expect(result1.added).toEqual([]);
      expect(result1.updated).toEqual([]);
      expect(result1.duplicates).toEqual([]);

      const existingItems: MediaItem[] = [createMediaItem()];
      const result2 = addNewMediaItems(existingItems, []);
      expect(result2.items).toEqual(existingItems);
      expect(result2.added).toEqual([]);

      const newItems: MediaItem[] = [createMediaItem()];
      const result3 = addNewMediaItems([], newItems);
      expect(result3.items).toHaveLength(1);
      expect(result3.added).toHaveLength(1);
    });

    it('should handle all media types correctly', () => {
      const existingItems: MediaItem[] = [];
      const mediaTypes = ['film', 'tv', 'game', 'book', 'boardgame'] as const;
      
      const newItems: MediaItem[] = mediaTypes.map(type => 
        createMediaItem({ title: `Test ${type}`, type })
      );

      const result = addNewMediaItems(existingItems, newItems);

      expect(result.added).toHaveLength(5);
      expect(result.items).toHaveLength(5);
      
      mediaTypes.forEach(type => {
        const item = result.items.find(item => item.type === type)!;
        expect(item.title).toBe(`Test ${type}`);
      });
    });

    it('should handle all status types correctly', () => {
      const existingItems: MediaItem[] = [];
      const statuses = ['watched', 'watching', 'watchlist'] as const;
      
      const newItems: MediaItem[] = statuses.map(status => 
        createMediaItem({ title: `Test ${status}`, status })
      );

      const result = addNewMediaItems(existingItems, newItems);

      expect(result.added).toHaveLength(3);
      
      statuses.forEach(status => {
        const item = result.items.find(item => item.status === status)!;
        expect(item.title).toBe(`Test ${status}`);
      });
    });

    it('should handle items with special characters in titles', () => {
      const existingItems: MediaItem[] = [
        createMediaItem({ 
          id: 'existing-1',
          title: 'Movie: "The Best" (2023)',
          type: 'film'
        })
      ];

      const newItems: MediaItem[] = [
        createMediaItem({ 
          title: 'movie: "the best" (2023)',
          type: 'film',
          rating: 95
        })
      ];

      const result = addNewMediaItems(existingItems, newItems);

      expect(result.updated).toHaveLength(1);
      expect(result.items[0].rating).toBe(95);
    });

    it('should handle boundary rating values', () => {
      const existingItems: MediaItem[] = [];
      const newItems: MediaItem[] = [
        createMediaItem({ title: 'Zero Rating', rating: 0 }),
        createMediaItem({ title: 'Max Rating', rating: 100 }),
        createMediaItem({ title: 'Negative Rating', rating: -5 })
      ];

      const result = addNewMediaItems(existingItems, newItems);

      expect(result.added).toHaveLength(3);
      expect(result.items.find(item => item.title === 'Zero Rating')!.rating).toBe(0);
      expect(result.items.find(item => item.title === 'Max Rating')!.rating).toBe(100);
      expect(result.items.find(item => item.title === 'Negative Rating')!.rating).toBe(-5);
    });

    it('should handle items with empty or whitespace reviews', () => {
      const existingItems: MediaItem[] = [];
      const newItems: MediaItem[] = [
        createMediaItem({ title: 'Empty Review', review: '' }),
        createMediaItem({ title: 'Whitespace Review', review: '   \n\t   ' }),
        createMediaItem({ title: 'Normal Review', review: 'Great movie' })
      ];

      const result = addNewMediaItems(existingItems, newItems);

      expect(result.added).toHaveLength(3);
      expect(result.items.find(item => item.title === 'Empty Review')!.review).toBe('');
      expect(result.items.find(item => item.title === 'Whitespace Review')!.review).toBe('   \n\t   ');
    });

    it('should return correct message and success status', () => {
      const result = addNewMediaItems([], []);
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Update successful');
    });

    describe('ID generation consistency', () => {
      it('should generate IDs with consistent format', () => {
        const existingItems: MediaItem[] = [];
        const newItems: MediaItem[] = [createMediaItem()];

        const result = addNewMediaItems(existingItems, newItems);
        const generatedId = result.added[0].id;

        // Should start with 'import-'
        expect(generatedId).toMatch(/^import-/);
        
        // Should contain timestamp
        expect(generatedId).toMatch(/import-\d+/);
        
        // Should contain random component
        expect(generatedId).toMatch(/import-\d+-[a-z0-9]+/);
        
        // Should end with counter
        expect(generatedId).toMatch(/import-\d+-[a-z0-9]+-\d+$/);
      });

      it('should increment counter for multiple items in same batch', () => {
        const existingItems: MediaItem[] = [];
        const newItems: MediaItem[] = [
          createMediaItem({ title: 'Movie 1' }),
          createMediaItem({ title: 'Movie 2' })
        ];

        const result = addNewMediaItems(existingItems, newItems);
        const ids = result.added.map(item => item.id);

        // Extract counter from IDs
        const counters = ids.map(id => {
          const parts = id.split('-');
          return parseInt(parts[parts.length - 1]);
        });

        expect(counters[0]).toBe(0);
        expect(counters[1]).toBe(1);
      });
    });
  });
});
