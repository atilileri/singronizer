import NextAuth from "next-auth";
import Spotify from "next-auth/providers/spotify";
import Google from "next-auth/providers/google";

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
    async jwt({ token, account, profile }: any) {
      // Add the account data to the token on initial sign in
      if (account) {
        if (account.provider === "spotify") {
          token.spotifyAccessToken = account.access_token;
          token.spotifyRefreshToken = account.refresh_token;
          token.spotifyExpiresAt = account.expires_at;
          token.spotifyConnected = true;
        }
        if (account.provider === "google") {
          token.youtubeAccessToken = account.access_token;
          token.youtubeRefreshToken = account.refresh_token;
          token.youtubeExpiresAt = account.expires_at;
          token.youtubeConnected = true;
        }
      }
      return token;
    },
    async session({ session, token }: any) {
      // Populate session with persistent platform connection info
      session.connectedPlatforms = {
        spotify: !!token.spotifyConnected || !!token.spotifyAccessToken,
        youtube: !!token.youtubeConnected || !!token.youtubeAccessToken,
      };
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
