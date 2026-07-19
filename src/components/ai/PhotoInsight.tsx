import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ImageUp, ChevronDown, ChevronRight, Lightbulb } from 'lucide-react'
import { toast } from 'sonner'
import { analyzePhotos, type PhotoInsight as PhotoInsightType } from '../../lib/deepseek'
import { useSettingsStore } from '../../store/settingsStore'
import { useMemoryStore } from '../../store/memoryStore'
import type { MemoryDimensions } from '../../types/memory'

interface PhotoInsightProps {
  photos: string[]
  onFillField: (dimension: keyof MemoryDimensions, field: string, value: string) => void
  onSetEmotion: (emotion: string) => void
  onAddTag: (tag: string) => void
}

export default function PhotoInsight({ photos, onFillField, onSetEmotion, onAddTag }: PhotoInsightProps) {
  const [insight, setInsight] = useState<PhotoInsightType | null>(null)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(true)
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set())
  const { apiKey } = useSettingsStore()
  const storeMemory = useMemoryStore((s) => s.memory)

  const handleAnalyze = async () => {
    if (!apiKey) {
      toast.error('请先在设置页面配置 DeepSeek API Key')
      return
    }
    if (photos.length === 0) {
      toast.error('请先上传照片')
      return
    }

    setLoading(true)
    try {
      const result = await analyzePhotos(photos.length, storeMemory.title, storeMemory.tags)
      setInsight(result)
      setExpanded(true)
      setAnsweredQuestions(new Set())

      // Auto-apply scene description to visual description
      if (result.scene) {
        onFillField('visual', 'visualDescription', result.scene)
      }
      // Auto-suggest emotion
      if (result.suggestedEmotion) {
        onSetEmotion(result.suggestedEmotion)
        toast.success(`已识别情绪：${result.suggestedEmotion}`)
      }
      // Auto-add tags
      if (result.suggestedTags) {
        result.suggestedTags.forEach((t) => onAddTag(t))
      }

      toast.success(`AI 分析了你的照片，生成了 ${result.questions.length} 个引导问题`)
    } catch (e) {
      toast.error('照片分析失败，请检查 API Key')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerQuestion = (idx: number) => {
    if (!insight) return
    const q = insight.questions[idx]
    onFillField(q.targetDimension as keyof MemoryDimensions, q.targetField, '')
    setAnsweredQuestions((prev) => new Set([...prev, idx]))
    // Scroll to the relevant dimension card
    const el = document.querySelector(`[data-dimension="${q.targetDimension}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <div className="space-y-3">
      {/* Trigger button */}
      {!insight && (
        <button
          onClick={handleAnalyze}
          disabled={loading || photos.length === 0}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500/10 to-pink-500/10 border border-amber-500/20 px-4 py-3 text-sm text-amber-500 hover:from-amber-500/20 hover:to-pink-500/20 transition-all disabled:opacity-50"
        >
          {loading ? (
            <>
              <Sparkles className="h-4 w-4 animate-pulse" />
              AI 正在分析照片...
            </>
          ) : (
            <>
              <ImageUp className="h-4 w-4" />
              AI 分析照片，帮我回忆更多细节
            </>
          )}
        </button>
      )}

      {/* Results */}
      <AnimatePresence>
        {insight && (
          <motion.div
            className="rounded-2xl border border-amber-500/15 bg-gradient-to-br from-amber-500/5 to-pink-500/5 p-4"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {/* Header */}
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center justify-between w-full mb-3"
            >
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium text-text">AI 引导问题</span>
                <span className="text-xs text-text-muted">
                  ({answeredQuestions.size}/{insight.questions.length})
                </span>
              </div>
              {expanded ? <ChevronDown className="h-4 w-4 text-text-muted" /> : <ChevronRight className="h-4 w-4 text-text-muted" />}
            </button>

            {/* Scene description */}
            {expanded && insight.scene && (
              <p className="text-xs text-text-muted italic mb-3 leading-relaxed">
                📷 {insight.scene}
              </p>
            )}

            {/* Questions */}
            {expanded && (
              <div className="space-y-1.5">
                {insight.questions.map((q, idx) => {
                  const answered = answeredQuestions.has(idx)
                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswerQuestion(idx)}
                      className={`w-full text-left rounded-xl px-3 py-2.5 text-sm transition-all ${
                        answered
                          ? 'bg-green-500/5 border border-green-500/10 text-text-muted/50'
                          : 'bg-white/5 border border-transparent hover:bg-white/10 hover:border-white/10 text-text-muted hover:text-text'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`text-xs shrink-0 ${answered ? 'text-green-500/50' : 'text-amber-500'}`}>
                          {answered ? '✓' : '·'}
                        </span>
                        <span className={answered ? 'line-through' : ''}>{q.question}</span>
                        <span className="text-xs text-text-muted/40 ml-auto shrink-0">
                          {dimensionLabel(q.targetDimension)}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Refresh button */}
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="mt-3 flex items-center gap-1.5 text-xs text-amber-500/60 hover:text-amber-500 transition-colors"
            >
              <Sparkles className="h-3 w-3" />
              重新分析
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function dimensionLabel(key: string): string {
  const map: Record<string, string> = {
    subjectiveFeelings: '感受',
    visual: '视觉',
    auditory: '听觉',
    taste: '味觉',
    smell: '嗅觉',
    touch: '触觉',
    environment: '环境',
    objects: '物件',
    relationships: '关系',
  }
  return map[key] || key
}
