'use client';
import React from "react";
import { useSyncStore, Platform } from '@/lib/store/use-sync-store';

const platformOptions: { value: Platform; label: string }[] = [
  { value: 'spotify', label: 'Spotify' },
  { value: 'youtube', label: 'YouTube Music' },
];

function PlatformDropdown({
  value,
  onChange,
  label,
}: {
  value: Platform;
  onChange: (p: Platform) => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] font-bold uppercase tracking-widest text-outline">{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as Platform)}
          className="appearance-none bg-surface-container-highest hover:bg-surface-container-high transition-colors px-3 py-1.5 pr-8 text-[10px] font-bold uppercase tracking-wider outline-none cursor-pointer"
        >
          {platformOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <span className="material-symbols-outlined text-sm absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">expand_more</span>
      </div>
    </div>
  );
}

interface TopBarProps {
  isSyncEnabled?: boolean;
  isSyncing?: boolean;
  progressPercentage?: number;
  onSync?: () => void;
}

export function TopBar({ isSyncEnabled = false, isSyncing = false, progressPercentage = 0, onSync }: TopBarProps) {
  const store = useSyncStore();

  return (
    <header className="grid grid-cols-[1fr_auto_1fr] items-center w-full px-8 py-4 max-w-full bg-background text-on-surface font-['Inter'] antialiased text-sm tracking-tight fixed top-0 z-50 border-b border-outline-variant/10">
      {/* Left: logo */}
      <div className="text-2xl font-black tracking-tighter text-primary">singronizer</div>

      {/* Center: from · refresh · swap · to · sync */}
      <div className="flex items-center gap-3">
        <PlatformDropdown
          label="From"
          value={store.sourcePlatform}
          onChange={(p) => store.setSourcePlatform(p)}
        />

        {/* Refresh */}
        {!isSyncing && (
          <button
            onClick={store.triggerRefresh}
            className="w-8 h-8 flex items-center justify-center hover:bg-surface-container-high transition-colors"
            title="Refresh playlists"
          >
            <span className="material-symbols-outlined text-[18px] text-on-surface">refresh</span>
          </button>
        )}

        {/* Swap */}
        {!isSyncing && (
          <button
            onClick={store.swapPlatforms}
            className="w-8 h-8 flex items-center justify-center hover:bg-surface-container-high transition-colors"
            title="Swap platforms"
          >
            <span className="material-symbols-outlined text-[18px] text-on-surface">swap_horiz</span>
          </button>
        )}

        <PlatformDropdown
          label="To"
          value={store.destinationPlatform}
          onChange={(p) => store.setDestinationPlatform(p)}
        />

        {/* Sync / Progress */}
        {isSyncing ? (
          <div className="relative w-8 h-8 flex items-center justify-center" title={`${Math.round(progressPercentage)}%`}>
            <svg className="w-7 h-7 -rotate-90" viewBox="0 0 32 32">
              <circle className="text-surface-container-highest" cx="16" cy="16" fill="transparent" r="13" stroke="currentColor" strokeWidth="2" />
              <circle
                className="text-primary transition-all duration-300"
                cx="16" cy="16" fill="transparent" r="13" stroke="currentColor"
                strokeDasharray="81.7"
                strokeDashoffset={81.7 - (81.7 * progressPercentage) / 100}
                strokeWidth="2"
              />
            </svg>
            <span className="absolute text-[8px] font-black leading-none">{Math.round(progressPercentage)}%</span>
          </div>
        ) : (
          <button
            onClick={isSyncEnabled ? onSync : undefined}
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
      </div>

      {/* Right: buy me a coffee — far right anchor */}
      <div className="flex items-center justify-end">
        <button className="text-[10px] font-black uppercase tracking-widest hover:bg-surface-container-high transition-colors px-2 py-1 text-on-surface">
          buy me a coffee
        </button>
      </div>
    </header>
  );
}
