import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { SpotifyAdapter } from '@/lib/adapters/spotify-adapter';
import { YouTubeAdapter } from '@/lib/adapters/youtube-adapter';
import { getPlatformTokens } from '@/lib/auth/platform-cookies';

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  
  const { searchParams } = new URL(req.url);
  const platform = searchParams.get('platform');

  console.log("[API/Playlists] Debug Request:", {
    platform,
    hasAuthSession: !!token,
  });

  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!platform) return NextResponse.json({ error: 'Platform required' }, { status: 400 });

  try {
    // Independent Cookie Strategy:
    // We fetch tokens from their dedicated platform cookie, not the session.
    const platformTokens = await getPlatformTokens(platform);
    
    if (!platformTokens) {
      console.error(`[API/Playlists] No tokens found in independent cookie for ${platform}`);
      return NextResponse.json({ 
        error: `Not connected to ${platform}. Please connect your account.` 
      }, { status: 400 });
    }

    const adapter = platform === 'spotify' 
      ? new SpotifyAdapter(platformTokens.accessToken)
      : new YouTubeAdapter(platformTokens.accessToken);
      
    const playlists = await adapter.getPlaylists();
    return NextResponse.json(playlists);
  } catch (error: any) {
    console.error("[API/Playlists] Fetch Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
