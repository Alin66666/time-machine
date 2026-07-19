import type { BadgeDef, Memory } from '../types/memory'

function countFilledDimensions(m: Memory): number {
  let count = 0
  const d = m.dimensions
  if (d.subjectiveFeelings.primaryEmotion || d.subjectiveFeelings.moodDescription) count++
  if (d.visual.photos.length > 0 || d.visual.visualDescription) count++
  if (d.auditory.sounds.length > 0 || d.auditory.music || d.auditory.audioDescription) count++
  if (d.taste.flavors.length > 0 || d.taste.foodAndDrinks.length > 0 || d.taste.tasteDescription) count++
  if (d.smell.scents.length > 0 || d.smell.smellDescription) count++
  if (d.touch.textures.length > 0 || d.touch.temperature || d.touch.physicalSensations || d.touch.touchDescription) count++
  if (d.environment.location || d.environment.weather || d.environment.setting || d.environment.environmentDescription) count++
  if (d.objects.items.length > 0 || d.objects.objectsDescription) count++
  if (d.relationships.people.length > 0 || d.relationships.relationshipDescription) count++
  return count
}

function longestStreak(memories: Memory[]): number {
  if (memories.length === 0) return 0
  const dates = memories
    .map((m) => m.actualDate.split('T')[0])
    .filter(Boolean)
  const unique = [...new Set(dates)].sort()
  if (unique.length === 0) return 0

  let max = 1
  let cur = 1
  for (let i = 1; i < unique.length; i++) {
    const prev = new Date(unique[i - 1])
    const curr = new Date(unique[i])
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
    if (diff === 1) {
      cur++
      if (cur > max) max = cur
    } else {
      cur = 1
    }
  }
  return max
}

function maxDaysInMonth(memories: Memory[]): number {
  const monthMap = new Map<string, Set<number>>()
  for (const m of memories) {
    const d = new Date(m.actualDate)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (!monthMap.has(key)) monthMap.set(key, new Set())
    monthMap.get(key)!.add(d.getDate())
  }
  let max = 0
  for (const days of monthMap.values()) {
    if (days.size > max) max = days.size
  }
  return max
}

function mostMemoriesInMonth(memories: Memory[]): number {
  const monthMap = new Map<string, number>()
  for (const m of memories) {
    const d = new Date(m.actualDate)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    monthMap.set(key, (monthMap.get(key) || 0) + 1)
  }
  let max = 0
  for (const count of monthMap.values()) {
    if (count > max) max = count
  }
  return max
}

