import { create } from 'zustand'
import { addFishCrackers, getTotalFishCrackers, getNianNianState, updateNianNianState } from '../db/operations'

const LEVEL_THRESHOLDS = [0, 30, 80, 150, 300] as const
const LEVEL_CAPS = [10, 25, 50, 100, Infinity] as const
const LEVEL_NAMES = ['见习宇航猫', '星尘领航员', '银河编织者', '宇宙守护神', '时光之主'] as const

function computeLevel(total: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (total >= LEVEL_THRESHOLDS[i]) return i + 1
  }
  return 1
}

function getNextLevelThreshold(currentLevel: number): number | null {
  if (currentLevel >= LEVEL_THRESHOLDS.length) return null
  return LEVEL_THRESHOLDS[currentLevel]
}

interface NianNianStore {
  totalFishCrackers: number
  level: number
  levelName: string
  clusterCap: number
  lastAdded: number
  justLeveledUp: boolean

  load: () => Promise<void>
  addFishCrackers: (amount: number, memoryId?: string) => Promise<void>
  getNextThreshold: () => number | null
  getProgress: () => number
  clearLevelUp: () => void
}

export const useNianNianStore = create<NianNianStore>((set, get) => ({
  totalFishCrackers: 0,
  level: 1,
  levelName: '见习宇航猫',
  clusterCap: 10,
  lastAdded: 0,
  justLeveledUp: false,

  load: async () => {
    const state = await getNianNianState()
    const total = state.totalFishCrackers
    const lv = computeLevel(total)
    set({
      totalFishCrackers: total,
      level: lv,
      levelName: LEVEL_NAMES[lv - 1],
      clusterCap: LEVEL_CAPS[lv - 1],
    })
  },

  addFishCrackers: async (amount: number, memoryId?: string) => {
    await addFishCrackers(amount, memoryId)
    const total = await getTotalFishCrackers()
    const oldLevel = get().level
    const newLevel = computeLevel(total)
    await updateNianNianState({
      totalFishCrackers: total,
      level: newLevel,
    })
    set({
      totalFishCrackers: total,
      level: newLevel,
      levelName: LEVEL_NAMES[newLevel - 1],
      clusterCap: LEVEL_CAPS[newLevel - 1],
      lastAdded: amount,
      justLeveledUp: newLevel > oldLevel,
    })
  },

  getNextThreshold: () => getNextLevelThreshold(get().level),
  getProgress: () => {
    const { totalFishCrackers, level } = get()
    const current = level < LEVEL_THRESHOLDS.length ? LEVEL_THRESHOLDS[level - 1] : 0
    const next = getNextLevelThreshold(get().level)
    if (!next) return 100
    return Math.min(100, Math.round(((totalFishCrackers - current) / (next - current)) * 100))
  },
  clearLevelUp: () => set({ justLeveledUp: false }),
}))

export { LEVEL_THRESHOLDS, LEVEL_CAPS, LEVEL_NAMES }
