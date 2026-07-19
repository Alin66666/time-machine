export interface DimensionMeta {
  key: string
  label: string
  icon: string
  color: string
  placeholder: string
}

export const dimensions: DimensionMeta[] = [
  {
    key: 'subjectiveFeelings',
    label: '主体感受',
    icon: 'Heart',
    color: '#FF6B8A',
    placeholder: '闭上眼睛，回想那一刻...你感受到了什么？是喜悦、宁静，还是某种复杂的情绪？',
  },
  {
    key: 'visual',
    label: '视觉',
    icon: 'Eye',
    color: '#FF9500',
    placeholder: '你看到了什么？天空是什么颜色？光从哪里来？周围有哪些颜色和形状？',
  },
  {
    key: 'auditory',
    label: '听觉',
    icon: 'Ear',
    color: '#4A9EAA',
    placeholder: '你听到了什么声音？是风、海浪、音乐，还是某人的笑声？',
  },
  {
    key: 'taste',
    label: '味觉',
    icon: 'Utensils',
    color: '#FF3B30',
    placeholder: '那时候你尝到了什么味道？是甜、咸、酸、苦，还是某种特别的滋味？',
  },
  {
    key: 'smell',
    label: '嗅觉',
    icon: 'Wind',
    color: '#7BC8A4',
    placeholder: '空气里有什么气味？是花香、泥土味、海腥味，还是某种让你想起某个人的味道？',
  },
  {
    key: 'touch',
    label: '触觉',
    icon: 'Hand',
    color: '#FF8C5A',
    placeholder: '你的皮肤感觉到了什么？是温暖的阳光、凉爽的风，还是某种材质的触感？',
  },
  {
    key: 'environment',
    label: '环境',
    icon: 'MapPin',
    color: '#6B7FD6',
    placeholder: '你在哪里？天气怎么样？周围是什么样子的？是一个安静的角落还是热闹的街头？',
  },
  {
    key: 'objects',
    label: '物件参照',
    icon: 'Package',
    color: '#C8A96E',
    placeholder: '有什么特别的物品在你身边？一本书、一杯咖啡、一件礼物？它们承载了什么故事？',
  },
  {
    key: 'relationships',
    label: '主体关系',
    icon: 'Users',
    color: '#FF6B8A',
    placeholder: '谁和你在一起？你们是什么关系？那一刻你们之间的氛围是怎样的？',
  },
]
