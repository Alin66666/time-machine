import type { SharePayload, ResponsePayload, Perspective, MemoryDimensions } from '../types/memory'

const PREFIX_INVITE = 'tm-invite-'
const PREFIX_RESPONSE = 'tm-response-'
const MAX_PHOTO_SIZE = 800

function compressPhotoForShare(base64: string): Promise<string> {
  return new Promise<string>((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let { width, height } = img
      if (width > MAX_PHOTO_SIZE) {
        height = (height * MAX_PHOTO_SIZE) / width
        width = MAX_PHOTO_SIZE
      }
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', 0.4))
    }
    img.src = base64
  })
}

function encodeBase64(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
}

function decodeBase64(str: string): string {
  return decodeURIComponent(escape(atob(str)))
}

export async function generateInviteUrl(
  memoryId: string,
  memoryTitle: string,
  memoryDate: string,
  location: string,
  photos: string[],
  ownerName: string,
  existingPeople: string[]
): Promise<string> {
  const compressedPhotos = await Promise.all(
    photos.slice(0, 3).map(compressPhotoForShare)
  )

  const payload: SharePayload = {
    memoryId,
    memoryTitle,
    memoryDate,
    location,
    photos: compressedPhotos,
    ownerName,
    existingPeople,
  }

  const json = JSON.stringify(payload)
  const encoded = encodeBase64(json)
  return `${window.location.origin}/cocreate#${PREFIX_INVITE}${encoded}`
}

export function parseInviteFromHash(hash: string): SharePayload | null {
  const raw = hash.replace(/^#\/?/, '')
  if (!raw.startsWith(PREFIX_INVITE)) return null
  try {
    const encoded = raw.slice(PREFIX_INVITE.length)
    const json = decodeBase64(encoded)
    return JSON.parse(json) as SharePayload
  } catch {
    return null
  }
}

export function isInviteUrl(hash: string): boolean {
  return hash.includes(PREFIX_INVITE)
}

export function generateResponseUrl(memoryId: string, perspective: Perspective): string {
  const payload: ResponsePayload = { memoryId, perspective }
  const json = JSON.stringify(payload)
  const encoded = encodeBase64(json)
  return `${window.location.origin}/cocreate#${PREFIX_RESPONSE}${encoded}`
}

export function parseResponseFromHash(hash: string): ResponsePayload | null {
  const raw = hash.replace(/^#\/?/, '')
  if (!raw.startsWith(PREFIX_RESPONSE)) return null
  try {
    const encoded = raw.slice(PREFIX_RESPONSE.length)
    const json = decodeBase64(encoded)
    return JSON.parse(json) as ResponsePayload
  } catch {
    return null
  }
}

export function isResponseUrl(hash: string): boolean {
  return hash.includes(PREFIX_RESPONSE)
}

export function emptyDimensions(): MemoryDimensions {
  return {
    subjectiveFeelings: { primaryEmotion: '', moodIntensity: 5, moodDescription: '', emotionalTags: [] },
    visual: { photos: [], dominantColors: [], lightQuality: '', visualDescription: '' },
    auditory: { sounds: [], music: '', audioDescription: '' },
    taste: { flavors: [], foodAndDrinks: [], tasteDescription: '' },
    smell: { scents: [], smellDescription: '' },
    touch: { textures: [], temperature: '', physicalSensations: '', touchDescription: '' },
    environment: { location: '', weather: '', setting: '', environmentDescription: '' },
    objects: { items: [], objectsDescription: '' },
    relationships: { people: [], relationshipDescription: '' },
  }
}
