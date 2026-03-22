import React from "react";

interface ActionNodeProps {
  isSyncing?: boolean;
  isSyncEnabled?: boolean;
  progressPercentage?: number;
  onSwap?: () => void;
  onSync?: () => void;
  onRefresh?: () => void;
}

export function ActionNode({ isSyncing = false, isSyncEnabled = false, progressPercentage = 0, onSwap, onSync, onRefresh }: ActionNodeProps) {
  return (
    <div className="w-24 flex flex-col items-center justify-center bg-surface relative z-10 gap-6 border-x border-outline-variant/10">
      <div className="h-full w-px bg-outline-variant/20 absolute top-0 left-1/2 -translate-x-1/2"></div>

      {!isSyncing && (
        <button
          onClick={onSwap}
          className="w-10 h-10 bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-20"
          title="Swap platforms"
        >
          <span className="material-symbols-outlined text-primary text-xl">sync_alt</span>
        </button>
      )}

      {!isSyncing && (
        <button
          onClick={onRefresh}
          className="w-10 h-10 bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-20"
          title="Refresh playlists"
        >
          <span className="material-symbols-outlined text-primary text-xl">refresh</span>
        </button>
      )}

      {!isSyncing ? (
        <button
          onClick={isSyncEnabled ? onSync : undefined}
          disabled={!isSyncEnabled}
          className={`group px-4 py-6 flex flex-col items-center justify-center gap-2 z-20 transition-colors ${isSyncEnabled
              ? 'bg-primary text-on-primary hover:bg-zinc-800 cursor-pointer'
              : 'bg-surface-container-highest text-outline cursor-not-allowed'
            }`}
        >
          <span className="text-[10px] font-black uppercase tracking-[0.2em] [writing-mode:vertical-lr] rotate-180">Sync</span>
          <span className="material-symbols-outlined text-lg">arrow_forward</span>
        </button>
      ) : (
        <div className="w-16 h-16 flex items-center justify-center z-20 bg-surface rounded-full">
          <svg className="w-full h-full -rotate-90">
            <circle className="text-surface-container-highest" cx="32" cy="32" fill="transparent" r="28" stroke="currentColor" strokeWidth="2"></circle>
            <circle
              className="text-primary transition-all duration-300"
              cx="32" cy="32" fill="transparent" r="28" stroke="currentColor"
              strokeDasharray="175.9"
              strokeDashoffset={175.9 - (175.9 * progressPercentage) / 100}
              strokeWidth="2"
            ></circle>
          </svg>
          <span className="absolute text-[9px] font-black">{Math.round(progressPercentage)}%</span>
        </div>
      )}
    </div>
  );
}
