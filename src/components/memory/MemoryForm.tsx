import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Share2, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import type { Memory, MemoryDimensions } from '../../types/memory'
import { dimensions as dimensionMetas } from '../../constants/dimensions'
import { useMemoryStore } from '../../store/memoryStore'
import { generateInviteUrl } from '../../lib/share'
import DimensionCard from './DimensionCard'
import EmotionPicker from './EmotionPicker'
import IntensitySlider from './IntensitySlider'
import PhotoUploader from './PhotoUploader'
import PhotoInsight from '../ai/PhotoInsight'
import TagInput from './TagInput'
import ColorPalettePicker from './ColorPalettePicker'
import { Textarea } from '../ui/Textarea'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { lightQualities } from '../../lib/colors'

const flavorSuggestions = ['甜', '咸', '酸', '苦', '鲜', '辣', '清淡', '浓郁', '清爽', '醇厚']
const scentSuggestions = ['花香', '泥土', '海腥味', '草木', '咖啡', '烤面包', '雨后的空气', '木质香', '果香', '书本']
const soundSuggestions = ['鸟鸣', '海浪', '风吹树叶', '雨声', '音乐', '车流', '笑声', '人声嘈杂', '安静', '钟声']
const textureSuggestions = ['细沙', '柔软', '粗糙', '凉爽', '温暖', '湿润', '光滑', '毛绒', '硬质', '丝滑']

