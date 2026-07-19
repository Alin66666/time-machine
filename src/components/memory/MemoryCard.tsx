import { Link } from 'react-router-dom'
import { Star, Trash2 } from 'lucide-react'
import { cn, formatDateShort } from '../../lib/utils'
import { emotions } from '../../constants/emotions'
import type { Memory } from '../../types/memory'

interface MemoryCardProps {
  memory: Memory
  onToggleFavorite?: () => void
  onDelete?: () => void
}

export default function MemoryCard({ memory, onToggleFavorite, onDelete }: MemoryCardProps) {
  const { dimensions } = memory
  const emotionDef = emotions.find((e) => e.id === dimensions.subjectiveFeelings.primaryEmotion)
  const hasPhotos = dimensions.visual.photos.length > 0
  const gradient = emotionDef?.gradient || 'from-bg-card to-bg-card'

  return (
    <div className="relative rounded-2xl border border-border bg-bg-card transition-all hover:bg-bg-card-hover hover:border-white/15 hover:-translate-y-1 overflow-hidden flex flex-col h-full">
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-20 pointer-events-none`} />

      <Link to={`/revisit/${memory.id}`} className="relative flex flex-col flex-1">

      {/* Photo or placeholder */}
      <div className="relative aspect-[3/4] overflow-hidden">
        {hasPhotos ? (
          <img
            src={dimensions.visual.photos[0]}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-bg/50">
            {emotionDef ? (
              <span className="text-5xl opacity-30">{emotionDef.emoji}</span>
            ) : (
              <div className="h-10 w-10 rounded-full bg-white/5" />
            )}
          </div>
        )}

        {/* Favorite toggle */}
        {onToggleFavorite && (
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onToggleFavorite()
            }}
            className="absolute right-2 top-2 z-10 rounded-full bg-black/50 p-1.5 backdrop-blur-sm hover:bg-black/70"
          >
            <Star
              className={cn(
                'h-4 w-4 transition-colors',
                memory.isFavorite ? 'fill-amber-500 text-amber-500' : 'text-white/60 hover:text-white'
              )}
            />
          </button>
        )}
      </div>

      {/* Info */}
      <div className="relative p-4 flex-1">
        <h3 className="font-medium text-text truncate">{memory.title || '未命名记忆'}</h3>
        <p className="mt-0.5 text-xs text-text-muted">{formatDateShort(memory.actualDate)}</p>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {emotionDef && (
            <span className="inline-flex items-center gap-0.5 rounded-md bg-white/5 px-1.5 py-0.5 text-xs text-text-muted">
              {emotionDef.emoji}
            </span>
          )}
          {dimensions.environment.location && (
            <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-xs text-text-muted truncate max-w-[120px]">
              {dimensions.environment.location}
            </span>
          )}
          {memory.revisitCount > 0 && (
            <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-xs text-text-muted">
              {memory.revisitCount}次重温
            </span>
          )}
        </div>
      </div>

      </Link>

      {/* Delete button - always at bottom */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onDelete()
          }}
          className="relative w-full flex items-center justify-center gap-1.5 border-t border-red-500/10 bg-red-500/5 py-2.5 text-xs text-red-400/80 hover:bg-red-500/10 hover:text-red-400 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
          删除记忆
        </button>
      )}
    </div>
  )
}
