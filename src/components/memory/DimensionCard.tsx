import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Eye, Heart, Ear, Utensils, Wind, Hand, MapPin, Package, Users } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { DimensionMeta } from '../../constants/dimensions'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Heart, Eye, Ear, Utensils, Wind, Hand, MapPin, Package, Users,
}

interface DimensionCardProps {
  meta: DimensionMeta
  filled: boolean
  onFocus?: () => void
  children: React.ReactNode
}

export default function DimensionCard({ meta, filled, onFocus, children }: DimensionCardProps) {
  const [expanded, setExpanded] = useState(false)
  const Icon = iconMap[meta.icon] || Heart

  return (
    <motion.div
      data-dimension={meta.key}
      className={cn(
        'rounded-2xl border transition-colors overflow-hidden',
        expanded
          ? 'border-white/15 bg-bg-card'
          : filled
            ? 'border-white/10 bg-bg-card/50'
            : 'border-border bg-bg-card/30'
      )}
      layout
    >
      <button
        onClick={() => {
          setExpanded(!expanded)
          if (!expanded) onFocus?.()
        }}
        className="flex w-full items-center gap-3 px-5 py-4 text-left"
      >
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ backgroundColor: meta.color + '18' }}
        >
          <span style={{ color: meta.color, display: 'flex' }}>
            <Icon className="h-[18px] w-[18px]" />
          </span>
        </div>
        <div className="flex-1">
          <span className={cn('text-sm font-medium', filled ? 'text-text' : 'text-text-muted')}>
            {meta.label}
          </span>
          {filled && (
            <span className="ml-2 inline-flex h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
          )}
        </div>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-4 w-4 text-text-muted" />
        </motion.div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-0">
              <p className="mb-4 text-xs leading-relaxed text-text-muted/70">
                {meta.placeholder}
              </p>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
