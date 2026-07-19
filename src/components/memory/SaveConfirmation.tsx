import { motion } from 'framer-motion'
import { Hourglass, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../ui/Button'
import { useMemoryStore } from '../../store/memoryStore'
import { formatDateShort } from '../../lib/utils'
import { emotions } from '../../constants/emotions'

interface SaveConfirmationProps {
  onRecordAnother: () => void
  onViewMemory: () => void
}

export default function SaveConfirmation({ onRecordAnother, onViewMemory }: SaveConfirmationProps) {
  const { memory } = useMemoryStore()
  const emotionDef = emotions.find((e) => e.id === memory.dimensions.subjectiveFeelings.primaryEmotion)

  return (
    <motion.div
      className="flex flex-col items-center justify-center py-16 text-center"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className="mb-6 rounded-full bg-amber-500/15 p-6"
      >
        <Hourglass className="h-12 w-12 text-amber-500" />
      </motion.div>

      <motion.h2
        className="text-2xl font-medium text-text"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        记忆已珍藏
      </motion.h2>

      <motion.div
        className="mt-6 rounded-2xl border border-border bg-bg-card p-6 text-left w-full max-w-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <h3 className="text-lg font-medium text-text">{memory.title || '未命名记忆'}</h3>
        <p className="mt-1 text-xs text-text-muted">{formatDateShort(memory.actualDate)}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {memory.dimensions.subjectiveFeelings.primaryEmotion && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 text-xs text-text-muted">
              {emotionDef?.emoji} {emotionDef?.label}
            </span>
          )}
          {memory.dimensions.environment.location && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 text-xs text-text-muted">
              {memory.dimensions.environment.location}
            </span>
          )}
          {memory.dimensions.visual.photos.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 text-xs text-text-muted">
              {memory.dimensions.visual.photos.length} 张照片
            </span>
          )}
        </div>
      </motion.div>

      <motion.div
        className="mt-8 flex flex-col items-center gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onRecordAnother}>
            再记一条
          </Button>
          <Button variant="primary" onClick={onViewMemory}>
            <ArrowRight className="h-4 w-4" />
            去看看
          </Button>
        </div>
        <Link
          to="/revisit"
          className="text-sm text-amber-500/70 hover:text-amber-500 transition-colors"
        >
          浏览所有记忆 →
        </Link>
      </motion.div>
    </motion.div>
  )
}
