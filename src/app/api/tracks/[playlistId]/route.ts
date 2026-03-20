import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { SpotifyAdapter } from '@/lib/adapters/spotify-adapter';
import { YouTubeAdapter } from '@/lib/adapters/youtube-adapter';

export async function GET(req: NextRequest, props: { params: Promise<{ playlistId: string }> }) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const platform = searchParams.get('platform');
  const params = await props.params;

  try {
    const adapter = platform === 'spotify' 
      ? new SpotifyAdapter(token.spotifyAccessToken as string)
      : new YouTubeAdapter(token.youtubeAccessToken as string);
      
    const tracks = await adapter.getPlaylistTracks(params.playlistId);
    return NextResponse.json(tracks);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
