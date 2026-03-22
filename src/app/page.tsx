'use client';
import { useState } from 'react';
import { TopBar, PlatformDropdown } from "@/components/layout/top-bar";
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

  const isSyncEnabled = !!store.selectedSourcePlaylistId && !!store.selectedDestinationPlaylistId && !!session;

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
      <TopBar
        isSyncEnabled={isSyncEnabled}
        isSyncing={store.isSyncing}
        progressPercentage={store.progressPercentage}
        onSync={handleSync}
      />

      {/* Main content — extra bottom padding on mobile to clear the bottom bar */}
      <main className="flex h-screen pt-[72px] pb-16 sm:pb-0 bg-surface">
        <Panel isSource={true} />
        {store.isSyncing ? (
          <section className="w-1/2 min-w-0 flex flex-col bg-surface">
            <SyncView
              sourcePlaylistName={sourceName}
              totalTracks={totalTracks}
              currentTrackIndex={currentTrackIndex}
            />
          </section>
        ) : (
          <Panel isSource={false} />
        )}
      </main>

      {/* Bottom bar — only visible below sm breakpoint */}
      <nav className="sm:hidden fixed bottom-0 left-0 w-full z-50 flex items-center justify-center gap-3 px-4 py-3 bg-background border-t border-outline-variant/10">
        {/* Swap */}
        {!store.isSyncing && (
          <button
            onClick={store.swapPlatforms}
            className="w-8 h-8 flex items-center justify-center hover:bg-surface-container-high transition-colors"
            title="Swap platforms"
          >
            <span className="material-symbols-outlined text-[18px] text-on-surface">swap_horiz</span>
          </button>
        )}

        <PlatformDropdown
          label="From"
          value={store.sourcePlatform}
          onChange={(p) => store.setSourcePlatform(p)}
          hideName={true}
          hideLabel={true}
        />

        {/* Sync / Progress */}
        {store.isSyncing ? (
          <div className="relative w-8 h-8 flex items-center justify-center" title={`${Math.round(store.progressPercentage)}%`}>
            <svg className="w-7 h-7 -rotate-90" viewBox="0 0 32 32">
              <circle className="text-surface-container-highest" cx="16" cy="16" fill="transparent" r="13" stroke="currentColor" strokeWidth="2" />
              <circle
                className="text-primary transition-all duration-300"
                cx="16" cy="16" fill="transparent" r="13" stroke="currentColor"
                strokeDasharray="81.7"
                strokeDashoffset={81.7 - (81.7 * store.progressPercentage) / 100}
                strokeWidth="2"
              />
            </svg>
            <span className="absolute text-[8px] font-black leading-none">{Math.round(store.progressPercentage)}%</span>
          </div>
        ) : (
          <button
            onClick={isSyncEnabled ? handleSync : undefined}
            disabled={!isSyncEnabled}
            className={`flex items-center gap-1.5 px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-colors ${
              isSyncEnabled
                ? 'bg-primary text-on-primary hover:bg-zinc-800 cursor-pointer'
                : 'bg-surface-container-highest text-outline cursor-not-allowed'
            }`}
          >
            Sync
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </button>
        )}

        <PlatformDropdown
          label="To"
          value={store.destinationPlatform}
          onChange={(p) => store.setDestinationPlatform(p)}
          hideName={true}
          hideLabel={true}
        />

        {/* Refresh */}
        {!store.isSyncing && (
          <button
            onClick={store.triggerRefresh}
            className="w-8 h-8 flex items-center justify-center hover:bg-surface-container-high transition-colors"
            title="Refresh playlists"
          >
            <span className="material-symbols-outlined text-[18px] text-on-surface">refresh</span>
          </button>
        )}
      </nav>
    </>
  );
}
