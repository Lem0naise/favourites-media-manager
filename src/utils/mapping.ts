const matches = (keywords: string[], s: string): boolean => {
    return keywords.some(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'i')
        return regex.test(s);
    });
}

export const mapStringToStatus = (status?: string, hasRating?: boolean): 'watched' | 'watching' | 'watchlist' => {
    if (!status && !hasRating) return 'watchlist';
    if (!status) return 'watched';
    const s = status.toLowerCase();
    
    const watchlistKeywords = [
        'watchlist', 'want', 'to ', 'plan', 'wishlist', 'queue', 'pending', 'backlog',
        'to-watch', 'to read', 'to-play', 'to do', 'to see', 'to finish', 'to complete',
        'plan to', 'plan on', 'plan watch', 'plan read', 'plan play', 'plan finish',
        'plan complete', 'plan to watch', 'plan to read', 'plan to play', 'plan to finish',
        'plan to complete', 'unwatched', 'unread', 'unplayed', 'unseen', 'not started',
        'future', 'someday', 'later', 'eventually'
    ]
    const watchingKeywords = [
        'watching', 'reading', 'playing', 'current', 'in progress', 'progress', 'ongoing',
        'started', 'continuing', 'continuing', 'doing', 'active', 'working on', 'reading now',
        'playing now', 'watching now', 'in-progress', 'in progress', 'inplay', 'inread', 'inwatch',
        'continuing', 'currently', 'now', 'ongoing', 'on going', 'on-going'
    ];
    const watchedKeywords = [
        'watched', 'completed', 'finished', 'done', 'seen', 'read', 'played', 'over', 'ended',
        'complete', 'finished', 'accomplished', 'finalized', 'finalised', 'concluded', 'cleared',
        'beaten', 'ended', 'past', 'old', 'archived'
    ];

    if (matches(watchlistKeywords, s)) return 'watchlist';
    if (matches(watchedKeywords, s)) return 'watched';
    if (matches(watchingKeywords, s)) return 'watching';
    if (!hasRating) return 'watchlist';
    return 'watched';
}

export const mapStringToType = (typeString: string | undefined, defaultType?: 'film' | 'tv' | 'game' | 'book' | 'boardgame'): 'film' | 'tv' | 'game' | 'book' | 'boardgame' => {
    if (!typeString) return defaultType || 'film';
    const typeValue = typeString.toLowerCase().trim();
    const tvKeywords = ['tv', 'show', 'series', 'television', 'tv show', 'tv series', 'serie', 'episode',
        'mini-series', 'miniseries', 'webseries', 'web series', 'season'];
    const boardgameKeywords = ['board game', 'boardgame', 'tabletop', 'card game', 'board', 'table game', 'tabletop game',
        'tabletop rpg', 'rpg', 'tabletop roleplaying', 'tabletop role-playing', 'tabletopgame', 'tabletopgames'];
    const gameKeywords = ['game', 'video', 'video game', 'videogame', 'gaming', 'pc', 'console', 'mobile game', 'arcade',
        'computer game', 'switch', 'playstation', 'xbox', 'steam', 'ps4', 'ps5', 'nintendo', 'handheld',
        'browser game', 'online game', 'digital game'];
    const bookKeywords = ['book', 'novel', 'literature', 'audiobook', 'ebook', 'non-fiction', 'nonfiction', 'fiction',
        'reading', 'manga', 'comic', 'graphic novel', 'light novel', 'magazine', 'manual', 'textbook',
        'guide', 'journal', 'publication', 'story', 'short story', 'poetry', 'poem'];
    const filmKeywords = ['film', 'movie', 'cinema', 'documentary', 'feature', 'motion picture', 'picture',
        'doc', 'docu', 'featurette', 'screening', 'flick', 'biopic', 'animation film', 'animated film'];
    if (matches(tvKeywords, typeValue)) return 'tv';
    if (matches(boardgameKeywords, typeValue)) return 'boardgame';
    if (matches(gameKeywords, typeValue)) return 'game';
    if (matches(bookKeywords, typeValue)) return 'book';
    if (matches(filmKeywords, typeValue)) return 'film';

    return defaultType || 'film';
};

export const findColumnVariations = (headers: string[], candidates: string[]): string | null => {
    const lowerHeaders = headers.map(h => h.toLowerCase());
    for (const candidate of candidates) {
        const idx = lowerHeaders.indexOf(candidate.toLowerCase());
        if (idx !== -1) return headers[idx];
    }
    return null;
};
