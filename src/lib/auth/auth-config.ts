import NextAuth from "next-auth";
import Spotify from "next-auth/providers/spotify";
import Google from "next-auth/providers/google";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Spotify({
      authorization:
        "https://accounts.spotify.com/authorize?scope=user-read-email,playlist-read-private,playlist-modify-public,playlist-modify-private",
    }),
    Google({
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope:
            "openid email profile https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        if (account.provider === "spotify") {
          token.spotifyAccessToken = account.access_token;
          token.spotifyRefreshToken = account.refresh_token;
        }
        if (account.provider === "google") {
          token.youtubeAccessToken = account.access_token;
          token.youtubeRefreshToken = account.refresh_token;
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Expose minimal info to the client-side session.
      // The tokens stay inside the encrypted JWT token, which is stored in the HttpOnly cookie.
      // Browser Javascript can never access `token.spotifyAccessToken` etc.
      return session;
    },
  },
});
