import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { SpotifyAdapter } from '@/lib/adapters/spotify-adapter';
import { YouTubeAdapter } from '@/lib/adapters/youtube-adapter';
import { Track } from '@/lib/adapters/base-adapter';

// Vercel 10s Serverless timeout bypass -> the frontend will slice the track payload into max 20 sizes
export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { destinationPlatform, targetPlaylistId, tracks } = body;

  const destAdapter = destinationPlatform === 'spotify' 
    ? new SpotifyAdapter(token.spotifyAccessToken as string)
    : new YouTubeAdapter(token.youtubeAccessToken as string);

  const matchedTrackIds: string[] = [];
  const log: string[] = [];

  for (const track of (tracks as Track[])) {
    try {
      const searchRes = await destAdapter.searchTracks(`${track.title} ${track.artist}`);
      if (searchRes.length > 0) {
        matchedTrackIds.push(searchRes[0].id);
        log.push(`Synced: "${track.title}" successfully.`);
      } else {
        log.push(`Skipped: Could not find match for "${track.title}".`);
      }
    } catch (e: any) {
      log.push(`Error: Failed to process "${track.title}": ${e.message}`);
    }
  }

  // Add all found tracks dynamically to destination
  if (matchedTrackIds.length > 0) {
    try {
      await destAdapter.addTracksToPlaylist(targetPlaylistId, matchedTrackIds);
    } catch (e: any) {
      log.push(`Critical Error: Could not commit matches sequence to playlist.`);
    }
  }

  return NextResponse.json({ log });
}
