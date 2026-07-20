import { useState } from 'react'
import { Tag } from '../ui/Tag'

interface TagInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  suggestions?: string[]
}

export default function TagInput({ tags, onChange, placeholder = '输入标签后按回车...', suggestions = [] }: TagInputProps) {
  const [input, setInput] = useState('')

  const addTag = (tag: string) => {
    const trimmed = tag.trim()
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed])
    }
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag(input)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-x-2 gap-y-2">
        {tags.map((tag) => (
          <Tag key={tag} label={tag} onRemove={() => onChange(tags.filter((t) => t !== tag))} />
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text placeholder:text-text-muted/50 focus:border-amber-500/50 focus:outline-none"
      />
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {suggestions
            .filter((s) => !tags.includes(s))
            .slice(0, 8)
            .map((s) => (
              <button
                key={s}
                onClick={() => addTag(s)}
                className="rounded-md border border-border px-2 py-0.5 text-xs text-text-muted hover:text-text hover:border-white/20 transition-colors"
              >
                + {s}
              </button>
            ))}
        </div>
      )}
    </div>
  )
}
