import { defineStore } from 'pinia'
import { AudioService, type AudioEvent } from '../services/audio'
import { licensedTracks } from '../data/tracks'
import { readFavoriteIds, saveFavoriteIds } from '../data/favorites'
import { readRecentTrackIds, saveRecentTrackIds, validRecentTrackIds } from '../data/recentlyPlayed'
import { DEFAULT_VOLUME, readVolumePreference, saveVolumePreference } from '../data/volume'
import type { Track } from '../types/track'

export type RepeatMode = 'off' | 'all' | 'one'
export interface QueueContext {
  source: 'library' | 'playlist'
  playlistId?: string
  playlistName?: string
  orderedTrackIds: string[]
}
export interface PlaylistQueueInput {
  id: string
  name: string
  trackIds: string[]
}
export type PlaybackStatus =
  'loading' | 'ready' | 'buffering' | 'error' | 'unavailable'

interface PlayerState {
  currentTrack: Track
  isPlaying: boolean
  currentTime: number
  duration: number
  canSeek: boolean
  status: PlaybackStatus
  errorMessage: string
  shuffle: boolean
  repeat: RepeatMode
  history: string[]
  historyIndex: number
  shuffleBag: string[]
  queue: QueueContext
  favorites: string[]
  tracks: Track[]
  trackDurations: Record<string, number>
  recentlyPlayedIds: string[]
  volume: number
  isMuted: boolean
  lastNonZeroVolume: number
}

let engine: AudioService | null = null
let requestId = 0
let playIntent = false
import.meta.hot?.dispose(() => {
  engine?.dispose()
  engine = null
  playIntent = false
})

