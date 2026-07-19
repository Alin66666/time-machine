import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Trash2 } from 'lucide-react'
import { useImageUpload } from '../../hooks/useImageUpload'

interface PhotoUploaderProps {
  photos: string[]
  onChange: (photos: string[]) => void
}

export default function PhotoUploader({ photos, onChange }: PhotoUploaderProps) {
  const { uploading, processFiles } = useImageUpload()

  const onDrop = useCallback(
    async (files: File[]) => {
      const results = await processFiles(files)
      onChange([...photos, ...results])
    },
    [photos, onChange, processFiles]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
  })

  const removePhoto = (idx: number) => {
    onChange(photos.filter((_, i) => i !== idx))
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <AnimatePresence>
          {photos.map((photo, idx) => (
            <motion.div
              key={idx}
              className="relative h-20 w-20 overflow-hidden rounded-xl group"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <img src={photo} alt="" className="h-full w-full object-cover" />
              <button
                onClick={() => removePhoto(idx)}
                className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-black/60 py-1 text-xs text-red-400/80 hover:text-red-400 hover:bg-black/80 transition-colors"
              >
                <Trash2 className="h-3 w-3" />
                删除
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {photos.length < 10 && (
          <div
            {...getRootProps()}
            className={`flex h-20 w-20 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed transition-colors ${
              isDragActive
                ? 'border-amber-500/50 bg-amber-500/5'
                : 'border-border hover:border-white/20'
            }`}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
            ) : (
              <Camera className="h-5 w-5 text-text-muted" />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
