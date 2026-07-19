import { useState, useCallback } from 'react'
import type { Memory } from '../types/memory'
import { createMemory, getMemoryById, updateMemory, deleteMemory } from '../db/operations'

export function useMemory() {
  const [loading, setLoading] = useState(false)

  const load = useCallback(async (id: string) => {
    setLoading(true)
    const m = await getMemoryById(id)
    setLoading(false)
    return m
  }, [])

  const save = useCallback(async (memory: Memory) => {
    setLoading(true)
    const now = new Date().toISOString()
    const toSave = { ...memory, updatedAt: now }
    const existing = await getMemoryById(memory.id)
    if (existing) {
      await updateMemory(toSave)
    } else {
      await createMemory(toSave)
    }
    setLoading(false)
    return memory.id
  }, [])

  const remove = useCallback(async (id: string) => {
    await deleteMemory(id)
  }, [])

  return { loading, load, save, remove }
}
