import { create } from 'zustand'
import { db, type MusicTrack } from '../db/index'
import { generateId } from '../lib/utils'

const MAX_SIZE_MB = 8

interface MusicStore {
  tracks: MusicTrack[]
  currentId: string | null
  volume: number
  playing: boolean
  shuffle: boolean
  loading: boolean

  loadTracks: () => Promise<void>
  addTracks: (files: File[]) => Promise<string | null>
  removeTrack: (id: string) => Promise<void>
  setVolume: (v: number) => void
  setPlaying: (p: boolean) => void
  togglePlay: () => void
  selectTrack: (id: string) => void
  next: () => void
  prev: () => void
  setShuffle: (s: boolean) => void
}

export const useMusicStore = create<MusicStore>((set, get) => ({
  tracks: [],
  currentId: null,
  volume: 0.3,
  playing: false,
  shuffle: false,
  loading: true,

  loadTracks: async () => {
    try {
      const tracks = await db.musicTracks.orderBy('addedAt').toArray()
      set({ tracks, currentId: tracks[0]?.id || null, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  addTracks: async (files: File[]) => {
    const oversized = files.find((f) => f.size > MAX_SIZE_MB * 1024 * 1024)
    if (oversized) return `"${oversized.name}" 超过 ${MAX_SIZE_MB}MB 限制`

    const results: string[] = []

    for (const file of files) {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(new Error('读取失败'))
        reader.readAsDataURL(file)
      })

      const track: MusicTrack = {
        id: generateId(),
        fileName: file.name,
        dataUrl,
        addedAt: new Date().toISOString(),
      }

      try {
        await db.musicTracks.add(track)
        results.push(track.id)
      } catch {
        return `"${file.name}" 保存失败，空间不足`
      }
    }

    const tracks = await db.musicTracks.orderBy('addedAt').toArray()
    const currentId = get().currentId || tracks[0]?.id || null
    set({ tracks, currentId })
    return null
  },

  removeTrack: async (id: string) => {
    await db.musicTracks.delete(id)
    const tracks = await db.musicTracks.orderBy('addedAt').toArray()
    let currentId = get().currentId
    if (currentId === id) {
      currentId = tracks[0]?.id || null
    }
    set({ tracks, currentId, playing: currentId ? get().playing : false })
  },

  setVolume: (volume) => {
    set({ volume: Math.max(0, Math.min(1, volume)) })
  },

  setPlaying: (playing) => set({ playing }),

  togglePlay: () => set((s) => ({ playing: !s.playing })),

  next: () => {
    const { tracks, currentId, shuffle } = get()
    if (tracks.length === 0) return
    const idx = tracks.findIndex((t) => t.id === currentId)
    let nextIdx: number
    if (shuffle) {
      nextIdx = Math.floor(Math.random() * tracks.length)
    } else {
      nextIdx = idx < 0 ? 0 : (idx + 1) % tracks.length
    }
    set({ currentId: tracks[nextIdx].id, playing: true })
  },

  prev: () => {
    const { tracks, currentId } = get()
    if (tracks.length === 0) return
    const idx = tracks.findIndex((t) => t.id === currentId)
    const prevIdx = idx <= 0 ? tracks.length - 1 : idx - 1
    set({ currentId: tracks[prevIdx].id, playing: true })
  },

  selectTrack: (id) => set({ currentId: id, playing: true }),

  setShuffle: (shuffle) => set({ shuffle }),
}))
