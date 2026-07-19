import { useRef, useState, useCallback } from 'react'
import { toPng } from 'html-to-image'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, Share2, X, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import type { Memory } from '../../types/memory'
import { formatDate } from '../../lib/utils'
import { emotions } from '../../constants/emotions'

interface SharePosterProps {
  memory: Memory
}

const timePhrases = [
  '把此刻的美好，留给未来的自己',
  '不是保存照片，而是保存那一刻的你',
  '让未来的你，重新遇见今天的自己',
  '每一刻都值得被珍藏',
  '时光会走远，记忆永留存',
]

// Standard social media poster: 3:4 ratio
const POSTER_WIDTH = 750
const POSTER_HEIGHT = 1000

const shareChannels = [
  { id: 'download', label: '保存海报', icon: Download, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  { id: 'copy', label: '复制图片', icon: Copy, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
  { id: 'weibo', label: '分享到微博', icon: Share2, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
]

export default function SharePoster({ memory }: SharePosterProps) {
  const captureRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [captureReady, setCaptureReady] = useState(false)

  const d = memory.dimensions
  const emotionDef = emotions.find((e) => e.id === d.subjectiveFeelings.primaryEmotion)
  const coverPhoto = d.visual.photos[0]
  const phrase = timePhrases[Math.floor(Math.random() * timePhrases.length)]

  const openModal = useCallback(() => {
    setOpen(true)
    setGeneratedUrl(null)
    // Give the hidden capture element time to render
    setTimeout(() => setCaptureReady(true), 300)
  }, [])

  const generatePoster = async (): Promise<string> => {
    if (!captureRef.current) throw new Error('No capture element')
    const dataUrl = await toPng(captureRef.current, {
      quality: 0.95,
      pixelRatio: 1,
      width: POSTER_WIDTH,
      height: POSTER_HEIGHT,
    })
    return dataUrl
  }

  const handleDownload = async () => {
    try {
      const url = generatedUrl || await generatePoster()
      setGeneratedUrl(url)
      const a = document.createElement('a')
      a.href = url
      a.download = `美好时光机_${memory.title || '记忆'}_${new Date(memory.actualDate).toLocaleDateString('zh-CN').replace(/\//g, '-')}.png`
      a.click()
      toast.success('海报已下载')
    } catch (e) {
      console.error('Poster generation failed:', e)
      toast.error('生成海报失败')
    }
  }

  const handleCopy = async () => {
    try {
      const url = generatedUrl || await generatePoster()
      setGeneratedUrl(url)
      const res = await fetch(url)
      const blob = await res.blob()
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ])
      setCopied(true)
      toast.success('海报已复制到剪贴板')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('复制失败，请尝试下载')
    }
  }

  const handleWeiboShare = async () => {
    try {
      setGenerating(true)
      await generatePoster()
      const text = encodeURIComponent(`${memory.title || '一段美好时光'}${emotionDef ? ` ${emotionDef.emoji}` : ''} | 来自美好时光机`)
      window.open(`https://service.weibo.com/share/share.php?title=${text}&url=${encodeURIComponent(window.location.href)}`, '_blank')
      toast.success('海报已生成，请下载后上传到微博')
      await handleDownload()
    } catch {
      toast.error('操作失败')
    } finally {
      setGenerating(false)
    }
  }

  const handleAction = async (channelId: string) => {
    setGenerating(true)
    try {
      switch (channelId) {
        case 'download': await handleDownload(); break
        case 'copy': await handleCopy(); break
        case 'weibo': await handleWeiboShare(); break
      }
    } finally {
      setGenerating(false)
    }
  }

  const PosterContent = ({ small }: { small?: boolean }) => (
    <div
      className="relative flex flex-col items-center justify-end text-center"
      style={{
        width: small ? '100%' : POSTER_WIDTH,
        height: small ? undefined : POSTER_HEIGHT,
        aspectRatio: small ? '3/4' : undefined,
        maxHeight: small ? '60vh' : undefined,
        background: coverPhoto
          ? `url(${coverPhoto}) center/cover no-repeat`
          : 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
      }}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/10" />
      {!coverPhoto && (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 to-amber-900/30" />
      )}

      {/* Top accent line */}
      <div className="absolute top-8 left-8 right-8 h-px bg-white/20" />

      {/* Content */}
      <div className="relative z-10 p-10 pb-12 w-full">
        {/* Emotion emoji */}
        {emotionDef && (
          <div className={small ? "text-5xl mb-3 drop-shadow-lg" : "text-7xl mb-4 drop-shadow-lg"}>
            {emotionDef.emoji}
          </div>
        )}

        {/* Title */}
        <h2
          className="font-bold text-white drop-shadow-lg leading-tight"
          style={{ fontSize: small ? 24 : 36 }}
        >
          {memory.title || '一段美好时光'}
        </h2>

        {/* Date & Location */}
        <div
          className="flex items-center justify-center gap-3 text-white/70 mt-3"
          style={{ fontSize: small ? 13 : 16 }}
        >
          <span>{formatDate(memory.actualDate)}</span>
          {d.environment.location && (
            <>
              <span>·</span>
              <span>{d.environment.location}</span>
            </>
          )}
        </div>

        {/* Emotion label */}
        {emotionDef && (
          <div className="mt-3" style={{ fontSize: small ? 12 : 14 }}>
            <span className="rounded-full bg-white/10 px-4 py-1 text-white/70 backdrop-blur-sm">
              {emotionDef.label}
            </span>
          </div>
        )}

        {/* AI Summary or tags */}
        {memory.aiEnriched.summary ? (
          <p
            className="text-white/60 leading-relaxed mt-5 px-4 mx-auto max-w-md"
            style={{ fontSize: small ? 12 : 15 }}
          >
            {memory.aiEnriched.summary}
          </p>
        ) : memory.tags.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            {memory.tags.slice(0, 4).map((t) => (
              <span
                key={t}
                className="rounded-full bg-white/10 px-3 py-1 text-white/70 backdrop-blur-sm"
                style={{ fontSize: small ? 11 : 14 }}
              >
                #{t}
              </span>
            ))}
          </div>
        ) : null}

        {/* Memo line */}
        {d.subjectiveFeelings.moodDescription && (
          <p
            className="text-white/50 italic leading-relaxed mt-5 px-4 mx-auto max-w-md line-clamp-2"
            style={{ fontSize: small ? 11 : 14 }}
          >
            "{d.subjectiveFeelings.moodDescription}"
          </p>
        )}

        {/* Spacer */}
        <div style={{ height: small ? 20 : 30 }} />

        {/* Branding */}
        <div className="border-t border-white/15 pt-5 mx-8">
          <p className="text-white/40" style={{ fontSize: small ? 11 : 14 }}>
            ✨ 美好时光机 · 珍藏每一个当下
          </p>
          <p className="text-white/25 mt-2 italic" style={{ fontSize: small ? 10 : 13 }}>
            {phrase}
          </p>
        </div>
      </div>

      {/* Bottom accent */}
      <div className="absolute bottom-6 left-8 right-8 h-px bg-white/15" />
    </div>
  )

  return (
    <>
      {/* Share button */}
      <button
        onClick={openModal}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500/10 to-pink-500/10 border border-amber-500/20 px-4 py-2.5 text-sm text-amber-500 hover:from-amber-500/20 hover:to-pink-500/20 transition-all"
      >
        <Share2 className="h-4 w-4" />
        生成分享海报
      </button>

      {/* Hidden full-size capture element */}
      {open && captureReady && (
        <div
          ref={captureRef}
          style={{
            position: 'fixed',
            left: '-9999px',
            top: 0,
            width: POSTER_WIDTH,
            height: POSTER_HEIGHT,
            zIndex: -1,
          }}
        >
          <PosterContent />
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="relative bg-bg-card border border-border rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                <button
                  onClick={() => setOpen(false)}
                  className="absolute right-4 top-4 text-text-muted hover:text-text z-10"
                >
                  <X className="h-5 w-5" />
                </button>

                <h3 className="text-lg font-medium text-text mb-4">分享记忆海报</h3>

                {/* Poster preview (scaled down for modal) */}
                <div className="rounded-xl overflow-hidden border border-border mb-4">
                  <PosterContent small />
                </div>

                {/* Share channels */}
                <div className="space-y-2">
                  {shareChannels.map((ch) => {
                    const Icon = ch.icon
                    const isCopy = ch.id === 'copy' && copied
                    return (
                      <button
                        key={ch.id}
                        onClick={() => handleAction(ch.id)}
                        disabled={generating}
                        className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-colors disabled:opacity-50 ${ch.bg} ${ch.border} ${ch.color}`}
                      >
                        {isCopy ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Icon className="h-4 w-4" />
                        )}
                        {isCopy ? '已复制' : ch.label}
                      </button>
                    )
                  })}
                  {/* Native share (mobile) */}
                  {typeof navigator !== 'undefined' && 'share' in navigator && (
                    <button
                      onClick={() => handleAction('download')}
                      disabled={generating}
                      className="w-full flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-amber-500 to-pink-500 px-4 py-3 text-sm font-medium text-white disabled:opacity-50 transition-all hover:from-amber-400 hover:to-pink-400"
                    >
                      <Share2 className="h-4 w-4" />
                      一键分享
                    </button>
                  )}
                </div>
                <p className="mt-3 text-center text-xs text-text-muted/50">
                  生成海报后，可分享至微信朋友圈、微博、小红书等平台
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
