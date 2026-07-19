import { create } from 'zustand'
import type { EarnedBadge } from '../types/memory'

interface AchievementStore {
  unlockQueue: EarnedBadge[]
  addToQueue: (badges: EarnedBadge[]) => void
  clearQueue: () => void
  wallOpen: boolean
  setWallOpen: (open: boolean) => void
}

export const useAchievementStore = create<AchievementStore>((set) => ({
  unlockQueue: [],
  addToQueue: (badges) =>
    set((s) => ({ unlockQueue: [...s.unlockQueue, ...badges] })),
  clearQueue: () => set({ unlockQueue: [] }),
  wallOpen: false,
  setWallOpen: (open) => set({ wallOpen: open }),
}))
