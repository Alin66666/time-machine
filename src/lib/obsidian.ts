import type { Memory } from '../types/memory'
import { emotions } from '../constants/emotions'
import { formatDate } from './utils'

interface ObsidianOptions {
  includePhotos: boolean
  includeAiContent: boolean
}

export function memoryToMarkdown(
  memory: Memory,
  allMemories: Memory[],
  opts: ObsidianOptions = { includePhotos: true, includeAiContent: true }
): { markdown: string; photoFiles: Array<{ name: string; dataUrl: string }> } {
  const d = memory.dimensions
  const emotionDef = emotions.find((e) => e.id === d.subjectiveFeelings.primaryEmotion)
  const photoFiles: Array<{ name: string; dataUrl: string }> = []

  let md = ''

  md += '---\n'
  md += `title: "${memory.title || '未命名记忆'}"\n`
  md += `date: ${memory.actualDate}\n`
  md += `created: ${memory.createdAt}\n`
  if (d.subjectiveFeelings.primaryEmotion) {
    md += `emotion: ${d.subjectiveFeelings.primaryEmotion}\n`
    md += `mood_intensity: ${d.subjectiveFeelings.moodIntensity}\n`
  }
  if (memory.tags.length > 0) {
    md += 'tags:\n'
    memory.tags.forEach((t) => { md += `  - ${t}\n` })
  }
  if (d.environment.location) {
    md += `location: "${d.environment.location}"\n`
  }
  if (d.environment.weather) {
    md += `weather: ${d.environment.weather}\n`
  }
  if (d.environment.setting) {
    md += `setting: ${d.environment.setting}\n`
  }
  if (d.touch.temperature) {
    md += `temperature: ${d.touch.temperature}\n`
  }
  if (d.relationships.people.length > 0) {
    md += 'people:\n'
    d.relationships.people.forEach((p) => {
      md += `  - "[[${p.name}]]"` + (p.role ? ` #${p.role}` : '') + '\n'
    })
  }
  if (memory.revisitCount > 0) {
    md += `revisit_count: ${memory.revisitCount}\n`
  }
  if (memory.isFavorite) {
    md += 'favorite: true\n'
  }
  if (memory.aiEnriched.nostalgicScore) {
    md += `nostalgia_score: ${memory.aiEnriched.nostalgicScore}\n`
  }
  if (opts.includePhotos && d.visual.photos.length > 0) {
    md += 'photos:\n'
    d.visual.photos.forEach((_, i) => {
      const name = `${sanitizeFileName(memory.title)}_photo_${i + 1}.jpg`
      md += `  - ${name}\n`
    })
  }
  md += '---\n\n'

  md += `# ${memory.title || '未命名记忆'}\n\n`

  if (opts.includeAiContent && memory.aiEnriched.summary) {
    md += `> [!quote] AI 诗意总结\n`
    md += `> ${memory.aiEnriched.summary}\n\n`
  }

  md += `📅 **日期**: ${formatDate(memory.actualDate)}\n`
  if (d.environment.location) {
    md += `📍 **地点**: [[${d.environment.location}]]\n`
  }
  if (d.environment.weather) {
    md += `🌤️ **天气**: ${d.environment.weather}\n`
  }
  if (d.environment.setting) {
    md += `🏠 **场景**: ${d.environment.setting}\n`
  }
  md += '\n---\n\n'

  md += '## 👤 主体感受\n\n'
  if (d.subjectiveFeelings.primaryEmotion && emotionDef) {
    md += `**主要情绪**: ${emotionDef.emoji} ${emotionDef.label}\n`
    md += `**强度**: ${'⭐'.repeat(Math.round(d.subjectiveFeelings.moodIntensity / 2))} (${d.subjectiveFeelings.moodIntensity}/10)\n\n`
  }
  if (d.subjectiveFeelings.emotionalTags.length > 0) {
    md += '**情绪标签**: '
    md += d.subjectiveFeelings.emotionalTags.map((t) => `#${t}`).join(', ')
    md += '\n\n'
  }
  if (d.subjectiveFeelings.moodDescription) {
    md += `${d.subjectiveFeelings.moodDescription}\n\n`
  }

  if (hasVisualData(d)) {
    md += '## 👁️ 视觉\n\n'
    if (d.visual.dominantColors.length > 0) {
      md += '**主色调**: '
      md += d.visual.dominantColors.map((c) => `\`${c}\``).join(', ')
      md += '\n\n'
    }
    if (d.visual.lightQuality) {
      md += `**光线**: ${d.visual.lightQuality}\n\n`
    }
    if (opts.includePhotos && d.visual.photos.length > 0) {
      md += '**照片**:\n\n'
      d.visual.photos.forEach((_, i) => {
        const name = `${sanitizeFileName(memory.title)}_photo_${i + 1}.jpg`
        md += `![[${name}]]\n`
      })
      md += '\n'
      d.visual.photos.forEach((dataUrl, i) => {
        photoFiles.push({
          name: `${sanitizeFileName(memory.title)}_photo_${i + 1}.jpg`,
          dataUrl,
        })
      })
    }
    if (d.visual.visualDescription) {
      md += `${d.visual.visualDescription}\n\n`
    }
  }

  if (hasAuditoryData(d)) {
    md += '## 👂 听觉\n\n'
    if (d.auditory.sounds.length > 0) {
      md += '**声音**: '
      md += d.auditory.sounds.map((s) => `\`${s}\``).join(', ')
      md += '\n\n'
    }
    if (d.auditory.music) {
      md += `**音乐**: ${d.auditory.music}\n\n`
    }
    if (d.auditory.audioDescription) {
      md += `${d.auditory.audioDescription}\n\n`
    }
  }

  if (hasTasteData(d)) {
    md += '## 👅 味觉\n\n'
    if (d.taste.flavors.length > 0) {
      md += '**味道**: '
      md += d.taste.flavors.map((f) => `\`${f}\``).join(', ')
      md += '\n\n'
    }
    if (d.taste.foodAndDrinks.length > 0) {
      md += '**食物与饮品**:\n'
      d.taste.foodAndDrinks.forEach((f) => { md += `- 🍽️ ${f}\n` })
      md += '\n'
    }
    if (d.taste.tasteDescription) {
      md += `${d.taste.tasteDescription}\n\n`
    }
  }

  if (hasSmellData(d)) {
    md += '## 👃 嗅觉\n\n'
    if (d.smell.scents.length > 0) {
      md += '**气味**: '
      md += d.smell.scents.map((s) => `\`${s}\``).join(', ')
      md += '\n\n'
    }
    if (d.smell.smellDescription) {
      md += `${d.smell.smellDescription}\n\n`
    }
  }

  if (hasTouchData(d)) {
    md += '## ✋ 触觉\n\n'
    if (d.touch.textures.length > 0) {
      md += '**质感**: '
      md += d.touch.textures.map((t) => `\`${t}\``).join(', ')
      md += '\n\n'
    }
    if (d.touch.temperature) {
      md += `**温度**: ${d.touch.temperature}\n\n`
    }
    if (d.touch.physicalSensations) {
      md += `**身体感受**: ${d.touch.physicalSensations}\n\n`
    }
    if (d.touch.touchDescription) {
      md += `${d.touch.touchDescription}\n\n`
    }
  }

  if (hasEnvironmentData(d)) {
    md += '## 🌍 环境\n\n'
    if (d.environment.environmentDescription) {
      md += `${d.environment.environmentDescription}\n\n`
    }
  }

  if (hasObjectsData(d)) {
    md += '## 📦 物件参照\n\n'
    d.objects.items.forEach((item) => {
      md += `### ${item.name || '未命名物品'}\n`
      if (item.description) {
        md += `${item.description}\n\n`
      }
    })
    if (d.objects.objectsDescription) {
      md += `${d.objects.objectsDescription}\n\n`
    }
  }

  if (hasRelationshipsData(d)) {
    md += '## 🤝 主体关系\n\n'
    d.relationships.people.forEach((p) => {
      md += `- **[[${p.name}]]**`
      if (p.role) md += ` (${p.role})`
      if (p.dynamic) md += ` — ${p.dynamic}`
      md += '\n'
    })
    md += '\n'
    if (d.relationships.relationshipDescription) {
      md += `${d.relationships.relationshipDescription}\n\n`
    }
  }

  if (opts.includeAiContent && memory.aiEnriched.enriched) {
    md += '## 🤖 AI 分析\n\n'
    if (memory.aiEnriched.moodArc) {
      md += `**情感轨迹**: ${memory.aiEnriched.moodArc}\n\n`
    }
    if (memory.aiEnriched.themeTags && memory.aiEnriched.themeTags.length > 0) {
      md += '**AI 主题标签**: '
      md += memory.aiEnriched.themeTags.map((t) => `#${t}`).join(', ')
      md += '\n\n'
    }
    if (memory.aiEnriched.suggestedPrompts && memory.aiEnriched.suggestedPrompts.length > 0) {
      md += '### 引导回忆提示\n'
      memory.aiEnriched.suggestedPrompts.forEach((p) => { md += `- ❓ ${p}\n` })
      md += '\n'
    }
  }

  const related = findRelatedMemories(memory, allMemories)
  if (related.length > 0) {
    md += '## 🔗 相关记忆\n\n'
    related.forEach((r) => {
      md += `- [[${r.title || '未命名记忆'}]]`
      if (r.reason) md += ` — _${r.reason}_`
      md += '\n'
    })
    md += '\n'
  }

  md += '---\n'
  md += `*由 [[美好时光机]] 生成 | ${new Date().toISOString().slice(0, 10)}*\n`
  if (memory.revisitCount > 0) {
    md += `*重温 ${memory.revisitCount} 次*\n`
  }

  return { markdown: md, photoFiles }
}

