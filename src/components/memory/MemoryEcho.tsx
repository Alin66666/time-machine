import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, Sparkles, Pause, Play, Orbit, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import type { Memory } from '../../types/memory'
import type { MemorySnapshot, ChainNarration } from '../../lib/deepseek'
import { analyzeMemoryChain } from '../../lib/deepseek'
import { emotions } from '../../constants/emotions'
import { formatDateShort } from '../../lib/utils'

interface MemoryEchoProps {
  memories: Memory[]
  filterLabel: string
  onClose: () => void
  onViewInUniverse: (ids: string[]) => void
}

export default function MemoryEcho({ memories, filterLabel, onClose, onViewInUniverse }: MemoryEchoProps) {
  const [step, setStep] = useState<'loading' | 'ready' | 'playing' | 'paused' | 'finished'>('loading')
  const [narration, setNarration] = useState<ChainNarration | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showChat, setShowChat] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'ai' | 'user'; content: string }>>([])
  const [chatSending, setChatSending] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Build snapshots and call AI
  useEffect(() => {
    let cancelled = false
    const snapshots: MemorySnapshot[] = memories.map((m) => {
      const emo = emotions.find((e) => e.id === m.dimensions.subjectiveFeelings.primaryEmotion)
      return {
        id: m.id,
        title: m.title || '未命名',
        date: m.actualDate,
        emotion: m.dimensions.subjectiveFeelings.primaryEmotion,
        emotionLabel: emo?.label || '未知',
        moodDescription: m.dimensions.subjectiveFeelings.moodDescription,
        location: m.dimensions.environment.location,
        people: m.dimensions.relationships.people.map((p) => p.name),
        summary: '', // Don't pass AI summaries — they may contain inaccuracies
        tags: m.tags,
        photoCount: m.dimensions.visual.photos.length,
      }
    })

    analyzeMemoryChain(snapshots, filterLabel)
      .then((result) => {
        if (!cancelled) {
          setNarration(result)
          setStep('ready')
        }
      })
      .catch((e) => {
        if (!cancelled) {
          toast.error(e instanceof Error ? e.message : 'AI 分析失败')
          onClose()
        }
      })

    return () => { cancelled = true }
  }, [memories, filterLabel, onClose])

  // Auto-play timer
  useEffect(() => {
    if (step === 'playing') {
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= memories.length - 1) {
            setStep('finished')
            return prev
          }
          return prev + 1
        })
      }, 8000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [step, memories.length])

  const startPlay = useCallback(() => setStep('playing'), [])
  const togglePause = useCallback(() => {
    setStep((s) => (s === 'playing' ? 'paused' : 'playing'))
  }, [])
  const goNext = useCallback(() => {
    if (currentIndex < memories.length - 1) {
      setCurrentIndex((i) => i + 1)
    } else {
      setStep('finished')
    }
  }, [currentIndex, memories.length])
  const goPrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1))
  }, [])

  const handleChatSend = useCallback(async () => {
    if (!chatInput.trim() || chatSending) return
    const userMsg = chatInput.trim()
    setChatInput('')
    setChatMessages((prev) => [...prev, { role: 'user', content: userMsg }])
    setChatSending(true)

    try {
      const { chatWithContext } = await import('../../lib/deepseek')
      const currentMem = memories[currentIndex]
      const context = `你正在和用户回顾一段记忆：
标题：${currentMem.title}
日期：${currentMem.actualDate}
感受：${currentMem.dimensions.subjectiveFeelings.moodDescription || '未记录'}
地点：${currentMem.dimensions.environment.location || '未记录'}
${narration ? `AI导语：${narration.memories[currentIndex]?.narration || ''}` : ''}
${narration ? `整体主题：${narration.theme}` : ''}

你是用户温暖的记忆伙伴。用口语化的方式回应，1-3句话。`

      const text = await chatWithContext(
        [{ role: 'user', content: userMsg }],
        context
      )
      setChatMessages((prev) => [...prev, { role: 'ai', content: text }])
    } catch {
      toast.error('发送失败')
    } finally {
      setChatSending(false)
    }
  }, [chatInput, chatSending, currentIndex, memories, narration])

  const current = memories[currentIndex]
  const currentNarration = narration?.memories[currentIndex]
  const currentEmotion = emotions.find((e) => e.id === current?.dimensions.subjectiveFeelings.primaryEmotion)
  const mainPhoto = current?.dimensions.visual.photos[0] || ''

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-[#050510] flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Loading */}
      {step === 'loading' && (
        <div className="flex-1 flex flex-col items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
            className="mb-6"
          >
            <Sparkles className="h-12 w-12 text-amber-500" />
          </motion.div>
          <p className="text-lg text-text">AI 正在编织你的记忆...</p>
          <p className="mt-2 text-sm text-text-muted">在 {memories.length} 段时光中寻找回响</p>
        </div>
      )}

      {/* Ready / Playing / Paused / Finished */}
      {(step === 'ready' || step === 'playing' || step === 'paused' || step === 'finished') && (
        <>
          {/* Top bar */}
          <div className="shrink-0 flex items-center justify-between px-6 py-4">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white/80 transition-colors"
            >
              <X className="h-4 w-4" />
              退出
            </button>

            {/* Timeline dots */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-text-muted">{narration?.theme || ''}</span>
            </div>

            <div className="flex items-center gap-1">
              {memories.map((m, i) => (
                <button
                  key={m.id}
                  onClick={() => { setCurrentIndex(i); if (step === 'finished') setStep('paused') }}
                  className={`h-2 rounded-full transition-all duration-500 ${
                    i === currentIndex
                      ? 'w-8 bg-amber-500'
                      : i < currentIndex
                        ? 'w-2 bg-amber-500/40'
                        : 'w-2 bg-white/15'
                  }`}
                />
              ))}
            </div>

            <div className="w-16" /> {/* spacer */}
          </div>

          {/* Main content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="flex flex-col items-center justify-center min-h-full">
            <AnimatePresence mode="wait">
              {step !== 'finished' ? (
                <motion.div
                  key={current.id}
                  className="flex flex-col items-center max-w-2xl w-full"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.6, ease: 'easeInOut' }}
                >
                  {/* Photo */}
                  {mainPhoto ? (
                    <div className="relative w-full mb-4 rounded-2xl overflow-hidden flex items-center justify-center" style={{ maxHeight: '40vh' }}>
                      <motion.img
                        src={mainPhoto}
                        alt={current.title}
                        className="w-full h-auto max-h-[40vh] object-contain"
                        initial={{ scale: 1.03 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 4, ease: 'easeOut' }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#050510]/60 via-transparent to-transparent pointer-events-none" />
                    </div>
                  ) : (
                    <div className="w-full h-48 mb-6 rounded-2xl bg-white/5 flex items-center justify-center">
                      <span className="text-6xl">{currentEmotion?.emoji || '✨'}</span>
                    </div>
                  )}

                  {/* Title + Date */}
                  <h2 className="text-2xl font-medium text-text text-center">{current.title || '未命名记忆'}</h2>
                  <p className="mt-1 text-sm text-text-muted">{formatDateShort(current.actualDate)}</p>

                  {/* Mood quote */}
                  {current.dimensions.subjectiveFeelings.moodDescription && (
                    <p className="mt-4 text-center text-lg text-text/80 italic leading-relaxed max-w-lg">
                      "{current.dimensions.subjectiveFeelings.moodDescription}"
                    </p>
                  )}

                  {/* Dimension tags */}
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                    {currentEmotion && (
                      <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-text-muted">
                        {currentEmotion.emoji} {currentEmotion.label}
                      </span>
                    )}
                    {current.dimensions.environment.location && (
                      <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-text-muted">
                        📍 {current.dimensions.environment.location}
                      </span>
                    )}
                    {current.dimensions.relationships.people.length > 0 && (
                      <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-text-muted">
                        👥 {current.dimensions.relationships.people.map((p) => p.name).join('、')}
                      </span>
                    )}
                    {current.dimensions.auditory.sounds.length > 0 && (
                      <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-text-muted">
                        👂 {current.dimensions.auditory.sounds.slice(0, 2).join('、')}
                      </span>
                    )}
                  </div>

                  {/* AI Narration */}
                  {currentNarration && (
                    <motion.p
                      className="mt-6 text-center text-sm text-amber-500/80 leading-relaxed max-w-lg"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.5, duration: 1.5 }}
                    >
                      {currentNarration.narration}
                    </motion.p>
                  )}

                  {/* Progress */}
                  <p className="mt-4 text-xs text-text-muted/50">
                    {currentIndex + 1} / {memories.length}
                  </p>
                </motion.div>
              ) : (
                /* Finished screen */
                <motion.div
                  key="finished"
                  className="flex flex-col items-center text-center max-w-lg"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8 }}
                >
                  <motion.div
                    className="mb-6 rounded-full bg-amber-500/10 p-6"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <Sparkles className="h-12 w-12 text-amber-500" />
                  </motion.div>

                  <h2 className="text-2xl font-medium text-text">记忆回响</h2>

                  {narration && (
                    <>
                      <p className="mt-3 text-lg text-amber-500/80 font-serif italic">
                        "{narration.theme}"
                      </p>
                      <p className="mt-4 text-sm text-text-muted leading-relaxed">
                        {narration.closing}
                      </p>
                    </>
                  )}

                  <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={() => onViewInUniverse(memories.map((m) => m.id))}
                      className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-pink-500 px-5 py-3 text-sm font-medium text-white hover:shadow-lg hover:shadow-amber-500/20 transition-all"
                    >
                      <Orbit className="h-4 w-4" />
                      在宇宙中查看这些星球
                    </button>
                    <button
                      onClick={() => {
                        setCurrentIndex(0)
                        setStep('ready')
                      }}
                      className="flex items-center gap-2 rounded-xl border border-border bg-white/5 px-5 py-3 text-sm text-text-muted hover:text-text hover:bg-white/10 transition-all"
                    >
                      🔁 再走一遍
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            </div>
          </div>

          {/* Bottom controls */}
          {step !== 'finished' && (
            <div className="shrink-0 flex items-center justify-center gap-4 py-6">
              <button
                onClick={goPrev}
                disabled={currentIndex === 0}
                className="rounded-full bg-white/5 p-3 text-white/60 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-20"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <button
                onClick={togglePause}
                className="rounded-full bg-white/10 p-4 text-white hover:bg-white/15 transition-colors"
              >
                {step === 'playing' ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </button>

              <button
                onClick={goNext}
                className="rounded-full bg-white/5 p-3 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              <button
                onClick={() => setShowChat(!showChat)}
                className={`rounded-full p-3 transition-colors ${
                  showChat
                    ? 'bg-amber-500/20 text-amber-500'
                    : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <MessageCircle className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Chat panel */}
          <AnimatePresence>
            {showChat && step !== 'finished' && (
              <motion.div
                className="shrink-0 border-t border-border bg-bg-card/90 backdrop-blur-xl px-6 py-4"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
              >
                <div className="max-h-40 overflow-y-auto space-y-3 mb-3">
                  {chatMessages.map((msg, i) => (
                    <p key={i} className={`text-sm ${msg.role === 'ai' ? 'text-amber-500/80' : 'text-text'}`}>
                      {msg.role === 'ai' ? '✨ ' : '💬 '}{msg.content}
                    </p>
                  ))}
                  {chatMessages.length === 0 && (
                    <p className="text-xs text-text-muted">聊聊这段记忆...</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
                    placeholder="说说你的感受..."
                    className="flex-1 rounded-xl border border-border bg-bg px-3 py-2 text-sm text-text placeholder:text-text-muted/50 outline-none focus:border-amber-500/30"
                  />
                  <button
                    onClick={handleChatSend}
                    disabled={chatSending || !chatInput.trim()}
                    className="rounded-xl bg-amber-500/20 px-4 py-2 text-sm text-amber-500 hover:bg-amber-500/30 disabled:opacity-30 transition-colors"
                  >
                    发送
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </motion.div>
  )
}
