interface IntensitySliderProps {
  value: number
  onChange: (v: number) => void
}

export default function IntensitySlider({ value, onChange }: IntensitySliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-text-muted">
        <span>淡淡的</span>
        <span>强烈的</span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none bg-bg cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500
          [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg"
      />
      <div className="text-center text-sm text-amber-500 font-medium">{value} / 10</div>
    </div>
  )
}