function findRelatedMemories(
  memory: Memory,
  all: Memory[]
): Array<{ title: string; reason: string }> {
  const related: Array<{ title: string; reason: string }> = []
  const d = memory.dimensions

  for (const other of all) {
    if (other.id === memory.id) continue

    const od = other.dimensions
    const reasons: string[] = []

    if (d.environment.location && od.environment.location === d.environment.location) {
      reasons.push('同地点')
    }

    if (d.subjectiveFeelings.primaryEmotion && od.subjectiveFeelings.primaryEmotion === d.subjectiveFeelings.primaryEmotion) {
      reasons.push('同情绪')
    }

    const sharedPeople = d.relationships.people.filter((p) =>
      od.relationships.people.some((op) => op.name === p.name)
    )
    if (sharedPeople.length > 0) {
      reasons.push(`共同人物: ${sharedPeople.map((p) => p.name).join(', ')}`)
    }

    const sharedTags = memory.tags.filter((t) => other.tags.includes(t))
    if (sharedTags.length > 0) {
      reasons.push(`共同标签: ${sharedTags.join(', ')}`)
    }

    if (reasons.length > 0) {
      related.push({ title: other.title, reason: reasons[0] })
    }
  }

  return related.slice(0, 10)
}

export function downloadAllAsMarkdown(
  memories: Memory[],
  opts: ObsidianOptions = { includePhotos: true, includeAiContent: true }
) {
  memories.forEach((memory, i) => {
    const { markdown } = memoryToMarkdown(memory, memories, opts)
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const name = sanitizeFileName(memory.title) || `memory_${i + 1}`
    a.download = `${name}.md`
    a.click()
    URL.revokeObjectURL(url)
  })
}

