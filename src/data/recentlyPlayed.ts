export const RECENTLY_PLAYED_KEY = 'aura-music:recently-played:v1'
export const RECENTLY_PLAYED_LIMIT = 5

export function validRecentTrackIds(value: unknown, availableIds: readonly string[]): string[] {
  if (!Array.isArray(value)) return []
  const available = new Set(availableIds)
  const seen = new Set<string>()
  const ids: string[] = []
  for (const item of value) {
    if (typeof item !== 'string' || !available.has(item) || seen.has(item)) continue
    seen.add(item)
    ids.push(item)
    if (ids.length === RECENTLY_PLAYED_LIMIT) break
  }
  return ids
}

export function readRecentTrackIds(availableIds: readonly string[]): string[] {
  try {
    const saved = globalThis.localStorage?.getItem(RECENTLY_PLAYED_KEY)
    return saved ? validRecentTrackIds(JSON.parse(saved), availableIds) : []
  } catch {
    return []
  }
}

export function saveRecentTrackIds(ids: readonly string[]) {
  try {
    globalThis.localStorage?.setItem(RECENTLY_PLAYED_KEY, JSON.stringify(ids))
  } catch {
    // Playback and in-memory history still work if storage is unavailable.
  }
}
