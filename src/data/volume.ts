export const VOLUME_KEY = 'aura-music:volume:v1'
export const DEFAULT_VOLUME = 0.7

export interface VolumePreference {
  volume: number
  isMuted: boolean
  lastNonZeroVolume: number
}

const defaults = (): VolumePreference => ({
  volume: DEFAULT_VOLUME,
  isMuted: false,
  lastNonZeroVolume: DEFAULT_VOLUME,
})

export function readVolumePreference(): VolumePreference {
  try {
    const saved = globalThis.localStorage?.getItem(VOLUME_KEY)
    if (!saved) return defaults()
    const value: unknown = JSON.parse(saved)
    if (!value || typeof value !== 'object') return defaults()
    const data = value as Record<string, unknown>
    if (
      data.version !== 1 ||
      typeof data.volume !== 'number' || !Number.isFinite(data.volume) ||
      data.volume < 0 || data.volume > 1 ||
      typeof data.isMuted !== 'boolean' ||
      typeof data.lastNonZeroVolume !== 'number' || !Number.isFinite(data.lastNonZeroVolume) ||
      data.lastNonZeroVolume <= 0 || data.lastNonZeroVolume > 1
    ) return defaults()
    return {
      volume: data.volume,
      isMuted: data.isMuted || data.volume === 0,
      lastNonZeroVolume: data.lastNonZeroVolume,
    }
  } catch {
    return defaults()
  }
}

export function saveVolumePreference(preference: VolumePreference): void {
  try {
    globalThis.localStorage?.setItem(VOLUME_KEY, JSON.stringify({ version: 1, ...preference }))
  } catch {
    // Volume continues to work in memory if storage is unavailable.
  }
}
