'use client';
import { useSyncStore } from '@/lib/store/use-sync-store';

interface SyncViewProps {
  sourcePlaylistName: string;
  totalTracks: number;
  currentTrackIndex: number;
}

export function SyncView({ sourcePlaylistName, totalTracks, currentTrackIndex }: SyncViewProps) {
  const store = useSyncStore();
  
  return (
    <section className="panel-section">
      <div className="flex-1 flex flex-col p-6 min-h-0">
        <div className="flex-none">
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
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
        </div>

        {/* This container now takes all remaining space and scrolls internally */}
        <div className="flex-1 min-h-0 space-y-px border border-outline-variant/10 overflow-y-auto hide-scrollbar">
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
    </section>
  );
}
