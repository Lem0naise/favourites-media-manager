import { MediaItem, Status, MediaType} from '../core/types';
import { mapStringToStatus, mapStringToType, findColumnVariations } from '../utils/mapping';
import { detectRatingScaleAndConvert } from '../utils/ratingscaler';

export interface CSVParseOptions {
    hasHeaders?: boolean;
    delimiter?: string;
    defaultType?: MediaType;
}

// Two exported functions: parseCSV and createCSV
export const parseCSV = (
    csvText: string,
    options?: CSVParseOptions,
) : MediaItem[] => {
    if (!options) {options =  {}}

    const firstLine = csvText.trim().split('\n')[0] || '';
    if (!options.delimiter) options.delimiter = detectDelimiter(csvText);
    if (typeof options.hasHeaders === 'undefined') { // detect if headers are present
        const firstRow = parseCSVLine(firstLine, options.delimiter);
        const allNonNumeric = firstRow.every(f => isNaN(Number(f)) || f.trim() === '');
        options.hasHeaders = allNonNumeric;
    }
    if (!options.defaultType) options.defaultType = 'film';

    const rows = parseCSVTextToRows(csvText, options);
    return mapRowsToMediaItems(rows, options.defaultType);
}


export const createCSV = (items: MediaItem[]) : string => {
    if (!items || items.length === 0) {
        throw new Error('No media items to export');
    }
    const headers = ['Title', 'Type', 'Rating', 'Review', 'Status', 'Date Added'];
    const csvContent = [
        headers.join(','),
        ...items.map(item => [
            `"${item.title}"`,
            `"${item.type}"`,
            `"${item.rating.toString()}"`,
            `"${item.review.replace(/"/g, '""')}"`,
            `"${item.status}"`,
            `"${item.dateAdded.toISOString().split('T')[0]}"`
        ].join(','))
    ].join('\n');
    return csvContent;
}


// INTERNAL HELPER FUNCTIONS

// Helper function to detect the most likely delimiter
const detectDelimiter = (csvText: string): string => {
    const lines = csvText.trim().split('\n');
    if (lines.length === 0) return ',';
    const sampleLine = lines[0];
    const delimiters = ['\t', ',', ';', '|'];
    const counts: { [key: string]: number } = {};
    
    for (const delimiter of delimiters) {
        counts[delimiter] = sampleLine.split(delimiter).length - 1;
    }
    // Return the delimiter with the highest count (most splits)
    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
};

const parseCSVTextToRows = (csvText: string, options : CSVParseOptions) : Array<Record<string, string>> => {
    const lines = csvText.trim().split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];
    const delimiter = options.delimiter || ",";

    // If not a CSV
    const firstLine = lines[0];
    const hasCommas = firstLine.includes(',');
    const hasTabs = firstLine.includes('\t');
    if (!hasCommas && !hasTabs) {
        return parseLooseFormat(csvText);
    }

    if (!options.hasHeaders) { // if no headers, guess columns
        const firstRow = parseCSVLine(lines[0], delimiter);
        const headers = firstRow.map((_, index) => `column_${index}`);
        const rawRows = lines.map(row => {
            const values = parseCSVLine(row, delimiter);
            const obj: any = {};
            headers.forEach((header, index) => {
                obj[header] = values[index] || '';
            });
            return obj;
        });
        const roles = guessColumnRoles(rawRows);
        return rawRows.map(row => {
            const mapped: Record<string, string> = {};
            Object.entries(roles).forEach(([role, col]) => {
                mapped[role] = row[col as string] || '';
            });
            return mapped;
        });
    }

    const headers = parseCSVLine(lines[0], delimiter).map(h => h.toLowerCase().replace(/"/g, ''));
    const rows = lines.slice(1);

    return rows.map(row => {
        const values = parseCSVLine(row, delimiter);
        const obj: any = {};
        headers.forEach((header, index) => {
            obj[header] = values[index] || '';
        });
        return obj;
    });
};

const parseLooseFormat = (csvText: string) : Array<Record<string, string>> => {

    // Use the logic from parseCustomFormat, but return array of row objects
    const lines = csvText.trim().split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];

    return lines.map(line => {
        // Handle quoted sections (reviews)
        const quotedMatches = line.match(/"([^"]*)"/g);
        let review = '';
        let cleanLine = line;

        if (quotedMatches && quotedMatches.length > 0) {
            review = quotedMatches[quotedMatches.length - 1].replace(/"/g, '');
            cleanLine = line.replace(/"[^"]*"/g, '').trim();
        }

        // Split by tabs first, then by multiple spaces if no tabs
        let parts: string[];
        if (cleanLine.includes('\t')) {
            parts = cleanLine.split('\t').map(p => p.trim()).filter(p => p);
        } else {
            // Split by multiple spaces/whitespace
            parts = cleanLine.split(/\s{2,}/).map(p => p.trim()).filter(p => p);
        }

        // If we still have single spaces, try a different approach
        if (parts.length === 1 && parts[0].includes(' ')) {
            // Look for a pattern: title followed by number
            const match = parts[0].match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*(.*)$/);
            if (match) {
                const [, title, rating, rest] = match;
                parts = [title.trim(), rating.trim()];
                if (rest.trim()) parts.push(rest.trim());
            }
        }

        const title = parts[0] || '';
        const rating = parts[1] || '0';

        return {
            title: title,
            rating: rating,
            review: review,
            type: mapStringToType(undefined, 'film'),
            status: 'watched'
        };
    }).filter(item => item.title);
};


