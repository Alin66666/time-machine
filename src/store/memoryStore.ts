import { create } from 'zustand'
import type { Memory, MemoryDimensions, Perspective } from '../types/memory'
import { getTodayISO, generateId } from '../lib/utils'

function emptyDimensions(): MemoryDimensions {
  return {
    subjectiveFeelings: { primaryEmotion: '', moodIntensity: 5, moodDescription: '', emotionalTags: [] },
    visual: { photos: [], dominantColors: [], lightQuality: '', visualDescription: '' },
    auditory: { sounds: [], music: '', audioDescription: '' },
    taste: { flavors: [], foodAndDrinks: [], tasteDescription: '' },
    smell: { scents: [], smellDescription: '' },
    touch: { textures: [], temperature: '', physicalSensations: '', touchDescription: '' },
    environment: { location: '', weather: '', setting: '', environmentDescription: '' },
    objects: { items: [], objectsDescription: '' },
    relationships: { people: [], relationshipDescription: '' },
  }
}

interface MemoryStore {
  memory: Memory
  isDirty: boolean

  initNew: () => void
  initEdit: (m: Memory) => void
  setTitle: (title: string) => void
  setActualDate: (date: string) => void
  setDimensions: (dimensions: MemoryDimensions) => void
  updateDimension: <K extends keyof MemoryDimensions>(key: K, value: Partial<MemoryDimensions[K]>) => void
  addPerspective: (p: Perspective) => void
  removePerspective: (id: string) => void
  setTags: (tags: string[]) => void
  setIsFavorite: (v: boolean) => void
  markClean: () => void
}

export const useMemoryStore = create<MemoryStore>((set) => ({
  memory: {
    id: '',
    title: '',
    actualDate: getTodayISO(),
    createdAt: '',
    updatedAt: '',
    dimensions: emptyDimensions(),
    aiEnriched: { enriched: false },
    perspectives: [],
    tags: [],
    isFavorite: false,
    revisitCount: 0,
    lastRevisitedAt: null,
  },
  isDirty: false,

  initNew: () =>
    set({
      memory: {
        id: generateId(),
        title: '',
        actualDate: getTodayISO(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        dimensions: emptyDimensions(),
        aiEnriched: { enriched: false },
        perspectives: [],
        tags: [],
        isFavorite: false,
        revisitCount: 0,
        lastRevisitedAt: null,
      },
      isDirty: false,
    }),

  initEdit: (m) => set({ memory: { ...m, perspectives: m.perspectives || [] }, isDirty: false }),

  setTitle: (title) =>
    set((s) => ({ memory: { ...s.memory, title }, isDirty: true })),

  setActualDate: (date) =>
    set((s) => ({ memory: { ...s.memory, actualDate: date }, isDirty: true })),

  setDimensions: (dimensions) =>
    set((s) => ({ memory: { ...s.memory, dimensions }, isDirty: true })),

  updateDimension: (key, value) =>
    set((s) => ({
      memory: {
        ...s.memory,
        dimensions: {
          ...s.memory.dimensions,
          [key]: { ...s.memory.dimensions[key], ...value },
        },
      },
      isDirty: true,
    })),

  addPerspective: (p) =>
    set((s) => ({
      memory: {
        ...s.memory,
        perspectives: [...s.memory.perspectives, p],
      },
      isDirty: true,
    })),

  removePerspective: (id) =>
    set((s) => ({
      memory: {
        ...s.memory,
        perspectives: s.memory.perspectives.filter((p) => p.id !== id),
      },
      isDirty: true,
    })),

  setTags: (tags) =>
    set((s) => ({ memory: { ...s.memory, tags }, isDirty: true })),

  setIsFavorite: (v) =>
    set((s) => ({ memory: { ...s.memory, isFavorite: v }, isDirty: true })),

  markClean: () => set({ isDirty: false }),
}))
