import { create } from 'zustand';

interface ScreenState {
  screenBase64: string | null;
  setScreenBase64: (url: string | null) => void;
}

export const useScreenStore = create<ScreenState>((set) => ({
  screenBase64: null,
  setScreenBase64: (url) => set({ screenBase64: url }),
}));