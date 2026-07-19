import { motion, AnimatePresence } from 'framer-motion'
import { useNianNianStore } from '../../store/nianNianStore'

export type NianNianState = 'idle' | 'guide' | 'launch' | 'eat' | 'think' | 'sleep'

interface NianNianProps {
  state?: NianNianState
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  className?: string
}

const sizeMap = { sm: 48, md: 72, lg: 120 }

export default function NianNian({ state = 'idle', size = 'md', onClick, className = '' }: NianNianProps) {
  const s = sizeMap[size]
  const { level, levelName, totalFishCrackers } = useNianNianStore()

  return (
    <motion.div
      className={`relative cursor-pointer select-none ${className}`}
      style={{ width: s, height: s }}
      onClick={onClick}
      animate={state === 'sleep' ? { rotate: -15 } : { y: [0, -4, 0] }}
      transition={
        state === 'sleep'
          ? { duration: 0.3 }
          : { y: { repeat: Infinity, duration: 2.5, ease: 'easeInOut' } }
      }
      title={`念念 Lv.${level} · ${levelName} · 🐟${totalFishCrackers}`}
    >
      <svg
        width={s}
        height={s}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Helmet glow ring */}
        <motion.circle
          cx="60" cy="52" r="36"
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="3"
          strokeDasharray="6 4"
          animate={{ rotate: state === 'think' ? [0, 360] : 0 }}
          transition={{ rotate: { repeat: Infinity, duration: 8, ease: 'linear' } }}
        />

        {/* Helmet dome */}
        <ellipse cx="60" cy="46" rx="32" ry="34" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />

        {/* Helmet visor reflection */}
        <ellipse cx="54" cy="38" rx="16" ry="12" fill="rgba(255,255,255,0.06)" transform="rotate(-15 54 38)" />

        {/* Cat ears poking through helmet */}
        <motion.path
          d="M38 28 L34 10 L48 24Z" fill="#F5A623"
          stroke="rgba(255,255,255,0.2)" strokeWidth="1"
        />
        <motion.path
          d="M82 28 L86 10 L72 24Z" fill="#F5A623"
          stroke="rgba(255,255,255,0.2)" strokeWidth="1"
        />
        {/* Inner ears */}
        <path d="M40 24 L37 14 L46 22Z" fill="#FFB8C6" />
        <path d="M80 24 L83 14 L74 22Z" fill="#FFB8C6" />

        {/* Cat face */}
        <ellipse cx="60" cy="48" rx="24" ry="20" fill="#F5A623" />

        {/* Face markings - lighter cheek fur */}
        <ellipse cx="48" cy="52" rx="10" ry="8" fill="#FDDCB5" opacity="0.6" />
        <ellipse cx="72" cy="52" rx="10" ry="8" fill="#FDDCB5" opacity="0.6" />

        {/* Eyes */}
        <motion.g
          animate={
            state === 'sleep'
              ? { scaleY: 0.1 }
              : state === 'eat'
                ? { scaleY: [1, 0.1, 1] }
                : { scaleY: [1, 0.1, 1] }
          }
          transition={
            state === 'sleep'
              ? { duration: 2 }
              : state === 'eat'
                ? { repeat: 2, duration: 0.15 }
                : { repeat: Infinity, duration: 3, repeatDelay: 2 }
          }
          style={{ originY: 45, originX: 50 }}
        >
          {/* Left eye */}
          <ellipse cx="50" cy="46" rx="6" ry="7" fill="white" />
          <ellipse cx="51" cy="46" rx="3.5" ry="4" fill="#2D1B00" />
          <circle cx="52.5" cy="43.5" r="1.5" fill="white" />
          {/* Right eye */}
          <ellipse cx="70" cy="46" rx="6" ry="7" fill="white" />
          <ellipse cx="71" cy="46" rx="3.5" ry="4" fill="#2D1B00" />
          <circle cx="72.5" cy="43.5" r="1.5" fill="white" />
        </motion.g>

        {/* Nose */}
        <ellipse cx="60" cy="52" rx="3" ry="2" fill="#FF8A80" />

        {/* Mouth */}
        <motion.path
          d="M56 55 Q60 59 64 55"
          fill="none"
          stroke="#5D4037"
          strokeWidth="1.2"
          strokeLinecap="round"
          animate={
            state === 'eat' ? { d: 'M56 55 Q60 61 64 55' } : state === 'launch' ? { d: 'M54 55 Q60 62 66 55' } : {}
          }
          transition={{ duration: 0.2 }}
        />

        {/* Whiskers */}
        <path d="M32 48 L44 50" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" strokeLinecap="round" />
        <path d="M32 52 L44 52" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" strokeLinecap="round" />
        <path d="M88 48 L76 50" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" strokeLinecap="round" />
        <path d="M88 52 L76 52" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" strokeLinecap="round" />

        {/* Spacesuit body */}
        <path
          d="M38 64 L34 100 Q34 108 42 106 L78 106 Q86 108 86 100 L82 64Z"
          fill="rgba(220,225,235,0.85)"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="1.5"
        />

        {/* Suit chest panel */}
        <rect x="50" y="72" width="20" height="24" rx="4" fill="rgba(30,40,60,0.4)" />
        {/* Chest lights */}
        <motion.circle
          cx="56" cy="78" r="3"
          fill="#4FC3F7"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ repeat: Infinity, duration: 2 }}
        />
        <motion.circle
          cx="64" cy="78" r="3"
          fill="#81C784"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ repeat: Infinity, duration: 2, delay: 0.7 }}
        />
        <motion.circle
          cx="60" cy="86" r="3"
          fill="#FFB74D"
          animate={{ opacity: state === 'launch' ? [0.4, 1, 0.4, 1, 0.4] : [0.6, 1, 0.6] }}
          transition={
            state === 'launch'
              ? { repeat: Infinity, duration: 0.4 }
              : { repeat: Infinity, duration: 2, delay: 1.4 }
          }
        />

        {/* Backpack / oxygen tank */}
        <rect
          x="34" y="70" width="8" height="20" rx="3"
          fill="rgba(180,190,200,0.7)" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8"
        />
        <rect
          x="78" y="70" width="8" height="20" rx="3"
          fill="rgba(180,190,200,0.7)" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8"
        />

        {/* Arms / paws */}
        <motion.g
          animate={
            state === 'guide'
              ? { rotate: [0, -30, 0] }
              : state === 'eat'
                ? { rotate: [0, -20, 0, -20, 0] }
                : state === 'idle'
                  ? { rotate: [0, 5, 0, -5, 0] }
                  : {}
          }
          transition={
            state === 'guide'
              ? { repeat: 2, duration: 0.3 }
              : state === 'eat'
                ? { repeat: 1, duration: 0.25 }
                : state === 'idle'
                  ? { repeat: Infinity, duration: 3, ease: 'easeInOut' }
                  : {}
          }
          style={{ originX: 44, originY: 74 }}
        >
          {/* Left paw */}
          <ellipse cx="38" cy="80" rx="9" ry="7" fill="#F5A623" />
          <circle cx="33" cy="78" r="2.5" fill="#FDDCB5" />
          <circle cx="37" cy="75" r="2.5" fill="#FDDCB5" />
          <circle cx="41" cy="77" r="2.5" fill="#FDDCB5" />
        </motion.g>

        <motion.g
          animate={
            state === 'guide'
              ? { rotate: [0, 30, 0] }
              : state === 'eat'
                ? { rotate: [0, 20, 0, 20, 0] }
                : state === 'idle'
                  ? { rotate: [0, -5, 0, 5, 0] }
                  : {}
          }
          transition={
            state === 'guide'
              ? { repeat: 2, duration: 0.3 }
              : state === 'eat'
                ? { repeat: 1, duration: 0.25 }
                : state === 'idle'
                  ? { repeat: Infinity, duration: 3, ease: 'easeInOut', delay: 1.5 }
                  : {}
          }
          style={{ originX: 76, originY: 74 }}
        >
          {/* Right paw */}
          <ellipse cx="82" cy="80" rx="9" ry="7" fill="#F5A623" />
          <circle cx="77" cy="78" r="2.5" fill="#FDDCB5" />
          <circle cx="81" cy="75" r="2.5" fill="#FDDCB5" />
          <circle cx="85" cy="77" r="2.5" fill="#FDDCB5" />
        </motion.g>

        {/* Tail (poking from suit) */}
        <motion.path
          d="M86 100 Q100 95 98 80 Q96 70 100 65"
          fill="none"
          stroke="#F5A623"
          strokeWidth="4"
          strokeLinecap="round"
          animate={
            state === 'launch'
              ? { d: 'M86 100 Q100 95 98 80 Q96 70 100 65', rotate: [0, 10, -10, 10, 0] }
              : { d: 'M86 100 Q100 98 95 85 Q92 76 96 70', rotate: [0, 5, -5, 5, 0] }
          }
          transition={{ rotate: { repeat: Infinity, duration: 2, ease: 'easeInOut' } }}
        />

        {/* Think state: star map above head */}
        <AnimatePresence>
          {state === 'think' && (
            <motion.g
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
            >
              <motion.circle cx="60" cy="8" r="2" fill="#FFD54F" animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} />
              <motion.circle cx="72" cy="10" r="1.5" fill="#FFD54F" animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 2.2 }} />
              <motion.circle cx="48" cy="10" r="1.5" fill="#FFD54F" animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 1.8 }} />
              {/* Connecting lines */}
              <line x1="60" y1="8" x2="72" y2="10" stroke="rgba(255,213,79,0.4)" strokeWidth="0.5" />
              <line x1="60" y1="8" x2="48" y2="10" stroke="rgba(255,213,79,0.4)" strokeWidth="0.5" />
              <line x1="72" y1="10" x2="48" y2="10" stroke="rgba(255,213,79,0.3)" strokeWidth="0.5" />
            </motion.g>
          )}
        </AnimatePresence>

        {/* Launch state: rocket particles from backpack */}
        <AnimatePresence>
          {state === 'launch' && (
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.circle cx="40" cy="108" r="3" fill="#FF9800" animate={{ y: [0, -15], opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.4 }} />
              <motion.circle cx="80" cy="108" r="3" fill="#FF9800" animate={{ y: [0, -15], opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.4, delay: 0.2 }} />
              <motion.circle cx="60" cy="108" r="4" fill="#FFC107" animate={{ y: [0, -20], opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.35, delay: 0.1 }} />
            </motion.g>
          )}
        </AnimatePresence>

        {/* Eat state: fish cracker */}
        <AnimatePresence>
          {state === 'eat' && (
            <motion.g
              initial={{ x: 30, y: 50, opacity: 0, scale: 0 }}
              animate={{ x: [30, 10, 55], y: [50, 30, 52], opacity: [0, 1, 0], scale: [0, 1, 0.3] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* Fish shape */}
              <ellipse cx="0" cy="0" rx="8" ry="4" fill="#FF8C42" />
              <polygon points="8,-4 14,0 8,4" fill="#FF8C42" />
              <circle cx="-3" cy="-0.5" r="1" fill="white" />
            </motion.g>
          )}
        </AnimatePresence>
      </svg>
    </motion.div>
  )
}

export function NianNianSpeech({
  text,
  onDismiss,
}: {
  text: string
  onDismiss?: () => void
}) {
  return (
    <motion.div
      className="absolute -top-18 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-2xl bg-bg-card border border-border px-4 py-2.5 text-sm text-text shadow-xl shadow-black/20"
      initial={{ opacity: 0, y: 10, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.9 }}
      onClick={onDismiss}
    >
      {text}
      {/* Speech bubble tail */}
      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-bg-card border border-border border-t-transparent border-l-transparent rotate-45" />
    </motion.div>
  )
}
