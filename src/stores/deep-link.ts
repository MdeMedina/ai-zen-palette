import { create } from "zustand";

interface DeepLinkState {
  pendingPath: string | null;
  capture: (path: string) => void;
  consume: () => string | null;
}

export const useDeepLinkStore = create<DeepLinkState>((set, get) => ({
  pendingPath: null,
  capture: (pendingPath) => set({ pendingPath }),
  consume: () => {
    const p = get().pendingPath;
    set({ pendingPath: null });
    return p;
  },
}));
