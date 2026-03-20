import { BaseAdapter, Playlist, Track } from './base-adapter';
import { google, youtube_v3 } from 'googleapis';

export class YouTubeAdapter implements BaseAdapter {
  platformId = 'youtube' as const;
  private youtube: youtube_v3.Youtube;

  constructor(accessToken: string) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    this.youtube = google.youtube({ version: 'v3', auth });
  }

  async getPlaylists(): Promise<Playlist[]> {
    const response = await this.youtube.playlists.list({
      part: ['snippet', 'contentDetails'],
      mine: true,
      maxResults: 50,
    });

    return (response.data.items || []).map((item: any) => ({
      id: item.id!,
      name: item.snippet?.title || 'Unknown',
      imageUrl: item.snippet?.thumbnails?.default?.url || undefined,
      trackCount: item.contentDetails?.itemCount || 0,
      owner: item.snippet?.channelTitle || undefined,
    }));
  }

  async getPlaylistTracks(playlistId: string): Promise<Track[]> {
    let tracks: Track[] = [];
    let nextPageToken: string | undefined = undefined;

    do {
      const response: any = await this.youtube.playlistItems.list({
        part: ['snippet', 'contentDetails'],
        playlistId,
        maxResults: 50,
        pageToken: nextPageToken,
      });

      const chunk = (response.data.items || []).map((item: any) => ({
        id: item.contentDetails?.videoId || item.id!,
        title: item.snippet?.title || 'Unknown Video',
        artist: item.snippet?.videoOwnerChannelTitle || 'Unknown Artist',
        imageUrl: item.snippet?.thumbnails?.default?.url || undefined,
      }));

      tracks = [...tracks, ...chunk];
      nextPageToken = response.data.nextPageToken || undefined;
    } while (nextPageToken);

    return tracks;
  }

  async createPlaylist(name: string, description?: string): Promise<string> {
    const response = await this.youtube.playlists.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title: name,
          description: description || '',
        },
        status: {
          privacyStatus: 'private',
        },
      },
    });
    return response.data.id!;
  }

  async addTracksToPlaylist(playlistId: string, trackIds: string[]): Promise<void> {
    for (const trackId of trackIds) {
      await this.youtube.playlistItems.insert({
        part: ['snippet'],
        requestBody: {
          snippet: {
            playlistId,
            resourceId: {
              kind: 'youtube#video',
              videoId: trackId,
            },
          },
        },
      });
    }
  }

  async searchTracks(query: string): Promise<Track[]> {
    const response = await this.youtube.search.list({
      part: ['snippet'],
      q: query,
      type: ['video'],
      videoCategoryId: '10', // Music
      maxResults: 1,
    });

    if (response.data.items && response.data.items.length > 0) {
      const item = response.data.items[0];
      return [{
        id: item.id?.videoId || '',
        title: item.snippet?.title || 'Unknown',
        artist: item.snippet?.channelTitle || 'Unknown',
        imageUrl: item.snippet?.thumbnails?.default?.url || undefined,
      }];
    }
    return [];
  }
}
