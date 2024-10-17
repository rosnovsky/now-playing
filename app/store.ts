import { create } from 'zustand';
import { Album, Artist, Song } from '~/types';

interface StoreState {
  songs: Song[];
  artists: Artist[];
  albums: Album[];
  setData: (dataType: string, data: Song[] | Artist[] | Album[]) => void;
}

export const useStore = create<StoreState>((set) => ({
  songs: [],
  artists: [],
  albums: [],
  setData: (dataType, data) => set({ [dataType]: data }),
}));
