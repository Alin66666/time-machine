import { useRef, useEffect, useCallback } from 'react'
import { Volume2, VolumeX, SkipBack, SkipForward, Shuffle, ListMusic } from 'lucide-react'
import { useMusicStore } from '../../store/musicStore'
import { cn } from '../../lib/utils'

export default function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const store = useMusicStore()
  const { tracks, currentId, volume, playing, shuffle } = store

  const currentTrack = tracks.find((t) => t.id === currentId)

  const handleEnded = useCallback(() => {
    store.next()
  }, [store])

  useEffect(() => {
    if (!currentTrack) return

    const audio = new Audio(currentTrack.dataUrl)
    audio.loop = false
    audio.volume = volume
    audio.addEventListener('ended', handleEnded)
    audioRef.current = audio

    if (playing) {
      audio.play().catch(() => store.setPlaying(false))
    }

    return () => {
      audio.removeEventListener('ended', handleEnded)
      audio.pause()
      audio.src = ''
      audioRef.current = null
    }
  }, [currentId])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.play().catch(() => store.setPlaying(false))
    } else {
      audio.pause()
    }
  }, [playing])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  useEffect(() => {
    store.loadTracks()
  }, [])

  if (tracks.length === 0) return null

  const shortName = currentTrack
    ? (currentTrack.fileName.length > 16 ? currentTrack.fileName.slice(0, 14) + '...' : currentTrack.fileName)
    : ''

  return (
    <div className="fixed bottom-24 right-6 z-50 flex items-center gap-2 rounded-full border border-border bg-bg-card/90 backdrop-blur-xl px-3 py-2 shadow-lg select-none">
      <span className="text-xs text-text-muted/60 max-w-[100px] truncate" title={currentTrack?.fileName}>
        {tracks.length > 1 && (
          <span className="mr-1 text-amber-500/60">
            {tracks.findIndex((t) => t.id === currentId) + 1}/{tracks.length}
          </span>
        )}
        {shortName}
      </span>

      {tracks.length > 1 && (
        <button
          onClick={() => store.prev()}
          className="text-text-muted hover:text-text transition-colors"
          title="上一首"
        >
          <SkipBack className="h-3.5 w-3.5" />
        </button>
      )}

      <button
        onClick={() => store.togglePlay()}
        className={cn(
          'flex h-7 w-7 items-center justify-center rounded-full transition-all',
          playing
            ? 'bg-amber-500/20 text-amber-500'
            : 'bg-white/5 text-text-muted hover:text-text'
        )}
        title={playing ? '暂停' : '播放'}
      >
        <ListMusic className={cn('h-3.5 w-3.5', playing && 'animate-pulse')} />
      </button>

      {tracks.length > 1 && (
        <button
          onClick={() => store.next()}
          className="text-text-muted hover:text-text transition-colors"
          title="下一首"
        >
          <SkipForward className="h-3.5 w-3.5" />
        </button>
      )}

      {tracks.length > 1 && (
        <button
          onClick={() => store.setShuffle(!shuffle)}
          className={cn(
            'text-xs transition-colors',
            shuffle ? 'text-amber-500' : 'text-text-muted hover:text-text'
          )}
          title={shuffle ? '随机播放中' : '顺序播放'}
        >
          <Shuffle className="h-3.5 w-3.5" />
        </button>
      )}

      <div className="flex items-center gap-1">
        <button
          onClick={() => store.setVolume(volume > 0 ? 0 : 0.3)}
          className="text-text-muted hover:text-text transition-colors"
          title={volume > 0 ? '静音' : '取消静音'}
        >
          {volume > 0 ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={(e) => store.setVolume(parseFloat(e.target.value))}
          className="h-1 w-14 accent-amber-500"
          title={`音量: ${Math.round(volume * 100)}%`}
        />
      </div>
    </div>
  )
}
