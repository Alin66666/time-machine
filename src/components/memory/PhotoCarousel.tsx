import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'

interface PhotoCarouselProps {
  photos: string[]
  onDelete?: (index: number) => void
}

export default function PhotoCarousel({ photos, onDelete }: PhotoCarouselProps) {
  const [current, setCurrent] = useState(0)

  if (photos.length === 0) return null

  const prev = () => setCurrent((c) => (c === 0 ? photos.length - 1 : c - 1))
  const next = () => setCurrent((c) => (c === photos.length - 1 ? 0 : c + 1))

  const handleDelete = (idx: number) => {
    if (!onDelete) return
    if (idx >= photos.length) return
    onDelete(idx)
    if (idx === photos.length - 1 && idx > 0) {
      setCurrent(idx - 1)
    }
    if (current >= photos.length - 1 && current > 0) {
      setCurrent(photos.length - 2)
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl group/carousel">
      <div className="aspect-[4/5] relative">
        <AnimatePresence mode="wait">
          <motion.img
            key={current}
            src={photos[current]}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          />
        </AnimatePresence>
        {onDelete && (
          <button
            onClick={() => handleDelete(current)}
            className="absolute bottom-0 inset-x-0 flex items-center justify-center gap-1.5 bg-black/60 py-2 text-xs text-red-400/80 hover:text-red-400 hover:bg-black/80 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            删除此照片
          </button>
        )}
      </div>

      {photos.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white/80 hover:text-white backdrop-blur-sm"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white/80 hover:text-white backdrop-blur-sm"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-1.5">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === current ? 'w-5 bg-white' : 'w-1.5 bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
