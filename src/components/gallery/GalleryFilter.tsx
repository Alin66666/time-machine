import { useState, useRef, useEffect } from 'react'
import { Search, SlidersHorizontal, Users, MapPin, Calendar, Sparkles, X } from 'lucide-react'
import { Tag } from '../ui/Tag'
import { emotions } from '../../constants/emotions'

export interface FilterState {
  search: string
  selectedEmotion: string
  selectedPerson: string
  selectedLocation: string
  onThisDay: boolean
  sortNewest: boolean
}

interface GalleryFilterProps {
  filter: FilterState
  onChange: (f: FilterState) => void
  people: string[]
  locations: string[]
  onAISearch: (query: string) => void
  aiSearching: boolean
}

export default function GalleryFilter({
  filter,
  onChange,
  people,
  locations,
  onAISearch,
  aiSearching,
}: GalleryFilterProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [aiQuery, setAiQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  const hasAdvancedFilter = filter.selectedPerson || filter.selectedLocation || filter.onThisDay

  const update = (patch: Partial<FilterState>) => onChange({ ...filter, ...patch })

  return (
    <div className="space-y-3">
      {/* Search bar with AI */}
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            ref={searchRef}
            type="text"
            value={filter.search}
            onChange={(e) => update({ search: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && filter.search.trim()) {
                onAISearch(filter.search.trim())
              }
            }}
            placeholder="搜索记忆... (按 Enter 开启 AI 智能搜索)"
            className="w-full rounded-xl border border-border bg-bg-card py-2.5 pl-10 pr-4 text-sm text-text placeholder:text-text-muted/50 focus:border-amber-500/50 focus:outline-none"
          />
        </div>

        {/* AI search button */}
        {filter.search.trim() && (
          <button
            onClick={() => onAISearch(filter.search.trim())}
            disabled={aiSearching}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-pink-500/20 border border-amber-500/30 px-3 py-2 text-xs text-amber-500 hover:from-amber-500/30 hover:to-pink-500/30 transition-all disabled:opacity-50 shrink-0"
          >
            <Sparkles className={`h-3.5 w-3.5 ${aiSearching ? 'animate-pulse' : ''}`} />
            {aiSearching ? '思考中...' : 'AI 搜'}
          </button>
        )}

        {/* Advanced toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs transition-all shrink-0 ${
            showAdvanced || hasAdvancedFilter
              ? 'border-amber-500/30 bg-amber-500/10 text-amber-500'
              : 'border-border bg-bg-card text-text-muted hover:text-text'
          }`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          筛选
          {hasAdvancedFilter && (
            <span className="flex h-1.5 w-1.5 rounded-full bg-amber-500" />
          )}
        </button>
      </div>

      {/* Emotion row - always visible */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-text-muted shrink-0">心情:</span>
        <Tag
          label="全部"
          active={!filter.selectedEmotion}
          onClick={() => update({ selectedEmotion: '' })}
        />
        {emotions.map((e) => (
          <Tag
            key={e.id}
            label={`${e.emoji} ${e.label}`}
            active={filter.selectedEmotion === e.id}
            onClick={() => update({ selectedEmotion: filter.selectedEmotion === e.id ? '' : e.id })}
          />
        ))}
      </div>

      {/* Advanced filters panel */}
      {showAdvanced && (
        <div className="rounded-2xl border border-border bg-bg-card/80 p-4 space-y-4">
          {/* People filter */}
          {people.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Users className="h-3.5 w-3.5 text-text-muted" />
                <span className="text-xs text-text-muted">人物</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Tag
                  label="全部"
                  active={!filter.selectedPerson}
                  onClick={() => update({ selectedPerson: '' })}
                />
                {people.map((p) => (
                  <Tag
                    key={p}
                    label={p}
                    active={filter.selectedPerson === p}
                    onClick={() => update({ selectedPerson: filter.selectedPerson === p ? '' : p })}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Location filter */}
          {locations.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <MapPin className="h-3.5 w-3.5 text-text-muted" />
                <span className="text-xs text-text-muted">地点</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Tag
                  label="全部"
                  active={!filter.selectedLocation}
                  onClick={() => update({ selectedLocation: '' })}
                />
                {locations.map((loc) => (
                  <Tag
                    key={loc}
                    label={loc}
                    active={filter.selectedLocation === loc}
                    onClick={() => update({ selectedLocation: filter.selectedLocation === loc ? '' : loc })}
                  />
                ))}
              </div>
            </div>
          )}

          {/* On This Day */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Calendar className="h-3.5 w-3.5 text-text-muted" />
              <span className="text-xs text-text-muted">那年今日</span>
            </div>
            <Tag
              label="📅 那年今日的记忆"
              active={filter.onThisDay}
              onClick={() => update({ onThisDay: !filter.onThisDay })}
            />
          </div>
        </div>
      )}

      {/* Sort toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-3.5 w-3.5 text-text-muted" />
          <button
            onClick={() => update({ sortNewest: !filter.sortNewest })}
            className="text-xs text-text-muted hover:text-text transition-colors"
          >
            {filter.sortNewest ? '最新在前' : '最早在前'}
          </button>
        </div>

        {/* Active filter count */}
        {hasAdvancedFilter && (
          <button
            onClick={() => update({ selectedPerson: '', selectedLocation: '', onThisDay: false })}
            className="flex items-center gap-1 text-xs text-amber-500/70 hover:text-amber-500 transition-colors"
          >
            <X className="h-3 w-3" />
            清除筛选
          </button>
        )}
      </div>
    </div>
  )
}
