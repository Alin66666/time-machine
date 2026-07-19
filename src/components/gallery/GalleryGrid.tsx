import { useNavigate } from 'react-router-dom'
import type { Memory } from '../../types/memory'
import MemoryCard from '../memory/MemoryCard'
import { EmptyState } from '../ui/EmptyState'

interface GalleryGridProps {
  memories: Memory[]
  onToggleFavorite: (id: string) => void
  onDelete: (id: string) => void
  hasFilter: boolean
  onClearFilter: () => void
}

export default function GalleryGrid({ memories, onToggleFavorite, onDelete, hasFilter, onClearFilter }: GalleryGridProps) {
  const navigate = useNavigate()

  if (memories.length === 0) {
    if (hasFilter) {
      return (
        <EmptyState
          title="没有匹配的记忆"
          description="试试调整筛选条件"
          action={{ label: '清除筛选', onClick: onClearFilter }}
        />
      )
    }
    return (
      <EmptyState
        title="还没有记忆"
        description="去记录你的第一段美好时光吧"
        action={{ label: '记录美好', onClick: () => navigate('/record') }}
      />
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {memories.map((memory) => (
        <MemoryCard
          key={memory.id}
          memory={memory}
          onToggleFavorite={() => onToggleFavorite(memory.id)}
          onDelete={() => onDelete(memory.id)}
        />
      ))}
    </div>
  )
}
