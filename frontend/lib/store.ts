import { create } from "zustand";

export type BrowsePath = "rent" | "buy" | null;

interface AppState {
  path: BrowsePath;
  setPath: (path: BrowsePath) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  path: null,
  setPath: (path) => set({ path }),
  searchQuery: "",
  setSearchQuery: (searchQuery) => set({ searchQuery }),
}));
