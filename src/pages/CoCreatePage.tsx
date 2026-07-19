import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Sparkles, Share2, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import type { SharePayload, Perspective } from '../types/memory'
import { parseInviteFromHash, parseResponseFromHash, isResponseUrl, emptyDimensions, generateResponseUrl } from '../lib/share'
import { generateId } from '../lib/utils'
import { getMemoryById, updateMemory } from '../db/operations'
import { emotions } from '../constants/emotions'
import EmotionPicker from '../components/memory/EmotionPicker'
import IntensitySlider from '../components/memory/IntensitySlider'
import PhotoUploader from '../components/memory/PhotoUploader'
import TagInput from '../components/memory/TagInput'
import ColorPalettePicker from '../components/memory/ColorPalettePicker'
import { Textarea } from '../components/ui/Textarea'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Tag } from '../components/ui/Tag'
import PhotoCarousel from '../components/memory/PhotoCarousel'

const flavorSuggestions = ['甜', '咸', '酸', '苦', '鲜', '辣', '清淡', '浓郁', '清爽', '醇厚']
const scentSuggestions = ['花香', '泥土', '海腥味', '草木', '咖啡', '烤面包', '雨后的空气', '木质香', '果香']
const soundSuggestions = ['鸟鸣', '海浪', '风吹树叶', '雨声', '音乐', '车流', '笑声', '人声嘈杂', '安静', '钟声']
const textureSuggestions = ['细沙', '柔软', '粗糙', '凉爽', '温暖', '湿润', '光滑', '毛绒', '硬质', '丝滑']

