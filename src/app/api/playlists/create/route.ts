import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { SpotifyAdapter } from '@/lib/adapters/spotify-adapter';
import { YouTubeAdapter } from '@/lib/adapters/youtube-adapter';

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { platform, name, description } = body;

  try {
    const adapter = platform === 'spotify' 
      ? new SpotifyAdapter(token.spotifyAccessToken as string)
      : new YouTubeAdapter(token.youtubeAccessToken as string);
      
    const newPlaylistId = await adapter.createPlaylist(name, description);
    return NextResponse.json({ id: newPlaylistId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
