import { db } from './index'
import type { Memory } from '../types/memory'

export async function createMemory(memory: Memory): Promise<string> {
  await db.memories.add(memory)
  return memory.id
}

export async function getMemoryById(id: string): Promise<Memory | undefined> {
  return db.memories.get(id)
}

export async function getAllMemories(): Promise<Memory[]> {
  return db.memories.orderBy('actualDate').reverse().toArray()
}

export async function updateMemory(memory: Memory): Promise<void> {
  await db.memories.put(memory)
}

export async function deleteMemory(id: string): Promise<void> {
  await db.memories.delete(id)
}

export async function searchMemories(query: string): Promise<Memory[]> {
  const lower = query.toLowerCase()
  return db.memories
    .filter(
      (m) =>
        m.title.toLowerCase().includes(lower) ||
        m.tags.some((t) => t.toLowerCase().includes(lower)) ||
        m.dimensions.environment.location.toLowerCase().includes(lower)
    )
    .toArray()
}

export async function getFilteredMemories(opts: {
  emotion?: string
  isFavorite?: boolean
  year?: number
}): Promise<Memory[]> {
  let collection = db.memories.orderBy('actualDate').reverse()

  return collection.filter((m) => {
    if (opts.emotion && m.dimensions.subjectiveFeelings.primaryEmotion !== opts.emotion)
      return false
    if (opts.isFavorite && !m.isFavorite) return false
    if (opts.year && new Date(m.actualDate).getFullYear() !== opts.year) return false
    return true
  }).toArray()
}

export async function getMemoryCount(): Promise<number> {
  return db.memories.count()
}

export async function getAllMemorySummaries(): Promise<Pick<Memory, 'id' | 'title' | 'actualDate' | 'tags' | 'dimensions'>[]> {
  return db.memories.toArray().then((memories) =>
    memories.map((m) => ({
      id: m.id,
      title: m.title,
      actualDate: m.actualDate,
      tags: m.tags,
      dimensions: m.dimensions,
    }))
  )
}

export async function exportAllMemories(): Promise<string> {
  const memories = await db.memories.toArray()
  return JSON.stringify(memories, null, 2)
}

export async function importMemories(json: string): Promise<void> {
  const memories: Memory[] = JSON.parse(json)
  await db.memories.bulkAdd(memories)
}

// === Fish Crackers ===

export async function addFishCrackers(amount: number, memoryId?: string): Promise<void> {
  const record: import('../types/memory').FishCrackerRecord = {
    id: crypto.randomUUID(),
    amount,
    memoryId,
    earnedAt: new Date().toISOString(),
  }
  await db.fishCrackers.add(record)
}

export async function getTotalFishCrackers(): Promise<number> {
  const records = await db.fishCrackers.toArray()
  return records.reduce((sum, r) => sum + r.amount, 0)
}

export async function getNianNianState(): Promise<import('../types/memory').NianNianState> {
  const state = await db.nianNianState.get('current')
  return state || { id: 'current', totalFishCrackers: 0, level: 1 }
}

export async function updateNianNianState(partial: Partial<import('../types/memory').NianNianState>): Promise<void> {
  const current = await getNianNianState()
  await db.nianNianState.put({ ...current, ...partial, id: 'current' })
}
