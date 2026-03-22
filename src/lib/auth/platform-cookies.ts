import { cookies } from "next/headers";
import { Platform } from "@/lib/store/use-sync-store";

const COOKIE_PREFIX = "SINGRONIZER_TOKEN_";

export interface PlatformTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

export async function setPlatformTokens(platform: string, tokens: PlatformTokens) {
  const cookieStore = await cookies();
  const name = `${COOKIE_PREFIX}${platform.toUpperCase()}`;
  
  cookieStore.set(name, JSON.stringify(tokens), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function getPlatformTokens(platform: string): Promise<PlatformTokens | null> {
  const cookieStore = await cookies();
  const name = `${COOKIE_PREFIX}${platform.toUpperCase()}`;
  const cookie = cookieStore.get(name);
  
  if (!cookie?.value) return null;
  
  try {
    return JSON.parse(cookie.value) as PlatformTokens;
  } catch (e) {
    return null;
  }
}

async function refreshGoogleToken(refreshToken: string) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || 'Failed to refresh Google token');
  return {
    accessToken: data.access_token,
    expiresAt: Math.floor(Date.now() / 1000 + data.expires_in),
    refreshToken: data.refresh_token || refreshToken,
  };
}

async function refreshSpotifyToken(refreshToken: string) {
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || 'Failed to refresh Spotify token');
  return {
    accessToken: data.access_token,
    expiresAt: Math.floor(Date.now() / 1000 + data.expires_in),
    refreshToken: data.refresh_token || refreshToken,
  };
}

export async function getAndRefreshPlatformTokens(platform: string): Promise<PlatformTokens | null> {
  const tokens = await getPlatformTokens(platform);
  if (!tokens) return null;

  const now = Math.floor(Date.now() / 1000);
  const buffer = 300; // 5 minute buffer

  if (tokens.expiresAt && now + buffer < tokens.expiresAt) {
    return tokens;
  }

  // Token is expired or about to expire, and we have a refresh token
  if (tokens.refreshToken) {
    try {
      console.log(`[platform-cookies] Refreshing tokens for ${platform}...`);
      const refreshed = platform === 'spotify' 
        ? await refreshSpotifyToken(tokens.refreshToken)
        : await refreshGoogleToken(tokens.refreshToken);
      
      await setPlatformTokens(platform, refreshed);
      return refreshed;
    } catch (e: any) {
      console.error(`[platform-cookies] Refresh failed for ${platform}:`, e.message);
      return null;
    }
  }

  return tokens; // Return as is, hope for the best (or let caller handle 401)
}

export async function clearPlatformTokens(platform: string) {
  const cookieStore = await cookies();
  const name = `${COOKIE_PREFIX}${platform.toUpperCase()}`;
  cookieStore.delete(name);
}

export async function getAllConnectedPlatforms(): Promise<string[]> {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  return allCookies
    .filter((c: any) => c.name.startsWith(COOKIE_PREFIX))
    .map((c: any) => c.name.replace(COOKIE_PREFIX, "").toLowerCase());
}
