import { MediaItem } from "../core/types";
import { MediaType } from "../core/types";
import { Status } from "../core/types";


export type SortCriteria = 'byDate' | 'byRating' | 'byTitle';
export interface SortOption {
    criteria: SortCriteria;
    ascending: boolean;
}

export function getSortedMedia(mediaItems: MediaItem[], sortOptions: SortOption[]) {
    if (!sortOptions.length) return [...mediaItems];

    return [...mediaItems].sort((a, b) => {
        for (const {criteria, ascending} of sortOptions) {
            let comp = 0;
            switch (criteria) {
                case 'byDate':
                    comp = a.dateAdded.getTime() - b.dateAdded.getTime();
                    break;
                case 'byRating':
                    comp = a.rating - b.rating;
                    break;
                case 'byTitle':
                    comp = a.title.localeCompare(b.title);
                    break;
            }
            if (!ascending) {
                comp = -comp;
            } 
            if (comp !== 0){
                return comp;
            }
        }
        return 0;
    });
}



export interface FilterOptions {
    searchTerm?: string,
    type?: MediaType;
    status?: Status;
    before?: Date;
    after?: Date;
    lessThanRating?: number;
    moreThanRating?: number;
}

export function getFilteredMedia(mediaItems: MediaItem[], filterOptions: FilterOptions) : MediaItem[] {
    let filtered: MediaItem[] = mediaItems;
    if (filterOptions.searchTerm?.trim()) {
        const searchLower = filterOptions.searchTerm.toLowerCase().trim();
        filtered = mediaItems.filter(item => 
            item.title.toLowerCase().includes(searchLower) ||
            item.review.toLowerCase().includes(searchLower)
        );
    }
    return filtered.filter(item => 
        (!filterOptions.type || item.type === filterOptions.type) && 
        (!filterOptions.status || item.status === filterOptions.status) &&
        (!filterOptions.before || item.dateAdded.getTime() < filterOptions.before.getTime()) &&
        (!filterOptions.after || item.dateAdded.getTime() > filterOptions.after.getTime()) &&
        (!filterOptions.moreThanRating || item.rating > filterOptions.moreThanRating) &&
        (!filterOptions.lessThanRating || item.rating < filterOptions.lessThanRating)
    );
};


export function getWatched(mediaItems: MediaItem[]){
    return getFilteredMedia(mediaItems, {status: 'watched'})
}

export function getWatching(mediaItems: MediaItem[]){
    return getFilteredMedia(mediaItems, {status: 'watching'})
}

export function getWatchlist(mediaItems: MediaItem[]){
    return getFilteredMedia(mediaItems, {status: 'watchlist'})
}
