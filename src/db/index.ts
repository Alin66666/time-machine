import Dexie, { type EntityTable } from 'dexie'
import type { Memory, FishCrackerRecord, NianNianState } from '../types/memory'

export interface MusicTrack {
  id: string
  fileName: string
  dataUrl: string
  addedAt: string
}

export class TimeMachineDB extends Dexie {
  memories!: EntityTable<Memory, 'id'>
  musicTracks!: EntityTable<MusicTrack, 'id'>
  fishCrackers!: EntityTable<FishCrackerRecord, 'id'>
  nianNianState!: EntityTable<NianNianState, 'id'>

  constructor() {
    super('TimeMachineDB')
    this.version(2).stores({
      memories: 'id, actualDate, createdAt, isFavorite, tags',
      musicTracks: 'id, addedAt',
    })
    this.version(3).stores({
      memories: 'id, actualDate, createdAt, isFavorite, tags',
      musicTracks: 'id, addedAt',
      achievements: null,
    })
    this.version(4).stores({
      memories: 'id, actualDate, createdAt, isFavorite, tags',
      musicTracks: 'id, addedAt',
      fishCrackers: 'id, memoryId, earnedAt',
      nianNianState: 'id',
    })
  }
}

export const db = new TimeMachineDB()
