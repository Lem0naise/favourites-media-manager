import { MediaItem, UpdateResult} from "./types";
import {FilterOptions, getFilteredMedia, getWatched, getWatching, getWatchlist} from '../utils/filtering';
import { getAverageRating } from "../utils/statistics";

export class MediaManager {
    private mediaItems: MediaItem[] = [];

    getMediaItems(): MediaItem[] {
        return [...this.mediaItems];
    }

    getFilteredMedia(filterOptions: FilterOptions, customMediaItems?: MediaItem[]) : MediaItem[] {
        if (customMediaItems){return getFilteredMedia(customMediaItems, filterOptions);}
        return getFilteredMedia(this.mediaItems, filterOptions);
    }

    getAverageRating(customMediaItems?: MediaItem[]) {
        if (customMediaItems){return getAverageRating(customMediaItems)};
        return getAverageRating(this.mediaItems);
    }
}

export default MediaManager;
