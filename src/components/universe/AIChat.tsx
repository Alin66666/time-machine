import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Send, User, Bot } from 'lucide-react'
import { toast } from 'sonner'
import { useSettingsStore } from '../../store/settingsStore'
import { chatWithContext } from '../../lib/deepseek'
import type { Memory } from '../../types/memory'
import { updateMemory } from '../../db/operations'

interface Message {
  role: 'ai' | 'user'
  content: string
}

interface AIChatProps {
  memory: Memory
  onMemoryUpdate: (updated: Memory) => void
}

// AI personality options
const personalities = [
  { id: 'gentle', label: '温柔共情', emoji: '💫', prompt: '你是一个温柔共情的倾听者，用温暖、关怀的语气和用户对话。慢慢引导用户回忆更多细节。' },
  { id: 'casual', label: '闲聊八卦', emoji: '💬', prompt: '你是一个喜欢闲聊的朋友，用轻松、好奇的语气和用户对话。像朋友一样追问有趣的细节。' },
  { id: 'deep', label: '深度反思', emoji: '🌙', prompt: '你是一个有深度的思考伙伴，用哲思、沉静的语气和用户对话。帮助用户挖掘内心的感受和领悟。' },
]

export default function AIChat({ memory, onMemoryUpdate }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [personality, setPersonality] = useState(personalities[0])
  const [phase, setPhase] = useState<'intro' | 'chatting' | 'done'>('intro')
  const { apiKey } = useSettingsStore()
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const getMissingDimensions = (): string[] => {
    const d = memory.dimensions
    const missing: string[] = []
    if (!d.subjectiveFeelings.primaryEmotion && !d.subjectiveFeelings.moodDescription) missing.push('主体感受')
    if (!d.visual.visualDescription && d.visual.photos.length === 0) missing.push('视觉')
    if (!d.auditory.audioDescription && d.auditory.sounds.length === 0) missing.push('听觉')
    if (!d.taste.tasteDescription && d.taste.flavors.length === 0) missing.push('味觉')
    if (!d.smell.smellDescription && d.smell.scents.length === 0) missing.push('嗅觉')
    if (!d.touch.touchDescription && d.touch.textures.length === 0) missing.push('触觉')
    if (!d.environment.environmentDescription && !d.environment.location) missing.push('环境')
    if (!d.objects.objectsDescription && d.objects.items.length === 0) missing.push('物件')
    if (!d.relationships.relationshipDescription && d.relationships.people.length === 0) missing.push('关系')
    return missing
  }

  const startChat = async () => {
    if (!apiKey) {
      toast.error('请先在设置页面配置 DeepSeek API Key')
      return
    }

    setPhase('chatting')
    const missing = getMissingDimensions()

    if (missing.length === 0) {
      setMessages([{
        role: 'ai',
        content: '你的这颗星球已经很丰满了！✨ 每一段记忆都闪闪发光。我们随便聊聊吧，关于这段时光，你还有什么想分享的吗？',
      }])
      return
    }

    // Generate an intro message from AI
    setSending(true)
    try {
      const text = await chatWithContext(
        [{ role: 'user', content: '开始和我聊聊这段记忆吧，帮我填充更多细节。' }],
        `${personality.prompt}
当前用户正在回顾一段记忆：
- 标题：${memory.title || '未命名'}
- 已记录的信息：${JSON.stringify(memory.dimensions, null, 2)}
- 还缺少的维度：${missing.join('、')}

你的任务是：像朋友聊天一样，自然地引导用户补充这些缺失的维度信息。
每次只说1-2句话，提1个具体的问题。不要一次性问太多。
记住：你不是AI助手，你是${personality.label}的朋友。用口语化的方式交流。`
      )

      setMessages([{ role: 'ai', content: text }])
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'AI 服务暂不可用'
      toast.error(msg)
      setPhase('intro')
    } finally {
      setSending(false)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || sending) return

    const userMsg = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }])
    setSending(true)

    try {
      const missing = getMissingDimensions()

      const systemPrompt = `${personality.prompt}
你是用户的记忆伙伴，正在帮用户丰富一段记忆。用户刚分享了新的内容，你需要：
1. 先共情回应用户（表示理解和欣赏）
2. 如果发现有新的记忆维度信息，提取出来用JSON格式回复
3. 继续自然地引导对话

记忆当前状态：
${JSON.stringify(memory.dimensions, null, 2)}
还缺少的维度：${missing.length > 0 ? missing.join('、') : '基本完整'}

回复格式：先写对话内容（1-3句话），如果需要更新记忆信息，在最后用JSON代码块输出：
\`\`\`json
{ "update": { "维度key": { "字段": "值" } } }
\`\`\`

如果没有新信息需要更新，就不写JSON代码块。保持对话自然流畅。`

      const text = await chatWithContext(
        [
          ...messages.map((m) => ({
            role: (m.role === 'ai' ? 'assistant' : 'user') as 'user' | 'assistant',
            content: m.content,
          })),
          { role: 'user' as const, content: userMsg },
        ],
        systemPrompt
      )

      // Try to extract memory update from response
      const jsonMatch = text.match(/```json\s*\n?([\s\S]*?)\n?```/)
      if (jsonMatch) {
        try {
          const update = JSON.parse(jsonMatch[1])
          if (update.update) {
            const updated = { ...memory }
            for (const [dimKey, dimData] of Object.entries(update.update)) {
              if (dimKey in updated.dimensions) {
                (updated.dimensions as any)[dimKey] = {
                  ...(updated.dimensions as any)[dimKey],
                  ...(dimData as object),
                }
              }
            }
            updated.updatedAt = new Date().toISOString()
            await updateMemory(updated)
            onMemoryUpdate(updated)
          }
        } catch {
          // JSON parse failed, just show the message
        }
      }

      // Clean the response (remove JSON block)
      const cleanText = text.replace(/```json[\s\S]*?```/, '').trim()
      setMessages((prev) => [...prev, { role: 'ai', content: cleanText || text.trim() }])

      // Check if all dimensions are filled
      const remaining = getMissingDimensions()
      if (remaining.length === 0 && messages.length > 6) {
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            { role: 'ai', content: '感觉这颗星球已经充满了温度和故事！✨ 它现在会在你的宇宙中永远发光了。随时可以再回来聊聊。' },
          ])
          setPhase('done')
        }, 1000)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : '发送失败，请重试'
      toast.error(msg)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-amber-500" />
        <h3 className="font-medium text-text">点亮这颗星球</h3>
      </div>

      {/* Intro phase */}
      {phase === 'intro' && (
        <div className="flex-1 flex flex-col items-center justify-center py-8">
          <p className="text-sm text-text-muted text-center mb-4">
            选择一种对话风格，让 AI 陪你聊聊这段记忆，<br />
            帮你填充更多细节，让星球发光。
          </p>
          <div className="flex gap-2 mb-6">
            {personalities.map((p) => (
              <button
                key={p.id}
                onClick={() => setPersonality(p)}
                className={`px-3 py-2 rounded-xl text-xs transition-all ${
                  personality.id === p.id
                    ? 'bg-amber-500/20 border border-amber-500/30 text-amber-500'
                    : 'bg-white/5 border border-white/5 text-text-muted hover:bg-white/10'
                }`}
              >
                {p.emoji} {p.label}
              </button>
            ))}
          </div>
          <button
            onClick={startChat}
            disabled={sending}
            className="rounded-xl bg-gradient-to-r from-amber-500 to-pink-500 px-6 py-3 text-sm font-medium text-white hover:shadow-lg hover:shadow-amber-500/20 transition-all disabled:opacity-50"
          >
            {sending ? '正在连接...' : '✨ 开始对话'}
          </button>
        </div>
      )}

      {/* Chat messages */}
      {phase === 'chatting' && (
        <>
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 max-h-[400px]">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`flex h-7 w-7 items-center justify-center rounded-full shrink-0 ${
                  msg.role === 'ai' ? 'bg-amber-500/20' : 'bg-blue-500/20'
                }`}>
                  {msg.role === 'ai' ? (
                    <Bot className="h-3.5 w-3.5 text-amber-500" />
                  ) : (
                    <User className="h-3.5 w-3.5 text-blue-500" />
                  )}
                </div>
                <div className={`rounded-2xl px-4 py-2.5 max-w-[80%] ${
                  msg.role === 'ai'
                    ? 'bg-white/5 text-text-muted'
                    : 'bg-amber-500/10 text-text'
                }`}>
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                </div>
              </motion.div>
            ))}
            {sending && (
              <div className="flex gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/20">
                  <Bot className="h-3.5 w-3.5 text-amber-500" />
                </div>
                <div className="rounded-2xl px-4 py-2.5 bg-white/5">
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="分享你的故事..."
              className="flex-1 rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-text placeholder-text-muted/40 outline-none focus:border-amber-500/30 transition-colors"
              disabled={sending}
            />
            <button
              onClick={sendMessage}
              disabled={sending || !input.trim()}
              className="rounded-xl bg-amber-500 px-3 py-2.5 text-white hover:bg-amber-400 transition-colors disabled:opacity-30"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </>
      )}

      {/* Done phase */}
      {phase === 'done' && (
        <div className="flex-1 flex flex-col items-center justify-center py-8">
          <div className="text-5xl mb-4">🌟</div>
          <p className="text-text font-medium mb-2">这颗星球已完全点亮！</p>
          <p className="text-sm text-text-muted text-center">
            它现在会在你的宇宙中永远发光。
          </p>
        </div>
      )}
    </div>
  )
}
