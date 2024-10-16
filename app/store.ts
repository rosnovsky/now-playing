import { create } from 'zustand';
import { Album } from './routes/api.albums';
import { Artist } from './routes/api.artists';
import { Song } from './routes/api.songs';

interface StoreState {
  songs: Song[];
  artists: Artist[];
  albums: Album[];
  setData: (dataType: string, data: any[]) => void;
}

export const useStore = create<StoreState>((set) => ({
  songs: [],
  artists: [],
  albums: [],
  setData: (dataType, data) => set({ [dataType]: data }),
}));