export const usePlayerStore = defineStore('player', {
  state: (): PlayerState => ({
    currentTrack: licensedTracks[0]!,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    canSeek: false,
    status: 'loading',
    errorMessage: '',
    shuffle: false,
    repeat: 'off',
    history: [licensedTracks[0]!.id],
    historyIndex: 0,
    shuffleBag: [],
    queue: { source: 'library', orderedTrackIds: licensedTracks.map((track) => track.id) },
    favorites: readFavoriteIds(licensedTracks.map((track) => track.id)),
    tracks: licensedTracks,
    trackDurations: Object.fromEntries(licensedTracks.map((track) => [track.id, track.duration])),
    recentlyPlayedIds: readRecentTrackIds(licensedTracks.map((track) => track.id)),
    ...readVolumePreference(),
  }),
  getters: {
    progress: (state) =>
      state.duration > 0
        ? Math.min(1, Math.max(0, state.currentTime / state.duration))
        : 0,
    isFavorite: (state) => (id: string) => state.favorites.includes(id),
    durationForTrack: (state) => (id: string) => state.trackDurations[id] ?? 0,
    playableTracks: (state) =>
      state.tracks.filter((track) => Boolean(track.audioSrc)),
    queueTracks: (state) => state.queue.orderedTrackIds
      .map((id) => state.tracks.find((track) => track.id === id && Boolean(track.audioSrc)))
      .filter((track): track is Track => Boolean(track)),
    queueCurrentIndex: (state) => state.queue.orderedTrackIds.indexOf(state.currentTrack.id),
    recentlyPlayedTracks: (state) =>
      state.recentlyPlayedIds
        .map((id) => state.tracks.find((track) => track.id === id))
        .filter((track): track is Track => Boolean(track)),
  },
  actions: {
    initAudio() {
      if (engine) return
      engine = new AudioService((event) => this.onAudioEvent(event))
      this.applyVolume()
      this.loadCurrentTrack()
    },
    applyVolume() {
      if (!engine) return
      engine.audio.volume = this.volume
      engine.audio.muted = this.isMuted
    },
    persistVolume() {
      saveVolumePreference({
        volume: this.volume,
        isMuted: this.isMuted,
        lastNonZeroVolume: this.lastNonZeroVolume,
      })
    },
    setVolume(value: number) {
      if (!Number.isFinite(value)) return
      const volume = Math.min(1, Math.max(0, value))
      const isMuted = volume === 0
      if (this.volume === volume && this.isMuted === isMuted) return
      this.volume = volume
      this.isMuted = isMuted
      if (volume > 0) this.lastNonZeroVolume = volume
      this.applyVolume()
      this.persistVolume()
    },
    toggleMute() {
      if (this.isMuted || this.volume === 0) {
        if (this.volume === 0) this.volume = this.lastNonZeroVolume || DEFAULT_VOLUME
        this.isMuted = false
      } else {
        this.isMuted = true
      }
      this.applyVolume()
      this.persistVolume()
    },
    onAudioEvent(event: AudioEvent) {
      if (!engine?.matches(this.currentTrack.audioSrc)) return
      const audio = engine.audio
      if (
        event === 'loadedmetadata' ||
        event === 'durationchange' ||
        event === 'timeupdate' ||
        event === 'canplay'
      ) {
        this.duration =
          Number.isFinite(audio.duration) && audio.duration > 0
            ? audio.duration
            : 0
        if (this.duration > 0) this.trackDurations[this.currentTrack.id] = this.duration
        this.currentTime = Number.isFinite(audio.currentTime)
          ? Math.min(this.duration, Math.max(0, audio.currentTime))
          : 0
        this.canSeek = this.duration > 0 && audio.seekable.length > 0
      }
      if (event === 'canplay') {
        if (this.status !== 'error') this.status = 'ready'
      } else if (event === 'waiting') {
        this.isPlaying = false
        this.status = 'buffering'
      } else if (event === 'playing') {
        this.isPlaying = true
        this.status = 'ready'
        this.errorMessage = ''
        this.recordRecentPlayback(this.currentTrack.id)
      } else if (event === 'pause') {
        this.isPlaying = false
        if (this.status === 'buffering') this.status = 'ready'
      } else if (event === 'ended') {
        playIntent = false
        this.isPlaying = false
        this.currentTime = this.duration
        this.onEnded()
      } else if (event === 'error') {
        playIntent = false
        audio.pause()
        this.isPlaying = false
        this.status = 'error'
        this.errorMessage =
          '音訊載入失敗，請重試或選擇其他歌曲。'
      }
    },
    loadCurrentTrack() {
      requestId++
      this.isPlaying = false
      this.currentTime = 0
      this.duration = 0
      this.canSeek = false
      this.errorMessage = ''
      this.status = this.currentTrack.audioSrc ? 'loading' : 'unavailable'
      engine?.load(this.currentTrack.audioSrc)
    },
    async play() {
      this.initAudio()
      if (!this.currentTrack.audioSrc || !engine) {
        this.status = 'unavailable'
        return
      }
      if (this.status === 'error') this.loadCurrentTrack()
      const attempt = ++requestId
      playIntent = true
      try {
        await engine.audio.play()
        // The playing event, not Promise resolution, confirms playback.
      } catch (error) {
        if (attempt !== requestId) return
        playIntent = false
        engine.audio.pause()
        this.isPlaying = false
        this.status = 'error'
        this.errorMessage =
          error instanceof DOMException && error.name === 'NotAllowedError'
            ? '瀏覽器阻止播放，請點選重試。'
            : '播放失敗，請重試或選擇其他歌曲。'
      }
    },
    pause() {
      requestId++
      playIntent = false
      engine?.audio.pause()
      this.isPlaying = false
    },
    togglePlay() {
      if (this.status === 'error') void this.play()
      else if (engine && !engine.audio.paused) this.pause()
      else void this.play()
    },
    selectTrack(
      track: Track,
      shouldPlay = engine ? !engine.audio.paused : false,
      recordHistory = true,
    ) {
      this.initAudio()
      this.currentTrack = track
      if (recordHistory) {
        this.history = [
          ...this.history.slice(0, this.historyIndex + 1),
          track.id,
        ]
        this.historyIndex = this.history.length - 1
      }
      this.shuffleBag = this.shuffleBag.filter((id) => id !== track.id)
      this.loadCurrentTrack()
      if (shouldPlay && track.audioSrc) void this.play()
    },
    selectLibraryTrack(track: Track, shouldPlay = true) {
      if (!this.playableTracks.some((candidate) => candidate.id === track.id)) return false
      this.queue = { source: 'library', orderedTrackIds: this.playableTracks.map((candidate) => candidate.id) }
      this.history = [track.id]
      this.historyIndex = 0
      this.shuffleBag = this.shuffle
        ? this.queue.orderedTrackIds.filter((id) => id !== track.id)
        : []
      this.selectTrack(track, shouldPlay, false)
      return true
    },
    startPlaylist(playlist: PlaylistQueueInput, startId?: string) {
      const valid = new Set(this.playableTracks.map((track) => track.id))
      const orderedTrackIds = [...new Set(playlist.trackIds.filter((id) => valid.has(id)))]
      const chosenId = startId ?? orderedTrackIds[0]
      const track = this.playableTracks.find((candidate) => candidate.id === chosenId)
      if (!track || !orderedTrackIds.includes(track.id)) return false
      this.queue = { source: 'playlist', playlistId: playlist.id, playlistName: playlist.name, orderedTrackIds }
      this.history = [track.id]
      this.historyIndex = 0
      this.shuffleBag = this.shuffle ? orderedTrackIds.filter((id) => id !== track.id) : []
      this.selectTrack(track, true, false)
      return true
    },
    nextTrack(fromEnded = false) {
      const playable = this.queueTracks
      if (!playable.length) {
        this.pause()
        this.status = 'unavailable'
        return
      }
      const shouldPlay = fromEnded || playIntent || Boolean(engine && !engine.audio.paused)
      if (playable.length === 1) {
        if (this.repeat !== 'off' || !fromEnded)
          this.selectTrack(playable[0]!, shouldPlay)
        else this.pause()
        return
      }
      if (this.shuffle && this.historyIndex < this.history.length - 1) {
        const forward = playable.find(
          (track) => track.id === this.history[this.historyIndex + 1],
        )
        if (forward) {
          this.historyIndex++
          this.selectTrack(forward, shouldPlay, false)
          return
        }
      }
      let next: Track | undefined
      if (this.shuffle) {
        let bag = this.shuffleBag.filter(
          (id) =>
            playable.some((track) => track.id === id) &&
            id !== this.currentTrack.id,
        )
        if (!bag.length && (this.repeat === 'all' || !fromEnded)) {
          bag = playable
            .filter((track) => track.id !== this.currentTrack.id)
            .map((track) => track.id)
        }
        if (bag.length) {
          const index = Math.floor(Math.random() * bag.length)
          next = playable.find((track) => track.id === bag[index])
          this.shuffleBag = bag.filter((_, position) => position !== index)
        }
      } else {
        const index = playable.findIndex(
          (track) => track.id === this.currentTrack.id,
        )
        next = playable[index + 1]
        if (!next && this.repeat === 'all') next = playable[0]
        if (!next && index < 0) next = playable[0]
      }
      if (!next) {
        this.pause()
        return
      }
      this.selectTrack(next, shouldPlay)
    },
    previousTrack() {
      if (this.currentTime > 3 && this.canSeek) {
        this.seek(0)
        return
      }
      const playable = this.queueTracks
      if (!playable.length) {
        this.pause()
        this.status = 'unavailable'
        return
      }
      const shouldPlay = playIntent || Boolean(engine && !engine.audio.paused)
      if (this.shuffle && this.historyIndex > 0) {
        this.historyIndex--
        const previous = playable.find(
          (track) => track.id === this.history[this.historyIndex],
        )
        if (previous) {
          this.selectTrack(previous, shouldPlay, false)
          return
        }
      }
      const index = playable.findIndex(
        (track) => track.id === this.currentTrack.id,
      )
      const previous =
        playable[index - 1] ??
        (this.repeat === 'all' ? playable.at(-1) : undefined)
      if (previous) this.selectTrack(previous, shouldPlay)
      else if (this.canSeek) this.seek(0)
    },
    onEnded() {
      if (
        (this.repeat === 'one' ||
          (this.repeat === 'all' && this.queueTracks.length === 1)) &&
        this.currentTrack.audioSrc &&
        engine
      ) {
        engine.audio.currentTime = 0
        this.currentTime = engine.audio.currentTime
        void this.play()
      } else this.nextTrack(true)
    },
    seek(seconds: number) {
      if (!engine || !this.canSeek || !Number.isFinite(seconds)) return
      const target = Math.min(this.duration, Math.max(0, seconds))
      try {
        engine.audio.currentTime = target
        this.currentTime = engine.audio.currentTime
      } catch {
        this.canSeek = false
      }
    },
    toggleShuffle() {
      this.shuffle = !this.shuffle
      this.shuffleBag = this.shuffle
        ? this.queueTracks
            .filter((track) => track.id !== this.currentTrack.id)
            .map((track) => track.id)
        : []
    },
    cycleRepeat() {
      this.repeat =
        this.repeat === 'off' ? 'all' : this.repeat === 'all' ? 'one' : 'off'
    },
    toggleFavorite(id: string) {
      if (!this.tracks.some((track) => track.id === id)) return
      this.favorites = this.favorites.includes(id)
        ? this.favorites.filter((favorite) => favorite !== id)
        : [...this.favorites, id]
      saveFavoriteIds(this.favorites)
    },
    recordRecentPlayback(id: string) {
      if (!this.tracks.some((track) => track.id === id && track.audioSrc)) return
      if (this.recentlyPlayedIds[0] === id) return
      this.recentlyPlayedIds = validRecentTrackIds(
        [id, ...this.recentlyPlayedIds],
        this.tracks.map((track) => track.id),
      )
      saveRecentTrackIds(this.recentlyPlayedIds)
    },
  },
})
