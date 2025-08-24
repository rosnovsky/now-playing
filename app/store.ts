import { create } from 'zustand';
import type { Album, Artist, CurrentMusic, Song } from '~/types';

interface StoreState {
  songs: Song[];
  artists: Artist[];
  albums: Album[];
  currentMusic: CurrentMusic | null;
  setData: (dataType: string, data: Song[] | Artist[] | Album[]) => void;
  setCurrentMusic: (currentMusic: CurrentMusic | null) => void;
}

export const useStore = create<StoreState>((set) => ({
  songs: [],
  artists: [],
  albums: [],
  currentMusic: null,
  setData: (dataType, data) => set({ [dataType]: data }),
  setCurrentMusic: (currentMusic) => set({ currentMusic }),
}));