export async function writeToObsidianVault(
  memories: Memory[],
  opts: ObsidianOptions = { includePhotos: true, includeAiContent: true }
): Promise<{ success: boolean; message: string }> {
  if (!('showDirectoryPicker' in window)) {
    return {
      success: false,
      message: '你的浏览器不支持 File System Access API。请使用 Chrome 或 Edge 浏览器。',
    }
  }

  try {
    const dirHandle = await (window as any).showDirectoryPicker({
      mode: 'readwrite',
    })

    const memoryDirName = '美好时光机记忆'
    let memoryDir: FileSystemDirectoryHandle
    try {
      memoryDir = await dirHandle.getDirectoryHandle(memoryDirName, { create: true })
    } catch {
      memoryDir = await dirHandle.getDirectoryHandle(memoryDirName)
    }

    let photosDir: FileSystemDirectoryHandle
    try {
      photosDir = await dirHandle.getDirectoryHandle('photos', { create: true })
    } catch {
      photosDir = await dirHandle.getDirectoryHandle('photos')
    }

    let written = 0
    let photoCount = 0

    for (const memory of memories) {
      const { markdown, photoFiles } = memoryToMarkdown(memory, memories, opts)
      const fileName = `${sanitizeFileName(memory.title) || `memory_${memory.id.slice(0, 8)}`}.md`

      try {
        const fileHandle = await memoryDir.getFileHandle(fileName, { create: true })
        const writable = await fileHandle.createWritable()
        await writable.write(markdown)
        await writable.close()
        written++
      } catch (e) {
        console.error(`Failed to write ${fileName}:`, e)
      }

      for (const photo of photoFiles) {
        try {
          const base64Data = photo.dataUrl.split(',')[1]
          const binaryStr = atob(base64Data)
          const bytes = new Uint8Array(binaryStr.length)
          for (let j = 0; j < binaryStr.length; j++) {
            bytes[j] = binaryStr.charCodeAt(j)
          }
          const fileHandle = await photosDir.getFileHandle(photo.name, { create: true })
          const writable = await fileHandle.createWritable()
          await writable.write(bytes)
          await writable.close()
          photoCount++
        } catch (e) {
          console.error(`Failed to write photo ${photo.name}:`, e)
        }
      }
    }

    return {
      success: true,
      message: `已写入 ${written} 篇笔记 + ${photoCount} 张照片到 Obsidian Vault`,
    }
  } catch (e: any) {
    if (e.name === 'AbortError') {
      return { success: false, message: '已取消' }
    }
    return { success: false, message: `写入失败: ${e.message || '未知错误'}` }
  }
}

