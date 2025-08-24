import { MediaItem } from "../core/types";
import { MediaType } from "../core/types";
import { Status } from "../core/types";

export interface FilterOptions {
    searchTerm?: string,
    type?: MediaType;
    status?: Status;
    reverseSort?: boolean,
}

export function getFilteredMedia(filterOptions: FilterOptions) : MediaItem[] {

    if (filterOptions.searchTerm?.trim()) {
        const searchLower = filterOptions.searchTerm.toLowerCase().trim();
        const filtered = filtered.filter(item => 
            item.title.toLowerCase().includes(searchLower) ||
            item.review.toLowerCase().includes(searchLower)
        );
    }
    
    // Sort by rating (highest first), then by title alphabetically for items with same rating
    return filtered.sort((a, b) => {
        if (b.rating !== a.rating) {
            return b.rating - a.rating; // Higher rating first
        }
        return a.title.localeCompare(b.title); // Alphabetical by title if ratings are equal
    });
};





const getWatchedMedia = () => {
    const filtered = getFilteredMedia();
    const watched = filtered.filter(item => item.status === 'watched');
    // Sort by rating (highest first), then by title alphabetically
    // But keep items being edited at the top
    return watched.sort((a, b) => {
        const aIsEditing = mobileEditingItem === a.id;
        const bIsEditing = mobileEditingItem === b.id;
        
        // If one item is being edited, it goes to the top
        if (aIsEditing && !bIsEditing) return -1;
        if (bIsEditing && !aIsEditing) return 1;
        
        // If neither or both are being edited, sort normally
        if (b.rating !== a.rating) {
            return b.rating - a.rating;
        }
        return a.title.localeCompare(b.title);
    });
};



const getWatchingMedia = () => {
    const filtered = getFilteredMedia();
    const watching = filtered.filter(item => item.status === 'watching');
    // Sort by rating (highest first), then by title alphabetically
    // But keep items being edited at the top
    return watching.sort((a, b) => {
        const aIsEditing = mobileEditingItem === a.id;
        const bIsEditing = mobileEditingItem === b.id;
        
        // If one item is being edited, it goes to the top
        if (aIsEditing && !bIsEditing) return -1;
        if (bIsEditing && !aIsEditing) return 1;
        
        // If neither or both are being edited, sort normally
        if (b.rating !== a.rating) {
            return b.rating - a.rating;
        }
        return a.title.localeCompare(b.title);
    });
};



const getWatchlistMedia = () => {
    const filtered = getFilteredMedia();
    const watchlist = filtered.filter(item => item.status === 'watchlist');
    // Sort by rating (highest first), then by title alphabetically
    // But keep items being edited at the top
    return watchlist.sort((a, b) => {
        const aIsEditing = mobileEditingItem === a.id;
        const bIsEditing = mobileEditingItem === b.id;
        
        // If one item is being edited, it goes to the top
        if (aIsEditing && !bIsEditing) return -1;
        if (bIsEditing && !aIsEditing) return 1;
        
        // If neither or both are being edited, sort normally
        if (b.rating !== a.rating) {
            return b.rating - a.rating;
        }
        return a.title.localeCompare(b.title);
    });
};