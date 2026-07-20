import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Download, Upload, Trash2, Key, Eye, EyeOff, Music4, Volume2, FileText, FolderOpen } from 'lucide-react'
import { useSettingsStore } from '../store/settingsStore'
import { useMusicStore } from '../store/musicStore'
import { Button } from '../components/ui/Button'
import { exportAllMemories, importMemories, getAllMemories } from '../db/operations'
import { downloadAllAsMarkdown, writeToObsidianVault } from '../lib/obsidian'

export default function SettingsPage() {
  const { apiKey, setApiKey, userName, setUserName } = useSettingsStore()
  const music = useMusicStore()
  const [showKey, setShowKey] = useState(false)
  const [importing, setImporting] = useState(false)
  const [obsidianExporting, setObsidianExporting] = useState(false)
  const [testingKey, setTestingKey] = useState(false)
  const musicInputRef = useRef<HTMLInputElement>(null)

  const handleExport = async () => {
    try {
      const json = await exportAllMemories()
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `time-machine-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('导出成功')
    } catch {
      toast.error('导出失败')
    }
  }

  const handleImport = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      setImporting(true)
      try {
        const text = await file.text()
        await importMemories(text)
        toast.success('导入成功')
        window.location.reload()
      } catch {
        toast.error('导入失败，请检查文件格式')
      } finally {
        setImporting(false)
      }
    }
    input.click()
  }

  const handleClear = () => {
    if (window.confirm('确定要删除所有记忆吗？此操作不可撤销！')) {
      import('../db/index').then(({ db }) => {
        db.memories.clear().then(() => {
          toast.success('已清空所有记忆')
          window.location.reload()
        })
      })
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-medium text-text">设置</h1>
        <p className="mt-1 text-sm text-text-muted">管理你的时光机</p>
      </div>

      <div className="space-y-6">
        {/* API Key */}
        <motion.div
          className="rounded-2xl border border-border bg-bg-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-4 flex items-center gap-2">
            <Key className="h-4 w-4 text-amber-500" />
            <h2 className="font-medium text-text">DeepSeek API Key</h2>
          </div>
          <p className="mb-4 text-xs leading-relaxed text-text-muted">
            输入你的 DeepSeek API Key 以启用 AI 记忆润色功能。
            你的密钥仅保存在浏览器本地存储中，不会被上传到任何服务器。
          </p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full rounded-xl border border-border bg-bg px-4 py-2.5 pr-10 text-sm text-text placeholder:text-text-muted/50 focus:border-amber-500/50 focus:outline-none"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button
              variant="secondary"
              loading={testingKey}
              onClick={async () => {
                if (!apiKey.trim()) {
                  toast.error('请先输入 API Key')
                  return
                }
                setTestingKey(true)
                try {
                  const res = await fetch('/api/deepseek/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${apiKey.trim()}`,
                    },
                    body: JSON.stringify({
                      model: 'deepseek-chat',
                      messages: [{ role: 'user', content: 'hi' }],
                      max_tokens: 10,
                    }),
                  })
                  if (res.ok) {
                    toast.success('API Key 有效！连接成功')
                  } else {
                    const err = await res.text()
                    toast.error(`API 错误 (${res.status}): ${err}`)
                  }
                } catch (e) {
                  toast.error(`网络错误: ${e instanceof Error ? e.message : String(e)}`)
                } finally {
                  setTestingKey(false)
                }
              }}
            >
              测试连接
            </Button>
            {apiKey && (
              <span className="self-center text-xs text-text-muted">
                Key 长度: {apiKey.length}, 前缀: {apiKey.slice(0, 6)}...
              </span>
            )}
          </div>
        </motion.div>

        {/* User Name */}
        <motion.div
          className="rounded-2xl border border-border bg-bg-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className="mb-4 flex items-center gap-2">
            <span className="text-lg">👤</span>
            <h2 className="font-medium text-text">你的称呼</h2>
          </div>
          <p className="mb-4 text-xs leading-relaxed text-text-muted">
            用于共创邀请时显示你的名字，让朋友知道是谁发出的邀请。
          </p>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="输入你的名字或昵称..."
            className="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-text placeholder:text-text-muted/50 focus:border-amber-500/50 focus:outline-none"
          />
        </motion.div>

        {/* Background Music */}
        <motion.div
          className="rounded-2xl border border-border bg-bg-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="mb-4 flex items-center gap-2">
            <Music4 className="h-4 w-4 text-amber-500" />
            <h2 className="font-medium text-text">背景音乐</h2>
            {music.tracks.length > 0 && (
              <span className="text-xs text-text-muted">({music.tracks.length} 首)</span>
            )}
          </div>
          <p className="mb-4 text-xs leading-relaxed text-text-muted">
            上传多首音频作为背景音乐播放列表，浏览记忆时自动播放。
            单文件不超过 8MB，支持 mp3、wav、ogg 格式。
          </p>

          {/* Playlist */}
          {music.tracks.length > 0 && (
            <div className="mb-4 space-y-1.5 max-h-48 overflow-y-auto">
              {music.tracks.map((track, i) => (
                <div
                  key={track.id}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                    track.id === music.currentId
                      ? 'bg-amber-500/10 border border-amber-500/20'
                      : 'bg-white/5 border border-transparent hover:bg-white/10'
                  }`}
                >
                  <span
                    className={`truncate flex-1 cursor-pointer ${track.id === music.currentId ? 'text-amber-500' : 'text-text-muted'}`}
                    onClick={() => music.selectTrack(track.id)}
                    title={track.fileName}
                  >
                    {track.id === music.currentId && (music.playing ? '🎵 ' : '⏸ ')}
                    {i + 1}. {track.fileName}
                  </span>
                  <button
                    onClick={() => {
                      music.removeTrack(track.id)
                      toast.success(`已移除：${track.fileName}`)
                    }}
                    className="ml-2 text-text-muted/40 hover:text-red-500 transition-colors shrink-0"
                    title="移除"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-3 items-center">
            <Button variant="secondary" onClick={() => musicInputRef.current?.click()}>
              <Upload className="h-4 w-4" />
              {music.tracks.length > 0 ? '添加更多' : '上传音乐'}
            </Button>
            {music.tracks.length > 0 && (
              <>
                <Button variant="secondary" onClick={() => music.togglePlay()}>
                  {music.playing ? '⏸ 暂停' : '▶ 播放'}
                </Button>
                <Button variant="secondary" onClick={() => music.setShuffle(!music.shuffle)}>
                  {music.shuffle ? '🔀 随机中' : '🔀 随机'}
                </Button>
              </>
            )}
            <input
              ref={musicInputRef}
              type="file"
              accept="audio/*"
              multiple
              className="hidden"
              onChange={async (e) => {
                const files = Array.from(e.target.files || [])
                if (files.length === 0) return
                const err = await music.addTracks(files)
                if (err) toast.error(err)
                else toast.success(`已添加 ${files.length} 首音乐`)
                // Reset so the same file can be re-selected
                e.target.value = ''
              }}
            />
          </div>
        </motion.div>

        {/* Obsidian Integration */}
        <motion.div
          className="rounded-2xl border border-border bg-bg-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="mb-4 flex items-center gap-2">
            <FileText className="h-4 w-4 text-purple-500" />
            <h2 className="font-medium text-text">Obsidian 集成</h2>
          </div>
          <p className="mb-4 text-xs leading-relaxed text-text-muted">
            将记忆导出为 Obsidian 兼容的 Markdown 格式，含 YAML frontmatter、[[wikilinks]] 双向链接、
            标签和完整九维度内容。可选择下载 MD 文件或直接写入 Obsidian Vault 文件夹。
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              loading={obsidianExporting}
              onClick={async () => {
                setObsidianExporting(true)
                try {
                  const memories = await getAllMemories()
                  if (memories.length === 0) {
                    toast.error('没有记忆可以导出')
                    return
                  }
                  downloadAllAsMarkdown(memories, { includePhotos: true, includeAiContent: true })
                  toast.success(`已导出 ${memories.length} 篇 Markdown 笔记`)
                } catch {
                  toast.error('导出失败')
                } finally {
                  setObsidianExporting(false)
                }
              }}
            >
              <Download className="h-4 w-4" />
              导出 MD 文件
            </Button>
            <Button
              variant="secondary"
              onClick={async () => {
                setObsidianExporting(true)
                try {
                  const memories = await getAllMemories()
                  if (memories.length === 0) {
                    toast.error('没有记忆可以导出')
                    return
                  }
                  const result = await writeToObsidianVault(memories, { includePhotos: true, includeAiContent: true })
                  if (result.success) {
                    toast.success(result.message)
                  } else {
                    toast.error(result.message)
                  }
                } catch {
                  toast.error('操作失败')
                } finally {
                  setObsidianExporting(false)
                }
              }}
            >
              <FolderOpen className="h-4 w-4" />
              写入 Obsidian Vault
            </Button>
          </div>
          <p className="mt-3 text-xs text-text-muted/50">
            「写入 Obsidian Vault」需要 Chrome/Edge 浏览器，选择你的 Obsidian Vault 文件夹即可。
            笔记将写入「美好时光机记忆」子目录，照片写入「photos」目录。
          </p>
        </motion.div>

        {/* Data Management */}
        <motion.div
          className="rounded-2xl border border-border bg-bg-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h2 className="mb-4 font-medium text-text">数据管理</h2>
          <p className="mb-4 text-xs leading-relaxed text-text-muted">
            所有记忆数据存储在浏览器的 IndexedDB 中。建议定期导出备份。
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={handleExport}>
              <Download className="h-4 w-4" />
              导出备份
            </Button>
            <Button variant="secondary" onClick={handleImport} loading={importing}>
              <Upload className="h-4 w-4" />
              导入备份
            </Button>
            <Button variant="danger" onClick={handleClear}>
              <Trash2 className="h-4 w-4" />
              清空数据
            </Button>
          </div>
        </motion.div>

        {/* About */}
        <motion.div
          className="rounded-2xl border border-border bg-bg-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="mb-3 font-medium text-text">关于美好时光机</h2>
          <p className="text-sm leading-relaxed text-text-muted">
            美好时光机是一个帮助人们多维记录生活的工具。它不仅仅是一本日记，
            更是一个AI外脑——通过视觉、听觉、味觉、嗅觉、触觉等多维度信息，
            帮你珍藏每一个珍贵的当下。多年后，当你重新打开这些记忆，
            不只是"看一张照片"，而是真正回到那一刻。
          </p>
          <p className="mt-2 text-sm leading-relaxed text-text-muted">
            所有数据仅存储在你的浏览器中，完全私密。
          </p>
        </motion.div>
      </div>
    </div>
  )
}
