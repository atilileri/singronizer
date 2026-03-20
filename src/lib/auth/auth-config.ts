import NextAuth from "next-auth";
import Spotify from "next-auth/providers/spotify";
import Google from "next-auth/providers/google";
import { setPlatformTokens, getAllConnectedPlatforms, getPlatformTokens } from "./platform-cookies";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  cookies: {
    callbackUrl: {
      options: {
        domain: "127.0.0.1",
        secure: false,
        sameSite: "lax",
        path: "/",
        httpOnly: true,
      },
    },
    sessionToken: {
      options: {
        domain: "127.0.0.1",
        secure: false,
        sameSite: "lax",
        path: "/",
        httpOnly: true,
      },
    },
    csrfToken: {
      options: {
        domain: "127.0.0.1",
        secure: false,
        sameSite: "lax",
        path: "/",
        httpOnly: true,
      },
    },
  },
  providers: [
    Spotify({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      authorization: {
        url: "https://accounts.spotify.com/authorize",
        params: {
          scope: "user-read-email,playlist-read-private,playlist-read-collaborative,playlist-modify-public,playlist-modify-private,user-library-read",
          redirect_uri: "http://127.0.0.1:3000/api/auth/callback/spotify"
        }
      }
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/youtube.force-ssl",
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async jwt({ token, account }: any) {
      if (account) {
        // Generic logic: whatever platform you just logged into, save it to its OWN cookie
        const platformKey = account.provider === "google" ? "youtube" : account.provider;
        
        setPlatformTokens(platformKey, {
          accessToken: account.access_token as string,
          refreshToken: account.refresh_token as string,
          expiresAt: account.expires_at as number,
        });

        // Also keep them in the JWT for this specific request cycle
        token[`${platformKey}AccessToken`] = account.access_token;
      }
      return token;
    },
    async session({ session, token }: any) {
      // Very generic: look through ALL singronizer cookies and tell the UI what's connected
      const connected = await getAllConnectedPlatforms();
      session.connectedPlatforms = connected.reduce((acc: any, p: string) => ({ ...acc, [p]: true }), {});
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Unconditionally force any localhost redirect back to 127.0.0.1 
      // to keep the session cookie valid in the browser.
      const targetUrl = url.includes("localhost") 
        ? url.replace("localhost", "127.0.0.1") 
        : url;
        
      const targetBase = baseUrl.includes("localhost")
        ? baseUrl.replace("localhost", "127.0.0.1")
        : baseUrl;

      return targetUrl.startsWith(targetBase) ? targetUrl : targetBase;
    },
  },
});
