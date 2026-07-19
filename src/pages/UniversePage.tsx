import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Grid3X3, Orbit, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import UniverseCanvas from '../components/universe/UniverseCanvas'
import PlanetDetail from '../components/universe/PlanetDetail'
import UniverseDock from '../components/layout/UniverseDock'
import OnboardingOverlay from '../components/layout/OnboardingOverlay'
import RecordDrawer from '../components/memory/RecordDrawer'
import GalleryGrid from '../components/gallery/GalleryGrid'
import GalleryFilter from '../components/gallery/GalleryFilter'
import type { Memory, FilterState as FilterStateType } from '../types/memory'
import { getAllMemories, updateMemory, deleteMemory, getMemoryById } from '../db/operations'
import { useNianNianStore } from '../store/nianNianStore'
import { useSettingsStore } from '../store/settingsStore'

type ViewMode = 'universe' | 'revisit'

// Extend the filter state type
interface FilterState {
  search: string
  selectedEmotion: string
  selectedPerson: string
  selectedLocation: string
  onThisDay: boolean
  sortNewest: boolean
}

export default function UniversePage() {
  const [memories, setMemories] = useState<Memory[]>([])
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('universe')
  const [showRecordDrawer, setShowRecordDrawer] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [aiSearching, setAiSearching] = useState(false)
  const [aiResults, setAiResults] = useState<string[] | null>(null)
  const { load: loadNianNian, totalFishCrackers, level, levelName } = useNianNianStore()
  const { apiKey } = useSettingsStore()

  const [filter, setFilter] = useState<FilterState>({
    search: '',
    selectedEmotion: '',
    selectedPerson: '',
    selectedLocation: '',
    onThisDay: false,
    sortNewest: true,
  })

  const loadMemories = useCallback(async () => {
    const data = await getAllMemories()
    setMemories(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadMemories()
    loadNianNian()
  }, [loadMemories, loadNianNian])

  // Show onboarding for first-time users with no memories
  useEffect(() => {
    if (!loading && memories.length === 0) {
      const seen = localStorage.getItem('tm-onboarding-seen')
      if (!seen) {
        setShowOnboarding(true)
      }
    }
  }, [loading, memories.length])

  const handleOnboardingComplete = () => {
    localStorage.setItem('tm-onboarding-seen', 'true')
    setShowOnboarding(false)
  }

  const handleSelectMemory = useCallback((memory: Memory) => {
    setSelectedMemory(memory)
  }, [])

  const handleMemoryUpdate = useCallback((updated: Memory) => {
    setMemories((prev) => prev.map((m) => (m.id === updated.id ? updated : m)))
    setSelectedMemory(updated)
  }, [])

  const handleCloseDetail = useCallback(() => {
    setSelectedMemory(null)
  }, [])

  // Memoize people and locations for filter
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
        toast.success(`念念找到 ${result.matches.length} 条相关记忆 — ${result.reason || ''}`)
      } else {
        toast.info('念念没找到特别匹配的记忆，试试换个说法？')
      }
    } catch {
      toast.error('念念走神了，AI 搜索失败')
    } finally {
      setAiSearching(false)
    }
  }, [memories, apiKey])

  // Apply filters
  const filtered = useMemo(() => {
    let result = [...memories]
    if (aiResults) {
      const aiSet = new Set(aiResults)
      result = result.filter((m) => aiSet.has(m.id))
      result.sort((a, b) => aiResults!.indexOf(a.id) - aiResults!.indexOf(b.id))
      return result
    }
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
    if (filter.selectedEmotion) {
      result = result.filter((m) => m.dimensions.subjectiveFeelings.primaryEmotion === filter.selectedEmotion)
    }
    if (filter.selectedPerson) {
      result = result.filter((m) =>
        m.dimensions.relationships.people.some((p) => p.name === filter.selectedPerson)
      )
    }
    if (filter.selectedLocation) {
      result = result.filter((m) => m.dimensions.environment.location === filter.selectedLocation)
    }
    if (filter.onThisDay) {
      const today = new Date()
      result = result.filter((m) => {
        const d = new Date(m.actualDate)
        return d.getMonth() === today.getMonth() && d.getDate() === today.getDate()
      })
    }
    if (!filter.sortNewest) result.reverse()
    return result
  }, [memories, filter, aiResults])

  const hasFilter = !!(filter.search || filter.selectedEmotion || filter.selectedPerson || filter.selectedLocation || filter.onThisDay || aiResults)

  const handleToggleFavorite = useCallback(async (id: string) => {
    const m = await getMemoryById(id)
    if (!m) return
    m.isFavorite = !m.isFavorite
    await updateMemory(m)
    toast.success(m.isFavorite ? '已收藏' : '已取消收藏')
    loadMemories()
  }, [loadMemories])

  const handleDelete = useCallback(async (id: string) => {
    if (!window.confirm('确定要删除这段记忆吗？念念会难过的…此操作不可撤销。')) return
    try {
      await deleteMemory(id)
      toast.success('记忆已删除')
      loadMemories()
    } catch {
      toast.error('删除失败')
    }
  }, [loadMemories])

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

  const handleFeedClick = () => {
    setShowRecordDrawer(true)
  }

  const today = new Date()

  return (
    <div className="fixed inset-0 bg-[#050510]">
      {/* Universe mode */}
      <AnimatePresence mode="wait">
        {viewMode === 'universe' && (
          <motion.div
            key="universe"
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <UniverseCanvas
              memories={memories}
              selectedId={selectedMemory?.id ?? null}
              onSelectMemory={handleSelectMemory}
            />

            {/* Empty state overlay */}
            {!loading && memories.length === 0 && (
              <motion.div
                className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <motion.div
                  className="text-7xl mb-6"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                  🐱
                </motion.div>
                <motion.div
                  className="w-32 h-32 mb-6 rounded-full border-2 border-dashed border-amber-500/30 flex items-center justify-center"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                >
                  <span className="text-xs text-amber-500/50">第一颗星球</span>
                </motion.div>
                <h2 className="text-xl font-medium text-white/70 mb-2">念念的宇宙还空着呢</h2>
                <p className="text-sm text-text-muted/60 text-center max-w-xs">
                  把一段记忆投喂给念念，第一颗星球将在这里诞生。
                </p>
              </motion.div>
            )}

            {/* Bottom interaction hint */}
            {memories.length > 0 && (
              <motion.div
                className="absolute bottom-28 left-1/2 -translate-x-1/2 z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                <p className="text-xs text-white/20 text-center">
                  拖拽旋转 · 滚轮缩放 · 点击星球
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Revisit mode */}
      <AnimatePresence mode="wait">
        {viewMode === 'revisit' && (
          <motion.div
            key="revisit"
            className="absolute inset-0 overflow-y-auto bg-[#0A0A14]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="mx-auto max-w-5xl px-4 pt-8 pb-32">
              <div className="mb-4">
                <h1 className="text-xl font-medium text-text">重温时光</h1>
                <p className="mt-1 text-sm text-text-muted">
                  {aiResults
                    ? `念念找到 ${filtered.length} 段相关记忆`
                    : memories.length > 0
                      ? `念念守护着 ${memories.length} 段珍贵记忆`
                      : '念念在等你投喂第一段记忆～'}
                </p>
                {filter.onThisDay && (
                  <p className="mt-2 text-xs text-amber-500/80">
                    {today.getMonth() + 1}月{today.getDate()}日 — 历年今日的记忆
                  </p>
                )}
              </div>
              <GalleryFilter
                filter={filter}
                onChange={(f) => {
                  setFilter(f)
                  if (f.search !== filter.search) setAiResults(null)
                }}
                people={people}
                locations={locations}
                onAISearch={handleAISearch}
                aiSearching={aiSearching}
              />
              <div className="mt-4">
                <GalleryGrid
                  memories={filtered}
                  onToggleFavorite={handleToggleFavorite}
                  onDelete={handleDelete}
                  hasFilter={hasFilter}
                  onClearFilter={handleClearFilter}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top bar */}
      <motion.div
        className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="pointer-events-auto flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-full bg-black/50 backdrop-blur-lg border border-white/10 p-0.5">
            <button
              onClick={() => {
                setViewMode('universe')
                setSelectedMemory(null)
              }}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                viewMode === 'universe'
                  ? 'bg-amber-500/25 text-amber-400'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              <Orbit className="h-3.5 w-3.5" />
              宇宙
            </button>
            <button
              onClick={() => setViewMode('revisit')}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                viewMode === 'revisit'
                  ? 'bg-amber-500/25 text-amber-400'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              <Grid3X3 className="h-3.5 w-3.5" />
              重温
            </button>
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-3">
          <span className="text-xs text-white/30 hidden sm:inline">
            {memories.length > 0
              ? `${memories.length}颗星球 · Lv.${level} ${levelName}`
              : '念念的宇宙'}
          </span>
        </div>
      </motion.div>

      {/* Bottom dock */}
      <UniverseDock
        onFeedClick={handleFeedClick}
        hasMemories={memories.length > 0}
      />

      {/* Record drawer */}
      <RecordDrawer
        open={showRecordDrawer}
        onClose={() => {
          setShowRecordDrawer(false)
          loadMemories()
        }}
      />

      {/* Onboarding */}
      <OnboardingOverlay
        open={showOnboarding}
        onComplete={handleOnboardingComplete}
      />

      {/* Planet/Card detail panel (right slide-in) */}
      <AnimatePresence>
        {selectedMemory && (
          <PlanetDetail
            memory={selectedMemory}
            onClose={handleCloseDetail}
            onMemoryUpdate={handleMemoryUpdate}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
