'use client';
import { useSyncStore } from '@/lib/store/use-sync-store';

export function SyncView({ sourcePlaylistName, totalTracks, currentTrackIndex }: { sourcePlaylistName: string, totalTracks: number, currentTrackIndex: number }) {
  const store = useSyncStore();
  
  return (
    <div className="flex-1 flex flex-col">
      <div className="p-6">
        <div className="flex justify-between items-end mb-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.1em] text-on-surface-variant">
            Syncing: {sourcePlaylistName}
          </h2>
          <span className="text-[10px] font-black text-primary">{Math.round(store.progressPercentage)}%</span>
        </div>
        
        <div className="w-full bg-surface-container-highest h-0.5 mb-2 relative">
          <div 
            className="bg-primary h-0.5 absolute left-0 top-0 transition-all duration-300" 
            style={{ width: `${store.progressPercentage}%` }} 
          />
        </div>
        
        <div className="flex justify-between text-[9px] font-bold uppercase tracking-tighter text-outline mb-6">
          <span>Destination Target</span>
          <span>{currentTrackIndex} / {totalTracks} Tracks Complete</span>
        </div>

        <div className="space-y-px border border-outline-variant/10 max-h-[400px] overflow-y-auto hide-scrollbar">
          {store.syncLogs.map((log, i) => (
            <div key={i} className="flex items-center gap-4 p-2 bg-surface-container-lowest border-b border-outline-variant/10">
              <span className="text-[9px] font-mono text-outline w-4">
                {(i + 1).toString().padStart(2, '0')}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold truncate">{log.replace(/^(Moved|Synced|Skipped|Error): /, '')}</p>
                <p className="text-[9px] text-on-surface-variant uppercase tracking-tighter">
                  {log.split(':')[0] || 'Processed'}
                </p>
              </div>
              {log.includes('Skipped') || log.includes('Error') ? (
                <span className="material-symbols-outlined text-sm text-error">error</span>
              ) : (
                <span className="material-symbols-outlined text-sm text-green-600">check_circle</span>
              )}
            </div>
          ))}
          {store.progressPercentage < 100 && (
            <div className="flex items-center gap-4 p-2 bg-surface-container-lowest border-b border-outline-variant/10">
              <span className="text-[9px] font-mono text-outline w-4">...</span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold truncate">Syncing next batch</p>
              </div>
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
