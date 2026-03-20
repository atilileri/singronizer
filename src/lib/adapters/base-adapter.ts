export interface Playlist {
  id: string;
  name: string;
  imageUrl?: string;
  trackCount: number;
  owner?: string;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  durationMs?: number;
  album?: string;
  imageUrl?: string;
}

export interface BaseAdapter {
  platformId: 'spotify' | 'youtube';
  getPlaylists(): Promise<Playlist[]>;
  getPlaylistTracks(playlistId: string): Promise<Track[]>;
  createPlaylist(name: string, description?: string): Promise<string>;
  addTracksToPlaylist(playlistId: string, trackIds: string[]): Promise<void>;
  searchTracks(query: string): Promise<Track[]>;
}
