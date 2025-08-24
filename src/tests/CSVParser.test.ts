import { describe, it, expect } from 'vitest';
import { parseCSV, createCSV } from '../io/CSVParser';
import type { MediaItem } from '../core/types';

describe('CSVParser exported functions', () => {
  const csvWithHeaders = `
Title,Type,Rating,Review,Status,Date Added
"Inception",film,9,"Amazing sci-fi thriller","watched","2023-01-01"
"The Wire",tv,10,"Best TV show ever","watched","2023-02-15"
`;

  const csvWithoutHeaders = `
"Inception",film,9,"Amazing sci-fi thriller","watched","2023-01-01"
"The Wire",tv,10,"Best TV show ever","watched","2023-02-15"
`;

  it('parseCSV should parse CSV with headers into MediaItems', () => {
    const items = parseCSV(csvWithHeaders, { hasHeaders: true });
    expect(items.length).toBe(2);
    expect(items[0].title).toBe('Inception');
    expect(items[1].type).toBe('tv');
    expect(items[0].rating).toBeGreaterThan(0);
    expect(items[1].review).toContain('Best TV show');
  });

  it('parseCSV should parse CSV without headers using defaultType', () => {
    const items = parseCSV(csvWithoutHeaders, { hasHeaders: false, defaultType: 'film' });
    expect(items.length).toBe(2);
    expect(items[0].title).toBe('Inception');
    expect(items[0].type).toBe('film');
  });

  const csvNonsense = `
ThisisAfilm.    99
Another Film Of Note    82 
`;

  it('parseCSV should do something with Nonsense', () => {
    const items = parseCSV(csvNonsense);
    expect(items.length).toBe(2);
    expect(items[0].title).toBe('ThisisAfilm.');
    expect(items[1].type).toBe('film');
    expect(items[0].rating).toBe(99);
    expect(items[1].review).toContain('');
  });


  it('createCSV should export MediaItems to CSV string', () => {
    const items: MediaItem[] = [
      {
        id: '1',
        title: 'Test Movie',
        type: 'film',
        rating: 8,
        review: 'Nice "quotes" inside',
        status: 'watched',
        dateAdded: new Date('2023-11-01')
      }
    ];
    const csv = createCSV(items);
    expect(csv).toContain('"Test Movie"');
    expect(csv).toContain('"Nice ""quotes"" inside"');
    expect(csv).toContain('2023-11-01');
    const lines = csv.split('\n');
    expect(lines[0]).toBe('Title,Type,Rating,Review,Status,Date Added');
    expect(lines[1].split(',').length).toBe(6);
  });

  it('createCSV should throw when given empty array', () => {
    expect(() => createCSV([])).toThrow();
  });

  it('parseCSV should handle tab-separated values without headers', () => {
    const tabSeparated = `
Inception\tfilm\t9\t"Amazing sci-fi thriller"\twatched\t2023-01-01
The Wire\ttv\t10\t"Best TV show ever"\twatched\t2023-02-15
James\t\t8\t"Best TV show ever"\twatched\t2023-02-15
`;
    const items = parseCSV(tabSeparated, { defaultType: 'book' });
    expect(items.length).toBe(3);
    expect(items[0].title).toBe('Inception');
    expect(items[2].type).toBe('book');
    expect(items[0].review).toContain('Amazing');
  });
  it('parseCSV should handle CSV with jumbled header columns', () => {
    const jumbledHeaders = `
Rating,Review,Title,Status,Type,Date Added
9,"Amazing sci-fi thriller","Inception","watched",film,2023-01-01
10,"Best TV show ever","The Wire","watched",tv,2023-02-15
`;
    const items = parseCSV(jumbledHeaders, { hasHeaders: true });
    expect(items.length).toBe(2);
    expect(items[0].title).toBe('Inception');
    expect(items[0].type).toBe('film');
    expect(items[0].rating).toBeGreaterThan(0);
    expect(items[0].review).toContain('Amazing');
    expect(items[1].title).toBe('The Wire');
    expect(items[1].type).toBe('tv');
    expect(items[1].rating).toBeGreaterThan(0);
    expect(items[1].review).toContain('Best TV show');
  });

  it('parseCSV should handle tab-separated values with headers', () => {
    const tabWithHeaders = `
Title\tType\tRating\tReview\tStatus\tDate Added
Inception\tfilm\t9\t"Amazing sci-fi thriller"\twatched\t2023-01-01
The Wire\ttv\t10\t"Best TV show ever"\twatched\t2023-02-15
`;
  const items = parseCSV(tabWithHeaders, { hasHeaders: true, delimiter: '\t' });
    expect(items.length).toBe(2);
    expect(items[1].title).toBe('The Wire');
    expect(items[1].type).toBe('tv');
    expect(items[1].review).toContain('Best TV show');
  });

  it('parseCSV and createCSV should round-trip and standardise output', () => {
    const csv = `
Title,Type,Rating,Review,Status,Date Added
"Arrival",film,8,"Great sci-fi","watched","2023-03-01"
"Breaking Bad",tv,10,"Masterpiece","watched","2023-04-10"
`;
    const items = parseCSV(csv, { hasHeaders: true });
    const outCSV = createCSV(items);
    const lines = outCSV.split('\n');
    expect(lines[0]).toBe('Title,Type,Rating,Review,Status,Date Added');
    expect(lines.length).toBe(3);
    expect(outCSV).toContain('"Arrival"');
    expect(outCSV).toContain('"Breaking Bad"');
    // Parse again to check round-trip
    const items2 = parseCSV(outCSV, { hasHeaders: true });
    expect(items2.length).toBe(2);
    expect(items2[0].title).toBe('Arrival');
    expect(items2[1].type).toBe('tv');
  });

  it('createCSV should always output standard headers', () => {
    const items: MediaItem[] = [
      {
        id: 'x',
        title: 'A',
        type: 'film',
        rating: 5,
        review: '',
        status: 'watched',
        dateAdded: new Date('2022-01-01')
      }
    ];
    const csv = createCSV(items);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('Title,Type,Rating,Review,Status,Date Added');
    expect(lines[1].split(',').length).toBe(6);
  });

  
});