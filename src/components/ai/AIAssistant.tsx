import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X, FileText, Tag, TrendingUp, HelpCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useMemoryStore } from '../../store/memoryStore'
import { useSettingsStore } from '../../store/settingsStore'
import { runAIEnrichment } from '../../lib/deepseek'
import AIProcessingModal from './AIProcessingModal'

const modes = [
  { id: 'summary', label: '生成诗意总结', icon: FileText },
  { id: 'themes', label: '提取主题标签', icon: Tag },
  { id: 'moodArc', label: '分析情感轨迹', icon: TrendingUp },
  { id: 'prompts', label: '帮我回忆更多', icon: HelpCircle },
]

export default function AIAssistant() {
  const [open, setOpen] = useState(false)
  const [processing, setProcessing] = useState(false)
  const { memory, setDimensions, setTags } = useMemoryStore()
  const { apiKey } = useSettingsStore()

  const handleEnrich = async (selectedModes: string[]) => {
    if (!apiKey) {
      toast.error('请先在设置页面配置 DeepSeek API Key')
      return
    }

    setProcessing(true)
    setOpen(false)

    try {
      const json = JSON.stringify({
        title: memory.title,
        dimensions: memory.dimensions,
        tags: memory.tags,
        actualDate: memory.actualDate,
      })

      const result = await runAIEnrichment(json, selectedModes)

      // Apply results
      if (result.summary) {
        memory.aiEnriched.summary = result.summary
        memory.aiEnriched.enriched = true
      }
      if (result.themeTags) {
        memory.aiEnriched.themeTags = result.themeTags
        memory.aiEnriched.enriched = true
        setTags([...new Set([...memory.tags, ...result.themeTags])])
      }
      if (result.moodArc) {
        memory.aiEnriched.moodArc = result.moodArc
        memory.aiEnriched.enriched = true
      }
      if (result.suggestedPrompts) {
        memory.aiEnriched.suggestedPrompts = result.suggestedPrompts
        memory.aiEnriched.enriched = true
      }

      toast.success('AI 润色完成！')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'AI 服务暂时不可用'
      toast.error(msg)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-24 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-pink-500 shadow-lg shadow-amber-500/20 text-white hover:shadow-xl hover:scale-105 transition-all"
      >
        <Sparkles className="h-5 w-5" />
      </button>

      {/* Slide-up panel */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl border border-border bg-bg-card p-6"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  <h3 className="font-medium text-text">AI 记忆润色</h3>
                </div>
                <button onClick={() => setOpen(false)} className="text-text-muted hover:text-text">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p className="mb-4 text-xs text-text-muted">
                DeepSeek 会帮你从不同角度丰富这段记忆。选择一个模式开始吧。
              </p>

              <div className="space-y-2">
                {modes.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => handleEnrich([id])}
                    className="flex w-full items-center gap-3 rounded-xl border border-border bg-bg/50 px-4 py-3 text-left hover:bg-bg-card-hover hover:border-white/15 transition-colors"
                  >
                    <Icon className="h-4 w-4 text-amber-500" />
                    <span className="text-sm text-text">{label}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => handleEnrich(['summary', 'themes', 'moodArc'])}
                className="mt-3 w-full rounded-xl bg-gradient-to-r from-amber-500/20 to-pink-500/20 border border-amber-500/30 py-3 text-sm font-medium text-amber-500 hover:from-amber-500/30 hover:to-pink-500/30 transition-colors"
              >
                ✨ 一键全面润色
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AIProcessingModal open={processing} text="DeepSeek 正在思考..." />
    </>
  )
}
