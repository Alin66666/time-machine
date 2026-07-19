import { motion } from 'framer-motion'
import { emotions } from '../../constants/emotions'

interface MoodVisualizerProps {
  emotion: string
  fullscreen?: boolean
  children?: React.ReactNode
}

export default function MoodVisualizer({ emotion, fullscreen, children }: MoodVisualizerProps) {
  const def = emotions.find((e) => e.id === emotion)
  const gradient = def?.gradient || 'from-bg to-bg-card'

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br ${gradient} ${fullscreen ? 'min-h-screen' : 'rounded-2xl'}`}
    >
      <div className="absolute inset-0">
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/5"
            style={{
              width: Math.random() * 80 + 20,
              height: Math.random() * 80 + 20,
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
            }}
            animate={{
              y: [0, -15, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: Math.random() * 4 + 4,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          />
        ))}
      </div>
      {children && <div className="relative z-10">{children}</div>}
    </div>
  )
}
