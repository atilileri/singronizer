'use client';
import { useState, useEffect } from 'react';
import { PlaylistItem } from '@/components/playlist/playlist-item';
import { useSyncStore, Platform } from '@/lib/store/use-sync-store';
import { useSession, signIn } from 'next-auth/react';

const providerMap: Record<Platform, string> = {
  spotify: 'spotify',
  youtube: 'google'
};

const platformLabels: Record<Platform, string> = {
  spotify: 'Spotify',
  youtube: 'YouTube Music'
};

export function Panel({ isSource }: { isSource: boolean }) {
  const store = useSyncStore();
  const { data: session, update, status } = useSession();
  const platform = isSource ? store.sourcePlatform : store.destinationPlatform;
  const isConnected = (session as any)?.connectedPlatforms?.[platform] ?? false;
  const isAuthLoading = status === 'loading';
  
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleConnect = async () => {
    setIsSigningIn(true);
    // Note: NextAuth signIn usually triggers a redirect, 
    // but the spinner provides immediate feedback until the page unloads.
    try {
      await signIn(providerMap[platform], { callbackUrl: 'http://127.0.0.1:3000/' });
    } catch (e) {
      console.error("[Panel] Sign in error:", e);
      setIsSigningIn(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    await update(); // Force NextAuth to pull the latest session/tokens
    setRefreshKey(k => k + 1);
  };

  useEffect(() => {
    async function fetchPlaylists() {
      if (!session || !isConnected) {
        setPlaylists([]);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/playlists?platform=${platform}`);
        if(res.ok) {
           const data = await res.json();
           setPlaylists(data || []);
        } else if (res.status === 401) {
           console.error(`[Panel] 401 Unauthorized for ${platform}. Triggering re-auth.`);
           setPlaylists([]);
           handleConnect();
        } else {
           const errorData = await res.text();
           console.error(`[Panel] Error fetching playlists for ${platform}:`, res.status, errorData);
           setPlaylists([]);
        }
      } catch (e) {
         console.error(`[Panel] Network/Fetch error:`, e);
      }
      setLoading(false);
    }
    fetchPlaylists();
  }, [platform, session, isConnected, refreshKey]);

  const handlePlatformChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPlatform = e.target.value as Platform;
    if (isSource) store.setSourcePlatform(newPlatform);
    else store.setDestinationPlatform(newPlatform);
  };

  return (
    <section className={`flex-1 flex flex-col bg-surface ${isSource ? 'border-r border-outline-variant/10 bg-surface-container-low' : ''}`}>
      <div className={`px-6 py-3 bg-surface border-b border-outline-variant/10 flex items-center justify-between ${!isSource ? 'flex-row-reverse bg-surface-container' : ''}`}>
        <div className="flex items-center gap-2">
          <div className="relative">
            <select 
              value={platform} 
              onChange={handlePlatformChange}
              className="appearance-none bg-surface-container-highest hover:bg-surface-container-high transition-colors px-3 py-1.5 pr-8 text-[10px] font-bold uppercase tracking-wider outline-none cursor-pointer"
            >
              <option value="spotify">Spotify</option>
              <option value="youtube">YouTube Music</option>
            </select>
            <span className="material-symbols-outlined text-sm absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">expand_more</span>
          </div>
          {isConnected && (
            <button 
              onClick={handleRefresh} 
              disabled={loading}
              className="p-1 hover:bg-surface-container-highest transition-colors rounded disabled:opacity-50 flex items-center justify-center text-outline"
              title="Refresh playlists"
            >
              <span className={`material-symbols-outlined text-sm ${loading ? 'animate-spin' : ''}`}>refresh</span>
            </button>
          )}
        </div>
        <div className={`relative flex-1 max-w-[200px] ${isSource ? 'ml-4' : 'mr-4'}`}>
          <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-sm text-outline">search</span>
          <input className="w-full bg-surface-container-lowest border-none text-[11px] py-1.5 pl-8 focus:outline-none focus:ring-1 focus:ring-primary/20 placeholder:text-outline/60" placeholder="Search playlists..." type="text" />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto hide-scrollbar px-6 py-4 space-y-1 relative">
        {isAuthLoading || isSigningIn ? (
            <div className="absolute inset-0 flex items-center justify-center text-center px-6">
              <div className="text-outline text-xs uppercase tracking-widest font-bold flex flex-col items-center gap-3">
                <span className="material-symbols-outlined animate-spin text-xl">refresh</span>
                <div>{isSigningIn ? `Redirecting to ${platformLabels[platform]}...` : 'Loading Auth...'}</div>
              </div>
            </div>
        ) : !isConnected ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <button 
              onClick={handleConnect} 
              className="bg-primary hover:bg-zinc-800 text-on-primary transition-colors px-6 py-3 text-[10px] font-black uppercase tracking-widest"
            >
              Connect {platformLabels[platform]}
            </button>
          </div>
        ) : (
          <>
            {!isSource && !store.isSyncing && (
              <PlaylistItem 
                title="Create New Playlist" 
                subtitle="Initialize empty collection" 
                isSpecialAction 
                isSelected={store.selectedDestinationPlaylistId === 'CREATE_NEW'}
                onClick={() => store.setSelectedDestinationPlaylist('CREATE_NEW')}
              />
            )}
            
            {loading ? (
              <div className="p-4 text-center text-outline text-xs uppercase tracking-widest font-bold">Loading...</div>
            ) : (
              !store.isSyncing || isSource ? (
                playlists.map(p => (
                  <PlaylistItem
                    key={p.id}
                    title={p.name}
                    subtitle={`${p.trackCount} Tracks`}
                    imageUrl={p.imageUrl}
                    isSelected={isSource ? store.selectedSourcePlaylistId === p.id : store.selectedDestinationPlaylistId === p.id}
                    onClick={() => isSource ? store.setSelectedSourcePlaylist(p.id) : store.setSelectedDestinationPlaylist(p.id)}
                  />
                ))
              ) : null
            )}
          </>
        )}
      </div>
    </section>
  );
}
