import { create } from 'zustand';

export type Platform = 'spotify' | 'youtube';

interface SyncState {
  sourcePlatform: Platform;
  destinationPlatform: Platform;
  selectedSourcePlaylistId: string | null;
  selectedDestinationPlaylistId: string | 'CREATE_NEW' | null;
  isSyncing: boolean;
  progressPercentage: number;
  syncLogs: string[];
  globalRefreshKey: number;
  
  setSourcePlatform: (platform: Platform) => void;
  setDestinationPlatform: (platform: Platform) => void;
  setSelectedSourcePlaylist: (id: string | null) => void;
  setSelectedDestinationPlaylist: (id: string | 'CREATE_NEW' | null) => void;
  setIsSyncing: (isSyncing: boolean) => void;
  setProgress: (percentage: number) => void;
  addSyncLog: (log: string) => void;
  swapPlatforms: () => void;
  triggerRefresh: () => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  sourcePlatform: 'spotify',
  destinationPlatform: 'youtube',
  selectedSourcePlaylistId: null,
  selectedDestinationPlaylistId: null,
  isSyncing: false,
  progressPercentage: 0,
  syncLogs: [],

  setSourcePlatform: (platform) => set({ sourcePlatform: platform }),
  setDestinationPlatform: (platform) => set({ destinationPlatform: platform }),
  setSelectedSourcePlaylist: (id) => set({ selectedSourcePlaylistId: id }),
  setSelectedDestinationPlaylist: (id) => set({ selectedDestinationPlaylistId: id }),
  setIsSyncing: (isSyncing) => set({ isSyncing }),
  setProgress: (percentage) => set({ progressPercentage: percentage }),
  addSyncLog: (log) => set((state) => ({ syncLogs: [...state.syncLogs, log] })),
  swapPlatforms: () => set((state) => ({ 
    sourcePlatform: state.destinationPlatform, 
    destinationPlatform: state.sourcePlatform,
    selectedSourcePlaylistId: null,
    selectedDestinationPlaylistId: null,
  })),
  globalRefreshKey: 0,
  triggerRefresh: () => set((state) => ({ globalRefreshKey: state.globalRefreshKey + 1 })),
}));
