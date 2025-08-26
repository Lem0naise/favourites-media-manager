import { MediaItem } from "../core/types";

export function getAverageRating (mediaItems: MediaItem[]): string {
    const watchedMedia = mediaItems.filter(item => item.status === 'watched');
    const ratingsWithValues = watchedMedia.filter(item => item.rating > 0);
    if (ratingsWithValues.length === 0) return "0.00";
    const sum = ratingsWithValues.reduce((acc, item) => acc + item.rating, 0);
    return (sum / ratingsWithValues.length).toFixed(2);
};
