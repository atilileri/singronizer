'use client';
import { useState, useEffect } from 'react';
import { TopBar, PlatformDropdown } from "@/components/layout/top-bar";
import { Panel } from "@/components/layout/panel";
import { useSyncStore } from "@/lib/store/use-sync-store";
import { SyncView } from "@/components/sync/sync-view";
import { useSession } from "next-auth/react";
import type { SingornizerSession } from "@/lib/types";

export default function Home() {
  const store = useSyncStore();
  const { data: session } = useSession();
  const [totalTracks, setTotalTracks] = useState(0);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [sourceName, setSourceName] = useState("");
  const [mobileStep, setMobileStep] = useState<'source' | 'target'>('source');
  const [isMobile, setIsMobile] = useState(false);

  const singSession = session as SingornizerSession;
  const isBothConnected = !!singSession?.connectedPlatforms?.[store.sourcePlatform] && 
                          !!singSession?.connectedPlatforms?.[store.destinationPlatform];
  const useMobileWizard = isMobile && isBothConnected;

  // Sync mobile step with platform changes or refresh
  useEffect(() => {
    setMobileStep('source');
  }, [store.sourcePlatform, store.destinationPlatform, store.globalRefreshKey]);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 639px)"); // < sm
    const onChange = (e: MediaQueryListEvent | MediaQueryList) => setIsMobile(e.matches);
    onChange(mql);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const isSyncEnabled =
    !!store.selectedSourcePlaylistId &&
    !!store.selectedDestinationPlaylistId &&
    !!session;

  const handleSync = async () => {
    if (!store.selectedSourcePlaylistId || !store.selectedDestinationPlaylistId || !session) {
      alert("Please sign in and select both a source and destination playlist to sync.");
      return;
    }

    store.setIsSyncing(true);
    store.setProgress(0);
    setCurrentTrackIndex(0);

    try {
      const res = await fetch(
        `/api/tracks/${store.selectedSourcePlaylistId}?platform=${store.sourcePlatform}`
      );
      const tracks: { id: string; name: string }[] = await res.json();
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
            description: 'Created by singronizer App',
          }),
        });
        const created: { id: string } = await createRes.json();
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
            tracks: chunk,
          }),
        });

        const syncData: { log: string[] } = await syncRes.json();
        syncData.log.forEach((l) => store.addSyncLog(l));

        completed += chunk.length;
        setCurrentTrackIndex(Math.min(completed, tracks.length));
        store.setProgress(
          (Math.min(completed, tracks.length) / tracks.length) * 100
        );
      }
    } catch (err) {
      console.error(err);
      store.addSyncLog('Critical Error: Execution Pipeline failed. Check console.');
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

      <main className={`layout-main ${useMobileWizard ? 'mobile-wizard-active' : ''}`}>
        {/* Desktop View / Multi-panel */}
        {!useMobileWizard && (
          <>
            <Panel isSource={true} />
            {store.isSyncing ? (
              <SyncView
                sourcePlaylistName={sourceName}
                totalTracks={totalTracks}
                currentTrackIndex={currentTrackIndex}
              />
            ) : (
              <Panel isSource={false} />
            )}
          </>
        )}

        {/* Mobile Wizard View */}
        {useMobileWizard && (
          <div className="flex-1 flex flex-col min-h-0 w-full animate-in fade-in duration-500">
            {mobileStep === 'source' ? (
              <div className="flex-1 flex flex-col min-h-0 space-y-4">
                <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                  <Panel isSource={true} onPlaylistSelect={() => setMobileStep('target')} />
                </div>
                <div className="px-6 py-2">
                  <button 
                    onClick={() => setMobileStep('target')}
                    className="w-full btn-primary flex items-center justify-center gap-2 group"
                  >
                    Next: Choose Target
                    <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0 space-y-4">
                <div className="px-6 py-0">
                  <button 
                    onClick={() => setMobileStep('source')}
                    className="w-full flex items-center justify-center gap-2 py-2 text-outline hover:text-on-surface transition-colors text-[10px] uppercase font-black tracking-widest"
                  >
                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                    Previous: Change Source
                  </button>
                </div>
                <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                  {store.isSyncing ? (
                    <SyncView
                      sourcePlaylistName={sourceName}
                      totalTracks={totalTracks}
                      currentTrackIndex={currentTrackIndex}
                    />
                  ) : (
                    <Panel isSource={false} />
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom bar — cluster (hidden when keyboard might be up or just standard mobile cluster) */}
      <nav className="bottom-nav-mobile">
        {/* Swap */}
        {!store.isSyncing && (
          <button
            onClick={store.swapPlatforms}
            className="btn-icon"
            title="Swap platforms"
          >
            <span className="material-symbols-outlined text-[18px] text-on-surface">
              swap_horiz
            </span>
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
          <div
            className="relative w-8 h-8 flex items-center justify-center"
            title={`${Math.round(store.progressPercentage)}%`}
          >
            <svg className="w-7 h-7 -rotate-90" viewBox="0 0 32 32">
              <circle
                className="text-surface-container-highest"
                cx="16" cy="16" fill="transparent" r="13"
                stroke="currentColor" strokeWidth="2"
              />
              <circle
                className="text-primary transition-all duration-300"
                cx="16" cy="16" fill="transparent" r="13"
                stroke="currentColor"
                strokeDasharray="81.7"
                strokeDashoffset={81.7 - (81.7 * store.progressPercentage) / 100}
                strokeWidth="2"
              />
            </svg>
            <span className="absolute text-[8px] font-black leading-none">
              {Math.round(store.progressPercentage)}%
            </span>
          </div>
        ) : (
          <button
            onClick={isSyncEnabled ? handleSync : undefined}
            disabled={!isSyncEnabled}
            className={`btn-primary-compact ${!isSyncEnabled ? 'btn-disabled' : 'cursor-pointer'}`}
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
            className="btn-icon"
            title="Refresh playlists"
          >
            <span className="material-symbols-outlined text-[18px] text-on-surface">
              refresh
            </span>
          </button>
        )}
      </nav>
    </>
  );
}
