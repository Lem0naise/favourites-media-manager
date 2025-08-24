export const detectRatingScaleAndConvert = (rawRatings: number[]): number[] => {
    if (rawRatings.length === 0) return [];
    const maxRating = Math.max(...rawRatings);
    // If max rating is 5 or below, assume 0-5 scale, multiply by 20
    if (maxRating <= 5) {
        return rawRatings.map(rating => Math.min(100, Math.max(0, rating * 20)));
    }
    // If max rating is exactly 10 or close to 10, assume 0-10 scale, multiply by 10
    if (maxRating <= 10) {
        return rawRatings.map(rating => Math.min(100, Math.max(0, rating * 10)));
    }
    // Otherwise, assume 0-100 scale (no scaling needed)
    return rawRatings.map(rating => Math.min(100, Math.max(0, rating)));
};