function sanitizeFileName(name: string): string {
  return name
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, '_')
    .slice(0, 80) || 'untitled'
}

function hasVisualData(d: Memory['dimensions']): boolean {
  return d.visual.photos.length > 0 || d.visual.dominantColors.length > 0 || !!d.visual.lightQuality || !!d.visual.visualDescription
}
function hasAuditoryData(d: Memory['dimensions']): boolean {
  return d.auditory.sounds.length > 0 || !!d.auditory.music || !!d.auditory.audioDescription
}
function hasTasteData(d: Memory['dimensions']): boolean {
  return d.taste.flavors.length > 0 || d.taste.foodAndDrinks.length > 0 || !!d.taste.tasteDescription
}
function hasSmellData(d: Memory['dimensions']): boolean {
  return d.smell.scents.length > 0 || !!d.smell.smellDescription
}
function hasTouchData(d: Memory['dimensions']): boolean {
  return d.touch.textures.length > 0 || !!d.touch.temperature || !!d.touch.physicalSensations || !!d.touch.touchDescription
}
function hasEnvironmentData(d: Memory['dimensions']): boolean {
  return !!d.environment.environmentDescription
}
function hasObjectsData(d: Memory['dimensions']): boolean {
  return d.objects.items.length > 0 || !!d.objects.objectsDescription
}
function hasRelationshipsData(d: Memory['dimensions']): boolean {
  return d.relationships.people.length > 0 || !!d.relationships.relationshipDescription
}
