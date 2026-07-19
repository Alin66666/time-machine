import Dexie, { type EntityTable } from 'dexie'
import type { Memory, EarnedBadge } from '../types/memory'

export interface MusicTrack {
  id: string
  fileName: string
  dataUrl: string
  addedAt: string
}

export class TimeMachineDB extends Dexie {
  memories!: EntityTable<Memory, 'id'>
  musicTracks!: EntityTable<MusicTrack, 'id'>
  achievements!: EntityTable<EarnedBadge, 'id'>

  constructor() {
    super('TimeMachineDB')
    this.version(2).stores({
      memories: 'id, actualDate, createdAt, isFavorite, tags',
      musicTracks: 'id, addedAt',
    })
    this.version(3).stores({
      memories: 'id, actualDate, createdAt, isFavorite, tags',
      musicTracks: 'id, addedAt',
      achievements: 'id',
    })
  }
}

export const db = new TimeMachineDB()