export default function MemoryForm() {
  const store = useMemoryStore()
  const { memory } = store

  const filledCount = useMemo(() => {
    let count = 0
    const dims = memory.dimensions
    if (dims.subjectiveFeelings.primaryEmotion || dims.subjectiveFeelings.moodDescription) count++
    if (dims.visual.photos.length > 0 || dims.visual.visualDescription) count++
    if (dims.auditory.sounds.length > 0 || dims.auditory.audioDescription) count++
    if (dims.taste.flavors.length > 0 || dims.taste.tasteDescription) count++
    if (dims.smell.scents.length > 0 || dims.smell.smellDescription) count++
    if (dims.touch.textures.length > 0 || dims.touch.touchDescription) count++
    if (dims.environment.location || dims.environment.environmentDescription) count++
    if (dims.objects.items.length > 0 || dims.objects.objectsDescription) count++
    if (dims.relationships.people.length > 0 || dims.relationships.relationshipDescription) count++
    return count
  }, [memory.dimensions])

  const [invitingPerson, setInvitingPerson] = useState<string | null>(null)
  const [inviteUrl, setInviteUrl] = useState('')
  const [copied, setCopied] = useState(false)

  const handleInvite = async (personName: string) => {
    if (!memory.title.trim()) {
      toast.error('请先给记忆起个名字')
      return
    }
    setInvitingPerson(personName)
    try {
      const peopleNames = d.relationships.people.map((p) => p.name).filter(Boolean)
      const url = await generateInviteUrl(
        memory.id,
        memory.title,
        memory.actualDate,
        d.environment.location,
        d.visual.photos,
        '我', // owner name placeholder - user can customize
        peopleNames
      )
      setInviteUrl(url)
    } catch {
      toast.error('生成邀请链接失败')
    }
  }

  const copyInviteUrl = async () => {
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    toast.success('邀请链接已复制！发送给你的朋友吧')
    setTimeout(() => {
      setCopied(false)
      setInviteUrl('')
      setInvitingPerson(null)
    }, 2000)
  }

  const update = <K extends keyof MemoryDimensions>(key: K, val: Partial<MemoryDimensions[K]>) => {
    store.updateDimension(key, val)
  }

  const d = memory.dimensions

  return (
    <motion.div className="space-y-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Title & Date */}
      <div className="rounded-2xl border border-border bg-bg-card p-5 space-y-4">
        <Input
          placeholder="给这段记忆起个名字..."
          value={memory.title}
          onChange={(e) => store.setTitle(e.target.value)}
          className="text-lg font-medium border-0 bg-transparent px-0 focus:ring-0"
        />
        <div className="flex items-center gap-3">
          <span className="text-sm text-text-muted shrink-0">时间</span>
          <Input
            type="date"
            value={memory.actualDate.slice(0, 10)}
            onChange={(e) => store.setActualDate(e.target.value + 'T00:00:00.000Z')}
            className="w-44"
          />
        </div>
      </div>

      {/* Progress */}
      <div className="flex justify-center py-2">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <div className="flex h-1.5 w-24 overflow-hidden rounded-full bg-bg">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-pink-500 transition-all duration-500"
              style={{ width: `${(filledCount / 9) * 100}%` }}
            />
          </div>
          {filledCount}/9 维度
        </div>
      </div>

      {/* Dimension Cards */}
      {dimensionMetas.map((meta) => {
        const dim = d[meta.key as keyof MemoryDimensions]
        const filled = meta.key === 'subjectiveFeelings'
          ? !!(dim as typeof d.subjectiveFeelings).primaryEmotion || !!(dim as typeof d.subjectiveFeelings).moodDescription
          : meta.key === 'visual'
            ? !!(dim as typeof d.visual).photos.length || !!(dim as typeof d.visual).visualDescription
            : meta.key === 'objects'
              ? !!(dim as typeof d.objects).items.length || !!(dim as typeof d.objects).objectsDescription
              : meta.key === 'relationships'
                ? !!(dim as typeof d.relationships).people.length || !!(dim as typeof d.relationships).relationshipDescription
                : false

        return (
          <DimensionCard key={meta.key} meta={meta} filled={filled}>
            {meta.key === 'subjectiveFeelings' && (
              <div className="space-y-4">
                <EmotionPicker
                  value={d.subjectiveFeelings.primaryEmotion}
                  onChange={(v) => update('subjectiveFeelings', { primaryEmotion: v })}
                />
                <IntensitySlider
                  value={d.subjectiveFeelings.moodIntensity}
                  onChange={(v) => update('subjectiveFeelings', { moodIntensity: v })}
                />
                <TagInput
                  tags={d.subjectiveFeelings.emotionalTags}
                  onChange={(v) => update('subjectiveFeelings', { emotionalTags: v })}
                  placeholder="添加情绪标签..."
                  suggestions={['治愈', '浪漫', '自由', '温暖', '感动', '平静', '释怀', '幸福']}
                />
                <Textarea
                  placeholder="进一步描述你的感受..."
                  value={d.subjectiveFeelings.moodDescription}
                  onChange={(e) => update('subjectiveFeelings', { moodDescription: e.target.value })}
                />
              </div>
            )}

            {meta.key === 'visual' && (
              <div className="space-y-4">
                <label className="text-xs text-text-muted">照片</label>
                <PhotoUploader
                  photos={d.visual.photos}
                  onChange={(v) => update('visual', { photos: v })}
                />
                <PhotoInsight
                  photos={d.visual.photos}
                  onFillField={(dimension, field, _value) => {
                    // Scroll to and expand the target dimension card
                    const el = document.querySelector(`[data-dimension="${dimension}"]`)
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                      // Add a brief highlight pulse
                      el.classList.add('ring-2', 'ring-amber-500/30')
                      setTimeout(() => el.classList.remove('ring-2', 'ring-amber-500/30'), 2000)
                    }
                  }}
                  onSetEmotion={(emotion) => update('subjectiveFeelings', { primaryEmotion: emotion })}
                  onAddTag={(tag) => {
                    if (!memory.tags.includes(tag)) {
                      store.setTags([...memory.tags, tag])
                    }
                  }}
                />
                <label className="text-xs text-text-muted">主色调</label>
                <ColorPalettePicker
                  colors={d.visual.dominantColors}
                  onChange={(v) => update('visual', { dominantColors: v })}
                />
                <label className="text-xs text-text-muted">光线</label>
                <div className="flex flex-wrap gap-1.5">
                  {lightQualities.map((lq) => (
                    <button
                      key={lq}
                      type="button"
                      onClick={() => update('visual', { lightQuality: d.visual.lightQuality === lq ? '' : lq })}
                      className={`rounded-lg px-2.5 py-1 text-xs transition-colors ${
                        d.visual.lightQuality === lq
                          ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                          : 'border border-border text-text-muted hover:text-text hover:border-white/20'
                      }`}
                    >
                      {lq}
                    </button>
                  ))}
                </div>
                <Textarea
                  placeholder="描述你看到的画面..."
                  value={d.visual.visualDescription}
                  onChange={(e) => update('visual', { visualDescription: e.target.value })}
                />
              </div>
            )}

            {meta.key === 'auditory' && (
              <div className="space-y-4">
                <TagInput
                  tags={d.auditory.sounds}
                  onChange={(v) => update('auditory', { sounds: v })}
                  placeholder="你听到了什么声音？"
                  suggestions={soundSuggestions}
                />
                <Input
                  placeholder="当时有没有特别的音乐或旋律？"
                  value={d.auditory.music}
                  onChange={(e) => update('auditory', { music: e.target.value })}
                />
                <Textarea
                  placeholder="描述声音的氛围..."
                  value={d.auditory.audioDescription}
                  onChange={(e) => update('auditory', { audioDescription: e.target.value })}
                />
              </div>
            )}

            {meta.key === 'taste' && (
              <div className="space-y-4">
                <TagInput
                  tags={d.taste.flavors}
                  onChange={(v) => update('taste', { flavors: v })}
                  placeholder="什么味道？"
                  suggestions={flavorSuggestions}
                />
                <TagInput
                  tags={d.taste.foodAndDrinks}
                  onChange={(v) => update('taste', { foodAndDrinks: v })}
                  placeholder="吃了什么？喝了什么？"
                />
                <Textarea
                  placeholder="描述味觉的体验..."
                  value={d.taste.tasteDescription}
                  onChange={(e) => update('taste', { tasteDescription: e.target.value })}
                />
              </div>
            )}

            {meta.key === 'smell' && (
              <div className="space-y-4">
                <TagInput
                  tags={d.smell.scents}
                  onChange={(v) => update('smell', { scents: v })}
                  placeholder="空气里有什么气味？"
                  suggestions={scentSuggestions}
                />
                <Textarea
                  placeholder="描述气味的感受..."
                  value={d.smell.smellDescription}
                  onChange={(e) => update('smell', { smellDescription: e.target.value })}
                />
              </div>
            )}

            {meta.key === 'touch' && (
              <div className="space-y-4">
                <TagInput
                  tags={d.touch.textures}
                  onChange={(v) => update('touch', { textures: v })}
                  placeholder="触摸到了什么质感？"
                  suggestions={textureSuggestions}
                />
                <Input
                  placeholder="温度感受...（如：温暖的夏日午后，凉爽的秋风）"
                  value={d.touch.temperature}
                  onChange={(e) => update('touch', { temperature: e.target.value })}
                />
                <Input
                  placeholder="身体感受...（如：微风拂面，阳光洒在皮肤上）"
                  value={d.touch.physicalSensations}
                  onChange={(e) => update('touch', { physicalSensations: e.target.value })}
                />
                <Textarea
                  placeholder="描述触觉的体验..."
                  value={d.touch.touchDescription}
                  onChange={(e) => update('touch', { touchDescription: e.target.value })}
                />
              </div>
            )}

            {meta.key === 'environment' && (
              <div className="space-y-4">
                <Input
                  placeholder="你在哪里？（如：三亚湾海边，家里阳台上...）"
                  value={d.environment.location}
                  onChange={(e) => update('environment', { location: e.target.value })}
                />
                <Input
                  placeholder="天气如何？（如：晴朗微风，微雨蒙蒙...）"
                  value={d.environment.weather}
                  onChange={(e) => update('environment', { weather: e.target.value })}
                />
                <Input
                  placeholder="环境氛围...（如：傍晚安静的小巷，喧闹的夜市...）"
                  value={d.environment.setting}
                  onChange={(e) => update('environment', { setting: e.target.value })}
                />
                <Textarea
                  placeholder="描述所处的环境..."
                  value={d.environment.environmentDescription}
                  onChange={(e) => update('environment', { environmentDescription: e.target.value })}
                />
              </div>
            )}

            {meta.key === 'objects' && (
              <div className="space-y-4">
                {d.objects.items.map((item, idx) => (
                  <div key={idx} className="flex gap-3 rounded-xl border border-border bg-bg/50 p-3">
                    <div className="flex-1 space-y-2">
                      <Input
                        placeholder="物品名称"
                        value={item.name}
                        onChange={(e) => {
                          const items = [...d.objects.items]
                          items[idx] = { ...items[idx], name: e.target.value }
                          update('objects', { items })
                        }}
                      />
                      <Textarea
                        placeholder="描述这件物品..."
                        value={item.description}
                        onChange={(e) => {
                          const items = [...d.objects.items]
                          items[idx] = { ...items[idx], description: e.target.value }
                          update('objects', { items })
                        }}
                        className="!text-xs"
                        rows={2}
                      />
                    </div>
                    <button
                      onClick={() => update('objects', { items: d.objects.items.filter((_, i) => i !== idx) })}
                      className="shrink-0 text-xs text-red-400 hover:text-red-300"
                    >
                      删除
                    </button>
                  </div>
                ))}
                <button
                  onClick={() =>
                    update('objects', {
                      items: [...d.objects.items, { name: '', description: '' }],
                    })
                  }
                  className="w-full rounded-lg border border-dashed border-border py-2 text-xs text-text-muted hover:text-text hover:border-white/20 transition-colors"
                >
                  + 添加物品
                </button>
                <Textarea
                  placeholder="这些物品对你来说意味着什么？"
                  value={d.objects.objectsDescription}
                  onChange={(e) => update('objects', { objectsDescription: e.target.value })}
                />
              </div>
            )}

            {meta.key === 'relationships' && (
              <div className="space-y-4">
                {d.relationships.people.map((person, idx) => (
                  <div key={idx} className="flex gap-3 rounded-xl border border-border bg-bg/50 p-3">
                    <div className="flex-1 space-y-2">
                      <Input
                        placeholder="名字"
                        value={person.name}
                        onChange={(e) => {
                          const people = [...d.relationships.people]
                          people[idx] = { ...people[idx], name: e.target.value }
                          update('relationships', { people })
                        }}
                      />
                      <select
                        value={person.role}
                        onChange={(e) => {
                          const people = [...d.relationships.people]
                          people[idx] = { ...people[idx], role: e.target.value }
                          update('relationships', { people })
                        }}
                        className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text"
                      >
                        <option value="">关系...</option>
                        <option value="家人">家人</option>
                        <option value="朋友">朋友</option>
                        <option value="伴侣">伴侣</option>
                        <option value="同事">同事</option>
                        <option value="其他">其他</option>
                      </select>
                      <Input
                        placeholder="相处状态...（如：亲密欢笑，安静陪伴...）"
                        value={person.dynamic}
                        onChange={(e) => {
                          const people = [...d.relationships.people]
                          people[idx] = { ...people[idx], dynamic: e.target.value }
                          update('relationships', { people })
                        }}
                      />
                    </div>
                    <div className="flex shrink-0 flex-col gap-1">
                      <button
                        onClick={() =>
                          update('relationships', {
                            people: d.relationships.people.filter((_, i) => i !== idx),
                          })
                        }
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        删除
                      </button>
                      {person.name && (
                        <button
                          onClick={() => handleInvite(person.name)}
                          className="flex items-center gap-1 rounded-lg bg-amber-500/10 px-2 py-1 text-xs text-amber-500 hover:bg-amber-500/20 transition-colors"
                        >
                          <Share2 className="h-3 w-3" />
                          邀请共创
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Invite URL modal */}
                {inviteUrl && (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                    <p className="text-xs text-text-muted mb-2">
                      已生成 <span className="text-amber-500">{invitingPerson}</span> 的共创邀请链接
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 truncate rounded-lg bg-bg px-3 py-2 text-xs text-text-muted">
                        {inviteUrl.slice(0, 50)}...
                      </code>
                      <Button variant="primary" size="sm" onClick={copyInviteUrl}>
                        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        {copied ? '已复制' : '复制'}
                      </Button>
                    </div>
                    <p className="mt-2 text-xs text-text-muted/60">
                      把链接发给 {invitingPerson}，Ta 打开后就能添加自己的视角
                    </p>
                  </div>
                )}

                <button
                  onClick={() =>
                    update('relationships', {
                      people: [...d.relationships.people, { name: '', role: '', dynamic: '' }],
                    })
                  }
                  className="w-full rounded-lg border border-dashed border-border py-2 text-xs text-text-muted hover:text-text hover:border-white/20 transition-colors"
                >
                  + 添加人物
                </button>
                <Textarea
                  placeholder="与这些人的关系给你的感受..."
                  value={d.relationships.relationshipDescription}
                  onChange={(e) => update('relationships', { relationshipDescription: e.target.value })}
                />
              </div>
            )}
          </DimensionCard>
        )
      })}
    </motion.div>
  )
}
