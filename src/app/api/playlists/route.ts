import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { SpotifyAdapter } from '@/lib/adapters/spotify-adapter';
import { YouTubeAdapter } from '@/lib/adapters/youtube-adapter';

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  console.log("[API/Playlists] Debug Token Status:", {
    hasToken: !!token,
    platforms: token?.connectedPlatforms,
    hasSpotify: !!token?.spotifyAccessToken,
    hasYoutube: !!token?.youtubeAccessToken,
    // Note: Don't log full tokens for security, but we want to know they exist.
  });

  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const platform = searchParams.get('platform');

  try {
    const adapter = platform === 'spotify' 
      ? new SpotifyAdapter(token.spotifyAccessToken as string)
      : new YouTubeAdapter(token.youtubeAccessToken as string);
      
    const playlists = await adapter.getPlaylists();
    return NextResponse.json(playlists);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
