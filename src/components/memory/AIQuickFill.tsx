import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Camera, Loader2, Check, Edit3, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { useMemoryStore } from '../../store/memoryStore'
import { useSettingsStore } from '../../store/settingsStore'
import { fillDimensions } from '../../lib/deepseek'
import PhotoUploader from './PhotoUploader'
import { emotions } from '../../constants/emotions'
import { dimensions as dimensionMetas } from '../../constants/dimensions'
import type { MemoryDimensions } from '../../types/memory'

type Step = 'input' | 'processing' | 'preview'

interface AIQuickFillProps {
  onSaved: () => void
}

export default function AIQuickFill({ onSaved }: AIQuickFillProps) {
  const store = useMemoryStore()
  const { memory } = store
  const { apiKey } = useSettingsStore()
  const [step, setStep] = useState<Step>('input')
  const [photos, setPhotos] = useState<string[]>(memory.dimensions.visual.photos)
  const [freeText, setFreeText] = useState('')
  const [aiResult, setAiResult] = useState<Record<string, unknown> | null>(null)
  const [expandedDims, setExpandedDims] = useState<Set<string>>(new Set())
  const [editingDim, setEditingDim] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const toggleExpand = (key: string) => {
    setExpandedDims((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const handleAIFill = async () => {
    if (!apiKey) {
      toast.error('请先在设置页面配置 DeepSeek API Key')
      return
    }
    if (photos.length === 0 && !freeText.trim()) {
      toast.error('至少上传一张照片或写一段话')
      return
    }

    setStep('processing')
    try {
      const result = await fillDimensions(photos.length, freeText, memory.title || undefined)
      setAiResult(result)
      setStep('preview')
      toast.success('AI 帮你整理好了，看看怎么样～')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'AI 处理失败，再试一次')
      setStep('input')
    }
  }

  const handleApplyAndSave = () => {
    if (!aiResult) return

    // Apply AI result to memory store
    if (aiResult.title && !memory.title.trim()) {
      store.setTitle(String(aiResult.title))
    }

    // Subjective feelings
    const sf: Record<string, unknown> = {}
    if (aiResult.emotion) sf.primaryEmotion = aiResult.emotion
    if (aiResult.moodIntensity) sf.moodIntensity = aiResult.moodIntensity
    if (aiResult.moodDescription) sf.moodDescription = aiResult.moodDescription
    if (aiResult.emotionalTags) sf.emotionalTags = aiResult.emotionalTags
    if (Object.keys(sf).length > 0) {
      store.updateDimension('subjectiveFeelings', sf)
    }

    // Visual
    const vis: Record<string, unknown> = { photos }
    if (aiResult.visualDescription) vis.visualDescription = aiResult.visualDescription
    if (aiResult.dominantColors) vis.dominantColors = aiResult.dominantColors
    if (aiResult.lightQuality) vis.lightQuality = aiResult.lightQuality
    store.updateDimension('visual', vis)

    // Auditory
    const aud: Record<string, unknown> = {}
    if (aiResult.sounds) aud.sounds = aiResult.sounds
    if (aiResult.music) aud.music = aiResult.music
    if (aiResult.audioDescription) aud.audioDescription = aiResult.audioDescription
    if (Object.keys(aud).length > 0) store.updateDimension('auditory', aud)

    // Taste
    const tas: Record<string, unknown> = {}
    if (aiResult.flavors) tas.flavors = aiResult.flavors
    if (aiResult.foodAndDrinks) tas.foodAndDrinks = aiResult.foodAndDrinks
    if (aiResult.tasteDescription) tas.tasteDescription = aiResult.tasteDescription
    if (Object.keys(tas).length > 0) store.updateDimension('taste', tas)

    // Smell
    const sme: Record<string, unknown> = {}
    if (aiResult.scents) sme.scents = aiResult.scents
    if (aiResult.smellDescription) sme.smellDescription = aiResult.smellDescription
    if (Object.keys(sme).length > 0) store.updateDimension('smell', sme)

    // Touch
    const tou: Record<string, unknown> = {}
    if (aiResult.textures) tou.textures = aiResult.textures
    if (aiResult.temperature) tou.temperature = aiResult.temperature
    if (aiResult.physicalSensations) tou.physicalSensations = aiResult.physicalSensations
    if (aiResult.touchDescription) tou.touchDescription = aiResult.touchDescription
    if (Object.keys(tou).length > 0) store.updateDimension('touch', tou)

    // Environment
    const env: Record<string, unknown> = {}
    if (aiResult.location) env.location = aiResult.location
    if (aiResult.weather) env.weather = aiResult.weather
    if (aiResult.setting) env.setting = aiResult.setting
    if (aiResult.environmentDescription) env.environmentDescription = aiResult.environmentDescription
    if (Object.keys(env).length > 0) store.updateDimension('environment', env)

    // Objects
    const obj: Record<string, unknown> = {}
    if (aiResult.items) obj.items = aiResult.items
    if (aiResult.objectsDescription) obj.objectsDescription = aiResult.objectsDescription
    if (Object.keys(obj).length > 0) store.updateDimension('objects', obj)

    // Relationships
    const rel: Record<string, unknown> = {}
    if (aiResult.people) rel.people = aiResult.people
    if (aiResult.relationshipDescription) rel.relationshipDescription = aiResult.relationshipDescription
    if (Object.keys(rel).length > 0) store.updateDimension('relationships', rel)

    // Tags and AI enrichment — use getState() to ensure we write to the latest state
    if (aiResult.tags) store.setTags([...new Set([...memory.tags, ...(aiResult.tags as string[])])])
    const latest = useMemoryStore.getState().memory
    if (aiResult.themeTags) {
      latest.aiEnriched.themeTags = aiResult.themeTags as string[]
      latest.aiEnriched.enriched = true
    }
    if (aiResult.summary) {
      latest.aiEnriched.summary = aiResult.summary as string
      latest.aiEnriched.enriched = true
    }

    // Auto-fill title if empty
    if (!latest.title.trim() && aiResult.summary) {
      const shortTitle = String(aiResult.summary).slice(0, 20)
      store.setTitle(shortTitle)
    }

    onSaved()
  }

  // Count how many dimensions have data
  const filledCount = aiResult
    ? [
        aiResult.emotion || aiResult.moodDescription,
        aiResult.visualDescription || (aiResult.dominantColors as string[])?.length > 0,
        aiResult.sounds || aiResult.audioDescription,
        aiResult.flavors || aiResult.tasteDescription,
        aiResult.scents || aiResult.smellDescription,
        aiResult.textures || aiResult.touchDescription,
        aiResult.location || aiResult.environmentDescription,
        aiResult.items || aiResult.objectsDescription,
        aiResult.people || aiResult.relationshipDescription,
      ].filter(Boolean).length
    : 0

  // Get a quick display of dimension content for preview
  const getDimPreview = (key: string): string | null => {
    if (!aiResult) return null
    const m: Record<string, string | string[]> = {
      subjectiveFeelings: (aiResult.moodDescription as string) || (aiResult.emotion as string),
      visual: (aiResult.visualDescription as string) || (aiResult.lightQuality as string),
      auditory: (aiResult.audioDescription as string) || ((aiResult.sounds as string[])?.join('、')),
      taste: (aiResult.tasteDescription as string) || ((aiResult.flavors as string[])?.join('、')),
      smell: (aiResult.smellDescription as string) || ((aiResult.scents as string[])?.join('、')),
      touch: (aiResult.touchDescription as string) || (aiResult.temperature as string),
      environment: (aiResult.location as string) || (aiResult.environmentDescription as string),
      objects: (aiResult.objectsDescription as string),
      relationships: (aiResult.relationshipDescription as string),
    }
    const val = m[key]
    if (typeof val === 'string') return val || null
    if (Array.isArray(val) && val.length > 0) return val.join('、')
    return null
  }

  return (
    <div className="space-y-4">
      {/* Step: Input */}
      <AnimatePresence mode="wait">
        {step === 'input' && (
          <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Title & Date */}
            <div className="rounded-2xl border border-border bg-bg-card p-5">
              <input
                type="text"
                value={memory.title}
                onChange={(e) => store.setTitle(e.target.value)}
                placeholder="给这段记忆起个名字（必填）"
                className="w-full border-0 bg-transparent px-0 text-lg font-medium text-text placeholder:text-text-muted/40 focus:outline-none"
              />
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-text-muted shrink-0">日期</span>
                <input
                  type="date"
                  value={memory.actualDate.slice(0, 10)}
                  onChange={(e) => store.setActualDate(e.target.value + 'T00:00:00.000Z')}
                  className="w-40 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text focus:border-amber-500/40 focus:outline-none"
                />
              </div>
            </div>

            {/* Photo upload */}
            <div className="rounded-2xl border border-border bg-bg-card p-5">
              <h3 className="text-sm font-medium text-text mb-3 flex items-center gap-2">
                <Camera className="h-4 w-4 text-amber-500" />
                上传照片
              </h3>
              <p className="text-xs text-text-muted mb-3">
                拖拽或点击上传，AI 会从照片中识别场景、颜色、光线、人物等信息
              </p>
              <PhotoUploader photos={photos} onChange={setPhotos} />
            </div>

            {/* Free text */}
            <div className="rounded-2xl border border-border bg-bg-card p-5">
              <h3 className="text-sm font-medium text-text mb-3 flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-amber-500" />
                自由讲述
              </h3>
              <p className="text-xs text-text-muted mb-3">
                随便写几句——天气怎么样、听到了什么声音、闻到了什么气味、和谁在一起…想到什么写什么
              </p>
              <textarea
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                placeholder="比如：下班后和同事去了那家常去的居酒屋，梅子酒很甜，店里放着爵士乐，烤串的香气弥漫整个房间，灯光昏暗但很温暖…"
                rows={5}
                className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-sm text-text placeholder:text-text-muted/40 focus:border-amber-500/40 focus:outline-none resize-none"
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleAIFill}
              className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3.5 text-sm font-medium text-white hover:from-amber-400 hover:to-orange-400 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              AI 帮你整理 →
            </button>
          </motion.div>
        )}

        {/* Step: Processing */}
        {step === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center py-16"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
            >
              <Sparkles className="h-12 w-12 text-amber-500" />
            </motion.div>
            <p className="mt-6 text-sm font-medium text-text">AI 正在分析你的记忆…</p>
            <p className="mt-2 text-xs text-text-muted">从照片和文字中提取视觉、听觉、味觉等九维度信息</p>
            <div className="mt-6 flex gap-1.5">
              {dimensionMetas.map((dim, i) => (
                <motion.div
                  key={dim.key}
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: dim.color }}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.15 }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Step: Preview */}
        {step === 'preview' && aiResult && (
          <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* AI summary banner */}
            {aiResult.summary && (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
                <p className="text-xs text-amber-500/60 mb-1">AI 读后的感受</p>
                <p className="text-sm leading-relaxed text-text">{String(aiResult.summary)}</p>
              </div>
            )}

            {/* Filled count */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-text">AI 识别到</span>
              <span className="text-amber-500 font-bold">{filledCount}/9</span>
              <span className="text-text-muted">个维度的信息</span>
            </div>

            {/* Dimension cards preview */}
            <div className="space-y-2">
              {dimensionMetas.map((dim) => {
                const preview = getDimPreview(dim.key)
                const isExpanded = expandedDims.has(dim.key)
                const isEditing = editingDim === dim.key

                return (
                  <div
                    key={dim.key}
                    className="rounded-xl border border-border bg-bg-card overflow-hidden"
                  >
                    <button
                      onClick={() => toggleExpand(dim.key)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold"
                          style={{ backgroundColor: dim.color + '20', color: dim.color }}
                        >
                          {dim.label.slice(0, 1)}
                        </div>
                        <span className="text-sm text-text">{dim.label}</span>
                        {preview ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <span className="text-[10px] text-text-muted/40">未识别到</span>
                        )}
                      </div>
                      <ChevronDown className={`h-4 w-4 text-text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 border-t border-border pt-3">
                            {preview ? (
                              isEditing ? (
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="flex-1 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text focus:border-amber-500/40 focus:outline-none"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        setEditingDim(null)
                                      }
                                    }}
                                  />
                                  <button
                                    onClick={() => setEditingDim(null)}
                                    className="rounded-lg bg-amber-500/20 px-3 py-1.5 text-xs text-amber-500"
                                  >
                                    确定
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-start justify-between gap-3">
                                  <p className="text-sm text-text-muted leading-relaxed">{preview}</p>
                                  <button
                                    onClick={() => {
                                      setEditValue(preview)
                                      setEditingDim(dim.key)
                                    }}
                                    className="shrink-0 text-text-muted/40 hover:text-text-muted transition-colors"
                                  >
                                    <Edit3 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              )
                            ) : (
                              <p className="text-xs text-text-muted/40 italic">
                                AI 未从你的素材中识别到{dim.label}相关信息。你可以稍后在详情页手动补充。
                              </p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setStep('input')}
                className="flex-1 rounded-xl border border-border bg-bg py-3 text-sm text-text-muted hover:text-text transition-colors"
              >
                返回修改
              </button>
              <button
                onClick={handleApplyAndSave}
                className="flex-[2] rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-sm font-medium text-white hover:from-amber-400 hover:to-orange-400 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                确认，保存这段记忆
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
