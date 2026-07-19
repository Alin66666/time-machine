import { cn } from '../../lib/utils'
import type { BadgeDef, EarnedBadge } from '../../types/memory'

interface AchievementBadgeProps {
  badge: BadgeDef
  earned?: EarnedBadge
}

const tierColors: Record<string, string> = {
  bronze: 'border-amber-700/40 bg-amber-500/5 text-amber-500',
  silver: 'border-slate-400/40 bg-slate-300/5 text-slate-300',
  gold: 'border-yellow-500/40 bg-yellow-500/5 text-yellow-400',
  diamond: 'border-cyan-400/40 bg-cyan-400/5 text-cyan-400',
}

const tierGlow: Record<string, string> = {
  bronze: 'shadow-amber-500/10',
  silver: 'shadow-slate-300/10',
  gold: 'shadow-yellow-500/15',
  diamond: 'shadow-cyan-400/15',
}

export default function AchievementBadge({ badge, earned }: AchievementBadgeProps) {
  const colorClass = tierColors[badge.tier] || tierColors.bronze
  const glowClass = tierGlow[badge.tier] || tierGlow.bronze

  return (
    <div
      className={cn(
        'relative flex flex-col items-center rounded-2xl border p-4 text-center transition-all',
        earned
          ? `${colorClass} ${glowClass} shadow-lg`
          : 'border-border/30 bg-bg-card/30 opacity-40 grayscale'
      )}
    >
      <span
        className="text-3xl drop-shadow-lg"
        style={{ fontSize: earned ? '2.5rem' : '2rem' }}
      >
        {badge.emoji}
      </span>
      <span className="mt-2 text-sm font-medium text-text">
        {badge.name}
      </span>
      <span className="mt-0.5 text-xs text-text-muted">
        {badge.description}
      </span>
      {earned ? (
        <span className="mt-1.5 text-xs text-text-muted/60">
          {new Date(earned.earnedAt).toLocaleDateString('zh-CN')} 获得
        </span>
      ) : (
        <span className="mt-1.5 text-xs text-text-muted/40">
          未解锁
        </span>
      )}
    </div>
  )
}
