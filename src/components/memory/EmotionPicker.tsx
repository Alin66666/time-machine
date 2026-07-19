import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'
import { emotions } from '../../constants/emotions'

interface EmotionPickerProps {
  value: string
  onChange: (emotion: string) => void
}

export default function EmotionPicker({ value, onChange }: EmotionPickerProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {emotions.map((e) => {
        const selected = value === e.id
        return (
          <motion.button
            key={e.id}
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(e.id)}
            className={cn(
              'flex flex-col items-center gap-1 rounded-xl py-3 transition-all',
              selected
                ? 'bg-white/10 ring-2 ring-offset-1 ring-offset-[#0F0F0F]'
                : 'hover:bg-white/5'
            )}
          >
            <span className="text-2xl">{e.emoji}</span>
            <span className={cn('text-xs', selected ? 'text-text' : 'text-text-muted')}>
              {e.label}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}
