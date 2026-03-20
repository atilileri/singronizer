'use client';
import { useState } from 'react';
import { TopBar } from "@/components/layout/top-bar";
import { ActionNode } from "@/components/layout/action-node";
import { Panel } from "@/components/layout/panel";
import { useSyncStore } from "@/lib/store/use-sync-store";
import { SyncView } from "@/components/sync/sync-view";
import { useSession } from "next-auth/react";

export default function Home() {
  const store = useSyncStore();
  const { data: session } = useSession();
  const [totalTracks, setTotalTracks] = useState(0);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [sourceName, setSourceName] = useState("");

  const handleSync = async () => {
    if (!store.selectedSourcePlaylistId || !store.selectedDestinationPlaylistId || !session) {
      alert("Please sign in and select both a source and destination playlist to sync.");
      return;
    }
    
    store.setIsSyncing(true);
    store.setProgress(0);
    setCurrentTrackIndex(0);
    
    try {
      const res = await fetch(`/api/tracks/${store.selectedSourcePlaylistId}?platform=${store.sourcePlatform}`);
      const tracks = await res.json();
      setTotalTracks(tracks.length);
      setSourceName(`Selected Collection (${tracks.length} Items)`);

      let targetId = store.selectedDestinationPlaylistId;

      if (targetId === 'CREATE_NEW') {
        const createRes = await fetch('/api/playlists/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            platform: store.destinationPlatform, 
            name: `Synced from ${store.sourcePlatform} via singronizer`, 
            description: 'Created by singronizer App' 
          })
        });
        const created = await createRes.json();
        targetId = created.id;
      }

      const CHUNK_SIZE = 20;
      let completed = 0;
      
      for (let i = 0; i < tracks.length; i += CHUNK_SIZE) {
        const chunk = tracks.slice(i, i + CHUNK_SIZE);
        
        const syncRes = await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
             destinationPlatform: store.destinationPlatform,
             targetPlaylistId: targetId,
             tracks: chunk
          })
        });

        const syncData = await syncRes.json();
        syncData.log.forEach((l: string) => store.addSyncLog(l));
        
        completed += chunk.length;
        setCurrentTrackIndex(Math.min(completed, tracks.length));
        store.setProgress((Math.min(completed, tracks.length) / tracks.length) * 100);
      }
      
    } catch (e) {
      console.error(e);
      store.addSyncLog(`Critical Error: Execution Pipeline failed. Check console.`);
    }
  };

  return (
    <>
      <TopBar />
      <main className="flex h-screen pt-[72px] bg-surface">
        <Panel isSource={true} />
        <ActionNode 
          isSyncing={store.isSyncing} 
          progressPercentage={store.progressPercentage} 
          onSwap={store.swapPlatforms} 
          onSync={handleSync} 
        />
        {store.isSyncing ? (
          <section className="flex-1 flex flex-col bg-surface">
            <div className="px-6 py-3 bg-surface-container border-b border-outline-variant/10 flex items-center justify-between">
              <button className="flex items-center gap-2 bg-surface-container-lowest hover:bg-surface-container-high transition-colors px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider">
                {store.destinationPlatform === 'spotify' ? 'Spotify' : 'YouTube Music'} <span className="material-symbols-outlined text-sm">expand_more</span>
              </button>
            </div>
            <SyncView 
              sourcePlaylistName={sourceName} 
              totalTracks={totalTracks} 
              currentTrackIndex={currentTrackIndex} 
            />
          </section>
        ) : (
          <Panel isSource={false} />
        )}

        <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center bg-white/80 backdrop-blur-xl border-t border-zinc-200/20 md:hidden h-16 shadow-[0_-12px_40px_rgba(0,0,0,0.04)]">
          <a className="flex flex-col items-center justify-center text-zinc-900 bg-zinc-100/50 p-4 w-full h-full">
            <span className="material-symbols-outlined">sync_alt</span>
            <span className="font-['Inter'] text-[10px] uppercase tracking-[0.05em] font-bold mt-1">Sync</span>
          </a>
        </nav>
      </main>
    </>
  );
}
