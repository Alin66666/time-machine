import Dexie, { type EntityTable } from 'dexie'
import type { Memory, ChatRecord } from '../types/memory'

export interface MusicTrack {
  id: string
  fileName: string
  dataUrl: string
  addedAt: string
}

export class TimeMachineDB extends Dexie {
  memories!: EntityTable<Memory, 'id'>
  musicTracks!: EntityTable<MusicTrack, 'id'>
  chats!: EntityTable<ChatRecord, 'id'>

  constructor() {
    super('TimeMachineDB')
    this.version(3).stores({
      memories: 'id, actualDate, createdAt, isFavorite, tags',
      musicTracks: 'id, addedAt',
      chats: 'id, memoryId',
    })
  }
}

export const db = new TimeMachineDB()
