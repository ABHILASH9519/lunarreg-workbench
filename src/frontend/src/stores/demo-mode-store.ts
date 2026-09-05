import { create } from "zustand";
import type { DemoPair } from "../lib/types";

/**
 * Zustand store for demo mode state: which demo pair is selected and whether
 * demo mode is active. Demo pairs are always labeled DEMO/SAMPLE DATA.
 */

export interface DemoModeState {
  active: boolean;
  selectedPairId: string | null;
  pairs: DemoPair[];
  setActive: (active: boolean) => void;
  setSelectedPairId: (id: string | null) => void;
  setPairs: (pairs: DemoPair[]) => void;
}

export const useDemoModeStore = create<DemoModeState>((set) => ({
  active: false,
  selectedPairId: null,
  pairs: [],
  setActive: (active) => set({ active }),
  setSelectedPairId: (selectedPairId) => set({ selectedPairId }),
  setPairs: (pairs) => set({ pairs }),
}));
