import { useState } from 'react'
import { motion } from 'framer-motion'
import { ImageUp, Sparkles, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'
import EmotionPicker from './EmotionPicker'
import TagInput from './TagInput'
import { useMemoryStore } from '../../store/memoryStore'
import { useSettingsStore } from '../../store/settingsStore'

const MAX_PHOTOS = 3

export default function QuickRecord() {
  const store = useMemoryStore()
  const { memory } = store
  const { apiKey } = useSettingsStore()
  const [aiGuessing, setAiGuessing] = useState(false)

  const photos = memory.dimensions.visual.photos

  const handlePhotoAdd = (files: FileList | null) => {
    if (!files) return
    const readers: Promise<string>[] = []
    for (let i = 0; i < Math.min(files.length, MAX_PHOTOS - photos.length); i++) {
      readers.push(
        new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(files[i])
        })
      )
    }
    Promise.all(readers).then((dataUrls) => {
      store.updateDimension('visual', {
        photos: [...photos, ...dataUrls].slice(0, MAX_PHOTOS),
      })
    })
  }

  const removePhoto = (idx: number) => {
    store.updateDimension('visual', {
      photos: photos.filter((_, i) => i !== idx),
    })
  }

  // AI auto-fill emotion and tags from photos
  const handleAIGuess = async () => {
    if (!apiKey) {
      toast.error('请先配置 DeepSeek API Key')
      return
    }
    if (photos.length === 0) {
      toast.error('请先上传照片')
      return
    }
    setAiGuessing(true)
    try {
      const { quickGuess } = await import('../../lib/deepseek')
      const result = await quickGuess(photos.length, memory.title)

      if (result.emotion) {
        store.updateDimension('subjectiveFeelings', { primaryEmotion: result.emotion })
      }
      if (result.tags?.length) {
        store.setTags([...new Set([...memory.tags, ...result.tags])])
      }
      if (result.title && !memory.title.trim()) {
        store.setTitle(result.title)
      }
      toast.success('AI 已自动识别情绪和标签 ✨')
    } catch {
      toast.error('AI 识别失败')
    } finally {
      setAiGuessing(false)
    }
  }

  return (
    <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Photo area - large */}
      <div className="rounded-2xl border border-border bg-bg-card p-5">
        {photos.length === 0 ? (
          <label className="flex flex-col items-center justify-center py-16 cursor-pointer rounded-xl border-2 border-dashed border-border hover:border-amber-500/30 transition-colors">
            <ImageUp className="h-10 w-10 text-text-muted/40 mb-3" />
            <span className="text-sm text-text-muted">点击上传照片</span>
            <span className="text-xs text-text-muted/50 mt-1">最多 {MAX_PHOTOS} 张</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handlePhotoAdd(e.target.files)}
            />
          </label>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {photos.map((photo, idx) => (
                <div key={idx} className="relative aspect-[3/4] rounded-xl overflow-hidden">
                  <img src={photo} alt="" className="h-full w-full object-cover" />
                  <button
                    onClick={() => removePhoto(idx)}
                    className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center gap-1 bg-red-600/80 hover:bg-red-600 py-2 text-xs text-white font-medium"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    删除
                  </button>
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <label className="aspect-[3/4] rounded-xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-amber-500/30 transition-colors">
                  <span className="text-2xl text-text-muted/30">+</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handlePhotoAdd(e.target.files)}
                  />
                </label>
              )}
            </div>

            {/* AI guess button */}
            <button
              onClick={handleAIGuess}
              disabled={aiGuessing}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500/10 to-pink-500/10 border border-amber-500/20 px-4 py-2.5 text-xs text-amber-500 hover:from-amber-500/20 hover:to-pink-500/20 transition-all"
            >
              <Sparkles className={`h-3.5 w-3.5 ${aiGuessing ? 'animate-pulse' : ''}`} />
              {aiGuessing ? 'AI 正在识别...' : 'AI 自动识别心情和标签'}
            </button>
          </div>
        )}
      </div>

      {/* Title */}
      <div className="rounded-2xl border border-border bg-bg-card p-5">
        <Input
          placeholder="给这段记忆起个名字（可选）"
          value={memory.title}
          onChange={(e) => store.setTitle(e.target.value)}
          className="text-lg font-medium border-0 bg-transparent px-0 focus:ring-0"
        />
        <div className="mt-3">
          <span className="text-xs text-text-muted">日期</span>
          <Input
            type="date"
            value={memory.actualDate.slice(0, 10)}
            onChange={(e) => store.setActualDate(e.target.value + 'T00:00:00.000Z')}
            className="mt-1 w-44"
          />
        </div>
      </div>

      {/* Emotion */}
      <div className="rounded-2xl border border-border bg-bg-card p-5">
        <h3 className="text-sm font-medium text-text mb-3">此刻心情</h3>
        <EmotionPicker
          value={memory.dimensions.subjectiveFeelings.primaryEmotion}
          onChange={(v) => store.updateDimension('subjectiveFeelings', { primaryEmotion: v })}
        />
      </div>

      {/* Tags */}
      <div className="rounded-2xl border border-border bg-bg-card p-5">
        <h3 className="text-sm font-medium text-text mb-3">标签</h3>
        <TagInput
          tags={memory.tags}
          onChange={(v) => store.setTags(v)}
          placeholder="添加标签..."
          suggestions={['治愈', '自由', '温暖', '浪漫', '日常', '自然', '美食', '友谊', '独处', '成长']}
        />
      </div>

      {/* One-line note */}
      <div className="rounded-2xl border border-border bg-bg-card p-5">
        <Textarea
          placeholder="简单写一句话的记录...（可选）"
          value={memory.dimensions.subjectiveFeelings.moodDescription}
          onChange={(e) => store.updateDimension('subjectiveFeelings', { moodDescription: e.target.value })}
          rows={2}
        />
      </div>
    </motion.div>
  )
}
