import type { Platform } from '@/lib/store/use-sync-store';
import type { Session } from 'next-auth';

/** Shape returned by the /api/playlists endpoint */
export interface Playlist {
  id: string;
  name: string;
  trackCount: number;
  imageUrl?: string;
}

/** Extended NextAuth session that includes the per-platform connection map */
export interface SingornizerSession extends Session {
  connectedPlatforms?: Partial<Record<Platform, boolean>>;
}
