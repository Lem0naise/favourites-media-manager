const handleProcessCSVData = (csvText: string) => {
        try {
            // Determine default type and active filter
            const defaultType = activeFilter === 'all' ? 'film' : activeFilter as 'film' | 'tv' | 'game' | 'book' | 'boardgame';
            
            // Process CSV with three-phase approach
            const result = processCSVData(csvText, mediaItems, {
                defaultType,
                activeFilter
            }, {}, true); // Empty duplicate options, shouldUpdate = true
            
            if (!result.success) {
                const errorMessage = result.errors?.join(', ') || 'Unknown error occurred';
                showAlert('Import Error', `Error importing CSV: ${errorMessage}`, 'error');
                return;
            }
            
            if (result.newItems.length === 0 || (result.duplicateCount === 0 && result.updatedCount === 0 && result.addedCount === 0)) {
                showAlert('No Changes', `No changes to make - all items are identical to existing ones.`, 'info');
                return;
            }
            
            // Create confirmation message
            const { title, message, confirmText } = createImportMessage(result);
            
            showConfirm(
                title,
                message,
                () => {
                    // Replace all media items with the merged result
                    setMediaItems(() => {
                        // Sort all items after importing
                        return result.newItems.sort((a, b) => {
                            if (b.rating !== a.rating) {
                                return b.rating - a.rating; // Higher rating first
                            }
                            return a.title.localeCompare(b.title); // Alphabetical by title if ratings are equal
                        });
                    });
                    
                    // Show success message with details
                    const successMessage = createSuccessMessage(result, result.addedCount || result.newItems.length);
                    showAlert(
                        'Import Successful',
                        successMessage,
                        'success',
                        buildItemDetailsList(result)
                    );
                },
                () => {
                    // User cancelled
                },
                confirmText,
                'Cancel',
                result.typeConflicts && result.typeConflicts.length > 0 ? 'warning' : 'info'
            );
            
        } catch (error) {
            console.error('Import error:', error);
            showAlert('Import Error', `Error importing CSV: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
        }
    };



    import { parseCSV, convertCSVToMediaItems } from './CSVParser';
import { MediaItem } from '../components/media-input';

export interface ProcessCSVOptions {
    defaultType?: 'film' | 'tv' | 'game' | 'book' | 'boardgame';
    activeFilter?: 'all' | 'film' | 'tv' | 'game' | 'book' | 'boardgame' | 'stats';
}

export interface ProcessCSVResult {
    success: boolean;
    newItems: MediaItem[];
    duplicateCount: number;
    updatedCount?: number;  // New: items that were updated
    addedCount?: number;    // New: items that were added
    totalProcessed: number;
    errors?: string[];
    typeConflicts?: string[];
}

export interface DuplicateCheckOptions {
    /**
     * Check for exact duplicates across all fields (title, type, rating, review, status)
     * This is the most strict duplicate detection
     */
    exact?: boolean;
    
    /**
     * Check for duplicates based on title and type only (legacy behavior)
     * This allows same title/type to exist with different ratings/reviews/status
     */
    titleAndType?: boolean;
    
    /**
     * Check for duplicates based on title, type, and status
     * This allows same movie to exist as both "watched" and "watchlist" but not duplicate watchlist entries
     */
    titleTypeStatus?: boolean;
}

/**
 * Filters out duplicate items from a list of new items based on existing items
 */
export function filterDuplicates(
    newItems: MediaItem[], 
    existingItems: MediaItem[], 
    options: DuplicateCheckOptions = { titleTypeStatus: true }
): { uniqueItems: MediaItem[], duplicateCount: number } {
    
    // Create a set of existing item keys
    const existingKeys = new Set(
        existingItems.map(item => createDuplicateKey(item, options))
    );
    
    // Filter out duplicates from new items
    const uniqueItems = newItems.filter(item => 
        !existingKeys.has(createDuplicateKey(item, options))
    );
    
    const duplicateCount = newItems.length - uniqueItems.length;
    
    return { uniqueItems, duplicateCount };
}

/**
 * Merges new items with existing items using a three-phase approach:
 * 1. Skip exact duplicates (no changes needed)
 * 2. Update items that match on title+type but differ in other fields
 * 3. Add completely new items
 * 
 * Adds _updated and _added flags for UI details.
 */
export function mergeWithUpdates(
    newItems: MediaItem[], 
    existingItems: MediaItem[]
): { mergedItems: MediaItem[], duplicateCount: number, updatedCount: number, addedCount: number } {
    
    // Create maps for both exact matches and title+type matches
    const existingExactMap = new Map<string, MediaItem>();
    const existingTitleTypeMap = new Map<string, MediaItem>();
    
    existingItems.forEach(item => {
        const exactKey = createDuplicateKey(item, { exact: true });
        const titleTypeKey = createDuplicateKey(item, { titleAndType: true });
        
        existingExactMap.set(exactKey, item);
        existingTitleTypeMap.set(titleTypeKey, item);
    });
    
    let duplicateCount = 0;
    let updatedCount = 0;
    let addedCount = 0;
    
    const processedTitleTypeKeys = new Set<string>();
    const updatedItems: MediaItem[] = [];
    const timestamp = Date.now();
    let uniqueCounter = 0;
    
    // Phase 1 & 2 & 3: Process new items
    newItems.forEach((newItem, index) => {
        const exactKey = createDuplicateKey(newItem, { exact: true });
        const titleTypeKey = createDuplicateKey(newItem, { titleAndType: true });
        
        // Phase 1: Check for exact duplicates (skip these)
        if (existingExactMap.has(exactKey)) {
            duplicateCount++;
            return; // Skip this item entirely
        }
        
        // Phase 2: Check for title+type matches (update these)
        if (existingTitleTypeMap.has(titleTypeKey)) {
            const existingItem = existingTitleTypeMap.get(titleTypeKey)!;
            updatedItems.push({
                ...newItem,
                id: existingItem.id, // Keep original ID
                dateAdded: existingItem.dateAdded, // Keep original date added
                _updated: true // <-- Add flag for UI
            } as MediaItem & { _updated: true });
            updatedCount++;
            processedTitleTypeKeys.add(titleTypeKey);
            return;
        }
        
        // Phase 3: Completely new items (add these)
        const uniqueId = `import-${timestamp}-${Math.random().toString(36).substr(2, 9)}-${uniqueCounter++}`;
        updatedItems.push({
            ...newItem,
            id: uniqueId,
            _added: true // <-- Add flag for UI
        } as MediaItem & { _added: true });
        addedCount++;
        processedTitleTypeKeys.add(titleTypeKey);
    });
    
    // Add remaining existing items that weren't updated
    existingItems.forEach(existingItem => {
        const titleTypeKey = createDuplicateKey(existingItem, { titleAndType: true });
        if (!processedTitleTypeKeys.has(titleTypeKey)) {
            updatedItems.push(existingItem);
        }
    });
    
    return {
        mergedItems: updatedItems,
        duplicateCount,
        updatedCount,
        addedCount
    };
}

/**
 * Processes CSV data and returns processed MediaItems with update/merge logic
 */
export function processCSVData(
    csvText: string, 
    existingItems: MediaItem[], 
    options: ProcessCSVOptions = {},
    duplicateOptions: DuplicateCheckOptions = { titleAndType: true }, // Changed default to titleAndType
    shouldUpdate: boolean = true // New parameter to control update behavior
): ProcessCSVResult {
    try {
        const { defaultType = 'film', activeFilter = 'all' } = options;
        
        // Parse the CSV data
        const csvData = parseCSV(csvText);
        
        if (csvData.length === 0) {
            return {
                success: false,
                newItems: [],
                duplicateCount: 0,
                totalProcessed: 0,
                errors: ['No valid data found in CSV']
            };
        }
        
        // Convert CSV data to MediaItems
        const newMediaItems = convertCSVToMediaItems(csvData, defaultType);
        
        if (newMediaItems.length === 0) {
            return {
                success: false,
                newItems: [],
                duplicateCount: 0,
                totalProcessed: csvData.length,
                errors: ['No valid media items could be created from CSV data']
            };
        }
        
        let processedItems = newMediaItems;
        const typeConflicts: string[] = [];
        
        // Handle type conversion based on active filter
        if (activeFilter !== 'all' && activeFilter !== 'stats') {
            // When importing on a specific tab, convert all items to that type
            processedItems = newMediaItems.map((item: MediaItem) => ({
                ...item,
                type: activeFilter as 'film' | 'tv' | 'game' | 'book' | 'boardgame'
            }));
        } else {
            // Check for mixed types when on 'all' tab
            const detectedTypes = [...new Set(newMediaItems.map((item: MediaItem) => item.type))];
            if (detectedTypes.length > 1) {
                const typeNames = detectedTypes.map(type => 
                    type === 'film' ? 'films' : 
                    type === 'tv' ? 'TV shows' : 
                    type === 'game' ? 'video games' : 
                    type === 'book' ? 'books' : 
                    'board games'
                );
                typeConflicts.push(`Mixed media types detected: ${typeNames.join(', ')}`);
            }
        }
        
        if (shouldUpdate) {
            // Use merge logic with three-phase approach
            const { mergedItems, duplicateCount, updatedCount, addedCount } = mergeWithUpdates(
                processedItems,
                existingItems
            );
            
            return {
                success: true,
                newItems: mergedItems, // Return all items (existing + updated + new)
                duplicateCount, // Exact duplicates that were skipped
                updatedCount, // Items that were updated (same title+type, different other fields)
                addedCount, // Completely new items that were added
                totalProcessed: csvData.length,
                typeConflicts: typeConflicts.length > 0 ? typeConflicts : undefined
            };
        } else {
            // Use old filtering logic
            const { uniqueItems, duplicateCount } = filterDuplicates(
                processedItems, 
                existingItems, 
                duplicateOptions
            );
            
            return {
                success: true,
                newItems: uniqueItems,
                duplicateCount,
                totalProcessed: csvData.length,
                typeConflicts: typeConflicts.length > 0 ? typeConflicts : undefined
            };
        }
        
    } catch (error) {
        return {
            success: false,
            newItems: [],
            duplicateCount: 0,
            totalProcessed: 0,
            errors: [error instanceof Error ? error.message : 'Unknown error occurred while processing CSV']
        };
    }
}

/**
 * Processes titles (comma/newline separated) and returns MediaItems for watchlist
 */
export function processTitlesData(
    titlesText: string,
    existingItems: MediaItem[],
    typeToAdd: 'film' | 'tv' | 'game' | 'book' | 'boardgame' = 'film',
    duplicateOptions: DuplicateCheckOptions = { titleTypeStatus: true }
): ProcessCSVResult {
    try {
        // Parse titles from text
        const titles = titlesText
            .split(/[,\n\t]+/) // Split by comma, newline, or tab
            .map(title => title.trim())
            .filter(title => title.length > 0); // Remove empty strings
        
        if (titles.length === 0) {
            return {
                success: false,
                newItems: [],
                duplicateCount: 0,
                totalProcessed: 0,
                errors: ['No valid titles found']
            };
        }
        
        // Create MediaItem objects for each title
        const timestamp = Date.now();
        const newItems: MediaItem[] = titles.map((title, index) => ({
            id: `title-import-${timestamp}-${Math.random().toString(36).substr(2, 9)}-${index}`,
            title: title,
            type: typeToAdd,
            rating: 0, // No rating for watchlist items
            review: '',
            status: 'watchlist' as const,
            dateAdded: new Date()
        }));
        
        // Filter out duplicates
        const { uniqueItems, duplicateCount } = filterDuplicates(
            newItems, 
            existingItems, 
            duplicateOptions
        );
        
        return {
            success: true,
            newItems: uniqueItems,
            duplicateCount,
            totalProcessed: titles.length
        };
        
    } catch (error) {
        return {
            success: false,
            newItems: [],
            duplicateCount: 0,
            totalProcessed: 0,
            errors: [error instanceof Error ? error.message : 'Unknown error occurred while processing titles']
        };
    }
}

/**
 * Helper function to create confirmation messages for imports
 */
export function createImportMessage(result: ProcessCSVResult): {
    title: string;
    message: string;
    confirmText: string;
} {
    const { duplicateCount, updatedCount = 0, addedCount = 0, typeConflicts } = result;
    
    let message = '';
    const parts: string[] = [];
    
    if (duplicateCount > 0) {
        parts.push(`${duplicateCount} exact duplicate${duplicateCount > 1 ? 's' : ''} will be skipped`);
    }
    if (updatedCount > 0) {
        parts.push(`${updatedCount} existing item${updatedCount > 1 ? 's' : ''} will be updated`);
    }
    if (addedCount > 0) {
        parts.push(`${addedCount} new item${addedCount > 1 ? 's' : ''} will be added`);
    }
    
    if (parts.length > 0) {
        message = parts.join(', ') + '.';
    } else {
        message = 'No changes to make.';
    }
    
    // Add type conflict info
    if (typeConflicts && typeConflicts.length > 0) {
        message += ` ${typeConflicts.join(' ')}`;
    }
    
    return {
        title: typeConflicts && typeConflicts.length > 0 ? 'Mixed Media Types Detected' : 'Confirm Import',
        message,
        confirmText: typeConflicts && typeConflicts.length > 0 ? 'Import Anyway' : 'Import'
    };
}

/**
 * Helper function to create success messages after import
 */
export function createSuccessMessage(
    result: ProcessCSVResult, 
    actualImported: number
): string {
    const { duplicateCount, updatedCount = 0, addedCount = 0 } = result;

    let message = '';
    const parts: string[] = [];
    
    if (duplicateCount > 0) {
        parts.push(`skipped ${duplicateCount} exact duplicate${duplicateCount > 1 ? 's' : ''}`);
    }
    if (updatedCount > 0) {
        parts.push(`updated ${updatedCount} existing item${updatedCount > 1 ? 's' : ''}`);
    }
    if (addedCount > 0) {
        parts.push(`added ${addedCount} new item${addedCount > 1 ? 's' : ''}`);
    }
    
    if (parts.length > 0) {
        message = `Successfully ${parts.join(', ')}!`;
    } else {
        if (actualImported !== 0){
            message = `Successfully added ${actualImported} new item${actualImported > 1 ? 's' : ''}!`;
        }
        else {
            message = 'No changes were made.';  
        }

    }

    
    return message;
}




 // Helper to build details list for updated/added items
    const buildItemDetailsList = (result: any) => {
        // Prefer updatedItems and addedItems arrays if present
        const details: string[] = [];
        if (result.updatedItems && result.updatedItems.length > 0) {
            details.push(...result.updatedItems.map((item: any) =>
                `Updated: ${item.title}${item.type ? ` (${item.type})` : ''}${item.status ? ` [${item.status}]` : ''}`
            ));
        }
        if (result.addedItems && result.addedItems.length > 0) {
            details.push(...result.addedItems.map((item: any) =>
                `Added: ${item.title}${item.type ? ` (${item.type})` : ''}${item.status ? ` [${item.status}]` : ''}`
            ));
        }
        // Fallback: if only newItems is present (for some import flows)
        if (details.length === 0 && result.newItems && result.newItems.length > 0) {
            details.push(...result.newItems.map((item: any) =>
                `${item.title}${item.type ? ` (${item.type})` : ''}${item.status ? ` [${item.status}]` : ''}`
            ));
        }
        return details;
    };