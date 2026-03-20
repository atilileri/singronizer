'use client';
import { useState, useEffect } from 'react';
import { PlaylistItem } from '@/components/playlist/playlist-item';
import { useSyncStore } from '@/lib/store/use-sync-store';
import { useSession } from 'next-auth/react';

export function Panel({ isSource }: { isSource: boolean }) {
  const store = useSyncStore();
  const { data: session } = useSession();
  const platform = isSource ? store.sourcePlatform : store.destinationPlatform;
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchPlaylists() {
      if (!session) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/playlists?platform=${platform}`);
        if(res.ok) {
           const data = await res.json();
           setPlaylists(data || []);
        }
      } catch (e) {}
      setLoading(false);
    }
    fetchPlaylists();
  }, [platform, session]);

  return (
    <section className={`flex-1 flex flex-col bg-surface ${isSource ? 'border-r border-outline-variant/10 bg-surface-container-low' : ''}`}>
      <div className={`px-6 py-3 bg-surface border-b border-outline-variant/10 flex items-center justify-between ${!isSource ? 'flex-row-reverse bg-surface-container' : ''}`}>
        <button className="flex items-center gap-2 bg-surface-container-highest hover:bg-surface-container-high transition-colors px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider">
          {platform === 'spotify' ? 'Spotify' : 'YouTube Music'} <span className="material-symbols-outlined text-sm">expand_more</span>
        </button>
        <div className={`relative flex-1 max-w-[200px] ${isSource ? 'ml-4' : 'mr-4'}`}>
          <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-sm text-outline">search</span>
          <input className="w-full bg-surface-container-lowest border-none text-[11px] py-1.5 pl-8 focus:outline-none focus:ring-1 focus:ring-primary/20 placeholder:text-outline/60" placeholder="Search playlists..." type="text" />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto hide-scrollbar px-6 py-4 space-y-1">
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
      </div>
    </section>
  );
}
