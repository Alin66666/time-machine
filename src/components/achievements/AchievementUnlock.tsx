import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy } from 'lucide-react'
import type { EarnedBadge } from '../../types/memory'
import { getBadgeDef } from '../../lib/achievements'
import ConfettiOverlay from '../memory/ConfettiOverlay'

interface AchievementUnlockProps {
  queue: EarnedBadge[]
  onComplete: () => void
}

export default function AchievementUnlock({ queue, onComplete }: AchievementUnlockProps) {
  const [current, setCurrent] = useState<EarnedBadge | null>(null)
  const [confetti, setConfetti] = useState(false)

  const advance = useCallback(() => {
    setCurrent(null)
    setConfetti(false)
    if (queue.length === 0) {
      onComplete()
      return
    }
    const [next, ...rest] = queue
    setTimeout(() => {
      setCurrent(next)
      setConfetti(true)
      setTimeout(() => {
        setCurrent(null)
        setConfetti(false)
        onComplete()
      }, 3500)
    }, 200)
  }, [queue, onComplete])

  useEffect(() => {
    if (queue.length > 0 && !current) {
      advance()
    }
  }, [queue, current, advance])

  const badge = current ? getBadgeDef(current.id) : null

  return (
    <>
      <ConfettiOverlay active={confetti} />
      <AnimatePresence>
        {current && badge && (
          <motion.div
            className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2"
            initial={{ y: 120, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 120, opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20, stiffness: 260 }}
          >
            <div className="flex items-center gap-4 rounded-2xl border border-amber-500/30 bg-bg-card/95 backdrop-blur-xl px-6 py-4 shadow-2xl shadow-amber-500/10">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/15">
                <Trophy className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-amber-500/80 font-medium">🎉 勋章解锁！</p>
                <p className="text-base font-medium text-text">
                  {badge.emoji} {badge.name}
                </p>
                <p className="text-xs text-text-muted">{badge.description}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
