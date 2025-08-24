import { MediaItem } from "../core/types";
import { UpdateResult } from "../core/types";
import { createDuplicateKey } from "./duplicates";

export function addNewMediaItems(
    existingItems: MediaItem[],
    newItems: MediaItem[]
): UpdateResult {
    
    // Create maps for both exact matches and title+type matches
    const existingExactMap = new Map<string, MediaItem>();
    const existingTitleTypeMap = new Map<string, MediaItem>();
    
    existingItems.forEach(item => {
        const exactKey = createDuplicateKey(item, { exact: true });
        const titleTypeKey = createDuplicateKey(item, { titleAndType: true });
        existingExactMap.set(exactKey, item);
        existingTitleTypeMap.set(titleTypeKey, item);
    });
    
    let duplicates : MediaItem[] = [];
    let updated : MediaItem[] = [];
    let added : MediaItem[] = [];
    
    const processedTitleTypeKeys = new Set<string>();
    const updatedItems: MediaItem[] = [];
    const timestamp = Date.now();
    let uniqueCounter = 0;
    
    // Process new items
    newItems.forEach((newItem, index) => {
        const exactKey = createDuplicateKey(newItem, { exact: true });
        const titleTypeKey = createDuplicateKey(newItem, { titleAndType: true });
        
        // Phase 1: Check for exact duplicates (skip these)
        if (existingExactMap.has(exactKey)) {
            duplicates = [...duplicates, newItem];
            return; // Skip this item entirely
        }
        
        // Phase 2: Check for title+type matches (update these)
        if (existingTitleTypeMap.has(titleTypeKey)) {
            const existingItem = existingTitleTypeMap.get(titleTypeKey)!;
            updatedItems.push({
                ...newItem,
                id: existingItem.id, // Keep original ID
                dateAdded: existingItem.dateAdded, // Keep original date added
            } as MediaItem);
            updated = [...updated, newItem]
            processedTitleTypeKeys.add(titleTypeKey);
            return;
        }
        
        // Phase 3: Completely new items (add these)
        const uniqueId = `import-${timestamp}-${Math.random().toString(36).substr(2, 9)}-${uniqueCounter++}`;
        updatedItems.push({
            ...newItem,
            id: uniqueId,
        } as MediaItem );
        added.push({
            ...newItem,
            id: uniqueId,
        } as MediaItem);
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
        success: true,
        message: "Update successful",
        items: updatedItems,
        duplicates: duplicates,
        added: added,
        updated: updated
    };
}