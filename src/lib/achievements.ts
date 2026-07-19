import { db } from '../db'
import type { EarnedBadge, Memory } from '../types/memory'
import { allBadges } from '../constants/achievements'

export async function checkAndUnlock(
  allMemories: Memory[],
  currentMemory?: Memory
): Promise<EarnedBadge[]> {
  const earnedIds = await db.achievements.toCollection().primaryKeys()
  const earnedSet = new Set(earnedIds)
  const ctx = { allMemories, currentMemory }
  const newlyUnlocked: EarnedBadge[] = []

  for (const badge of allBadges) {
    if (earnedSet.has(badge.id)) continue
    try {
      if (badge.check(ctx)) {
        const earned: EarnedBadge = {
          id: badge.id,
          earnedAt: new Date().toISOString(),
        }
        await db.achievements.put(earned)
        newlyUnlocked.push(earned)
        earnedSet.add(badge.id)
      }
    } catch {
      // Skip badges whose check throws
    }
  }

  return newlyUnlocked
}

export function getBadgeDef(id: string) {
  return allBadges.find((b) => b.id === id)
}