export const allBadges: BadgeDef[] = [
  // === Bronze ===
  {
    id: 'first-memory',
    name: '初次记录',
    description: '创建第一条记忆',
    emoji: '🎬',
    tier: 'bronze',
    check: (ctx) => ctx.allMemories.length >= 1,
  },
  {
    id: 'first-photo',
    name: '光影捕手',
    description: '第一次上传照片',
    emoji: '📸',
    tier: 'bronze',
    check: (ctx) => ctx.allMemories.some((m) => m.dimensions.visual.photos.length > 0),
  },
  {
    id: 'multi-dimension',
    name: '多维记录者',
    description: '单条记忆填写 3 个以上维度',
    emoji: '🎨',
    tier: 'bronze',
    check: (ctx) => {
      if (ctx.currentMemory) return countFilledDimensions(ctx.currentMemory) >= 3
      return ctx.allMemories.some((m) => countFilledDimensions(m) >= 3)
    },
  },
  {
    id: 'first-ai',
    name: 'AI 初体验',
    description: '首次使用 AI 润色',
    emoji: '🤖',
    tier: 'bronze',
    check: (ctx) => ctx.allMemories.some((m) => m.aiEnriched.enriched),
  },
  {
    id: 'emotion-explorer',
    name: '情绪探索者',
    description: '记录过 3 种不同情绪',
    emoji: '😊',
    tier: 'bronze',
    check: (ctx) => {
      const emotions = new Set(
        ctx.allMemories
          .map((m) => m.dimensions.subjectiveFeelings.primaryEmotion)
          .filter(Boolean)
      )
      return emotions.size >= 3
    },
  },

  // === Silver ===
  {
    id: 'ten-memories',
    name: '十段时光',
    description: '累计记录 10 条记忆',
    emoji: '📚',
    tier: 'silver',
    check: (ctx) => ctx.allMemories.length >= 10,
  },
  {
    id: 'full-dimension',
    name: '全维度大师',
    description: '单条记忆填写全部 9 个维度',
    emoji: '🏆',
    tier: 'silver',
    check: (ctx) => {
      if (ctx.currentMemory) return countFilledDimensions(ctx.currentMemory) >= 9
      return ctx.allMemories.some((m) => countFilledDimensions(m) >= 9)
    },
  },
  {
    id: 'three-day-streak',
    name: '连续三天',
    description: '连续 3 天都有记录',
    emoji: '🔥',
    tier: 'silver',
    check: (ctx) => longestStreak(ctx.allMemories) >= 3,
  },
  {
    id: 'five-locations',
    name: '足迹遍布',
    description: '在 5 个不同地点记录',
    emoji: '📍',
    tier: 'silver',
    check: (ctx) => {
      const locs = new Set(
        ctx.allMemories
          .map((m) => m.dimensions.environment.location)
          .filter(Boolean)
      )
      return locs.size >= 5
    },
  },
  {
    id: 'five-people',
    name: '社交达人',
    description: '记忆中出现 5 个不同的人',
    emoji: '👥',
    tier: 'silver',
    check: (ctx) => {
      const people = new Set<string>()
      for (const m of ctx.allMemories) {
        for (const p of m.dimensions.relationships.people) {
          if (p.name) people.add(p.name)
        }
      }
      return people.size >= 5
    },
  },

  // === Gold ===
  {
    id: 'fifty-memories',
    name: '半百记忆',
    description: '累计记录 50 条记忆',
    emoji: '💎',
    tier: 'gold',
    check: (ctx) => ctx.allMemories.length >= 50,
  },
  {
    id: 'ten-full',
    name: '十全十美',
    description: '10 条全维度记忆',
    emoji: '⭐',
    tier: 'gold',
    check: (ctx) => ctx.allMemories.filter((m) => countFilledDimensions(m) >= 9).length >= 10,
  },
  {
    id: 'twenty-month',
    name: '高产月',
    description: '单月记录 20 条记忆',
    emoji: '📅',
    tier: 'gold',
    check: (ctx) => mostMemoriesInMonth(ctx.allMemories) >= 20,
  },
  {
    id: 'thirty-revisits',
    name: '常回家看看',
    description: '累计重温 30 次',
    emoji: '🔄',
    tier: 'gold',
    check: (ctx) => ctx.allMemories.reduce((sum, m) => sum + m.revisitCount, 0) >= 30,
  },
  {
    id: 'ten-favorites',
    name: '偏爱收藏',
    description: '收藏 10 条记忆',
    emoji: '❤️',
    tier: 'gold',
    check: (ctx) => ctx.allMemories.filter((m) => m.isFavorite).length >= 10,
  },

  // === Diamond ===
  {
    id: 'hundred-memories',
    name: '百段传奇',
    description: '累计记录 100 条记忆',
    emoji: '👑',
    tier: 'diamond',
    check: (ctx) => ctx.allMemories.length >= 100,
  },
  {
    id: 'full-month',
    name: '全勤月',
    description: '一个月内每天都有记录（30天）',
    emoji: '🗓️',
    tier: 'diamond',
    check: (ctx) => maxDaysInMonth(ctx.allMemories) >= 30,
  },
  {
    id: 'fifty-full',
    name: '完美主义',
    description: '50 条全维度记忆',
    emoji: '🌟',
    tier: 'diamond',
    check: (ctx) => ctx.allMemories.filter((m) => countFilledDimensions(m) >= 9).length >= 50,
  },
]
