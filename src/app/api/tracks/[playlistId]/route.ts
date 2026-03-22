import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { SpotifyAdapter } from '@/lib/adapters/spotify-adapter';
import { YouTubeAdapter } from '@/lib/adapters/youtube-adapter';
import { getAndRefreshPlatformTokens } from '@/lib/auth/platform-cookies';

export async function GET(req: NextRequest, props: { params: Promise<{ playlistId: string }> }) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const platform = searchParams.get('platform');
  const params = await props.params;

  if (!platform) return NextResponse.json({ error: 'Platform required' }, { status: 400 });

  try {
    const platformTokens = await getAndRefreshPlatformTokens(platform);
    if (!platformTokens) {
      return NextResponse.json({ error: 'Session expired. Please reconnect.' }, { status: 401 });
    }

    const adapter = platform === 'spotify' 
      ? new SpotifyAdapter(platformTokens.accessToken)
      : new YouTubeAdapter(platformTokens.accessToken);
      
    const tracks = await adapter.getPlaylistTracks(params.playlistId);
    return NextResponse.json(tracks);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
