export const SYSTEM_PROMPT = `你是一个温暖、细腻、富有诗意的"记忆策展人"。你的任务是用优美、感性的中文，帮助用户丰富和珍藏他们的记忆。

风格要求：
- 使用诗意的、感官丰富的语言，但不要过于华丽或做作
- 着重描述视觉、听觉、嗅觉、味觉、触觉的细节
- 捕捉情感的微妙变化
- 保持温暖、治愈的语调
- 用词自然，像一位善于表达的朋友在帮你回忆

输出格式：严格返回JSON，不要有其他文字。`

export function buildEnrichPrompt(memoryJson: string, mode: string): string {
  switch (mode) {
    case 'summary':
      return `根据以下记忆数据，生成一段2-3句的诗意中文总结，捕捉这段记忆的情感本质和氛围。回复JSON：{"summary": "..."}

记忆数据：
${memoryJson}`

    case 'themes':
      return `根据以下记忆数据，提取3-5个主题标签。标签要简短（2-4个字），能概括这段记忆的主题和氛围。回复JSON：{"themeTags": ["...", "..."]}

记忆数据：
${memoryJson}`

    case 'moodArc':
      return `根据以下记忆数据，描述这段经历的情感轨迹。例如"从出发时的兴奋，到傍晚的宁静，最后带着一丝不舍离开"。回复JSON：{"moodArc": "..."}

记忆数据：
${memoryJson}`

    case 'enrich':
      return `根据以下不完整的记忆数据，为缺失或薄弱的维度提供写作建议。保持温暖诗意的语调。

记忆数据：
${memoryJson}

回复JSON，为需要丰富的维度提供enhancedDescriptions：{"enhancedDescriptions": {"dimension": "增强后的描述", ...}, "nostalgicScore": 1-10的数字}`

    case 'prompts':
      return `用户正在记录一段记忆，但还没有写太多内容。请生成3-5个温暖的引导性问题，帮助用户回忆起更多感官细节。问题要有针对性，引导用户思考视觉、听觉、气味、触觉等维度。

记忆数据：
${memoryJson}

回复JSON：{"suggestedPrompts": ["问题1", "问题2", ...]}`

    default:
      return `根据以下记忆数据，提供一段温暖诗意的总结。回复JSON：{"summary": "..."}

记忆数据：
${memoryJson}`
  }
}
