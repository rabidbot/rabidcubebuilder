import { create } from 'zustand';
import type { CollectionEntry } from '../lib/types';

interface CollectionState {
  collection: CollectionEntry[];
  setCollection: (entries: CollectionEntry[]) => void;
  addEntries: (entries: CollectionEntry[]) => void;
  clearCollection: () => void;
}

export const useCollectionStore = create<CollectionState>((set) => ({
  collection: [],
  setCollection: (entries) => set({ collection: entries }),
  addEntries: (entries) => set((s) => {
    const existing = new Set(s.collection.map((e) => e.scryfallData.id));
    const filtered = entries.filter((e) => !existing.has(e.scryfallData.id));
    return { collection: [...s.collection, ...filtered] };
  }),
  clearCollection: () => set({ collection: [] }),
}));
