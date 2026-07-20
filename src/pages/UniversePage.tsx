import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Plus, Sparkles, PenLine, Hourglass, Settings, Orbit } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import UniverseCanvas from '../components/universe/UniverseCanvas'
import PlanetDetail from '../components/universe/PlanetDetail'
import type { Memory } from '../types/memory'
import { getAllMemories, createMemory, getMemoryById } from '../db/operations'
import { generateId, getTodayISO } from '../lib/utils'

export default function UniversePage() {
  const [memories, setMemories] = useState<Memory[]>([])
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchParams] = useSearchParams()
  const highlightIds = searchParams.get('highlight')?.split(',') || []
  const [showCreateHint, setShowCreateHint] = useState(false)

  const loadMemories = useCallback(async () => {
    const data = await getAllMemories()
    setMemories(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadMemories()
  }, [loadMemories])

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

  // Quick create a new planet (go to record page)
  const handleQuickCreate = useCallback(async () => {
    const id = generateId()
    const newMemory: Memory = {
      id,
      title: '',
      actualDate: getTodayISO(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dimensions: {
        subjectiveFeelings: { primaryEmotion: '', moodIntensity: 5, moodDescription: '', emotionalTags: [] },
        visual: { photos: [], dominantColors: [], lightQuality: '', visualDescription: '' },
        auditory: { sounds: [], music: '', audioDescription: '' },
        taste: { flavors: [], foodAndDrinks: [], tasteDescription: '' },
        smell: { scents: [], smellDescription: '' },
        touch: { textures: [], temperature: '', physicalSensations: '', touchDescription: '' },
        environment: { location: '', weather: '', setting: '', environmentDescription: '' },
        objects: { items: [], objectsDescription: '' },
        relationships: { people: [], relationshipDescription: '' },
      },
      aiEnriched: { enriched: false },
      perspectives: [],
      tags: [],
      isFavorite: false,
      revisitCount: 0,
      lastRevisitedAt: null,
    }
    await createMemory(newMemory)
    toast.success('一颗新的星球诞生了！去记录页面填充它的故事吧 ✨')
    setShowCreateHint(false)
    window.open(`/record/${id}`, '_blank')
  }, [])

  return (
    <div className="fixed inset-0 bg-[#050510]">
      {/* 3D Universe Canvas */}
      <UniverseCanvas
        memories={memories}
        selectedId={selectedMemory?.id ?? null}
        highlightIds={highlightIds}
        onSelectMemory={handleSelectMemory}
      />

      {/* Top bar */}
      <motion.div
        className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Link
          to="/"
          className="flex items-center gap-2 rounded-full bg-black/40 backdrop-blur-lg px-4 py-2 text-sm text-white/80 hover:text-white border border-white/5 hover:border-white/15 transition-all"
        >
          <Hourglass className="h-4 w-4 text-amber-500" />
          <span className="hidden sm:inline font-medium tracking-wide">美好时光机</span>
        </Link>

        {/* Navigation icons */}
        <div className="flex items-center gap-1">
          <Link
            to="/record"
            className="flex items-center gap-1.5 rounded-full bg-black/40 backdrop-blur-lg px-3.5 py-2 text-sm text-white/70 hover:text-white border border-white/5 hover:border-white/15 transition-all"
            title="记录美好"
          >
            <PenLine className="h-4 w-4" />
            <span className="hidden sm:inline">记录</span>
          </Link>
          <Link
            to="/revisit"
            className="flex items-center gap-1.5 rounded-full bg-black/40 backdrop-blur-lg px-3.5 py-2 text-sm text-white/70 hover:text-white border border-white/5 hover:border-white/15 transition-all"
            title="重温时光"
          >
            <Hourglass className="h-4 w-4" />
            <span className="hidden sm:inline">重温</span>
          </Link>
          <Link
            to="/universe"
            className="flex items-center gap-1.5 rounded-full bg-purple-500/20 backdrop-blur-lg px-3.5 py-2 text-sm text-purple-400 border border-purple-500/30 transition-all"
            title="记忆宇宙"
          >
            <Orbit className="h-4 w-4" />
            <span className="hidden sm:inline">宇宙</span>
          </Link>
          <Link
            to="/settings"
            className="flex items-center gap-1.5 rounded-full bg-black/40 backdrop-blur-lg px-3.5 py-2 text-sm text-white/70 hover:text-white border border-white/5 hover:border-white/15 transition-all"
            title="设置"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">设置</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-white/50 hidden sm:inline font-serif tracking-wider">
            {memories.length > 0
              ? `星河中有 ${memories.length} 颗星球`
              : '你的宇宙等待第一颗星球'}
          </span>

          {/* Create planet button */}
          <div className="relative">
            <button
              onClick={() => setShowCreateHint(!showCreateHint)}
              className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500/30 to-pink-500/30 backdrop-blur-lg px-4 py-2 text-sm text-amber-400 hover:text-amber-300 border border-amber-500/20 hover:border-amber-500/40 transition-all"
            >
              <Plus className="h-4 w-4" />
              <Sparkles className="h-3.5 w-3.5" />
            </button>

            <AnimatePresence>
              {showCreateHint && (
                <motion.div
                  className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-bg-card/95 backdrop-blur-xl border border-border p-4 shadow-2xl"
                  initial={{ opacity: 0, scale: 0.9, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -10 }}
                >
                  <p className="text-xs text-text-muted mb-3">
                    创建一颗新星球，上传照片或写下心情，然后和 AI 聊聊，让它发光。
                  </p>
                  <button
                    onClick={handleQuickCreate}
                    className="w-full rounded-xl bg-amber-500/20 border border-amber-500/30 py-2 text-sm text-amber-500 hover:bg-amber-500/30 transition-colors"
                  >
                    ✨ 星尘入口
                  </button>
                  <Link
                    to="/record"
                    className="mt-2 block w-full rounded-xl bg-white/5 border border-white/5 py-2 text-center text-xs text-text-muted hover:bg-white/10 transition-colors"
                  >
                    完整记录 →
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Empty state overlay */}
      {!loading && memories.length === 0 && (
        <motion.div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.div
            className="text-8xl mb-6"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            🕳️
          </motion.div>
          <h1 className="text-2xl font-medium text-white/80 mb-2 font-serif">你的记忆宇宙</h1>
          <p className="text-sm text-text-muted text-center max-w-md mb-8">
            这里还是一片沉寂的黑洞。<br />
            上传你的第一张照片或写下第一段心情，<br />
            第一颗星球将会诞生。
          </p>
          <Link
            to="/record"
            className="pointer-events-auto rounded-full bg-gradient-to-r from-amber-500 to-pink-500 px-6 py-3 text-sm font-medium text-white hover:shadow-lg hover:shadow-amber-500/20 transition-all"
          >
            ✨ 创建第一颗星球
          </Link>
        </motion.div>
      )}

      {/* Bottom hint */}
      {memories.length > 0 && (
        <motion.div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          <p className="text-xs text-white/25 text-center">
            拖拽旋转 · 滚轮缩放 · 点击星球查看详情
          </p>
        </motion.div>
      )}

      {/* Planet detail panel */}
      <AnimatePresence>
        {selectedMemory && (
          <PlanetDetail
            key={selectedMemory.id}
            memory={selectedMemory}
            onClose={handleCloseDetail}
            onMemoryUpdate={handleMemoryUpdate}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
