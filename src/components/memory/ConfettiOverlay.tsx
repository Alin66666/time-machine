import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ConfettiOverlayProps {
  active: boolean
  onComplete?: () => void
}

const colors = ['#FF9500', '#FF6B8A', '#4A9EAA', '#FF3B30', '#C8A96E', '#7BC8A4', '#FF8C5A']

interface Particle {
  id: number
  x: number
  y: number
  color: string
  size: number
  rotation: number
}

export default function ConfettiOverlay({ active, onComplete }: ConfettiOverlayProps) {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    if (active) {
      const items: Particle[] = Array.from({ length: 40 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: -10 - Math.random() * 20,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360,
      }))
      setParticles(items)

      const timer = setTimeout(() => {
        setParticles([])
        onComplete?.()
      }, 2500)
      return () => clearTimeout(timer)
    }
  }, [active, onComplete])

  return (
    <AnimatePresence>
      {active && (
        <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute rounded-sm"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size * 0.6,
                backgroundColor: p.color,
              }}
              initial={{ y: 0, rotate: 0, opacity: 1 }}
              animate={{
                y: window.innerHeight + 100,
                rotate: p.rotation + 720,
                opacity: [1, 1, 0],
              }}
              transition={{
                duration: 2 + Math.random() * 1.5,
                ease: 'easeIn',
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  )
}
