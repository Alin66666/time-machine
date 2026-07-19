import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Fish, ChevronUp } from 'lucide-react'
import NianNian, { NianNianSpeech } from '../universe/NianNian'
import { useNianNianStore } from '../../store/nianNianStore'

interface UniverseDockProps {
  onFeedClick: () => void
  hasMemories: boolean
}

export default function UniverseDock({ onFeedClick, hasMemories }: UniverseDockProps) {
  const { totalFishCrackers, level, levelName, lastAdded, justLeveledUp, clearLevelUp } = useNianNianStore()
  const [showSpeech, setShowSpeech] = useState(true)
  const [speechKey, setSpeechKey] = useState(0)

  const idleLines = [
    '宇宙还空着呢，投段记忆给我吧～',
    '今天想记录什么呀？',
    '咱一起把记忆变成星星吧！',
    '念念等不及要打包星球啦～',
  ]

  const idleLine = idleLines[Math.floor(Math.random() * idleLines.length)]

  const handleNianNianClick = () => {
    setSpeechKey((k) => k + 1)
    setShowSpeech(true)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex items-end justify-center pb-4">
      {/* Semi-transparent frosted dock */}
      <motion.div
        className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl px-5 py-3 shadow-2xl shadow-black/30"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, type: 'spring', damping: 20 }}
      >
        {/* Left: NianNian probe */}
        <div className="relative">
          <AnimatePresence>
            {showSpeech && (
              <NianNianSpeech
                key={speechKey}
                text={
                  lastAdded > 0
                    ? `+${lastAdded} 🐟 这颗星球亮晶晶的！`
                    : justLeveledUp
                      ? `念念不忘，必有回响！升到 Lv.${level} 啦～`
                      : idleLine
                }
                onDismiss={() => setShowSpeech(false)}
              />
            )}
          </AnimatePresence>
          <AnimatePresence>
            {justLeveledUp && (
              <motion.div
                className="absolute -top-2 -right-2 z-10 text-xs text-amber-400 font-bold"
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.5, 1] }}
                onAnimationComplete={clearLevelUp}
              >
                ⬆Lv.{level}!
              </motion.div>
            )}
          </AnimatePresence>
          <div className="relative -mb-2">
            <NianNian
              state={hasMemories ? 'idle' : 'guide'}
              size={hasMemories ? 'md' : 'lg'}
              onClick={handleNianNianClick}
            />
          </div>
        </div>

        {/* Middle: Feed button */}
        <motion.button
          onClick={onFeedClick}
          className="relative flex flex-col items-center gap-1 rounded-xl bg-gradient-to-b from-amber-500/20 to-amber-600/10 border border-amber-500/30 px-6 py-2.5 transition-colors hover:from-amber-500/30 hover:to-amber-600/20 hover:border-amber-500/50"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Fish className="h-6 w-6 text-amber-400" />
          <span className="text-xs font-medium text-amber-400 whitespace-nowrap">
            喂念念一段记忆
          </span>
          {!hasMemories && (
            <motion.div
              className="absolute inset-0 rounded-xl bg-amber-400/10"
              animate={{ opacity: [0.2, 0.5, 0.2], scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
          )}
        </motion.button>

        {/* Right: Fish cracker jar + level */}
        <div className="flex flex-col items-center gap-0.5 text-center">
          <div className="flex items-center gap-1">
            <span className="text-lg">🐟</span>
            <span className="text-sm font-bold text-amber-400">{totalFishCrackers}</span>
          </div>
          <div className="text-[10px] text-text-muted">
            Lv.{level} {levelName}
          </div>
          {/* Level progress bar */}
          <div className="mt-0.5 h-1 w-16 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-amber-500/60"
              initial={{ width: 0 }}
              animate={{ width: `${useNianNianStore.getState().getProgress()}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </motion.div>
    </div>
  )
}