export default function CoCreatePage() {
  const navigate = useNavigate()
  const [invite, setInvite] = useState<SharePayload | null>(null)
  const [authorName, setAuthorName] = useState('')
  const [dimensions, setDimensions] = useState(emptyDimensions())
  const [tags, setTags] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [step, setStep] = useState<'loading' | 'form' | 'done'>('loading')
  const [responseUrl, setResponseUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [importing, setImporting] = useState(false)

  // Parse invite from URL hash
  useEffect(() => {
    const hash = window.location.hash
    if (!hash) {
      setStep('loading')
      return
    }

    // Check if it's a response being imported back
    if (isResponseUrl(hash)) {
      handleImportResponse(hash)
      return
    }

    const parsed = parseInviteFromHash(hash)
    if (parsed) {
      setInvite(parsed)
      setStep('form')
    } else {
      toast.error('无效的共创邀请链接')
      navigate('/')
    }
  }, [])

  const handleImportResponse = async (hash: string) => {
    setImporting(true)
    const parsed = parseResponseFromHash(hash)
    if (!parsed) {
      toast.error('无效的回应链接')
      navigate('/')
      return
    }

    try {
      const memory = await getMemoryById(parsed.memoryId)
      if (!memory) {
        toast.error('未找到原始记忆，请确认记忆仍在你的时光机中')
        navigate('/')
        return
      }

      // Check if perspective already exists
      const exists = memory.perspectives?.some((p) => p.id === parsed.perspective.id)
      if (exists) {
        toast.info('该视角已经导入过了')
        navigate(`/revisit/${parsed.memoryId}`)
        return
      }

      memory.perspectives = [...(memory.perspectives || []), parsed.perspective]
      await updateMemory(memory)
      toast.success(`${parsed.perspective.authorName} 的视角已合并到记忆中！`)
      navigate(`/revisit/${parsed.memoryId}`)
    } catch {
      toast.error('导入失败，请重试')
    } finally {
      setImporting(false)
    }
  }

  const update = (key: string, val: Record<string, unknown>) => {
    setDimensions((prev) => ({
      ...prev,
      [key]: { ...((prev as unknown) as Record<string, object>)[key], ...val },
    }))
  }

  const handleShareBack = useCallback(() => {
    if (!invite) return

    const perspective: Perspective = {
      id: generateId(),
      authorName: authorName || '匿名朋友',
      authorRole: '朋友',
      createdAt: new Date().toISOString(),
      dimensions,
      aiEnriched: { enriched: false },
      tags,
      messageToOwner: message || undefined,
    }

    const url = generateResponseUrl(invite.memoryId, perspective)
    setResponseUrl(url)
    setStep('done')
  }, [invite, authorName, dimensions, tags, message])

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(responseUrl)
    setCopied(true)
    toast.success('回应链接已复制！发回给邀请你的人吧')
    setTimeout(() => setCopied(false), 2000)
  }

  if (importing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <motion.div className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
            className="mx-auto mb-4"
          >
            <Sparkles className="h-10 w-10 text-amber-500" />
          </motion.div>
          <p className="text-text-muted">正在合并共创视角...</p>
        </motion.div>
      </div>
    )
  }

  if (step === 'loading' || !invite) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <p className="text-text-muted">加载中...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-32 pt-6">
      <AnimatePresence mode="wait">
        {step === 'form' && (
          <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Header */}
            <button
              onClick={() => navigate('/')}
              className="mb-4 flex items-center gap-1.5 text-sm text-text-muted hover:text-text"
            >
              <ArrowLeft className="h-4 w-4" />
              返回
            </button>

            <motion.div
              className="mb-6 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-pink-500/5 p-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                <h1 className="text-lg font-medium text-text">共创邀请</h1>
              </div>
              <p className="text-sm text-text-muted">
                <span className="text-amber-500 font-medium">{invite.ownerName}</span> 邀请你一起记录这段时光
              </p>
            </motion.div>

            {/* Shared context */}
            <div className="mb-6 rounded-2xl border border-border bg-bg-card p-5">
              <h2 className="text-lg font-medium text-text">{invite.memoryTitle}</h2>
              <p className="mt-1 text-sm text-text-muted">{new Date(invite.memoryDate).toLocaleDateString('zh-CN')}</p>
              {invite.location && (
                <p className="mt-1 text-sm text-text-muted">📍 {invite.location}</p>
              )}
              {invite.photos.length > 0 && (
                <div className="mt-4">
                  <PhotoCarousel photos={invite.photos} />
                </div>
              )}
              {invite.existingPeople.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-text-muted">同行者：</span>
                  {invite.existingPeople.map((name) => (
                    <span key={name} className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-text-muted">
                      {name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Co-creator's name */}
            <div className="mb-6">
              <Input
                placeholder="你的名字（让Ta知道是你）"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
              />
            </div>

            {/* Co-creator's perspective - collapsed sections */}
            <div className="space-y-3">
              {/* Feelings */}
              <CollapsibleSection icon="💭" title="你的感受" defaultOpen>
                <EmotionPicker
                  value={dimensions.subjectiveFeelings.primaryEmotion}
                  onChange={(v) => update('subjectiveFeelings', { primaryEmotion: v })}
                />
                <div className="mt-3">
                  <IntensitySlider
                    value={dimensions.subjectiveFeelings.moodIntensity}
                    onChange={(v) => update('subjectiveFeelings', { moodIntensity: v })}
                  />
                </div>
                <div className="mt-3">
                  <TagInput
                    tags={dimensions.subjectiveFeelings.emotionalTags}
                    onChange={(v) => update('subjectiveFeelings', { emotionalTags: v })}
                    placeholder="情绪标签..."
                    suggestions={['治愈', '浪漫', '自由', '温暖', '感动', '平静', '幸福']}
                  />
                </div>
                <div className="mt-3">
                  <Textarea
                    placeholder="那一刻你的感受是..."
                    value={dimensions.subjectiveFeelings.moodDescription}
                    onChange={(e) => update('subjectiveFeelings', { moodDescription: e.target.value })}
                  />
                </div>
              </CollapsibleSection>

              {/* Visual */}
              <CollapsibleSection icon="👁️" title="你看到的">
                <PhotoUploader
                  photos={dimensions.visual.photos}
                  onChange={(v) => update('visual', { photos: v })}
                />
                <div className="mt-3">
                  <ColorPalettePicker
                    colors={dimensions.visual.dominantColors}
                    onChange={(v) => update('visual', { dominantColors: v })}
                  />
                </div>
                <div className="mt-3">
                  <Textarea
                    placeholder="你眼中的画面..."
                    value={dimensions.visual.visualDescription}
                    onChange={(e) => update('visual', { visualDescription: e.target.value })}
                  />
                </div>
              </CollapsibleSection>

              {/* Auditory */}
              <CollapsibleSection icon="👂" title="你听到的">
                <TagInput
                  tags={dimensions.auditory.sounds}
                  onChange={(v) => update('auditory', { sounds: v })}
                  placeholder="什么声音？"
                  suggestions={soundSuggestions}
                />
                <div className="mt-3">
                  <Input
                    placeholder="音乐或旋律..."
                    value={dimensions.auditory.music}
                    onChange={(e) => update('auditory', { music: e.target.value })}
                  />
                </div>
                <div className="mt-3">
                  <Textarea
                    placeholder="声音的氛围..."
                    value={dimensions.auditory.audioDescription}
                    onChange={(e) => update('auditory', { audioDescription: e.target.value })}
                  />
                </div>
              </CollapsibleSection>

              {/* Taste */}
              <CollapsibleSection icon="👅" title="你尝到的">
                <TagInput
                  tags={dimensions.taste.flavors}
                  onChange={(v) => update('taste', { flavors: v })}
                  placeholder="什么味道？"
                  suggestions={flavorSuggestions}
                />
                <div className="mt-3">
                  <Textarea
                    placeholder="味觉的体验..."
                    value={dimensions.taste.tasteDescription}
                    onChange={(e) => update('taste', { tasteDescription: e.target.value })}
                  />
                </div>
              </CollapsibleSection>

              {/* Smell */}
              <CollapsibleSection icon="👃" title="你闻到的">
                <TagInput
                  tags={dimensions.smell.scents}
                  onChange={(v) => update('smell', { scents: v })}
                  placeholder="空气里的气味？"
                  suggestions={scentSuggestions}
                />
                <div className="mt-3">
                  <Textarea
                    placeholder="气味的记忆..."
                    value={dimensions.smell.smellDescription}
                    onChange={(e) => update('smell', { smellDescription: e.target.value })}
                  />
                </div>
              </CollapsibleSection>

              {/* Touch */}
              <CollapsibleSection icon="🤚" title="你触碰到的">
                <TagInput
                  tags={dimensions.touch.textures}
                  onChange={(v) => update('touch', { textures: v })}
                  placeholder="质感..."
                  suggestions={textureSuggestions}
                />
                <div className="mt-3">
                  <Input
                    placeholder="温度感受..."
                    value={dimensions.touch.temperature}
                    onChange={(e) => update('touch', { temperature: e.target.value })}
                  />
                </div>
                <div className="mt-3">
                  <Textarea
                    placeholder="触觉体验..."
                    value={dimensions.touch.touchDescription}
                    onChange={(e) => update('touch', { touchDescription: e.target.value })}
                  />
                </div>
              </CollapsibleSection>

              {/* Tags */}
              <CollapsibleSection icon="🏷️" title="你的标签">
                <TagInput
                  tags={tags}
                  onChange={setTags}
                  placeholder="给这段共同回忆加几个标签..."
                  suggestions={['夏日', '友情', '旅行', '美食', '音乐', '冒险', '温暖', '治愈']}
                />
              </CollapsibleSection>

              {/* Message to owner */}
              <CollapsibleSection icon="💌" title="想对Ta说的话">
                <Textarea
                  placeholder="写下你想对邀请者说的话..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                />
              </CollapsibleSection>
            </div>

            {/* Submit */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
              <Button variant="primary" size="lg" onClick={handleShareBack} disabled={!authorName.trim()}>
                <Share2 className="h-4 w-4" />
                分享我的视角
              </Button>
            </div>
          </motion.div>
        )}

        {step === 'done' && (
          <motion.div
            key="done"
            className="flex flex-col items-center py-16 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <motion.div
              className="mb-6 rounded-full bg-green-500/15 p-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <Check className="h-12 w-12 text-green-500" />
            </motion.div>
            <h2 className="text-2xl font-medium text-text">视角已生成！</h2>
            <p className="mt-2 max-w-sm text-sm text-text-muted">
              复制下面的链接发给邀请你的人，Ta 就能看到你的视角并与自己的记忆合并。
            </p>

            <div className="mt-6 w-full max-w-md">
              <div className="flex items-center gap-2 rounded-xl border border-border bg-bg p-3">
                <code className="flex-1 break-all text-xs text-text-muted">{responseUrl.slice(0, 80)}...</code>
                <Button variant="secondary" size="sm" onClick={copyToClipboard}>
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  {copied ? '已复制' : '复制链接'}
                </Button>
              </div>
            </div>

            <Button variant="ghost" className="mt-4" onClick={() => navigate('/')}>
              返回首页
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ---- Collapsible Section ----
function CollapsibleSection({
  icon,
  title,
  defaultOpen = false,
  children,
}: {
  icon: string
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="rounded-xl border border-border bg-bg-card/60 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-bg-card-hover/50 transition-colors"
      >
        <span className="text-lg">{icon}</span>
        <span className="text-sm text-text">{title}</span>
        <span className="ml-auto text-xs text-text-muted">{open ? '收起' : '展开'}</span>
      </button>
      {open && <div className="px-4 pb-4 space-y-2">{children}</div>}
    </div>
  )
}
