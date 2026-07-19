import { useState, useCallback } from 'react'

function resizeImage(file: File, maxWidth = 1200, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = reject
      img.src = reader.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function useImageUpload() {
  const [uploading, setUploading] = useState(false)

  const processFiles = useCallback(async (files: File[]): Promise<string[]> => {
    setUploading(true)
    const results = await Promise.all(files.map((f) => resizeImage(f)))
    setUploading(false)
    return results
  }, [])

  return { uploading, processFiles }
}
