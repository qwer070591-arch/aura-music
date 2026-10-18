export const FAVORITES_KEY = 'aura-music:favorites:v1'

export function validFavoriteIds(value: unknown, availableIds: readonly string[]): string[] {
  if (!Array.isArray(value)) return []
  const available = new Set(availableIds)
  return [...new Set(value.filter((id): id is string => typeof id === 'string' && available.has(id)))]
}

export function readFavoriteIds(availableIds: readonly string[]): string[] {
  try {
    const saved = globalThis.localStorage?.getItem(FAVORITES_KEY)
    return saved ? validFavoriteIds(JSON.parse(saved), availableIds) : []
  } catch {
    return []
  }
}

export function saveFavoriteIds(ids: readonly string[]): void {
  try {
    globalThis.localStorage?.setItem(FAVORITES_KEY, JSON.stringify(ids))
  } catch {
    // 收藏仍可在本次瀏覽期間使用。
  }
}
