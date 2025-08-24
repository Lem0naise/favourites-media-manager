import { MediaItem } from "../core/types";

export interface DuplicateCheckOptions {
    // Check for exact duplicates across all fields (title, type, rating, review, status)
    exact?: boolean;
    //Check for duplicates based on title and type only (legacy
    titleAndType?: boolean;
    // Check for duplicates based on title, type, and status
    // This allows same movie to exist as both "watched" and "watchlist" but not duplicate watchlist entries
    titleTypeStatus?: boolean;
}

/**
 * Creates a unique identifier for a MediaItem based on the duplicate check options
 */
export function createDuplicateKey(item: MediaItem, options: DuplicateCheckOptions): string {
    const normalizedTitle = item.title.toLowerCase().trim();
    
    if (options.exact) {
        // Check all fields for exact duplicates
        return `${normalizedTitle}|${item.type}|${item.rating}|${item.review.toLowerCase().trim()}|${item.status}`;
    } else if (options.titleTypeStatus) {
        // Check title, type, and status
        return `${normalizedTitle}|${item.type}|${item.status}`;
    } else {
        // Default: title and type only (legacy behavior)
        return `${normalizedTitle}|${item.type}`;
    }
}
