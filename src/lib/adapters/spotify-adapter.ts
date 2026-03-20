import { BaseAdapter, Playlist, Track } from './base-adapter';

export class SpotifyAdapter implements BaseAdapter {
  platformId = 'spotify' as const;
  private accessToken: string;
  private baseUrl = 'https://api.spotify.com/v1';

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async fetchApi(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    if (!response.ok) {
      throw new Error(`Spotify API error: ${response.statusText}`);
    }
    return response.json();
  }

  async getPlaylists(): Promise<Playlist[]> {
    const data = await this.fetchApi('/me/playlists?limit=50');
    return data.items.map((item: any) => ({
      id: item.id,
      name: item.name,
      imageUrl: item.images?.[0]?.url,
      trackCount: item.tracks?.total,
      owner: item.owner?.display_name,
    }));
  }

  async getPlaylistTracks(playlistId: string): Promise<Track[]> {
    let tracks: Track[] = [];
    let nextUrl = `/playlists/${playlistId}/tracks?limit=50`;

    while (nextUrl) {
      const endpoint = nextUrl.replace(this.baseUrl, '');
      const data = await this.fetchApi(endpoint);
      
      const chunk = data.items
        .filter((item: any) => item.track)
        .map((item: any) => ({
          id: item.track.id,
          title: item.track.name,
          artist: item.track.artists.map((a: any) => a.name).join(', '),
          durationMs: item.track.duration_ms,
          album: item.track.album?.name,
          imageUrl: item.track.album?.images?.[0]?.url,
        }));
      
      tracks = [...tracks, ...chunk];
      nextUrl = data.next;
    }

    return tracks;
  }

  async createPlaylist(name: string, description?: string): Promise<string> {
    const me = await this.fetchApi('/me');
    const data = await this.fetchApi(`/users/${me.id}/playlists`, {
      method: 'POST',
      body: JSON.stringify({ name, description: description || '', public: false }),
    });
    return data.id;
  }

  async addTracksToPlaylist(playlistId: string, trackIds: string[]): Promise<void> {
    const uris = trackIds.map(id => `spotify:track:${id}`);
    await this.fetchApi(`/playlists/${playlistId}/tracks`, {
      method: 'POST',
      body: JSON.stringify({ uris }),
    });
  }

  async searchTracks(query: string): Promise<Track[]> {
    const data = await this.fetchApi(`/search?q=${encodeURIComponent(query)}&type=track&limit=1`);
    if (data.tracks?.items?.length > 0) {
      const track = data.tracks.items[0];
      return [{
        id: track.id,
        title: track.name,
        artist: track.artists.map((a: any) => a.name).join(', '),
        durationMs: track.duration_ms,
        album: track.album?.name,
        imageUrl: track.album?.images?.[0]?.url,
      }];
    }
    return [];
  }
}
