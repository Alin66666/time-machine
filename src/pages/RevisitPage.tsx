import { useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Sparkles } from 'lucide-react'
import { Spinner } from '../components/ui/Spinner'
import GalleryFilter from '../components/gallery/GalleryFilter'
import GalleryGrid from '../components/gallery/GalleryGrid'
import MemoryEcho from '../components/memory/MemoryEcho'
import type { FilterState } from '../components/gallery/GalleryFilter'
import { useMemories } from '../hooks/useMemories'
import { updateMemory, getMemoryById, deleteMemory } from '../db/operations'
import { useSettingsStore } from '../store/settingsStore'
import { emotions } from '../constants/emotions'

export default function RevisitPage() {
  const navigate = useNavigate()
  const { memories, loading, refresh } = useMemories()
  const { apiKey } = useSettingsStore()
  const [aiSearching, setAiSearching] = useState(false)
  const [aiResults, setAiResults] = useState<string[] | null>(null)
  const [echoActive, setEchoActive] = useState(false)

  const [filter, setFilter] = useState<FilterState>({
    search: '',
    selectedEmotion: '',
    selectedPerson: '',
    selectedLocation: '',
    onThisDay: false,
    sortNewest: true,
  })

  // Extract unique people and locations from all memories
  const people = useMemo(() => {
    const names = new Set<string>()
    memories.forEach((m) => {
      m.dimensions.relationships.people.forEach((p) => {
        if (p.name) names.add(p.name)
      })
    })
    return Array.from(names).sort()
  }, [memories])

  const locations = useMemo(() => {
    const locs = new Set<string>()
    memories.forEach((m) => {
      if (m.dimensions.environment.location) locs.add(m.dimensions.environment.location)
    })
    return Array.from(locs).sort()
  }, [memories])

  // AI semantic search
  const handleAISearch = useCallback(async (query: string) => {
    if (!apiKey) {
      toast.error('请先在设置页面配置 DeepSeek API Key')
      return
    }
    setAiSearching(true)
    try {
      const { aiSearch } = await import('../lib/deepseek')

      const memList = memories.map((m) => ({
        id: m.id,
        title: m.title,
        date: m.actualDate,
        emotion: m.dimensions.subjectiveFeelings.primaryEmotion,
        moodDesc: m.dimensions.subjectiveFeelings.moodDescription,
        location: m.dimensions.environment.location,
        tags: m.tags,
        people: m.dimensions.relationships.people.map((p) => p.name),
        summary: m.aiEnriched.summary || '',
      }))

      const result = await aiSearch(query, JSON.stringify(memList))

      if (result.matches?.length > 0) {
        setAiResults(result.matches)
        toast.success(`AI 找到 ${result.matches.length} 条相关记忆 — ${result.reason || ''}`)
      } else {
        toast.info('没有找到特别匹配的记忆，试试换个说法')
      }
    } catch (e) {
      toast.error('AI 搜索失败，请检查 API Key')
    } finally {
      setAiSearching(false)
    }
  }, [memories, apiKey])

  // Apply all filters
  const filtered = useMemo(() => {
    let result = [...memories]

    // AI result override
    if (aiResults) {
      const aiSet = new Set(aiResults)
      result = result.filter((m) => aiSet.has(m.id))
      // Sort by AI relevance order
      result.sort((a, b) => aiResults!.indexOf(a.id) - aiResults!.indexOf(b.id))
      return result
    }

    // Text search
    if (filter.search.trim()) {
      const q = filter.search.toLowerCase()
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.tags.some((t) => t.toLowerCase().includes(q)) ||
          m.dimensions.environment.location.toLowerCase().includes(q) ||
          m.dimensions.subjectiveFeelings.moodDescription?.toLowerCase().includes(q) ||
          m.dimensions.relationships.people.some((p) => p.name.toLowerCase().includes(q)) ||
          m.aiEnriched.summary?.toLowerCase().includes(q)
      )
    }

    // Emotion filter
    if (filter.selectedEmotion) {
      result = result.filter((m) => m.dimensions.subjectiveFeelings.primaryEmotion === filter.selectedEmotion)
    }

    // Person filter
    if (filter.selectedPerson) {
      result = result.filter((m) =>
        m.dimensions.relationships.people.some((p) => p.name === filter.selectedPerson)
      )
    }

    // Location filter
    if (filter.selectedLocation) {
      result = result.filter((m) => m.dimensions.environment.location === filter.selectedLocation)
    }

    // On This Day filter
    if (filter.onThisDay) {
      const today = new Date()
      const todayMonth = today.getMonth()
      const todayDay = today.getDate()
      result = result.filter((m) => {
        const d = new Date(m.actualDate)
        return d.getMonth() === todayMonth && d.getDate() === todayDay
      })
    }

    // Sort
    if (!filter.sortNewest) {
      result.reverse()
    }

    return result
  }, [memories, filter, aiResults])

  const hasFilter = !!(filter.search || filter.selectedEmotion || filter.selectedPerson || filter.selectedLocation || filter.onThisDay || aiResults)

  const echoLabel = filter.selectedEmotion
    ? (emotions.find((e) => e.id === filter.selectedEmotion)?.label || '')
    : (filter.search.trim() || '这段情感')

  const showEcho = filtered.length >= 2

  const handleDelete = useCallback(async (id: string) => {
    if (!window.confirm('确定要删除这段记忆吗？此操作不可撤销。')) return
    try {
      await deleteMemory(id)
      toast.success('记忆已删除')
      refresh()
    } catch {
      toast.error('删除失败')
    }
  }, [refresh])

  const handleClearFilter = useCallback(() => {
    setFilter({
      search: '',
      selectedEmotion: '',
      selectedPerson: '',
      selectedLocation: '',
      onThisDay: false,
      sortNewest: true,
    })
    setAiResults(null)
  }, [])

  const handleToggleFavorite = useCallback(async (id: string) => {
    const m = await getMemoryById(id)
    if (!m) return
    m.isFavorite = !m.isFavorite
    await updateMemory(m)
    toast.success(m.isFavorite ? '已收藏' : '已取消收藏')
    refresh()
  }, [refresh])

  const today = new Date()

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-text">重温时光</h1>
        <p className="mt-1 text-sm text-text-muted">
          {aiResults
            ? `AI 智能搜索找到 ${filtered.length} 段相关记忆`
            : memories.length > 0
              ? `共有 ${memories.length} 段珍贵记忆`
              : '在这里，重新遇见过去的自己'}
        </p>
        {/* On this day badge */}
        {filter.onThisDay && (
          <p className="mt-2 text-xs text-amber-500/80">
            📅 {today.getMonth() + 1}月{today.getDate()}日 — 历年今日的记忆
          </p>
        )}
      </div>

      <div className="mb-6">
        <GalleryFilter
          filter={filter}
          onChange={(f) => {
            setFilter(f)
            if (f.search !== filter.search) setAiResults(null) // clear AI results on new search input
          }}
          people={people}
          locations={locations}
          onAISearch={handleAISearch}
          aiSearching={aiSearching}
        />
      </div>

      {/* Memory Echo trigger */}
      {showEcho && !echoActive && (
        <div className="mb-6 flex justify-center">
          <button
            onClick={() => setEchoActive(true)}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500/10 to-pink-500/10 border border-amber-500/20 px-6 py-3.5 text-sm text-amber-500 hover:from-amber-500/20 hover:to-pink-500/20 hover:shadow-lg hover:shadow-amber-500/10 transition-all"
          >
            <Sparkles className="h-4 w-4" />
            <span className="font-medium">记忆回响</span>
            <span className="text-text-muted text-xs">
              串联 {filtered.length} 段关于「{echoLabel}」的记忆
            </span>
          </button>
        </div>
      )}

      {loading ? (
        <Spinner text="加载记忆中..." />
      ) : (
        <GalleryGrid
          memories={filtered}
          onToggleFavorite={handleToggleFavorite}
          onDelete={handleDelete}
          hasFilter={hasFilter}
          onClearFilter={handleClearFilter}
        />
      )}

      {/* Memory Echo overlay */}
      <AnimatePresence>
        {echoActive && (
          <MemoryEcho
            memories={filtered}
            filterLabel={echoLabel}
            onClose={() => setEchoActive(false)}
            onViewInUniverse={(ids) => {
              setEchoActive(false)
              navigate(`/universe?highlight=${ids.join(',')}`)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
