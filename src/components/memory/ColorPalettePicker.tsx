import { cn } from '../../lib/utils'
import { presetColors } from '../../lib/colors'

interface ColorPalettePickerProps {
  colors: string[]
  onChange: (colors: string[]) => void
}

export default function ColorPalettePicker({ colors, onChange }: ColorPalettePickerProps) {
  const toggle = (c: string) => {
    if (colors.includes(c)) {
      onChange(colors.filter((x) => x !== c))
    } else if (colors.length < 5) {
      onChange([...colors, c])
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {presetColors.map((c) => {
        const sel = colors.includes(c)
        return (
          <button
            key={c}
            type="button"
            onClick={() => toggle(c)}
            className={cn(
              'h-7 w-7 rounded-full transition-all',
              sel && 'scale-110'
            )}
            style={{
              backgroundColor: c,
              boxShadow: sel ? `0 0 0 2px ${'var(--color-bg)'}, 0 0 0 4px ${c}` : 'none',
            }}
          />
        )
      })}
    </div>
  )
}
