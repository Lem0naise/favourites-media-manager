export type Status = 'watched' | 'watching' | 'watchlist';
export type MediaType = 'film' | 'tv' | 'game' | 'book' | 'boardgame';

export interface MediaItem {
  id: string;
  title: string;
  type: MediaType;
  rating: number;
  review: string;
  status: Status;
  dateAdded: Date;
}

export interface UpdateResult {
    success: boolean;
    message: string;
    items: MediaItem[];
    added: MediaItem[];
    updated: MediaItem[];
    duplicates: MediaItem[];
}


