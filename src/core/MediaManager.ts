import { MediaItem } from "./types";
import {UpdateResult} from './types';
import {FilterOptions, getFilteredMedia} from '../utils/filtering';


export class MediaManager {
    private mediaItems: MediaItem[] = [];

    getMediaItems(): MediaItem[] {
        return [...this.mediaItems];
    }

    getFilteredMedia(filterOptions: FilterOptions) : MediaItem[] {
        return getFilteredMedia(this.mediaItems, filterOptions);
    }
}
export default MediaManager;
