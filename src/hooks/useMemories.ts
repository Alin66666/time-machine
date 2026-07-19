import { useState, useEffect, useCallback } from 'react'
import type { Memory } from '../types/memory'
import { getAllMemories, searchMemories, getFilteredMemories, deleteMemory as dbDelete } from '../db/operations'

export function useMemories() {
  const [memories, setMemories] = useState<Memory[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const data = await getAllMemories()
    setMemories(data)
    setLoading(false)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const search = useCallback(async (query: string) => {
    if (!query.trim()) { refresh(); return }
    setLoading(true)
    const data = await searchMemories(query)
    setMemories(data)
    setLoading(false)
  }, [refresh])

  const filter = useCallback(async (opts: { emotion?: string; isFavorite?: boolean; year?: number }) => {
    setLoading(true)
    const data = await getFilteredMemories(opts)
    setMemories(data)
    setLoading(false)
  }, [])

  const remove = useCallback(async (id: string) => {
    await dbDelete(id)
    refresh()
  }, [refresh])

  return { memories, loading, refresh, search, filter, remove }
}
