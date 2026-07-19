import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Fish, ChevronRight } from 'lucide-react'

const slides = [
  {
    emoji: '🐱',
    title: '嗨，我是念念！',
    text: '我是你的记忆守护猫，穿宇航服的念念。我的使命不是帮你保存照片，而是保存「那一刻的你」。',
  },
  {
    emoji: '🚀',
    title: '把记忆变成星球',
    text: '每当你记录一段记忆，我会把它打包成一颗星球，投放到属于你的宇宙里。你写的感受越多，星球就越亮越大！',
  },
  {
    emoji: '🐟',
    title: '小鱼干契约',
    text: '每颗星球都会冒出小鱼干来喂我。吃饱了，我就有力气帮你把记忆串成脉络，做系统性的整理。小鱼干只增不减，是我被你爱着的证明～',
  },
  {
    emoji: '✨',
    title: '念念不忘，必有回响！',
    text: '准备好了吗？让我们一起，把每一个珍贵的当下，变成宇宙里永不熄灭的星光。',
  },
]

interface OnboardingOverlayProps {
  open: boolean
  onComplete: () => void
}

export default function OnboardingOverlay({ open, onComplete }: OnboardingOverlayProps) {
  const [slide, setSlide] = useState(0)
  const current = slides[slide]

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0A12]/95 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="mx-auto max-w-sm px-6 text-center">
            <motion.div
              key={slide}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              {/* Emoji */}
              <motion.div
                className="text-7xl mb-8"
                animate={
                  slide === 2
                    ? { y: [0, -8, 0] }
                    : slide === 3
                      ? { scale: [1, 1.1, 1] }
                      : {}
                }
                transition={{ repeat: Infinity, duration: 2 }}
              >
                {current.emoji}
              </motion.div>

              <h2 className="mb-3 text-2xl font-medium text-text">{current.title}</h2>
              <p className="mb-3 text-sm leading-relaxed text-text-muted">{current.text}</p>
            </motion.div>

            {/* Progress dots */}
            <div className="mt-8 flex justify-center gap-2">
              {slides.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === slide ? 'w-6 bg-amber-500' : 'w-1.5 bg-white/20'
                  }`}
                />
              ))}
            </div>

            {/* Buttons */}
            <div className="mt-8 flex flex-col gap-3">
              {slide < slides.length - 1 ? (
                <>
                  <button
                    onClick={() => setSlide((s) => s + 1)}
                    className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-sm font-medium text-white hover:from-amber-400 hover:to-orange-400 transition-all flex items-center justify-center gap-2"
                  >
                    继续
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={onComplete}
                    className="text-xs text-text-muted/50 hover:text-text-muted transition-colors"
                  >
                    跳过引导
                  </button>
                </>
              ) : (
                <button
                  onClick={onComplete}
                  className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-sm font-medium text-white hover:from-amber-400 hover:to-orange-400 transition-all flex items-center justify-center gap-2"
                >
                  <Fish className="h-4 w-4" />
                  开始我的时光之旅
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
