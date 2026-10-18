export interface Playlist {
  id: string
  name: string
  trackIds: string[]
  createdAt: string
  updatedAt: string
}

export const PLAYLISTS_KEY = 'aura-music:playlists:v1'
const STORAGE_VERSION = 1

export function normalizePlaylistName(value: string): string | null {
  const name = value.trim()
  return name && Array.from(name).length <= 40 ? name : null
}

export function validPlaylists(value: unknown, availableIds: readonly string[]): Playlist[] {
  if (!value || typeof value !== 'object') return []
  const data = value as { version?: unknown; playlists?: unknown }
  if (data.version !== STORAGE_VERSION || !Array.isArray(data.playlists)) return []
  const available = new Set(availableIds)
  const seen = new Set<string>()
  const playlists: Playlist[] = []
  for (const item of data.playlists) {
    if (!item || typeof item !== 'object') continue
    const entry = item as Record<string, unknown>
    if (
      typeof entry.id !== 'string' || !entry.id.trim() || seen.has(entry.id) ||
      typeof entry.name !== 'string' || normalizePlaylistName(entry.name) !== entry.name ||
      !Array.isArray(entry.trackIds) ||
      typeof entry.createdAt !== 'string' || !Number.isFinite(Date.parse(entry.createdAt)) ||
      typeof entry.updatedAt !== 'string' || !Number.isFinite(Date.parse(entry.updatedAt))
    ) continue
    seen.add(entry.id)
    playlists.push({
      id: entry.id,
      name: entry.name,
      trackIds: [...new Set(entry.trackIds.filter((id): id is string => typeof id === 'string' && available.has(id)))],
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    })
  }
  return playlists
}

export function readPlaylists(availableIds: readonly string[]): Playlist[] {
  try {
    const saved = globalThis.localStorage?.getItem(PLAYLISTS_KEY)
    return saved ? validPlaylists(JSON.parse(saved), availableIds) : []
  } catch {
    return []
  }
}

export function savePlaylists(playlists: readonly Playlist[]): void {
  try {
    globalThis.localStorage?.setItem(PLAYLISTS_KEY, JSON.stringify({ version: STORAGE_VERSION, playlists }))
  } catch {
    // 儲存空間不可用時，歌單仍可在本次瀏覽期間使用。
  }
}
