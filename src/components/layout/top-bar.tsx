'use client';
import React, { useState, useRef, useEffect } from "react";
import { useSyncStore, Platform } from '@/lib/store/use-sync-store';

const SpotifyIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.59 14.42c-.18.3-.58.4-.88.22-2.39-1.46-5.39-1.79-8.93-.98-.34.08-.67-.14-.75-.48-.08-.34.14-.67.48-.75 3.87-.89 7.18-.5 9.86 1.13.3.18.4.58.22.88zM17.81 13.7c-.23.37-.71.48-1.07.26-2.73-1.68-6.89-2.16-10.12-1.18-.41.12-.84-.11-.97-.52-.13-.41.11-.84.52-.97 3.69-1.12 8.27-.57 11.39 1.34.36.23.47.71.25 1.07zm.11-2.83C14.37 8.81 8.34 8.61 4.85 9.67c-.56.17-1.14-.15-1.31-.7-.17-.56.15-1.14.71-1.31 4.02-1.22 10.7-1 14.82 1.44.5.3.67.94.37 1.44-.3.5-.94.67-1.44.37z" />
  </svg>
);

const YouTubeIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm6 1c0 3.31-2.69 6-6 6s-6-2.69-6-6 2.69-6 6-6 6 2.69 6 6z" />
  </svg>
);

const CoffeeIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M2 21h18c.6 0 1-.4 1-1v-3c0-.6-.4-1-1-1H2c-.6 0-1 .4-1 1v3c0 .6.4 1 1 1zM20 8h-2V5c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10h14c1.1 0 2-.9 2-2v-1h2c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm0 5h-2v-3h2v3z" />
  </svg>
);

const platformOptions: { value: Platform; label: string; icon: React.FC<{ className?: string }> }[] = [
  { value: 'spotify', label: 'Spotify', icon: SpotifyIcon },
  { value: 'youtube', label: 'YouTube Music', icon: YouTubeIcon },
];

function PlatformDropdown({
  value,
  onChange,
  label,
  hideName = false,
  hideLabel = false,
  labelClassName = "",
}: {
  value: Platform;
  onChange: (p: Platform) => void;
  label: string;
  hideName?: boolean;
  hideLabel?: boolean;
  labelClassName?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = platformOptions.find(o => o.value === value);
  const Icon = selectedOption?.icon || (() => null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex items-center gap-2">
      {!hideLabel && (
        <span className={`text-[9px] font-bold uppercase tracking-widest text-outline ${labelClassName}`}>{label}</span>
      )}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 bg-surface-container-highest hover:bg-surface-container-high transition-colors px-3 py-1.5 min-w-[40px] h-[32px] outline-none cursor-pointer group rounded-none"
        >
          <Icon className="w-4 h-4 text-on-surface opacity-70 group-hover:opacity-100 transition-opacity grayscale" />
          {!hideName && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface group-hover:opacity-100 opacity-70 transition-opacity">{selectedOption?.label}</span>
          )}
          <span className="material-symbols-outlined text-sm text-outline group-hover:text-on-surface pointer-events-none">expand_more</span>
        </button>

        {isOpen && (
          <div className="absolute bottom-full left-0 mb-1 bg-surface-container-highest border border-outline-variant/20 shadow-xl z-60 min-w-max origin-bottom animate-in fade-in slide-in-from-bottom-2 duration-200">
            {platformOptions.map((o) => {
              const OptionIcon = o.icon;
              return (
                <button
                  key={o.value}
                  onClick={() => {
                    onChange(o.value);
                    setIsOpen(false);
                  }}
                  className={`flex items-center gap-3 w-full p-2 px-3 hover:bg-surface-container-high transition-colors ${value === o.value ? 'bg-surface-container-high' : ''}`}
                  title={o.label}
                >
                  <OptionIcon className={`w-4 h-4 ${value === o.value ? 'text-primary opacity-100' : 'text-on-surface opacity-70'} grayscale`} />
                  <span className={`text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${value === o.value ? 'text-primary opacity-100' : 'text-on-surface opacity-70'}`}>
                    {o.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}
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

export { PlatformDropdown };

export function TopBar({ isSyncEnabled = false, isSyncing = false, progressPercentage = 0, onSync }: TopBarProps) {
  const store = useSyncStore();

  return (
    <header className="grid grid-cols-[1fr_auto_1fr] items-center w-full px-6 py-4 max-w-full bg-background text-on-surface font-['Inter'] antialiased text-sm tracking-tight fixed top-0 z-50 border-b border-outline-variant/10">
      {/* Left: logo — always visible */}
      <div className="text-2xl font-black tracking-tighter text-primary">singronizer</div>

      {/* Center: cluster — hidden below sm, visible sm+ */}
      <div className="hidden sm:flex items-center gap-3">
        {/* Swap */}
        {!isSyncing && (
          <button
            onClick={store.swapPlatforms}
            className="flex items-center gap-1.5 px-3 py-1.5 h-[32px] hover:bg-surface-container-high transition-colors text-[10px] font-black uppercase tracking-widest text-on-surface"
            title="Swap platforms"
          >
            <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
            <span className="hidden lg:inline">Swap</span>
          </button>
        )}

        <PlatformDropdown
          label="From"
          value={store.sourcePlatform}
          onChange={(p) => store.setSourcePlatform(p)}
          labelClassName="hidden lg:inline"
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

        <PlatformDropdown
          label="To"
          value={store.destinationPlatform}
          onChange={(p) => store.setDestinationPlatform(p)}
          labelClassName="hidden lg:inline"
        />

        {/* Refresh */}
        {!isSyncing && (
          <button
            onClick={store.triggerRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 h-[32px] hover:bg-surface-container-high transition-colors text-[10px] font-black uppercase tracking-widest text-on-surface"
            title="Refresh playlists"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            <span className="hidden lg:inline">Refresh</span>
          </button>
        )}
      </div>

      {/* Right: buy me a coffee — always visible */}
      <div className="flex items-center justify-end col-start-3">
        <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-surface-container-high transition-colors px-3 py-1.5 text-on-surface group">
          <CoffeeIcon className="w-4 h-4 text-on-surface opacity-70 group-hover:opacity-100 transition-opacity grayscale" />
          <span className="hidden lg:inline">buy me a coffee</span>
        </button>
      </div>
    </header>
  );
}
