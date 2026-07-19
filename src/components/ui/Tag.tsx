import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

interface TagProps {
  label: string
  color?: string
  onRemove?: () => void
  onClick?: () => void
  active?: boolean
  className?: string
}

export function Tag({ label, color, onRemove, onClick, active, className }: TagProps) {
  const Comp = onClick ? 'button' : 'span'
  return (
    <Comp
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs transition-colors',
        active
          ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
          : 'bg-bg border border-border text-text-muted hover:text-text hover:border-white/20',
        onClick && 'cursor-pointer',
        className
      )}
      style={color && !active ? { borderColor: color + '40', color } : undefined}
    >
      {label}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="ml-0.5 rounded-full p-0.5 hover:bg-white/10"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </Comp>
  )
}
