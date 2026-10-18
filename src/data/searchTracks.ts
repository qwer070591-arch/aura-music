import type { Track } from '../types/track'

export function searchTracks(tracks: readonly Track[], query: string): Track[] {
  const term = query.trim().toLocaleLowerCase('zh-TW')
  if (!term) return [...tracks]
  return tracks.filter((track) =>
    `${track.displayTitle ?? ''} ${track.title} ${track.artist}`.toLocaleLowerCase('zh-TW').includes(term),
  )
}
