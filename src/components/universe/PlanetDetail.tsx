import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, MapPin, Sparkles, Edit3, Share2, Copy, Check, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import type { Memory } from '../../types/memory'
import { formatDate } from '../../lib/utils'
import { emotions } from '../../constants/emotions'
import { generateInviteUrl } from '../../lib/share'
import { useSettingsStore } from '../../store/settingsStore'
import AIChat from './AIChat'

interface PlanetDetailProps {
  memory: Memory
  onClose: () => void
  onMemoryUpdate: (updated: Memory) => void
}

// Calculate completeness
function getCompleteness(memory: Memory): number {
  const d = memory.dimensions
  let score = 0
  if (d.subjectiveFeelings.primaryEmotion || d.subjectiveFeelings.moodDescription || d.subjectiveFeelings.emotionalTags.length > 0) score++
  if (d.visual.photos.length > 0 || d.visual.visualDescription || d.visual.dominantColors.length > 0) score++
  if (d.auditory.sounds.length > 0 || d.auditory.music || d.auditory.audioDescription) score++
  if (d.taste.flavors.length > 0 || d.taste.foodAndDrinks.length > 0 || d.taste.tasteDescription) score++
  if (d.smell.scents.length > 0 || d.smell.smellDescription) score++
  if (d.touch.textures.length > 0 || d.touch.temperature || d.touch.touchDescription) score++
  if (d.environment.location || d.environment.weather || d.environment.environmentDescription) score++
  if (d.objects.items.length > 0 || d.objects.objectsDescription) score++
  if (d.relationships.people.length > 0 || d.relationships.relationshipDescription) score++
  return Math.round((score / 9) * 100)
}

export default function PlanetDetail({ memory, onClose, onMemoryUpdate }: PlanetDetailProps) {
  const emotionDef = emotions.find((e) => e.id === memory.dimensions.subjectiveFeelings.primaryEmotion)
  const gradient = emotionDef?.gradient || 'from-bg-card to-bg-card'
  const completeness = getCompleteness(memory)
  const { userName } = useSettingsStore()
  const [inviteUrl, setInviteUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [showInvite, setShowInvite] = useState(false)

  const statusLabel = completeness < 20 ? '无光空心星' : completeness < 60 ? '轻度发光星' : '完整发光星球'
  const statusEmoji = completeness < 20 ? '🕳️' : completeness < 60 ? '✨' : '🌟'
  const statusColor = completeness < 20 ? 'text-text-muted/50' : completeness < 60 ? 'text-amber-500/70' : 'text-amber-500'

  const hasPerspectives = memory.perspectives && memory.perspectives.length > 0

  const handleInvite = async () => {
    if (!userName.trim()) {
      toast.error('请先在设置页面填写你的称呼')
      return
    }
    const url = await generateInviteUrl(
      memory.id,
      memory.title,
      memory.actualDate,
      memory.dimensions.environment.location,
      memory.dimensions.visual.photos,
      userName,
      memory.dimensions.relationships.people.map((p) => p.name),
    )
    setInviteUrl(url)
    setShowInvite(true)
  }

  const copyInviteLink = async () => {
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    toast.success('邀请链接已复制！分享给你的朋友吧')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      className="absolute right-4 top-4 bottom-4 w-96 z-10 rounded-2xl border border-border bg-bg-card/95 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden"
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
    >
      {/* Header with gradient */}
      <div className={`shrink-0 p-5 bg-gradient-to-br ${gradient}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-medium text-text truncate">{memory.title || '未命名记忆'}</h2>
            <p className="mt-0.5 text-xs text-text-muted">{formatDate(memory.actualDate)}</p>
            {memory.dimensions.environment.location && (
              <p className="mt-0.5 text-xs text-text-muted flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {memory.dimensions.environment.location}
              </p>
            )}
          </div>
          <button onClick={onClose} className="rounded-full bg-black/30 p-1.5 text-white/60 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Planet status */}
        <div className="mt-3 flex items-center gap-3">
          <span className={`text-xs ${statusColor}`}>
            {statusEmoji} {statusLabel}
          </span>
          <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                backgroundColor: emotionDef?.color || '#FF9500',
                width: `${completeness}%`,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${completeness}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
          <span className="text-xs text-text-muted">{completeness}%</span>
        </div>

        {/* AI summary if exists */}
        {memory.aiEnriched.summary && (
          <p className="mt-3 text-xs leading-relaxed text-text-muted italic">
            {memory.aiEnriched.summary}
          </p>
        )}
      </div>

      {/* Quick info */}
      <div className="shrink-0 px-5 py-3 flex items-center gap-4 border-b border-border">
        {emotionDef && (
          <div className="flex items-center gap-1.5">
            <span className="text-lg">{emotionDef.emoji}</span>
            <span className="text-xs text-text-muted">{emotionDef.label}</span>
          </div>
        )}
        {memory.dimensions.visual.photos.length > 0 && (
          <span className="text-xs text-text-muted">📷 {memory.dimensions.visual.photos.length}张照片</span>
        )}
        {memory.tags.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {memory.tags.slice(0, 3).map((t) => (
              <span key={t} className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-text-muted">{t}</span>
            ))}
          </div>
        )}
        <Link
          to={`/record/${memory.id}`}
          className="ml-auto text-xs text-text-muted hover:text-text flex items-center gap-1"
        >
          <Edit3 className="h-3 w-3" /> 编辑
        </Link>
      </div>

      {/* Invite + Perspectives section */}
      <div className="shrink-0 px-5 py-3 border-b border-border space-y-3">
        {/* Invite button */}
        {!showInvite ? (
          <button
            onClick={handleInvite}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/8 py-2.5 text-sm text-amber-500 hover:bg-amber-500/15 transition-colors"
          >
            <Share2 className="h-4 w-4" />
            邀请朋友共创这段记忆
          </button>
        ) : (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
            <p className="text-xs text-text-muted mb-2">复制链接发给朋友，他们可以添加自己的视角：</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate text-xs text-text-muted/70 bg-bg rounded-lg px-2 py-1.5">
                {inviteUrl.slice(0, 60)}...
              </code>
              <button
                onClick={copyInviteLink}
                className="shrink-0 rounded-lg bg-amber-500/20 px-3 py-1.5 text-xs text-amber-500 hover:bg-amber-500/30 transition-colors flex items-center gap-1"
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? '已复制' : '复制'}
              </button>
            </div>
          </div>
        )}

        {/* Existing perspectives */}
        {hasPerspectives && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Users className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs text-text-muted">
                已有 {memory.perspectives.length} 位朋友贡献了视角
              </span>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {memory.perspectives.map((p) => {
                const pEmotion = emotions.find((e) => e.id === p.dimensions.subjectiveFeelings.primaryEmotion)
                return (
                  <div
                    key={p.id}
                    className="rounded-xl border border-border bg-white/3 px-3 py-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text">{p.authorName}</span>
                      {pEmotion && <span className="text-xs">{pEmotion.emoji}</span>}
                      {p.messageToOwner && (
                        <span className="text-xs text-text-muted/70 truncate flex-1">
                          💌 {p.messageToOwner}
                        </span>
                      )}
                    </div>
                    {p.dimensions.subjectiveFeelings.moodDescription && (
                      <p className="mt-1 text-xs text-text-muted line-clamp-2">
                        {p.dimensions.subjectiveFeelings.moodDescription}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* AI Chat section */}
      <div className="flex-1 overflow-y-auto p-5">
        <AIChat memory={memory} onMemoryUpdate={onMemoryUpdate} />
      </div>
    </motion.div>
  )
}
