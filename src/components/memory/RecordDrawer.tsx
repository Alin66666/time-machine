import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Camera, ChevronRight, Sparkles, Check, Fish, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { dimensions as allDimensions, type DimensionMeta } from '../../constants/dimensions'
import { emotions } from '../../constants/emotions'
import { useMemoryStore } from '../../store/memoryStore'
import { useMemory } from '../../hooks/useMemory'
import { useNianNianStore } from '../../store/nianNianStore'
import { useSettingsStore } from '../../store/settingsStore'
import { analyzePhotos, enrichMemory } from '../../lib/deepseek'
import PhotoUploader from './PhotoUploader'
import type { MemoryDimensions } from '../../types/memory'

type Step = 'input' | 'ai-filling' | 'preview' | 'launched'

interface RecordDrawerProps {
  open: boolean
  onClose: () => void
}

export default function RecordDrawer({ open, onClose }: RecordDrawerProps) {
  const store = useMemoryStore()
  const { save } = useMemory()
  const { addFishCrackers } = useNianNianStore()
  const { apiKey } = useSettingsStore()

  const [step, setStep] = useState<Step>('input')
  const [photos, setPhotos] = useState<string[]>([])
  const [selectedDims, setSelectedDims] = useState<Set<string>>(new Set())
  const [freeText, setFreeText] = useState('')
  const [title, setTitle] = useState('')
  const [aiResult, setAiResult] = useState<Partial<MemoryDimensions> | null>(null)
  const [aiSummary, setAiSummary] = useState('')
  const [aiTags, setAiTags] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const handleReset = useCallback(() => {
    setStep('input')
    setPhotos([])
    setSelectedDims(new Set())
    setFreeText('')
    setTitle('')
    setAiResult(null)
    setAiSummary('')
    setAiTags([])
  }, [])

  const handleClose = () => {
    handleReset()
    onClose()
  }

  const toggleDim = (key: string) => {
    setSelectedDims((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const handlePhotosAdded = async (files: File[]) => {
    const compressImage = (file: File): Promise<string> =>
      new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const img = new Image()
          img.onload = () => {
            const canvas = document.createElement('canvas')
            let { width, height } = img
            if (width > 1200) { height = (height * 1200) / width; width = 1200 }
            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext('2d')!
            ctx.drawImage(img, 0, 0, width, height)
            resolve(canvas.toDataURL('image/jpeg', 0.7))
          }
          img.onerror = reject
          img.src = reader.result as string
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
    const compressed = await Promise.all(files.map(compressImage))
    setPhotos((prev) => [...prev, ...compressed].slice(0, 10))
  }

  const handleRemovePhoto = (idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleHandToNianNian = async () => {
    if (!apiKey) {
      toast.error('请先在设置页面配置 DeepSeek API Key')
      return
    }
    if (photos.length === 0 && !freeText.trim()) {
      toast.error('至少上传一张照片或写一段话给念念吧～')
      return
    }
    if (selectedDims.size === 0) {
      toast.error('至少选一个维度，念念才知道你想记录什么～')
      return
    }

    setStep('ai-filling')

    try {
      // Build the AI prompt for dimensional filling
      const dimLabels = Array.from(selectedDims)
        .map((k) => allDimensions.find((d) => d.key === k)?.label)
        .filter(Boolean)
        .join('、')

      const memoryJson = JSON.stringify({
        title: title || '未命名记忆',
        freeText,
        selectedDimensions: Array.from(selectedDims),
      })

      // Use enrichMemory to fill dimensions
      const enriched = await enrichMemory(
        JSON.stringify({
          title: title || '未命名',
          freeText,
          photoCount: photos.length,
          selectedDimensions: Array.from(selectedDims).map((k) => ({
            key: k,
            label: allDimensions.find((d) => d.key === k)?.label,
          })),
          instruction: `请根据用户提供的文字和${photos.length}张照片，对以下选中的维度进行识别填充：${dimLabels}。只从用户素材中提取，读不到就留空，绝不杜撰。返回每个维度的enhancedDescriptions，key为维度key。`,
        })
      ).catch(() => ({ enhancedDescriptions: {} }))

      // Build dimensions object from AI result
      const dims: Partial<MemoryDimensions> = {}
      if (enriched.enhancedDescriptions) {
        for (const [key, value] of Object.entries(enriched.enhancedDescriptions)) {
          if (selectedDims.has(key) && value) {
            ;(dims as Record<string, unknown>)[key] = value
          }
        }
      }

      // Also try to get a summary
      let summary = ''
      try {
        if (photos.length > 0 || freeText.trim()) {
          const insight = await analyzePhotos(
            photos.length,
            title || undefined
          )
          summary = insight.scene || ''
          if (insight.suggestedEmotion) {
            setAiResult((prev) => ({
              ...prev,
              subjectiveFeelings: {
                primaryEmotion: insight.suggestedEmotion || '',
                moodIntensity: 7,
                moodDescription: summary,
                emotionalTags: insight.suggestedTags || [],
              },
              visual: { photos: [], dominantColors: [], lightQuality: '', visualDescription: '' },
              auditory: { sounds: [], music: '', audioDescription: '' },
              taste: { flavors: [], foodAndDrinks: [], tasteDescription: '' },
              smell: { scents: [], smellDescription: '' },
              touch: { textures: [], temperature: '', physicalSensations: '', touchDescription: '' },
              environment: { location: '', weather: '', setting: '', environmentDescription: '' },
              objects: { items: [], objectsDescription: '' },
              relationships: { people: [], relationshipDescription: '' },
            }))
          }
          if (insight.suggestedTags) setAiTags(insight.suggestedTags)
        }
      } catch { /* summary failed, non-blocking */ }

      if (summary) setAiSummary(summary)

      setStep('preview')
      toast.success('念念帮你整理好啦，看看怎么样～')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '念念走神了，再试一次吧')
      setStep('input')
    }
  }

  const handleLaunch = async () => {
    setSaving(true)
    try {
      store.initNew()
      store.setTags(aiTags)
      if (title) store.memory.title = title
      store.memory.dimensions.visual.photos = photos

      // Apply AI-filled dimensions
      if (aiResult?.subjectiveFeelings) {
        store.memory.dimensions.subjectiveFeelings = aiResult.subjectiveFeelings
      }

      store.memory.aiEnriched.enriched = true
      if (aiSummary) store.memory.aiEnriched.summary = aiSummary
      if (aiTags.length > 0) store.memory.aiEnriched.themeTags = aiTags

      const savedMemory = { ...store.memory, updatedAt: new Date().toISOString() }
      await save(savedMemory)

      // Award fish crackers: base 1 + per dimension 1
      const fishAmount = 1 + selectedDims.size
      await addFishCrackers(fishAmount, savedMemory.id)

      setStep('launched')
    } catch {
      toast.error('发射失败，再试一次')
    } finally {
      setSaving(false)
    }
  }

  const selectedDimMetas = Array.from(selectedDims)
    .map((k) => allDimensions.find((d) => d.key === k))
    .filter(Boolean) as DimensionMeta[]

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Drawer */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl border border-border bg-bg-card"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Handle bar */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-bg-card px-6 py-4">
              <span className="text-sm font-medium text-text">
                {step === 'input' && '喂念念一段记忆'}
                {step === 'ai-filling' && '念念正在读你的记忆…'}
                {step === 'preview' && '念念整理好了，确认一下～'}
                {step === 'launched' && '发射成功！'}
              </span>
              <button onClick={handleClose} className="text-text-muted hover:text-text">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-5">
              {/* Step: Input */}
              {step === 'input' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {/* NianNian guide line */}
                  <p className="mb-5 text-sm text-text-muted">
                    🐱 念念说：「把你这一刻的记忆交给我，我来帮你打包成星球！」
                  </p>

                  {/* Title */}
                  <div className="mb-4">
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="给这段记忆取个名字…"
                      className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-lg text-text placeholder:text-text-muted/40 focus:border-amber-500/40 focus:outline-none"
                    />
                  </div>

                  {/* Photo upload */}
                  <div className="mb-5">
                    <PhotoUploader
                      photos={photos}
                      onPhotosAdded={handlePhotosAdded}
                      onRemove={handleRemovePhoto}
                    />
                  </div>

                  {/* Dimension chips */}
                  <div className="mb-5">
                    <p className="mb-2 text-xs text-text-muted">
                      选你想记录的维度，可多选，不用逐个填表～
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {allDimensions.map((dim) => {
                        const sel = selectedDims.has(dim.key)
                        return (
                          <button
                            key={dim.key}
                            onClick={() => toggleDim(dim.key)}
                            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${
                              sel
                                ? 'border-amber-500/40 bg-amber-500/15 text-amber-400'
                                : 'border-white/10 bg-white/5 text-text-muted hover:border-white/20 hover:text-text'
                            }`}
                          >
                            {dim.label}
                            {sel && <Check className="ml-1 inline h-3 w-3" />}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Free text */}
                  <div className="mb-5">
                    <textarea
                      value={freeText}
                      onChange={(e) => setFreeText(e.target.value)}
                      placeholder="讲讲这一刻…（天气、声音、气味、身边的人，想到什么写什么，念念帮你整理）"
                      rows={4}
                      className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-sm text-text placeholder:text-text-muted/40 focus:border-amber-500/40 focus:outline-none resize-none"
                    />
                  </div>

                  {/* Submit */}
                  <button
                    onClick={handleHandToNianNian}
                    className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3.5 text-sm font-medium text-white hover:from-amber-400 hover:to-orange-400 transition-all flex items-center justify-center gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    交给念念整理 →
                  </button>
                </motion.div>
              )}

              {/* Step: AI Filling (loading) */}
              {step === 'ai-filling' && (
                <motion.div
                  className="flex flex-col items-center py-12"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="relative mb-6">
                    <Loader2 className="h-12 w-12 text-amber-500 animate-spin" />
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center"
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      <Fish className="h-5 w-5 text-amber-600" />
                    </motion.div>
                  </div>
                  <p className="text-sm text-text-muted">念念正在读你的记忆…</p>
                  <p className="mt-1 text-xs text-text-muted/50">小鱼干被一点点叼出来的进度～</p>
                </motion.div>
              )}

              {/* Step: Preview */}
              {step === 'preview' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <p className="mb-4 text-sm text-text-muted">
                    🐱 念念的整理结果，你可以随手改，按「确认发射」投放宇宙～
                  </p>

                  {/* AI summary */}
                  {aiSummary && (
                    <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                      <p className="text-xs text-amber-400/60 mb-1">念念的读后感</p>
                      <p className="text-sm text-text">{aiSummary}</p>
                    </div>
                  )}

                  {/* Filled dimensions preview */}
                  {selectedDimMetas.length > 0 && (
                    <div className="mb-4 space-y-3">
                      <p className="text-xs text-text-muted">已填充的维度 ({selectedDims.size}个)</p>
                      {selectedDimMetas.map((dim) => (
                        <div
                          key={dim.key}
                          className="rounded-xl border border-border bg-bg/50 px-4 py-3"
                        >
                          <span className="text-xs font-medium text-text-muted">{dim.label}</span>
                          <p className="mt-1 text-sm text-text/70">
                            {photos.length > 0 ? '📷 从你的照片中识别的内容…' : '📝 基于你的描述整理的内容…'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* AI tags */}
                  {aiTags.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-1.5">
                      {aiTags.map((t) => (
                        <span
                          key={t}
                          className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-xs text-amber-400"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Fish cracker preview */}
                  <div className="mb-5 flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3">
                    <Fish className="h-5 w-5 text-amber-500" />
                    <span className="text-sm text-amber-400">
                      这颗星球将产出 <strong>{1 + selectedDims.size}</strong> 条小鱼干！
                    </span>
                  </div>

                  <button
                    onClick={handleLaunch}
                    disabled={saving}
                    className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3.5 text-sm font-medium text-white hover:from-amber-400 hover:to-orange-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    确认发射 → 星球升空！
                  </button>
                </motion.div>
              )}

              {/* Step: Launched */}
              {step === 'launched' && (
                <motion.div
                  className="flex flex-col items-center py-10 text-center"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <motion.div
                    animate={{ y: [0, -20, 0] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                  >
                    <span className="text-6xl">🚀</span>
                  </motion.div>
                  <h3 className="mt-4 text-lg font-medium text-text">
                    念念不忘，必有回响！
                  </h3>
                  <p className="mt-2 text-sm text-text-muted">
                    你的记忆已经被念念打包成一颗星球，投放到宇宙中啦～
                  </p>
                  <p className="mt-1 text-xs text-amber-400">
                    +{1 + selectedDims.size} 🐟 小鱼干已送达念念
                  </p>
                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={() => {
                        handleReset()
                      }}
                      className="rounded-xl border border-border bg-bg px-5 py-2.5 text-sm text-text hover:bg-bg-card-hover transition-colors"
                    >
                      再喂一段
                    </button>
                    <button
                      onClick={handleClose}
                      className="rounded-xl bg-amber-500/20 border border-amber-500/30 px-5 py-2.5 text-sm text-amber-400 hover:bg-amber-500/30 transition-colors"
                    >
                      回宇宙看看
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
