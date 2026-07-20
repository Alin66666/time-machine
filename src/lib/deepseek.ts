import { SYSTEM_PROMPT, buildEnrichPrompt } from '../constants/prompts'

const API_BASE = '/api/deepseek/v1/chat/completions'

function getApiKey(): string {
  const raw = localStorage.getItem('tm-settings')
  let apiKey = ''
  if (raw) {
    try {
      apiKey = JSON.parse(raw).apiKey || ''
    } catch { /* ignore */ }
  }
  return apiKey.trim()
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

async function chat(
  messages: ChatMessage[],
  opts: { temperature?: number; maxTokens?: number; jsonMode?: boolean } = {}
): Promise<string> {
  const apiKey = getApiKey()
  const body: Record<string, unknown> = {
    model: 'deepseek-chat',
    messages,
    temperature: opts.temperature ?? 0.7,
    max_tokens: opts.maxTokens ?? 1000,
    stream: false,
  }
  if (opts.jsonMode) {
    body.response_format = { type: 'json_object' }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`
  }

  const res = await fetch(API_BASE, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    if (res.status === 401) throw new Error('AI 服务未配置，请联系作者')
    if (res.status === 402) throw new Error('AI 服务余额不足，请联系作者')
    throw new Error(`API 错误 (${res.status}): ${err}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

function extractJson(text: string): unknown {
  const codeMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
  const raw = codeMatch ? codeMatch[1].trim() : text.trim()
  return JSON.parse(raw)
}

export async function generateSummary(memoryJson: string): Promise<{ summary: string }> {
  const prompt = buildEnrichPrompt(memoryJson, 'summary')
  const text = await chat(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    { jsonMode: true }
  )
  return extractJson(text) as { summary: string }
}

export async function extractThemeTags(memoryJson: string): Promise<{ themeTags: string[] }> {
  const prompt = buildEnrichPrompt(memoryJson, 'themes')
  const text = await chat(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    { jsonMode: true }
  )
  return extractJson(text) as { themeTags: string[] }
}

export async function analyzeMoodArc(memoryJson: string): Promise<{ moodArc: string }> {
  const prompt = buildEnrichPrompt(memoryJson, 'moodArc')
  const text = await chat(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    { jsonMode: true }
  )
  return extractJson(text) as { moodArc: string }
}

export async function enrichMemory(memoryJson: string): Promise<{
  enhancedDescriptions?: Record<string, string>
  nostalgicScore?: number
}> {
  const prompt = buildEnrichPrompt(memoryJson, 'enrich')
  const text = await chat(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    { jsonMode: true }
  )
  return extractJson(text) as Record<string, unknown>
}

export async function generatePrompts(memoryJson: string): Promise<{ suggestedPrompts: string[] }> {
  const prompt = buildEnrichPrompt(memoryJson, 'prompts')
  const text = await chat(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    { jsonMode: true }
  )
  return extractJson(text) as { suggestedPrompts: string[] }
}

export async function runAIEnrichment(
  memoryJson: string,
  modes: string[]
): Promise<{
  summary?: string
  themeTags?: string[]
  moodArc?: string
  suggestedPrompts?: string[]
}> {
  const result: Record<string, unknown> = {}

  for (const mode of modes) {
    try {
      const prompt = buildEnrichPrompt(memoryJson, mode)
      const text = await chat(
        [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        { jsonMode: true }
      )
      const data = extractJson(text) as Record<string, unknown>
      Object.assign(result, data)
    } catch (e) {
      console.error(`AI enrichment failed for mode ${mode}:`, e)
    }
  }

  return result
}

export interface PhotoInsight {
  scene: string
  questions: Array<{
    question: string
    targetDimension: string
    targetField: string
  }>
  suggestedEmotion?: string
  suggestedTags?: string[]
}

export async function analyzePhotos(
  photoCount: number,
  existingTitle?: string,
  existingTags?: string[]
): Promise<PhotoInsight> {
  const text = await chat(
    [
      {
        role: 'system',
        content: `你是一个善于引导回忆的AI助手。用户上传了${photoCount}张照片，你需要根据照片数量和一些已有信息，生成具体、贴切的问题来帮助用户回忆细节。

请提出5-8个具体问题，涉及以下维度（每个维度至少1个问题）：
- 主体感受（心情、情绪）
- 视觉（颜色、光线、画面细节）
- 听觉（声音、音乐）
- 味觉（味道、食物）
- 嗅觉（气味）
- 触觉（温度、质感、身体感受）
- 环境（地点、天气、氛围）
- 物件（照片中可能出现的物品）
- 关系（和谁在一起）

返回纯JSON，不要markdown包裹。`,
      },
      {
        role: 'user',
        content: `我上传了${photoCount}张照片。${existingTitle ? `记忆标题是「${existingTitle}」。` : ''}${existingTags?.length ? `已有标签：${existingTags.join('、')}。` : ''}
请生成引导问题。JSON格式：
{
  "scene": "根据照片数量推测的简要场景描述（1-2句）",
  "questions": [
    { "question": "具体问题", "targetDimension": "subjectiveFeelings|visual|auditory|taste|smell|touch|environment|objects|relationships", "targetField": "对应字段" }
  ],
  "suggestedEmotion": "喜悦|宁静|感动|兴奋|忧伤|怀念|温暖|释然",
  "suggestedTags": ["标签1", "标签2"]
}`,
      },
    ],
    { jsonMode: true, temperature: 0.8 }
  )

  return extractJson(text) as PhotoInsight
}

export async function chatWithContext(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  systemPrompt: string
): Promise<string> {
  const text = await chat(
    [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    ],
    { temperature: 0.9, maxTokens: 600 }
  )
  return text
}

// Memory chain analysis for 记忆回响
export interface MemorySnapshot {
  id: string
  title: string
  date: string
  emotion: string
  emotionLabel: string
  moodDescription: string
  location: string
  people: string[]
  summary: string
  tags: string[]
  photoCount: number
}

export interface ChainNarration {
  theme: string           // overall theme sentence
  memories: Array<{
    id: string
    narration: string     // 2-3 sentence narration for this memory
    transition: string    // connecting phrase to next memory (empty for last)
  }>
  closing: string         // 3-4 sentence closing summary
}

export async function analyzeMemoryChain(
  memories: MemorySnapshot[],
  filterLabel: string
): Promise<ChainNarration> {
  const memList = memories.map((m, i) =>
    `[记忆${i + 1}]
标题：${m.title}
日期：${m.date}
情绪：${m.emotionLabel}
感受（这是用户本人写下的原话）：${m.moodDescription || '未填写'}
地点：${m.location || '未填写'}
同行者：${m.people.length > 0 ? m.people.join('、') : '独自一人'}
标签：${m.tags.join('、')}`
  ).join('\n\n')

  const text = await chat(
    [
      {
        role: 'system',
        content: `你是一个温暖、细腻的记忆伙伴。用户在重温自己人生中关于"${filterLabel}"的${memories.length}段记忆。

这些记忆跨越了时间，但都有着相似的情感底色。你的任务是在这些记忆之间找到隐藏的连线——情绪的变化、人物的来去、地点的转换、心态的成长。

请为每段记忆写一段2-3句话的导语（口语化、有温度、像朋友在身边轻声说）。然后写一段总结（3-4句），概括这些记忆串联起来的"情感轨迹"。

⚠️ 重要规则：
- 严格基于用户提供的事实，绝对不要杜撰任何细节
- 不要猜测谁在做什么动作、手里拿什么、穿什么衣服
- 不要编造具体的对话内容或场景细节
- 如果记忆中没有某个信息，就不要提及它
- "感受"字段是用户本人的原话，要尊重原文
- 只描述你已经知道的事情：时间、地点、情绪、同行者
- 模糊的地方用诗意的留白代替，而不是编造

返回纯JSON，不要markdown包裹。`,
      },
      {
        role: 'user',
        content: `以下是用户的${memories.length}段记忆：

${memList}

请分析这些记忆并为每段写导语。JSON格式：
{
  "theme": "一句话主题概括",
  "memories": [
    {
      "id": "第一段记忆的id",
      "narration": "对第一段记忆的2-3句导语，引导用户进入这段回忆",
      "transition": "连接语，引导到下一段（最后一段不需要transition）"
    },
    ...
  ],
  "closing": "3-4句总结，概括情感轨迹，让用户感受到自己的成长与变化"
}

注意：
- narration要有温度，像朋友在耳边轻声回忆
- transition是连接两段记忆的桥梁（最后一段不需要）
- closing要让人感受到"原来我的开心是这样变化的"这种领悟
- 基于事实，不要杜撰记忆中没有的内容`,
      },
    ],
    { jsonMode: true, temperature: 0.8, maxTokens: 3000 }
  )

  return extractJson(text) as ChainNarration
}

export async function aiSearch(
  query: string,
  memoriesJson: string
): Promise<{ matches: string[]; reason: string }> {
  const text = await chat(
    [
      {
        role: 'system',
        content: `你是一个记忆搜索助手。用户会用自然语言描述想找的记忆，你需要从记忆列表中找出最匹配的。

返回JSON：{"matches": ["id1", "id2", ...], "reason": "为什么匹配"}`,
      },
      {
        role: 'user',
        content: `记忆列表：${memoriesJson}\n\n用户搜索：${query}`,
      },
    ],
    { jsonMode: true, temperature: 0.3 }
  )
  return extractJson(text) as { matches: string[]; reason: string }
}

export async function quickGuess(
  photoCount: number,
  title?: string
): Promise<{ emotion?: string; tags?: string[]; title?: string }> {
  const text = await chat(
    [
      {
        role: 'system',
        content: '根据用户提供的信息，推测可能的情绪和标签。返回JSON：{"emotion": "喜悦|宁静|感动|兴奋|忧伤|怀念|温暖|释然", "tags": ["标签1","标签2","标签3"], "title": "建议的标题（10字以内）"}',
      },
      {
        role: 'user',
        content: `用户上传了${photoCount}张照片。${title ? `可能标题是「${title}」。` : ''}请推测情绪、标签和建议标题。`,
      },
    ],
    { jsonMode: true, temperature: 0.6 }
  )
  return extractJson(text) as { emotion?: string; tags?: string[]; title?: string }
}

export async function fillDimensions(
  photoCount: number,
  freeText: string,
  title?: string
): Promise<{
  title?: string
  emotion?: string
  moodIntensity?: number
  moodDescription?: string
  emotionalTags?: string[]
  visualDescription?: string
  dominantColors?: string[]
  lightQuality?: string
  sounds?: string[]
  music?: string
  audioDescription?: string
  flavors?: string[]
  foodAndDrinks?: string[]
  tasteDescription?: string
  scents?: string[]
  smellDescription?: string
  textures?: string[]
  temperature?: string
  physicalSensations?: string
  touchDescription?: string
  location?: string
  weather?: string
  setting?: string
  environmentDescription?: string
  items?: Array<{ name: string; description: string }>
  objectsDescription?: string
  people?: Array<{ name: string; role: string; dynamic: string }>
  relationshipDescription?: string
  tags?: string[]
  themeTags?: string[]
  summary?: string
}> {
  const text = await chat(
    [
      {
        role: 'system',
        content: `你是一个善于观察和感受的"记忆策展人"。用户上传了${photoCount}张照片并写了一段自由文字。你需要从这些素材中，尽可能多地提取九维度感官信息。

九个维度：
1. 主体感受（primaryEmotion, moodIntensity 1-10, moodDescription, emotionalTags）
2. 视觉（visualDescription, dominantColors[], lightQuality）
3. 听觉（sounds[], music, audioDescription）
4. 味觉（flavors[], foodAndDrinks[], tasteDescription）
5. 嗅觉（scents[], smellDescription）
6. 触觉（textures[], temperature, physicalSensations, touchDescription）
7. 环境（location, weather, setting, environmentDescription）
8. 物件（items[{name,description}], objectsDescription）
9. 关系（people[{name,role,dynamic}], relationshipDescription）

重要原则：
- 只从用户素材中提取，读不到就留空，绝不杜撰
- 从照片内容推断：场景、颜色、光线、人物、物品、天气
- 从自由文字提取：用户明确提到的任何感官信息
- 情绪标签 2-3 个，主题标签 3-5 个
- 生成一段 2-3 句的诗意总结

返回纯JSON，不要markdown包裹。`,
      },
      {
        role: 'user',
        content: `${title ? `记忆标题：「${title}」。` : ''}
我上传了${photoCount}张照片，并写了下面这段话：

"""
${freeText || '（没有额外文字描述）'}
"""

请从照片和文字中提取所有能识别的维度信息。JSON格式：
{
  "emotion": "喜悦|宁静|感动|兴奋|忧伤|怀念|温暖|释然",
  "moodIntensity": 7,
  "moodDescription": "...",
  "emotionalTags": ["...", "..."],
  "visualDescription": "...",
  "dominantColors": ["#xxx", "#xxx"],
  "lightQuality": "...",
  "sounds": ["...", "..."],
  "music": "...",
  "audioDescription": "...",
  "flavors": ["...", "..."],
  "foodAndDrinks": ["...", "..."],
  "tasteDescription": "...",
  "scents": ["...", "..."],
  "smellDescription": "...",
  "textures": ["...", "..."],
  "temperature": "...",
  "physicalSensations": "...",
  "touchDescription": "...",
  "location": "...",
  "weather": "...",
  "setting": "...",
  "environmentDescription": "...",
  "items": [{"name": "...", "description": "..."}],
  "objectsDescription": "...",
  "people": [{"name": "...", "role": "...", "dynamic": "..."}],
  "relationshipDescription": "...",
  "tags": ["...", "..."],
  "themeTags": ["...", "..."],
  "summary": "..."
}`,
      },
    ],
    { jsonMode: true, temperature: 0.7, maxTokens: 3000 }
  )
  return extractJson(text) as Record<string, unknown>
}
