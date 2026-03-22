import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { SpotifyAdapter } from '@/lib/adapters/spotify-adapter';
import { YouTubeAdapter } from '@/lib/adapters/youtube-adapter';
import { Track } from '@/lib/adapters/base-adapter';
import { getAndRefreshPlatformTokens } from '@/lib/auth/platform-cookies';

// Vercel 10s Serverless timeout bypass -> the frontend will slice the track payload into max 20 sizes
export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { destinationPlatform, targetPlaylistId, tracks } = body;

  const platformTokens = await getAndRefreshPlatformTokens(destinationPlatform);
  if (!platformTokens) {
    return NextResponse.json({ error: 'Destination session expired. Please reconnect.' }, { status: 401 });
  }

  const destAdapter = destinationPlatform === 'spotify' 
    ? new SpotifyAdapter(platformTokens.accessToken)
    : new YouTubeAdapter(platformTokens.accessToken);

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
