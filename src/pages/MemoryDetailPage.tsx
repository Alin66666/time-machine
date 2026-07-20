import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Edit3, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { Spinner } from '../components/ui/Spinner'
import MemoryDetail from '../components/memory/MemoryDetail'
import SharePoster from '../components/memory/SharePoster'
import AIAssistant from '../components/ai/AIAssistant'
import type { Memory } from '../types/memory'
import { getMemoryById, updateMemory } from '../db/operations'
import { useMemoryStore } from '../store/memoryStore'

export default function MemoryDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [memory, setMemory] = useState<Memory | null>(null)
  const [loading, setLoading] = useState(true)
  const store = useMemoryStore()
  const enrichedRef = useRef(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getMemoryById(id).then((m) => {
      if (m) {
        setMemory(m)
        store.initEdit(m)
        enrichedRef.current = m.aiEnriched.enriched
      }
      setLoading(false)
      // Increment revisit count
      if (m) {
        const updated = {
          ...m,
          revisitCount: m.revisitCount + 1,
          lastRevisitedAt: new Date().toISOString(),
        }
        updateMemory(updated)
      }
    })
  }, [id])

  // Sync AI enrichment changes back to DB
  useEffect(() => {
    const enriched = store.memory.aiEnriched.enriched
    if (enriched && !enrichedRef.current) {
      enrichedRef.current = true
      const updated = { ...memory!, aiEnriched: store.memory.aiEnriched, tags: store.memory.tags }
      setMemory(updated)
      updateMemory(updated)
    }
  }, [store.memory.aiEnriched.enriched, store.memory.aiEnriched.summary, store.memory.tags])

  const handleToggleFavorite = async () => {
    if (!memory) return
    const updated = { ...memory, isFavorite: !memory.isFavorite }
    await updateMemory(updated)
    setMemory(updated)
    toast.success(updated.isFavorite ? '已收藏' : '已取消收藏')
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <Spinner text="正在加载记忆..." />
      </div>
    )
  }

  if (!memory) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-text-muted">记忆不存在</p>
        <Link to="/revisit" className="mt-4 inline-block text-sm text-amber-500 hover:text-amber-400">
          返回画廊
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 pb-20">
      {/* Nav */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          返回
        </button>
        <Link
          to={`/record/${memory.id}`}
          className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors"
        >
          <Edit3 className="h-4 w-4" />
          编辑
        </Link>
      </div>

      <MemoryDetail
        memory={memory}
        onToggleFavorite={handleToggleFavorite}
        onPhotoDelete={async (idx) => {
          const photos = memory.dimensions.visual.photos.filter((_, i) => i !== idx)
          const updated = { ...memory, dimensions: { ...memory.dimensions, visual: { ...memory.dimensions.visual, photos } }, updatedAt: new Date().toISOString() }
          await updateMemory(updated)
          setMemory(updated)
          store.initEdit(updated)
          toast.success('照片已删除')
        }}
      />
      <div className="mt-4 flex justify-center">
        <SharePoster memory={memory} />
      </div>
      <AIAssistant />
    </div>
  )
}
