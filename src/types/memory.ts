// ============================================================
// 美好时光机 — Core Type Definitions
// ============================================================

export interface Memory {
  id: string;
  title: string;
  actualDate: string;   // ISO 8601 — when the event occurred
  createdAt: string;     // ISO 8601 — when recorded
  updatedAt: string;     // ISO 8601 — last modified

  dimensions: MemoryDimensions;
  aiEnriched: AIEnriched;
  perspectives: Perspective[];  // co-creator contributions

  tags: string[];
  isFavorite: boolean;
  revisitCount: number;
  lastRevisitedAt: string | null;
}

// === Co-creation Perspectives ===

export interface Perspective {
  id: string;
  authorName: string;
  authorRole: string;       // "朋友", "家人", etc.
  createdAt: string;
  dimensions: MemoryDimensions;
  aiEnriched: AIEnriched;
  tags: string[];
  favoritePhotoIndex?: number;
  messageToOwner?: string;
}

// === Nine Dimensions ===

export interface MemoryDimensions {
  subjectiveFeelings: SubjectiveFeelings;
  visual: Visual;
  auditory: Auditory;
  taste: Taste;
  smell: Smell;
  touch: Touch;
  environment: Environment;
  objects: Objects;
  relationships: Relationships;
}

export interface SubjectiveFeelings {
  primaryEmotion: string;
  moodIntensity: number;      // 1-10
  moodDescription: string;
  emotionalTags: string[];
}

export interface Visual {
  photos: string[];           // base64 data URLs
  dominantColors: string[];   // hex color strings
  lightQuality: string;
  visualDescription: string;
}

export interface Auditory {
  sounds: string[];
  music: string;
  audioDescription: string;
}

export interface Taste {
  flavors: string[];
  foodAndDrinks: string[];
  tasteDescription: string;
}

export interface Smell {
  scents: string[];
  smellDescription: string;
}

export interface Touch {
  textures: string[];
  temperature: string;
  physicalSensations: string;
  touchDescription: string;
}

export interface Environment {
  location: string;
  weather: string;
  setting: string;
  environmentDescription: string;
}

export interface SignificantItem {
  name: string;
  description: string;
  photo?: string;
}

export interface Objects {
  items: SignificantItem[];
  objectsDescription: string;
}

export interface PersonPresent {
  name: string;
  role: string;        // "朋友", "家人", "伴侣", "同事", "其他"
  dynamic: string;      // "亲密", "欢笑", "安静陪伴"
}

export interface Relationships {
  people: PersonPresent[];
  relationshipDescription: string;
}

// === AI Enrichment ===

export interface AIEnriched {
  enriched: boolean;
  summary?: string;
  themeTags?: string[];
  moodArc?: string;
  nostalgicScore?: number;
  enhancedDescriptions?: Record<string, string>;
  relatedMemoryIds?: string[];
  suggestedPrompts?: string[];
}

// === Settings ===

export interface AppSettings {
  apiKey: string;
  theme: 'auto' | 'light' | 'dark';
}

// === Co-creation Share Payloads ===

export interface SharePayload {
  memoryId: string;
  memoryTitle: string;
  memoryDate: string;
  location: string;
  photos: string[];
  ownerName: string;
  existingPeople: string[];
}

export interface ResponsePayload {
  memoryId: string;
  perspective: Perspective;
}

export type ImportMode = 'owner' | 'co-creator'

// === Fish Crackers & NianNian ===

export interface FishCrackerRecord {
  id: string
  amount: number
  memoryId?: string
  earnedAt: string
}

export interface NianNianState {
  id: string
  totalFishCrackers: number
  level: number
}
