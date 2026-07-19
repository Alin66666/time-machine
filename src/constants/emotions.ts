export interface EmotionDef {
  id: string
  label: string
  emoji: string
  color: string
  gradient: string
}

export const emotions: EmotionDef[] = [
  { id: '喜悦', label: '喜悦', emoji: '😊', color: '#FFB74D', gradient: 'from-amber-500/40 to-orange-500/20' },
  { id: '宁静', label: '宁静', emoji: '😌', color: '#4DD0E1', gradient: 'from-teal-500/40 to-cyan-500/20' },
  { id: '感动', label: '感动', emoji: '😭', color: '#F48FB1', gradient: 'from-pink-500/40 to-rose-500/20' },
  { id: '兴奋', label: '兴奋', emoji: '🤩', color: '#EF5350', gradient: 'from-red-500/40 to-orange-400/20' },
  { id: '忧伤', label: '忧伤', emoji: '😢', color: '#7986CB', gradient: 'from-indigo-500/40 to-blue-500/20' },
  { id: '怀念', label: '怀念', emoji: '🥺', color: '#A1887F', gradient: 'from-yellow-600/40 to-amber-600/20' },
  { id: '温暖', label: '温暖', emoji: '🥰', color: '#FF8A65', gradient: 'from-orange-500/40 to-red-400/20' },
  { id: '释然', label: '释然', emoji: '😮‍💨', color: '#81C784', gradient: 'from-emerald-500/40 to-green-500/20' },
]