const parseCSVLine = (line: string, delimiter: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;
    
    while (i < line.length) {
        const char = line[i];
        
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i += 2;
            } else {
                inQuotes = !inQuotes;
                i++;
            }
        } else if (char === delimiter && !inQuotes) {
            result.push(current.trim());
            current = '';
            i++;
        } else {
            current += char;
            i++;
        }
    }
    // Add the last field
    result.push(current.trim());
    return result;
};


export const mapRowsToMediaItems = (csvRows: Array<Record<string, string>>, defaultType?: 'film' | 'tv' | 'game' | 'book' | 'boardgame'): MediaItem[] => {
    if (csvRows.length === 0) return [];
    
    const headers = Object.keys(csvRows[0]);
    const titleColumn = findColumnVariations(headers, ['title', 'name', 'movie', 'film', 'book', 'game', 'show']);
    const ratingColumn = findColumnVariations(headers, ['rating', 'score', 'stars', 'points']);
    const reviewColumn = findColumnVariations(headers, ['review', 'note', 'description', 'comment', 'thoughts']);
    const typeColumn = findColumnVariations(headers, ['type', 'category', 'kind', 'media']);
    const statusColumn = findColumnVariations(headers, ['status', 'state', 'watched', 'completed']);

    if (!titleColumn) {
        const lines = csvRows.map(row => Object.values(row).join('\t')).join('\n');
        const looseRows = parseLooseFormat(lines);
        return mapRowsToMediaItems(looseRows, defaultType);
    }

    const allRatings: number[] = [];
    csvRows.forEach(row => {
        const ratingValue = ratingColumn ? parseFloat(row[ratingColumn]) : NaN
        if (!isNaN(ratingValue)){
            allRatings.push(ratingValue);
        }
    });
    const convertedRatings = detectRatingScaleAndConvert(allRatings);
    let ratingIndex = 0;
    const timestamp = Date.now(); // Single timestamp for this batch

    return csvRows.map((row, index) => {
        const title = row[titleColumn];
        if (!title) return null;
        let rating = 0;
        let hasRating = false;
        if (ratingColumn && row[ratingColumn]) {
            const ratingValue = parseFloat(row[ratingColumn]);
            if (!isNaN(ratingValue) && ratingValue > 0) {
                rating = convertedRatings[ratingIndex] || 0;
                ratingIndex++;
                hasRating = true;
            }
        }
        // Use the detected columns for review, type, and status
        const review = reviewColumn && row[reviewColumn] ? row[reviewColumn] : (row.review || '');
        const typeValue = typeColumn && row[typeColumn] ? row[typeColumn] : row.type;
        const statusValue = statusColumn && row[statusColumn] ? row[statusColumn] : row.status;
        let status: Status = mapStringToStatus(statusValue);
        return {
            id: `import-${timestamp}-${Math.random().toString(36).substr(2, 9)}-${index}`,
            title: title.trim(),
            type: mapStringToType(typeValue, defaultType),
            rating,
            review: (review || '').trim(),
            status,
            dateAdded: new Date()
        };
    }).filter(Boolean) as MediaItem[];
};

const guessColumnRoles = (rows: Array<Record<string, string>>): Partial<Record<'title' | 'rating' | 'review' | 'type' | 'status', string>> => {
    if (!rows.length) return {};

    const mediaTypes = ['film', 'movie', 'show', 'game', 'book', 'boardgame'];
    const statuses = ['watched', 'completed', 'reading', 'playing', 'finished', 'done', 'in progress'];

    const columns = Object.keys(rows[0]);
    const stats = columns.map(col => {
        const values = rows.map(r => r[col]);
        const numericCount = values.filter(v => !isNaN(parseFloat(v)) && v.trim() !== '').length;
        const avgLength = values.reduce((a, b) => a + (b ? b.length : 0), 0) / values.length;
        const uniqueCount = new Set(values.map(v => v.trim().toLowerCase())).size;
        const mediaTypeMatches = values.filter(v => mediaTypes.includes(v.trim().toLowerCase())).length;
        const statusMatches = values.filter(v => statuses.includes(v.trim().toLowerCase())).length;
        return {
            col,
            numericCount,
            avgLength,
            uniqueCount,
            mediaTypeMatches,
            statusMatches
        };
    });

    // Rating: most numeric
    const ratingCol = stats.reduce((a, b) => (b.numericCount > a.numericCount ? b : a), stats[0]).col;
    // Review: longest avg length
    const reviewCol = stats.reduce((a, b) => (b.avgLength > a.avgLength ? b : a), stats[0]).col;
    // Type: most media type matches
    const typeCol = stats.reduce((a, b) => (b.mediaTypeMatches > a.mediaTypeMatches ? b : a), stats[0]).mediaTypeMatches > 0
        ? stats.reduce((a, b) => (b.mediaTypeMatches > a.mediaTypeMatches ? b : a), stats[0]).col
        : undefined;
    // Status: most status matches
    const statusCol = stats.reduce((a, b) => (b.statusMatches > a.statusMatches ? b : a), stats[0]).statusMatches > 0
        ? stats.reduce((a, b) => (b.statusMatches > a.statusMatches ? b : a), stats[0]).col
        : undefined;
    // Title: most unique values, not rating/review/type/status
    const usedCols = new Set([ratingCol, reviewCol, typeCol, statusCol].filter(Boolean));
    const titleCol = stats
        .filter(s => !usedCols.has(s.col))
        .reduce((a, b) => (b.uniqueCount > a.uniqueCount ? b : a), stats[0]).col;
    const result: Partial<Record<'title' | 'rating' | 'review' | 'type' | 'status', string>> = {};
    if (titleCol) result.title = titleCol;
    if (ratingCol) result.rating = ratingCol;
    if (reviewCol) result.review = reviewCol;
    if (typeCol) result.type = typeCol;
    if (statusCol) result.status = statusCol;
    return result;
}