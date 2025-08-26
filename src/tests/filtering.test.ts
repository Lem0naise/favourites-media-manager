import { describe, it, expect } from 'vitest';
import { 
  getSortedMedia, 
  getFilteredMedia, 
  getWatchedMedia, 
  getWatching, 
  getWatchlistMedia,
  SortOption,
  FilterOptions 
} from '../utils/filtering';
import type { MediaItem } from '../core/types';

describe('filtering utility functions', () => {
  const testItems: MediaItem[] = [
    {
      id: '1',
      title: 'Inception',
      type: 'film',
      rating: 90,
      review: 'Amazing sci-fi thriller with great visuals',
      status: 'watched',
      dateAdded: new Date('2023-01-01')
    },
    {
      id: '2',
      title: 'The Wire',
      type: 'tv',
      rating: 95,
      review: 'Best TV show ever made',
      status: 'watched',
      dateAdded: new Date('2023-02-15')
    },
    {
      id: '3',
      title: 'Zelda',
      type: 'game',
      rating: 85,
      review: 'Great adventure game',
      status: 'watching',
      dateAdded: new Date('2023-03-01')
    },
    {
      id: '4',
      title: 'Dune',
      type: 'book',
      rating: 80,
      review: 'Epic space opera',
      status: 'watchlist',
      dateAdded: new Date('2023-04-01')
    },
    {
      id: '5',
      title: 'Avatar',
      type: 'film',
      rating: 75,
      review: 'Visually stunning but weak story',
      status: 'watchlist',
      dateAdded: new Date('2023-05-01')
    }
  ];

  describe('getSortedMedia', () => {
    it('should return original array when no sort options provided', () => {
      const result = getSortedMedia(testItems, []);
      expect(result).toEqual(testItems);
      expect(result).not.toBe(testItems); // Should be a copy
    });

    it('should sort by date ascending', () => {
      const sortOptions: SortOption[] = [{ criteria: 'byDate', ascending: true }];
      const result = getSortedMedia(testItems, sortOptions);
      
      expect(result[0].title).toBe('Inception');
      expect(result[1].title).toBe('The Wire');
      expect(result[4].title).toBe('Avatar');
    });

    it('should sort by date descending', () => {
      const sortOptions: SortOption[] = [{ criteria: 'byDate', ascending: false }];
      const result = getSortedMedia(testItems, sortOptions);
      
      expect(result[0].title).toBe('Avatar');
      expect(result[1].title).toBe('Dune');
      expect(result[4].title).toBe('Inception');
    });

    it('should sort by rating ascending', () => {
      const sortOptions: SortOption[] = [{ criteria: 'byRating', ascending: true }];
      const result = getSortedMedia(testItems, sortOptions);
      
      expect(result[0].rating).toBe(75);
      expect(result[1].rating).toBe(80);
      expect(result[4].rating).toBe(95);
    });

    it('should sort by rating descending', () => {
      const sortOptions: SortOption[] = [{ criteria: 'byRating', ascending: false }];
      const result = getSortedMedia(testItems, sortOptions);
      
      expect(result[0].rating).toBe(95);
      expect(result[1].rating).toBe(90);
      expect(result[4].rating).toBe(75);
    });

    it('should sort by title ascending', () => {
      const sortOptions: SortOption[] = [{ criteria: 'byTitle', ascending: true }];
      const result = getSortedMedia(testItems, sortOptions);
      
      expect(result[0].title).toBe('Avatar');
      expect(result[1].title).toBe('Dune');
      expect(result[4].title).toBe('Zelda');
    });

    it('should sort by title descending', () => {
      const sortOptions: SortOption[] = [{ criteria: 'byTitle', ascending: false }];
      const result = getSortedMedia(testItems, sortOptions);
      
      expect(result[0].title).toBe('Zelda');
      expect(result[1].title).toBe('The Wire');
      expect(result[4].title).toBe('Avatar');
    });

    it('should handle multiple sort criteria with priority', () => {
      const itemsWithSameRating: MediaItem[] = [
        { ...testItems[0], rating: 85, title: 'Zulu' },
        { ...testItems[1], rating: 85, title: 'Alpha' },
        { ...testItems[2], rating: 90, title: 'Beta' }
      ];

      const sortOptions: SortOption[] = [
        { criteria: 'byRating', ascending: false },
        { criteria: 'byTitle', ascending: true }
      ];
      
      const result = getSortedMedia(itemsWithSameRating, sortOptions);
      
      expect(result[0].title).toBe('Beta'); // Highest rating
      expect(result[1].title).toBe('Alpha'); // Same rating, alphabetically first
      expect(result[2].title).toBe('Zulu'); // Same rating, alphabetically last
    });

    it('should handle empty array', () => {
      const sortOptions: SortOption[] = [{ criteria: 'byTitle', ascending: true }];
      const result = getSortedMedia([], sortOptions);
      
      expect(result).toEqual([]);
    });

    it('should handle items with same values in all sort criteria', () => {
      const identicalItems: MediaItem[] = [
        { ...testItems[0], id: 'a' },
        { ...testItems[0], id: 'b' },
        { ...testItems[0], id: 'c' }
      ];

      const sortOptions: SortOption[] = [
        { criteria: 'byTitle', ascending: true },
        { criteria: 'byRating', ascending: true },
        { criteria: 'byDate', ascending: true }
      ];
      
      const result = getSortedMedia(identicalItems, sortOptions);
      expect(result).toHaveLength(3);
    });
  });

  describe('getFilteredMedia', () => {
    it('should return all items when no filters applied', () => {
      const result = getFilteredMedia(testItems, {});
      expect(result).toEqual(testItems);
    });

    it('should filter by search term in title', () => {
      const filterOptions: FilterOptions = { searchTerm: 'inception' };
      const result = getFilteredMedia(testItems, filterOptions);
      
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Inception');
    });

    it('should filter by search term in review', () => {
      const filterOptions: FilterOptions = { searchTerm: 'visually stunning' };
      const result = getFilteredMedia(testItems, filterOptions);
      
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Avatar');
    });

    it('should handle case-insensitive search', () => {
      const filterOptions: FilterOptions = { searchTerm: 'AMAZING' };
      const result = getFilteredMedia(testItems, filterOptions);
      
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Inception');
    });

    it('should handle search with whitespace', () => {
      const filterOptions: FilterOptions = { searchTerm: '  wire  ' };
      const result = getFilteredMedia(testItems, filterOptions);
      
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('The Wire');
    });

    it('should filter by media type', () => {
      const filterOptions: FilterOptions = { type: 'film' };
      const result = getFilteredMedia(testItems, filterOptions);
      
      expect(result).toHaveLength(2);
      expect(result.map(item => item.title)).toEqual(['Inception', 'Avatar']);
    });

    it('should filter by status', () => {
      const filterOptions: FilterOptions = { status: 'watched' };
      const result = getFilteredMedia(testItems, filterOptions);
      
      expect(result).toHaveLength(2);
      expect(result.map(item => item.title)).toEqual(['Inception', 'The Wire']);
    });

    it('should filter by date before', () => {
      const filterOptions: FilterOptions = { before: new Date('2023-03-01') };
      const result = getFilteredMedia(testItems, filterOptions);
      
      expect(result).toHaveLength(2);
      expect(result.map(item => item.title)).toEqual(['Inception', 'The Wire']);
    });

    it('should filter by date after', () => {
      const filterOptions: FilterOptions = { after: new Date('2023-03-01') };
      const result = getFilteredMedia(testItems, filterOptions);
      
      expect(result).toHaveLength(2);
      expect(result.map(item => item.title)).toEqual(['Dune', 'Avatar']);
    });

    it('should filter by rating greater than', () => {
      const filterOptions: FilterOptions = { moreThanRating: 85 };
      const result = getFilteredMedia(testItems, filterOptions);
      
      expect(result).toHaveLength(2);
      expect(result.map(item => item.title)).toEqual(['Inception', 'The Wire']);
    });

    it('should filter by rating less than', () => {
      const filterOptions: FilterOptions = { lessThanRating: 85 };
      const result = getFilteredMedia(testItems, filterOptions);
      
      expect(result).toHaveLength(2);
      expect(result.map(item => item.title)).toEqual(['Dune', 'Avatar']);
    });

    it('should combine multiple filters', () => {
      const filterOptions: FilterOptions = { 
        type: 'film',
        status: 'watchlist',
        moreThanRating: 70 
      };
      const result = getFilteredMedia(testItems, filterOptions);
      
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Avatar');
    });

    it('should handle empty search term', () => {
      const filterOptions: FilterOptions = { searchTerm: '' };
      const result = getFilteredMedia(testItems, filterOptions);
      expect(result).toEqual(testItems);
    });

    it('should handle whitespace-only search term', () => {
      const filterOptions: FilterOptions = { searchTerm: '   ' };
      const result = getFilteredMedia(testItems, filterOptions);
      expect(result).toEqual(testItems);
    });

    it('should return empty array when no items match', () => {
      const filterOptions: FilterOptions = { searchTerm: 'nonexistent' };
      const result = getFilteredMedia(testItems, filterOptions);
      expect(result).toEqual([]);
    });

    it('should handle boundary rating values', () => {
      const zeroRatingItem: MediaItem = { ...testItems[0], rating: 0 };
      const hundredRatingItem: MediaItem = { ...testItems[1], rating: 100 };
      const extendedItems = [...testItems, zeroRatingItem, hundredRatingItem];

      const moreThanZero = getFilteredMedia(extendedItems, { moreThanRating: 1 });
      const lessThanHundred = getFilteredMedia(extendedItems, { lessThanRating: 100 });
      
      expect(moreThanZero).toHaveLength(6); // All except the 0 rating

      expect(lessThanHundred).toHaveLength(6); // All except the 100 rating
    });
  });

  describe('getWatchedMedia', () => {
    it('should return only watched items', () => {
      const result = getWatchedMedia(testItems);
      
      expect(result).toHaveLength(2);
      expect(result.map(item => item.title)).toEqual(['Inception', 'The Wire']);
      expect(result.every(item => item.status === 'watched')).toBe(true);
    });

    it('should return empty array when no watched items', () => {
      const unwatchedItems = testItems.map(item => ({ ...item, status: 'watchlist' as const }));
      const result = getWatchedMedia(unwatchedItems);
      
      expect(result).toEqual([]);
    });
  });

  describe('getWatching', () => {
    it('should return only watching items', () => {
      const result = getWatching(testItems);
      
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Zelda');
      expect(result[0].status).toBe('watching');
    });

    it('should return empty array when no watching items', () => {
      const noWatchingItems = testItems.map(item => ({ 
        ...item, 
        status: item.status === 'watching' ? 'watched' as const : item.status 
      }));
      const result = getWatching(noWatchingItems);
      
      expect(result).toEqual([]);
    });
  });

  describe('getWatchlistMedia', () => {
    it('should return only watchlist items', () => {
      const result = getWatchlistMedia(testItems);
      
      expect(result).toHaveLength(2);
      expect(result.map(item => item.title)).toEqual(['Dune', 'Avatar']);
      expect(result.every(item => item.status === 'watchlist')).toBe(true);
    });

    it('should return empty array when no watchlist items', () => {
      const noWatchlistItems = testItems.map(item => ({ 
        ...item, 
        status: item.status === 'watchlist' ? 'watched' as const : item.status 
      }));
      const result = getWatchlistMedia(noWatchlistItems);
      
      expect(result).toEqual([]);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle empty array for all functions', () => {
      expect(getSortedMedia([], [{ criteria: 'byTitle', ascending: true }])).toEqual([]);
      expect(getFilteredMedia([], { searchTerm: 'test' })).toEqual([]);
      expect(getWatchedMedia([])).toEqual([]);
      expect(getWatching([])).toEqual([]);
      expect(getWatchlistMedia([])).toEqual([]);
    });

    it('should handle items with extreme dates', () => {
      const extremeItems: MediaItem[] = [
        { ...testItems[0], dateAdded: new Date('1900-01-01') },
        { ...testItems[1], dateAdded: new Date('2099-12-31') }
      ];

      const sortOptions: SortOption[] = [{ criteria: 'byDate', ascending: true }];
      const result = getSortedMedia(extremeItems, sortOptions);
      
      expect(result[0].dateAdded.getFullYear()).toBe(1900);
      expect(result[1].dateAdded.getFullYear()).toBe(2099);
    });

    it('should handle items with special characters in search', () => {
      const specialItem: MediaItem = {
        ...testItems[0],
        title: 'Movie: "The Best" (2023)',
        review: 'Contains @#$% special characters!'
      };

      const result = getFilteredMedia([specialItem], { searchTerm: '"The Best"' });
      expect(result).toHaveLength(1);

      const result2 = getFilteredMedia([specialItem], { searchTerm: '@#$%' });
      expect(result2).toHaveLength(1);
    });
  });
});
