import { describe, it, expect } from 'vitest';
import { mapStringToStatus, mapStringToType, findColumnVariations } from '../utils/mapping';

describe('mapping utility functions', () => {
  describe('mapStringToStatus', () => {
    it('should map watchlist keywords correctly', () => {
      const watchlistTerms = [
        'watchlist', 'want', 'to watch', 'plan', 'wishlist', 'queue', 'pending', 'backlog',
        'to-watch', 'to read', 'to-play', 'to do', 'to see', 'to finish', 'to complete',
        'plan to watch', 'plan read', 'plan play', 'unwatched', 'unread', 'unplayed',
        'not started', 'future', 'someday', 'later', 'eventually'
      ];

      watchlistTerms.forEach(term => {
        expect(mapStringToStatus(term)).toBe('watchlist');
        expect(mapStringToStatus(term.toUpperCase())).toBe('watchlist');
      });
    });

    it('should map watching keywords correctly', () => {
      const watchingTerms = [
        'watching', 'reading', 'playing', 'current', 'in progress', 'ongoing',
        'started', 'continuing', 'doing', 'active', 'working on', 'reading now',
        'playing now', 'watching now', 'in-progress', 'currently', 'now'
      ];

      watchingTerms.forEach(term => {
        expect(mapStringToStatus(term)).toBe('watching');
        expect(mapStringToStatus(term.toUpperCase())).toBe('watching');
      });
    });

    it('should map watched keywords correctly', () => {
      const watchedTerms = [
        'watched', 'completed', 'finished', 'done', 'seen', 'read', 'played', 'over',
        'ended', 'complete', 'accomplished', 'concluded', 'cleared', 'beaten', 'past'
      ];

      watchedTerms.forEach(term => {
        expect(mapStringToStatus(term)).toBe('watched');
        expect(mapStringToStatus(term.toUpperCase())).toBe('watched');
      });
    });

    it('should default to watchlist when no status and no rating', () => {
      expect(mapStringToStatus()).toBe('watchlist');
      expect(mapStringToStatus(undefined)).toBe('watchlist');
      expect(mapStringToStatus('', false)).toBe('watchlist');
    });

    it('should default to watched when no status but has rating', () => {
      expect(mapStringToStatus(undefined, true)).toBe('watched');
      expect(mapStringToStatus('', true)).toBe('watched');
    });

    it('should handle unrecognized status without rating', () => {
      expect(mapStringToStatus('unknown status')).toBe('watchlist');
      expect(mapStringToStatus('random text')).toBe('watchlist');
    });

    it('should handle unrecognized status with rating', () => {
      expect(mapStringToStatus('unknown status', true)).toBe('watched');
      expect(mapStringToStatus('random text', true)).toBe('watched');
    });

    it('should handle whitespace and mixed case', () => {
      expect(mapStringToStatus('  WATCHED  ')).toBe('watched');
      expect(mapStringToStatus(' WaTcHiNg ')).toBe('watching');
      expect(mapStringToStatus('WatchList')).toBe('watchlist');
    });

    it('should handle partial keyword matches', () => {
      expect(mapStringToStatus('currently watching')).toBe('watching');
      expect(mapStringToStatus('plan to watch later')).toBe('watchlist');
      expect(mapStringToStatus('just finished reading')).toBe('watched');
    });

    it('should prioritize keywords correctly when multiple present', () => {
      // Watchlist keywords should take precedence
      expect(mapStringToStatus('want to watch')).toBe('watchlist');
      // Watching keywords should take precedence over watched
      expect(mapStringToStatus('started watching')).toBe('watching');
      // First matching keyword should win
      expect(mapStringToStatus('finished')).toBe('watched'); // 'finished' comes before 'plan'
    });

    it('should handle edge cases with empty or special strings', () => {
      expect(mapStringToStatus('')).toBe('watchlist');
      expect(mapStringToStatus('   ')).toBe('watchlist');
      expect(mapStringToStatus('\n\t')).toBe('watchlist');
      expect(mapStringToStatus('!@#$%')).toBe('watchlist');
    });
  });

  describe('mapStringToType', () => {
    it('should map TV keywords correctly', () => {
      const tvTerms = [
        'tv', 'show', 'series', 'television', 'tv show', 'tv series',
      ];
      const newTVTerms = ['serie',
        'episode','mini-series', 'miniseries', 'webseries', 'web series',
        'season',]

      tvTerms.forEach(term => {
        expect(mapStringToType(term)).toBe('tv');
        expect(mapStringToType(term.toUpperCase())).toBe('tv');
      });

       newTVTerms.forEach(term => {
        expect(mapStringToType(term)).toBe('tv');
        expect(mapStringToType(term.toUpperCase())).toBe('tv');
      });
    });

    it('should map boardgame keywords correctly', () => {
      const boardgameTerms = [
        'board game', 'boardgame', 'tabletop', 'card game', 'board', 'table game',
        'tabletop game', 'tabletop rpg', 'rpg', 'tabletop roleplaying'
      ];

      boardgameTerms.forEach(term => {
        expect(mapStringToType(term)).toBe('boardgame');
        expect(mapStringToType(term.toUpperCase())).toBe('boardgame');
      });
    });

    it('should map game keywords correctly', () => {
      const gameTerms = [
        'game', 'video', 'video game', 'videogame', 'gaming', 'pc', 'console',
        'mobile game', 'arcade', 'computer game', 'switch', 'playstation', 'xbox',
        'steam', 'ps4', 'ps5', 'nintendo', 'browser game', 'online game'
      ];

      gameTerms.forEach(term => {
        expect(mapStringToType(term)).toBe('game');
        expect(mapStringToType(term.toUpperCase())).toBe('game');
      });
    });

    it('should map book keywords correctly', () => {
      const bookTerms = [
        'book', 'novel', 'literature', 'audiobook', 'ebook', 'non-fiction',
        'nonfiction', 'fiction', 'reading', 'manga', 'comic', 'graphic novel',
        'light novel', 'magazine', 'manual', 'textbook', 'guide', 'journal'
      ];

      bookTerms.forEach(term => {
        expect(mapStringToType(term)).toBe('book');
        expect(mapStringToType(term.toUpperCase())).toBe('book');
      });
    });

    it('should map film keywords correctly', () => {
      const filmTerms = [
        'film', 'movie', 'cinema', 'documentary', 'short', 'feature',
        'motion picture', 'picture', 'doc', 'docu', 'featurette', 'screening',
        'flick', 'biopic', 'animation film', 'animated film'
      ];

      filmTerms.forEach(term => {
        expect(mapStringToType(term)).toBe('film');
        expect(mapStringToType(term.toUpperCase())).toBe('film');
      });
    });

    it('should use default type when provided and no string given', () => {
      expect(mapStringToType(undefined, 'tv')).toBe('tv');
      expect(mapStringToType('', 'book')).toBe('book');
      expect(mapStringToType(undefined, 'game')).toBe('game');
    });

    it('should default to film when no string or default provided', () => {
      expect(mapStringToType(undefined)).toBe('film');
      expect(mapStringToType('')).toBe('film');
    });

    it('should handle unrecognized type strings', () => {
      expect(mapStringToType('unknown type')).toBe('film');
      expect(mapStringToType('random text')).toBe('film');
      expect(mapStringToType('unknown type', 'tv')).toBe('tv');
    });

    it('should handle whitespace and case variations', () => {
      expect(mapStringToType('  VIDEO GAME  ')).toBe('game');
      expect(mapStringToType(' TeLEvIsIoN ')).toBe('tv');
      expect(mapStringToType('BOARD GAME')).toBe('boardgame');
    });

    it('should prioritize more specific matches', () => {
      // 'board game' should match boardgame, not game
      expect(mapStringToType('board game')).toBe('boardgame');
      // 'video game' should match game
      expect(mapStringToType('video game')).toBe('game');
      // 'tv show' should match tv
      expect(mapStringToType('tv show')).toBe('tv');
    });

    it('should handle partial matches correctly', () => {
      expect(mapStringToType('action movie')).toBe('film');
      expect(mapStringToType('fantasy book')).toBe('book');
      expect(mapStringToType('indie game')).toBe('game');
      expect(mapStringToType('reality tv')).toBe('tv');
    });

    it('should handle edge cases', () => {
      expect(mapStringToType('   ')).toBe('film');
      expect(mapStringToType('\n\t')).toBe('film');
      expect(mapStringToType('!@#$%')).toBe('film');
      expect(mapStringToType('123456')).toBe('film');
    });
  });

  describe('findColumnVariations', () => {
    it('should find exact matches case-insensitively', () => {
      const headers = ['Title', 'Type', 'Rating', 'Review'];
      const candidates = ['title', 'type', 'rating', 'review'];

      candidates.forEach((candidate, index) => {
        const result = findColumnVariations(headers, [candidate]);
        expect(result).toBe(headers[index]);
      });
    });

    it('should find first matching candidate', () => {
      const headers = ['Name', 'Category', 'Score'];
      const candidates = ['title', 'name', 'heading'];

      const result = findColumnVariations(headers, candidates);
      expect(result).toBe('Name');
    });

    it('should return null when no matches found', () => {
      const headers = ['Title', 'Type', 'Rating'];
      const candidates = ['author', 'director', 'genre'];

      const result = findColumnVariations(headers, candidates);
      expect(result).toBeNull();
    });

    it('should handle empty headers array', () => {
      const headers: string[] = [];
      const candidates = ['title', 'type'];

      const result = findColumnVariations(headers, candidates);
      expect(result).toBeNull();
    });

    it('should handle empty candidates array', () => {
      const headers = ['Title', 'Type', 'Rating'];
      const candidates: string[] = [];

      const result = findColumnVariations(headers, candidates);
      expect(result).toBeNull();
    });

    it('should handle case variations in headers', () => {
      const headers = ['TITLE', 'type', 'RaTiNg', 'Review'];
      const candidates = ['title', 'TYPE', 'rating', 'REVIEW'];

      candidates.forEach((candidate, index) => {
        const result = findColumnVariations(headers, [candidate]);
        expect(result).toBe(headers[index]);
      });
    });

    it('should preserve original header casing in result', () => {
      const headers = ['MySpecialTitle', 'WeirdCasing'];
      const candidates = ['myspecialtitle', 'weirdcasing'];

      const result1 = findColumnVariations(headers, [candidates[0]]);
      const result2 = findColumnVariations(headers, [candidates[1]]);

      expect(result1).toBe('MySpecialTitle');
      expect(result2).toBe('WeirdCasing');
    });

    it('should handle headers with special characters', () => {
      const headers = ['Title (Name)', 'Type/Category', 'Rating-Score'];
      const candidates = ['title (name)', 'type/category', 'rating-score'];

      candidates.forEach((candidate, index) => {
        const result = findColumnVariations(headers, [candidate]);
        expect(result).toBe(headers[index]);
      });
    });

    it('should handle whitespace in headers and candidates', () => {
      const headers = [' Title ', 'Type', '  Rating  '];
      const candidates = ['title', ' type ', 'rating'];

      // Note: This tests current behavior - whitespace is preserved in comparison
      const result1 = findColumnVariations(headers, ['title']);
      const result2 = findColumnVariations(headers, [' type ']);
      const result3 = findColumnVariations(headers, ['rating']);

      expect(result1).toBeNull(); // ' Title ' doesn't match 'title'
      expect(result2).toBeNull(); // 'Type' doesn't match ' type '
      expect(result3).toBeNull(); // '  Rating  ' doesn't match 'rating'
    });

    it('should find first match when multiple candidates match', () => {
      const headers = ['Title', 'Name', 'Heading'];
      const candidates = ['name', 'title', 'heading'];

      const result = findColumnVariations(headers, candidates);
      expect(result).toBe('Name'); // First match in headers order
    });

    it('should handle duplicate headers', () => {
      const headers = ['Title', 'Title', 'Type'];
      const candidates = ['title'];

      const result = findColumnVariations(headers, candidates);
      expect(result).toBe('Title'); // Should return first occurrence
    });

    it('should handle duplicate candidates', () => {
      const headers = ['Title', 'Type', 'Rating'];
      const candidates = ['title', 'title', 'type'];

      const result = findColumnVariations(headers, candidates);
      expect(result).toBe('Title'); // Should return match for first candidate
    });
  });

  describe('edge cases and integration', () => {
    it('should handle extremely long strings', () => {
      const longString = 'a'.repeat(1000) + 'movie' + 'b'.repeat(1000);
      expect(mapStringToType(longString)).toBe('film');

    });

    it('should handle unicode and special characters', () => {
      expect(mapStringToType('película')).toBe('film'); // Spanish for movie
      expect(mapStringToStatus('終了')).toBe('watchlist'); // Japanese, no match
      expect(mapStringToType('🎮 game')).toBe('game');
      expect(mapStringToStatus('✅ watched')).toBe('watched');
    });

    it('should handle null and undefined edge cases consistently', () => {
      expect(mapStringToStatus(null as any)).toBe('watchlist');
      expect(mapStringToType(null as any)).toBe('film');
      expect(mapStringToType(null as any, 'tv')).toBe('tv');
    });
  });
});
