import { useState, useEffect } from 'react'
import { Trophy, X } from 'lucide-react'
import { Modal } from '../ui/Modal'
import AchievementBadge from './AchievementBadge'
import { allBadges } from '../../constants/achievements'
import { getEarnedBadges } from '../../db/operations'
import type { EarnedBadge } from '../../types/memory'

interface AchievementWallProps {
  open: boolean
  onClose: () => void
}

const tiers = [
  { key: 'diamond', label: '钻石', order: 0 },
  { key: 'gold', label: '金牌', order: 1 },
  { key: 'silver', label: '银牌', order: 2 },
  { key: 'bronze', label: '铜牌', order: 3 },
] as const

export default function AchievementWall({ open, onClose }: AchievementWallProps) {
  const [earned, setEarned] = useState<EarnedBadge[]>([])

  useEffect(() => {
    if (open) {
      getEarnedBadges().then(setEarned)
    }
  }, [open])

  const earnedMap = new Map(earned.map((e) => [e.id, e]))

  return (
    <Modal open={open} onClose={onClose} title="">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-medium text-text">勋章墙</h2>
        </div>
        <span className="text-sm text-text-muted">
          {earned.length} / {allBadges.length}
        </span>
        <button onClick={onClose} className="text-text-muted hover:text-text">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-6 max-h-[65vh] overflow-y-auto pr-1">
        {tiers.map(({ key, label }) => {
          const tierBadges = allBadges.filter((b) => b.tier === key)
          const earnedCount = tierBadges.filter((b) => earnedMap.has(b.id)).length

          if (tierBadges.length === 0) return null

          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-text-muted">{label}</h3>
                <span className="text-xs text-text-muted/60">
                  {earnedCount} / {tierBadges.length}
                </span>
              </div>
              <div className="mb-3 h-1 w-full rounded-full bg-bg">
                <div
                  className="h-full rounded-full bg-amber-500/60 transition-all"
                  style={{ width: `${(earnedCount / tierBadges.length) * 100}%` }}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {tierBadges.map((badge) => (
                  <AchievementBadge
                    key={badge.id}
                    badge={badge}
                    earned={earnedMap.get(badge.id)}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </Modal>
  )
}
