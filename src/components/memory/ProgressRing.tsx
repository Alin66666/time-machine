interface ProgressRingProps {
  filled: number
  total: number
}

export default function ProgressRing({ filled, total }: ProgressRingProps) {
  const pct = total > 0 ? (filled / total) * 100 : 0
  const radius = 18
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference

  return (
    <div className="flex items-center gap-3">
      <svg width="44" height="44" className="-rotate-90">
        <circle cx="22" cy="22" r={radius} fill="none" stroke="#2A2A2A" strokeWidth="3" />
        <circle
          cx="22" cy="22" r={radius}
          fill="none"
          stroke="url(#progGrad)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
        <defs>
          <linearGradient id="progGrad" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#FF9500" />
            <stop offset="1" stopColor="#FF6B8A" />
          </linearGradient>
        </defs>
      </svg>
      <span className="text-sm text-text-muted">
        {filled}/{total} 维度已记录
      </span>
    </div>
  )
}
