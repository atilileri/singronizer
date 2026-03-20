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
