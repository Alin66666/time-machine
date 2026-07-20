import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { ArrowLeft, Layers, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../components/ui/Button'
import { useMemoryStore } from '../store/memoryStore'
import { useMemory } from '../hooks/useMemory'
import MemoryForm from '../components/memory/MemoryForm'
import ConfettiOverlay from '../components/memory/ConfettiOverlay'
import SaveConfirmation from '../components/memory/SaveConfirmation'
import AIAssistant from '../components/ai/AIAssistant'
import AIQuickFill from '../components/memory/AIQuickFill'

type RecordMode = 'ai' | 'deep'

export default function RecordPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const store = useMemoryStore()
  const { save } = useMemory()
  const [step, setStep] = useState<'form' | 'saved'>('form')
  const [saving, setSaving] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [mode, setMode] = useState<RecordMode>('ai')

  useEffect(() => {
    if (id) {
      // Load existing memory for editing
      import('../db/operations').then(({ getMemoryById }) => {
        getMemoryById(id).then((m) => {
          if (m) store.initEdit(m)
        })
      })
    } else {
      store.initNew()
    }
  }, [id])

  const handleSave = async () => {
    const latest = useMemoryStore.getState().memory
    if (!latest.title.trim()) {
      toast.error('请给记忆起个名字吧')
      return
    }
    setSaving(true)
    try {
      const savedMemory = { ...latest, updatedAt: new Date().toISOString() }
      await save(savedMemory)
      useMemoryStore.getState().markClean()
      setShowConfetti(true)
      setTimeout(() => setStep('saved'), 600)
    } catch {
      toast.error('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  const handleRecordAnother = () => {
    store.initNew()
    setStep('form')
  }

  const handleViewMemory = () => {
    navigate(`/revisit/${store.memory.id}`)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-32 pt-4">
      <AnimatePresence mode="wait">
        {step === 'form' && (
          <div key="form">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                返回
              </button>
              <div className="flex items-center gap-3">
                {store.isDirty && (
                  <span className="text-xs text-amber-500/80">未保存</span>
                )}
                <Link
                  to="/revisit"
                  className="text-sm text-amber-500/70 hover:text-amber-500 transition-colors"
                >
                  浏览记忆 →
                </Link>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-medium text-text">
                    {id ? '编辑记忆' : '记录美好'}
                  </h1>
                  <p className="mt-1 text-sm text-text-muted">
                    {id
                      ? '修改你想更新的一切'
                      : mode === 'ai'
                        ? '传照片 + 写一段话，AI 帮你填好九维度'
                        : '闭上眼睛，回想那个时刻...'}
                  </p>
                </div>
                {/* Mode toggle */}
                {!id && (
                  <div className="flex rounded-xl border border-border bg-bg p-0.5">
                    <button
                      onClick={() => setMode('ai')}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                        mode === 'ai'
                          ? 'bg-amber-500/20 text-amber-500'
                          : 'text-text-muted hover:text-text'
                      }`}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      AI速记
                    </button>
                    <button
                      onClick={() => setMode('deep')}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                        mode === 'deep'
                          ? 'bg-purple-500/20 text-purple-400'
                          : 'text-text-muted hover:text-text'
                      }`}
                    >
                      <Layers className="h-3.5 w-3.5" />
                      深度
                    </button>
                  </div>
                )}
              </div>
            </div>

            {mode === 'ai' && !id ? (
              <AIQuickFill onSaved={handleSave} />
            ) : (
              <MemoryForm />
            )}

            {/* Save button — only for quick/deep modes, AI has its own */}
            {mode !== 'ai' && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
                <Button
                  variant="primary"
                  size="lg"
                  loading={saving}
                  onClick={handleSave}
                  className="shadow-2xl shadow-amber-500/20 min-w-[180px]"
                >
                  保存这段记忆
                </Button>
              </div>
            )}
          </div>
        )}

        {step === 'saved' && (
          <div key="saved">
            <SaveConfirmation
              onRecordAnother={handleRecordAnother}
              onViewMemory={handleViewMemory}
            />
          </div>
        )}
      </AnimatePresence>

      <ConfettiOverlay active={showConfetti} onComplete={() => setShowConfetti(false)} />
      {step === 'form' && <AIAssistant />}
    </div>
  )
}
