import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Star, Eye, Heart, Ear, Utensils, Wind, Hand, Package, Users, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Memory, Perspective } from '../../types/memory'
import { formatDate } from '../../lib/utils'
import { emotions } from '../../constants/emotions'
import { dimensions as dimensionMetas } from '../../constants/dimensions'
import PhotoCarousel from './PhotoCarousel'

interface MemoryDetailProps {
  memory: Memory
  onToggleFavorite: () => void
  onPhotoDelete?: (index: number) => void
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Heart, Eye, Ear, Utensils, Wind, Hand, MapPin, Package, Users,
}

const fadeIn = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
}

export default function MemoryDetail({ memory, onToggleFavorite, onPhotoDelete }: MemoryDetailProps) {
  const d = memory.dimensions
  const emotionDef = emotions.find((e) => e.id === d.subjectiveFeelings.primaryEmotion)
  const gradient = emotionDef?.gradient || 'from-bg to-bg-card'

  const dimensionContent: Record<string, React.ReactNode> = {
    subjectiveFeelings: (
      <div className="space-y-3">
        {d.subjectiveFeelings.primaryEmotion && emotionDef && (
          <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
            <span className="text-3xl">{emotionDef.emoji}</span>
            <div>
              <p className="text-sm font-medium text-text">{emotionDef.label}</p>
              <div className="mt-1 flex h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-amber-500" style={{ width: `${d.subjectiveFeelings.moodIntensity * 10}%` }} />
              </div>
              <p className="mt-0.5 text-xs text-text-muted">强度 {d.subjectiveFeelings.moodIntensity}/10</p>
            </div>
          </div>
        )}
        {d.subjectiveFeelings.emotionalTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {d.subjectiveFeelings.emotionalTags.map((t) => (
              <span key={t} className="rounded-lg bg-white/5 px-2.5 py-1 text-xs text-text-muted border border-white/5">{t}</span>
            ))}
          </div>
        )}
        {d.subjectiveFeelings.moodDescription && (
          <p className="text-sm leading-relaxed text-text-muted">{d.subjectiveFeelings.moodDescription}</p>
        )}
        {!d.subjectiveFeelings.primaryEmotion && !d.subjectiveFeelings.moodDescription && d.subjectiveFeelings.emotionalTags.length === 0 && (
          <p className="text-xs text-text-muted/40">尚未记录</p>
        )}
      </div>
    ),

    visual: (
      <div className="space-y-4">
        {d.visual.photos.length > 0 && (
          <>
            <PhotoCarousel photos={d.visual.photos} onDelete={onPhotoDelete} />
            {/* Photo wall grid */}
            <div className="grid grid-cols-3 gap-2">
              {d.visual.photos.map((photo, idx) => (
                <div key={idx} className="relative aspect-[4/3] rounded-xl overflow-hidden group">
                  <img src={photo} alt="" className="h-full w-full object-cover" />
                  {onPhotoDelete && (
                    <button
                      onClick={() => onPhotoDelete(idx)}
                      className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center gap-1 bg-red-600/80 hover:bg-red-600 py-1.5 text-xs text-white font-medium transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      删除
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
        {d.visual.dominantColors.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">主色调：</span>
            <div className="flex gap-1.5">
              {d.visual.dominantColors.map((c) => (
                <div key={c} className="h-6 w-6 rounded-full ring-1 ring-white/10" style={{ backgroundColor: c }} title={c} />
              ))}
            </div>
          </div>
        )}
        {d.visual.lightQuality && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">光线：</span>
            <span className="rounded-lg bg-white/5 px-2.5 py-1 text-xs text-text-muted">{d.visual.lightQuality}</span>
          </div>
        )}
        {d.visual.visualDescription && (
          <p className="text-sm leading-relaxed text-text-muted">{d.visual.visualDescription}</p>
        )}
        {d.visual.photos.length === 0 && !d.visual.visualDescription && d.visual.dominantColors.length === 0 && !d.visual.lightQuality && (
          <p className="text-xs text-text-muted/40">尚未记录</p>
        )}
      </div>
    ),

    auditory: (
      <div className="space-y-3">
        {d.auditory.sounds.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {d.auditory.sounds.map((s) => (
              <span key={s} className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-text-muted">{s}</span>
            ))}
          </div>
        )}
        {d.auditory.music && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">🎵</span>
            <span className="text-sm text-text-muted">{d.auditory.music}</span>
          </div>
        )}
        {d.auditory.audioDescription && (
          <p className="text-sm leading-relaxed text-text-muted">{d.auditory.audioDescription}</p>
        )}
        {d.auditory.sounds.length === 0 && !d.auditory.music && !d.auditory.audioDescription && (
          <p className="text-xs text-text-muted/40">尚未记录</p>
        )}
      </div>
    ),

    taste: (
      <div className="space-y-3">
        {d.taste.flavors.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {d.taste.flavors.map((f) => (
              <span key={f} className="rounded-lg bg-white/5 px-2.5 py-1 text-xs text-text-muted border border-white/5">{f}</span>
            ))}
          </div>
        )}
        {d.taste.foodAndDrinks.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {d.taste.foodAndDrinks.map((f) => (
              <span key={f} className="rounded-lg bg-white/5 px-2.5 py-1 text-xs text-amber-500 border border-amber-500/10">🍽️ {f}</span>
            ))}
          </div>
        )}
        {d.taste.tasteDescription && (
          <p className="text-sm leading-relaxed text-text-muted">{d.taste.tasteDescription}</p>
        )}
        {d.taste.flavors.length === 0 && d.taste.foodAndDrinks.length === 0 && !d.taste.tasteDescription && (
          <p className="text-xs text-text-muted/40">尚未记录</p>
        )}
      </div>
    ),

    smell: (
      <div className="space-y-3">
        {d.smell.scents.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {d.smell.scents.map((s) => (
              <span key={s} className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-text-muted">{s}</span>
            ))}
          </div>
        )}
        {d.smell.smellDescription && (
          <p className="text-sm leading-relaxed text-text-muted">{d.smell.smellDescription}</p>
        )}
        {d.smell.scents.length === 0 && !d.smell.smellDescription && (
          <p className="text-xs text-text-muted/40">尚未记录</p>
        )}
      </div>
    ),

    touch: (
      <div className="space-y-3">
        {d.touch.textures.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {d.touch.textures.map((t) => (
              <span key={t} className="rounded-lg bg-white/5 px-2.5 py-1 text-xs text-text-muted border border-white/5">{t}</span>
            ))}
          </div>
        )}
        {d.touch.temperature && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">🌡️ 温度：</span>
            <span className="text-sm text-text-muted">{d.touch.temperature}</span>
          </div>
        )}
        {d.touch.physicalSensations && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">💆 身体感受：</span>
            <span className="text-sm text-text-muted">{d.touch.physicalSensations}</span>
          </div>
        )}
        {d.touch.touchDescription && (
          <p className="text-sm leading-relaxed text-text-muted">{d.touch.touchDescription}</p>
        )}
        {d.touch.textures.length === 0 && !d.touch.temperature && !d.touch.physicalSensations && !d.touch.touchDescription && (
          <p className="text-xs text-text-muted/40">尚未记录</p>
        )}
      </div>
    ),

    environment: (
      <div className="space-y-3">
        {d.environment.location && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">📍</span>
            <span className="text-sm text-text">{d.environment.location}</span>
          </div>
        )}
        {d.environment.weather && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">🌤️</span>
            <span className="text-sm text-text">{d.environment.weather}</span>
          </div>
        )}
        {d.environment.setting && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">🏠</span>
            <span className="text-sm text-text">{d.environment.setting}</span>
          </div>
        )}
        {d.environment.environmentDescription && (
          <p className="text-sm leading-relaxed text-text-muted">{d.environment.environmentDescription}</p>
        )}
        {!d.environment.location && !d.environment.weather && !d.environment.setting && !d.environment.environmentDescription && (
          <p className="text-xs text-text-muted/40">尚未记录</p>
        )}
      </div>
    ),

    objects: (
      <div className="space-y-3">
        {d.objects.items.length > 0 && (
          <div className="space-y-2">
            {d.objects.items.map((item, idx) => (
              <div key={idx} className="rounded-xl bg-white/5 p-3">
                <p className="text-sm font-medium text-text">{item.name || '未命名物品'}</p>
                {item.description && <p className="mt-1 text-xs text-text-muted">{item.description}</p>}
              </div>
            ))}
          </div>
        )}
        {d.objects.objectsDescription && (
          <p className="text-sm leading-relaxed text-text-muted">{d.objects.objectsDescription}</p>
        )}
        {d.objects.items.length === 0 && !d.objects.objectsDescription && (
          <p className="text-xs text-text-muted/40">尚未记录</p>
        )}
      </div>
    ),

    relationships: (
      <div className="space-y-3">
        {d.relationships.people.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {d.relationships.people.map((p, idx) => (
              <div key={idx} className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 text-sm text-amber-500 font-medium">
                  {p.name?.[0] || '?'}
                </div>
                <div>
                  <p className="text-sm text-text">{p.name || '未知'}</p>
                  <p className="text-xs text-text-muted">{p.role}{p.dynamic && ` · ${p.dynamic}`}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        {d.relationships.relationshipDescription && (
          <p className="text-sm leading-relaxed text-text-muted">{d.relationships.relationshipDescription}</p>
        )}
        {d.relationships.people.length === 0 && !d.relationships.relationshipDescription && (
          <p className="text-xs text-text-muted/40">尚未记录</p>
        )}
      </div>
    ),
  }

  return (
    <div className="space-y-4">
      {/* Hero */}
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient}`}>
        <div className="relative z-10 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-medium text-text">{memory.title || '未命名记忆'}</h1>
              <p className="mt-1 text-sm text-text-muted">{formatDate(memory.actualDate)}</p>
              {d.environment.location && (
                <p className="mt-1 text-xs text-text-muted">📍 {d.environment.location}</p>
              )}
              {memory.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {memory.tags.map((t) => (
                    <span key={t} className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-text-muted">{t}</span>
                  ))}
                </div>
              )}
              {memory.aiEnriched.summary && (
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-text-muted italic">{memory.aiEnriched.summary}</p>
              )}
            </div>
            <button onClick={onToggleFavorite} className="rounded-full bg-black/30 p-2 backdrop-blur-sm">
              <Star className={`h-5 w-5 ${memory.isFavorite ? 'fill-amber-500 text-amber-500' : 'text-white/60'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 9 Dimension Cards - same structure as the record form */}
      {dimensionMetas.map((meta) => {
        const Icon = iconMap[meta.icon] || Heart
        const content = dimensionContent[meta.key]
        const hasContent = !String((content as React.ReactElement<any>)?.props?.children ?? '').includes('尚未记录')

        return (
          <motion.div
            key={meta.key}
            className="rounded-2xl border border-border bg-bg-card/80 p-5"
            {...fadeIn}
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: meta.color + '18' }}>
                <span style={{ color: meta.color, display: 'flex' }}>
                  <Icon className="h-[18px] w-[18px]" />
                </span>
              </div>
              <div>
                <span className="text-sm font-medium text-text">{meta.label}</span>
                {hasContent && (
                  <span className="ml-2 inline-flex h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
                )}
              </div>
            </div>
            {content}
          </motion.div>
        )
      })}

      {/* Co-creator Perspectives */}
      {memory.perspectives && memory.perspectives.length > 0 && (
        <motion.div {...fadeIn}>
          <div className="mb-3 flex items-center gap-2">
            <span className="text-lg">🎭</span>
            <h2 className="text-base font-medium text-text">共创视角</h2>
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-500">{memory.perspectives.length} 人参与</span>
          </div>
          <div className="space-y-3">
            {memory.perspectives.map((p: Perspective) => {
              const pEmotion = emotions.find((e) => e.id === p.dimensions.subjectiveFeelings.primaryEmotion)
              const pGradient = pEmotion?.gradient || 'from-bg-card to-bg-card'
              return (
                <motion.div
                  key={p.id}
                  className={`rounded-2xl border border-border bg-gradient-to-br ${pGradient} p-5`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20 text-lg font-medium text-amber-500">
                      {p.authorName?.[0] || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text">{p.authorName}</p>
                      <p className="text-xs text-text-muted">{p.authorRole}</p>
                    </div>
                    {pEmotion && <span className="ml-auto text-2xl">{pEmotion.emoji}</span>}
                  </div>
                  {p.dimensions.visual.photos.length > 0 && (
                    <div className="mb-3">
                      <PhotoCarousel photos={p.dimensions.visual.photos} />
                    </div>
                  )}
                  {p.dimensions.subjectiveFeelings.moodDescription && (
                    <p className="text-sm text-text-muted mb-2">💭 {p.dimensions.subjectiveFeelings.moodDescription}</p>
                  )}
                  {p.dimensions.auditory.audioDescription && (
                    <p className="text-xs text-text-muted mb-1">👂 {p.dimensions.auditory.audioDescription}</p>
                  )}
                  {p.dimensions.taste.tasteDescription && (
                    <p className="text-xs text-text-muted mb-1">👅 {p.dimensions.taste.tasteDescription}</p>
                  )}
                  {p.messageToOwner && (
                    <div className="mt-3 rounded-xl bg-amber-500/5 border border-amber-500/10 p-3">
                      <p className="text-xs text-amber-500/70 mb-1">💌 给邀请者的话</p>
                      <p className="text-sm italic text-text-muted">{p.messageToOwner}</p>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Revisit count */}
      {memory.revisitCount > 0 && (
        <motion.p className="text-center text-xs text-text-muted/40" {...fadeIn}>
          这是你第 {memory.revisitCount} 次重温这段记忆
        </motion.p>
      )}
    </div>
  )
}
