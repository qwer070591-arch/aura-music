import { beforeEach, describe, expect, it, vi } from 'vitest'

class FakeAudio extends EventTarget {
  static instances: FakeAudio[] = []
  static rejectNext: Error | null = null
  preload = ''
  src = ''
  currentSrc = ''
  currentTime = 0
  duration = Number.NaN
  paused = true
  volume = 1
  muted = false
  ended = false
  seekable = { length: 1 }
  constructor() {
    super()
    FakeAudio.instances.push(this)
  }
  load() {
    this.currentSrc = this.src
    this.currentTime = 0
    this.duration = Number.NaN
    this.paused = true
  }
  removeAttribute(name: string) {
    if (name === 'src') this.src = ''
  }
  pause() {
    if (!this.paused) {
      this.paused = true
      this.dispatchEvent(new Event('pause'))
    }
  }
  async play() {
    if (FakeAudio.rejectNext) {
      const error = FakeAudio.rejectNext
      FakeAudio.rejectNext = null
      throw error
    }
    this.paused = false
    this.ended = false
    this.dispatchEvent(new Event('play'))
    this.dispatchEvent(new Event('playing'))
  }
  metadata(duration: number) {
    this.duration = duration
    this.dispatchEvent(new Event('loadedmetadata'))
    this.dispatchEvent(new Event('canplay'))
  }
  finish() {
    this.currentTime = this.duration
    this.paused = true
    this.ended = true
    this.dispatchEvent(new Event('timeupdate'))
    this.dispatchEvent(new Event('ended'))
  }
}

async function setup() {
  const { createPinia, setActivePinia } = await import('pinia')
  vi.stubGlobal('document', { baseURI: 'http://localhost:4173/' })
  const { usePlayerStore } = await import('../src/stores/player')
  setActivePinia(createPinia())
  const player = usePlayerStore()
  player.initAudio()
  return { player, audio: FakeAudio.instances.at(-1)! }
}

beforeEach(() => {
  vi.resetModules()
  vi.unstubAllGlobals()
  vi.stubGlobal('Audio', FakeAudio)
  vi.stubGlobal('localStorage', undefined)
  FakeAudio.instances = []
  FakeAudio.rejectNext = null
})

describe('one native audio engine and Pinia sync', () => {
  it('applies the default volume to the single audio engine and keeps it across tracks and seek', async () => {
    const { player, audio } = await setup()
    expect(player.volume).toBe(0.7)
    expect(audio.volume).toBe(0.7)
    expect(audio.muted).toBe(false)
    audio.metadata(85)
    player.seek(20)
    player.setVolume(0.4)
    expect(audio.volume).toBe(0.4)
    expect(audio.currentTime).toBe(20)
    player.nextTrack()
    expect(FakeAudio.instances).toHaveLength(1)
    expect(audio.volume).toBe(0.4)
    expect(audio.muted).toBe(false)
  })

  it('mutes, restores the previous nonzero level, and unmutes when raised from zero', async () => {
    const { player, audio } = await setup()
    player.setVolume(0.36)
    player.toggleMute()
    expect(player.isMuted).toBe(true)
    expect(audio.muted).toBe(true)
    player.toggleMute()
    expect(player.volume).toBe(0.36)
    expect(audio.volume).toBe(0.36)
    expect(audio.muted).toBe(false)
    player.setVolume(0)
    expect(player.lastNonZeroVolume).toBe(0.36)
    expect(player.isMuted).toBe(true)
    player.toggleMute()
    expect(player.volume).toBe(0.36)
    player.setVolume(0)
    player.setVolume(0.12)
    expect(player.isMuted).toBe(false)
    expect(audio.volume).toBe(0.12)
    expect(audio.muted).toBe(false)
  })

  it('persists valid volume settings without duplicate writes and survives broken storage', async () => {
    const saved = new Map<string, string>()
    const setItem = vi.fn((key: string, value: string) => saved.set(key, value))
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => saved.get(key) ?? null,
      setItem,
    })
    const { VOLUME_KEY } = await import('../src/data/volume')
    const { player } = await setup()
    player.setVolume(0.58)
    player.setVolume(0.58)
    expect(setItem).toHaveBeenCalledTimes(1)
    player.toggleMute()
    const { createPinia, setActivePinia } = await import('pinia')
    const { usePlayerStore } = await import('../src/stores/player')
    setActivePinia(createPinia())
    expect(usePlayerStore()).toMatchObject({ volume: 0.58, isMuted: true, lastNonZeroVolume: 0.58 })
    saved.set(VOLUME_KEY, '{broken')
    setActivePinia(createPinia())
    expect(usePlayerStore()).toMatchObject({ volume: 0.7, isMuted: false })
    saved.set(VOLUME_KEY, JSON.stringify({ version: 1, volume: 4, isMuted: false, lastNonZeroVolume: 0.5 }))
    setActivePinia(createPinia())
    expect(usePlayerStore().volume).toBe(0.7)
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('denied') }, setItem: () => { throw new Error('denied') } })
    setActivePinia(createPinia())
    const restricted = usePlayerStore()
    restricted.setVolume(0.2)
    expect(restricted.volume).toBe(0.2)
  })
  it('persists favorite changes and drops invalid stored song IDs', async () => {
    const saved = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => saved.get(key) ?? null,
      setItem: (key: string, value: string) => saved.set(key, value),
    })
    const { FAVORITES_KEY } = await import('../src/data/favorites')
    saved.set(FAVORITES_KEY, JSON.stringify(['envision', 'removed', 'envision', 42]))
    const { player } = await setup()
    expect(player.favorites).toEqual(['envision'])
    player.toggleFavorite('clean-soul')
    expect(JSON.parse(saved.get(FAVORITES_KEY)!)).toEqual(['envision', 'clean-soul'])
    player.toggleFavorite('envision')
    player.toggleFavorite('removed')
    expect(player.favorites).toEqual(['clean-soul'])
    const { createPinia, setActivePinia } = await import('pinia')
    const { usePlayerStore } = await import('../src/stores/player')
    setActivePinia(createPinia())
    expect(usePlayerStore().favorites).toEqual(['clean-soul'])
    saved.set(FAVORITES_KEY, '{broken')
    setActivePinia(createPinia())
    expect(usePlayerStore().favorites).toEqual([])
  })

  it('searches title or artist and assigns a distinct cover to every playable track', async () => {
    const { player } = await setup()
    const { searchTracks } = await import('../src/data/searchTracks')
    expect(searchTracks(player.tracks, '  SOUL ' ).map((track) => track.id)).toEqual(['clean-soul'])
    expect(searchTracks(player.tracks, 'kevin macleod')).toHaveLength(20)
    expect(searchTracks(player.tracks, 'ketsa')).toHaveLength(2)
    expect(searchTracks(player.tracks, 'meadowglint').map((track) => track.id)).toEqual(['meadowglint'])
    expect(searchTracks(player.tracks, 'upbeat motivational acoustic folk').map((track) => track.id)).toEqual(['meadowglint'])
    expect(searchTracks(player.tracks, 'hidden glade').map((track) => track.id)).toEqual(['hidden-glade'])
    expect(searchTracks(player.tracks, 'inspiring romantic acoustic folk').map((track) => track.id)).toEqual(['hidden-glade'])
    expect(player.tracks.find((track) => track.id === 'meadowglint')).toMatchObject({
      displayTitle: 'Meadowglint',
      title: 'Upbeat Motivational Acoustic Folk "Meadowglint".mp3',
      audioSrc: '/audio/meadowglint.mp3',
    })
    expect(searchTracks(player.tracks, 'not found')).toEqual([])
    expect(new Set(player.tracks.map((track) => track.cover)).size).toBe(26)
  })

  it('records only native playing events, then orders, deduplicates and limits recent tracks', async () => {
    const saved = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => saved.get(key) ?? null,
      setItem: (key: string, value: string) => saved.set(key, value),
    })
    const { player } = await setup()
    const { RECENTLY_PLAYED_KEY } = await import('../src/data/recentlyPlayed')
    player.selectTrack(player.tracks[1]!, false)
    expect(player.recentlyPlayedIds).toEqual([])
    FakeAudio.rejectNext = new DOMException('blocked', 'NotAllowedError')
    await player.play()
    expect(player.recentlyPlayedIds).toEqual([])
    await player.play()
    expect(player.recentlyPlayedIds).toEqual(['clean-soul'])
    for (const track of player.tracks.slice(2, 8)) player.selectTrack(track, true)
    expect(player.recentlyPlayedIds).toEqual([
      'townie-loop', 'deliberate-thought', 'basement-floor', 'galactic-rap', 'mesmerizing-galaxy',
    ])
    player.selectTrack(player.tracks[4]!, true)
    expect(player.recentlyPlayedIds).toEqual([
      'galactic-rap', 'townie-loop', 'deliberate-thought', 'basement-floor', 'mesmerizing-galaxy',
    ])
    expect(player.recentlyPlayedTracks.map((track) => track.id)).toEqual(player.recentlyPlayedIds)
    expect(JSON.parse(saved.get(RECENTLY_PLAYED_KEY)!)).toEqual(player.recentlyPlayedIds)
    const { createPinia, setActivePinia } = await import('pinia')
    const { usePlayerStore } = await import('../src/stores/player')
    setActivePinia(createPinia())
    expect(usePlayerStore().recentlyPlayedIds).toEqual(player.recentlyPlayedIds)
  })

  it('ignores broken storage, invalid IDs and duplicate entries on load', async () => {
    const saved = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => saved.get(key) ?? null,
      setItem: (key: string, value: string) => saved.set(key, value),
    })
    const { RECENTLY_PLAYED_KEY } = await import('../src/data/recentlyPlayed')
    saved.set(RECENTLY_PLAYED_KEY, '{broken')
    const { player } = await setup()
    expect(player.recentlyPlayedIds).toEqual([])
    saved.set(RECENTLY_PLAYED_KEY, JSON.stringify(['removed-track', 42, 'envision', 'envision', 'summer-day']))
    const { createPinia, setActivePinia } = await import('pinia')
    const { usePlayerStore } = await import('../src/stores/player')
    setActivePinia(createPinia())
    expect(usePlayerStore().recentlyPlayedIds).toEqual(['envision', 'summer-day'])
  })

  it('keeps only licensed sources in the default queue and retains fictional design data separately', async () => {
    const { player, audio } = await setup()
    const { stitchMockTracks } = await import('../src/data/stitchMockTracks')
    expect(player.tracks).toHaveLength(26)
    expect(player.tracks.every((track) => Boolean(track.audioSrc && track.sourcePage))).toBe(true)
    expect(stitchMockTracks).toHaveLength(7)
    expect(player.tracks.some((track) => stitchMockTracks.some((mock) => mock.id === track.id))).toBe(false)
    expect(player.durationForTrack('envision')).toBeCloseTo(85.33941)
    audio.metadata(85.5)
    expect(player.durationForTrack('envision')).toBe(85.5)
  })

  it('plays a chosen library track even when the previous track was paused', async () => {
    const { player, audio } = await setup()
    expect(audio.paused).toBe(true)
    player.selectTrack(player.tracks[2]!, true)
    await vi.waitFor(() => expect(audio.paused).toBe(false))
    expect(player.currentTrack.title).toBe('Summer Day')
    expect(audio.src).toBe('/audio/summer-day.mp3')
    expect(player.currentTime).toBe(0)
  })

  it('loads one source, waits for metadata, and reflects native play, time, seek and pause', async () => {
    const { player, audio } = await setup()
    expect(FakeAudio.instances).toHaveLength(1)
    expect(audio.src).toBe('/audio/envision.mp3')
    expect(player.duration).toBe(0)
    expect(player.canSeek).toBe(false)
    audio.metadata(85.3)
    expect(player.duration).toBe(85.3)
    expect(player.canSeek).toBe(true)
    await player.play()
    expect(audio.paused).toBe(false)
    expect(player.isPlaying).toBe(true)
    audio.currentTime = 20
    audio.dispatchEvent(new Event('timeupdate'))
    expect(player.progress).toBeCloseTo(20 / 85.3)
    player.seek(41)
    expect(audio.currentTime).toBe(41)
    expect(player.currentTime).toBe(41)
    player.pause()
    expect(audio.paused).toBe(true)
    expect(player.isPlaying).toBe(false)
  })

  it('switches sources without constructing another Audio, and ignores old source events', async () => {
    const { player, audio } = await setup()
    audio.metadata(85)
    await player.play()
    player.nextTrack()
    expect(FakeAudio.instances).toHaveLength(1)
    expect(player.currentTrack.title).toBe('Clean Soul')
    expect(audio.src).toBe('/audio/clean-soul.mp3')
    expect(player.currentTime).toBe(0)
    expect(player.duration).toBe(0)
    audio.currentSrc = '/audio/envision.mp3'
    audio.duration = 85
    audio.currentTime = 60
    audio.dispatchEvent(new Event('timeupdate'))
    expect(player.currentTime).toBe(0)
    audio.currentSrc = audio.src
    audio.metadata(307)
    expect(player.duration).toBe(307)
  })

  it('handles blocked play, audio errors, retry, and unavailable tracks', async () => {
    const { player, audio } = await setup()
    FakeAudio.rejectNext = new DOMException('blocked', 'NotAllowedError')
    await player.play()
    expect(player.isPlaying).toBe(false)
    expect(player.status).toBe('error')
    expect(player.errorMessage).toMatch(/瀏覽器阻止播放/)
    await player.play()
    expect(audio.paused).toBe(false)
    audio.dispatchEvent(new Event('error'))
    expect(player.status).toBe('error')
    expect(player.isPlaying).toBe(false)
    expect(audio.paused).toBe(true)
    expect(player.errorMessage).toMatch(/音訊載入失敗/)
  })

  it('applies repeat off, all, and one at native ended', async () => {
    const { player, audio } = await setup()
    player.selectTrack(player.playableTracks.at(-1)!, false)
    audio.metadata(player.currentTrack.duration)
    await player.play()
    audio.finish()
    expect(player.currentTrack.id).toBe('soft-landing')
    expect(player.isPlaying).toBe(false)
    player.cycleRepeat() // all
    await player.play()
    audio.finish()
    expect(player.currentTrack.id).toBe('envision')
    expect(audio.src).toBe('/audio/envision.mp3')
    player.cycleRepeat() // one
    audio.metadata(85)
    await player.play()
    audio.finish()
    expect(player.currentTrack.id).toBe('envision')
    expect(audio.currentTime).toBe(0)
    expect(audio.paused).toBe(false)
  })

  it('uses a shuffle bag without repeating the current track and goes back through history', async () => {
    const { player } = await setup()
    vi.spyOn(Math, 'random').mockReturnValue(0)
    player.toggleShuffle()
    player.nextTrack()
    const second = player.currentTrack.id
    player.nextTrack()
    const third = player.currentTrack.id
    expect(new Set(['envision', second, third]).size).toBe(3)
    player.previousTrack()
    expect(player.currentTrack.id).toBe(second)
    player.nextTrack()
    expect(player.currentTrack.id).toBe(third)
    vi.restoreAllMocks()
  })

  it('handles empty and single playable lists', async () => {
    const { player, audio } = await setup()
    player.tracks = []
    player.nextTrack()
    expect(player.status).toBe('unavailable')
    player.tracks = [player.currentTrack]
    player.cycleRepeat()
    audio.metadata(85)
    await player.play()
    audio.finish()
    expect(audio.paused).toBe(false)
    expect(player.currentTrack.id).toBe('envision')
  })

  it('keeps buffering and playback event states distinct', async () => {
    const { player, audio } = await setup()
    audio.metadata(85)
    await player.play()
    audio.dispatchEvent(new Event('waiting'))
    expect(player.status).toBe('buffering')
    expect(player.isPlaying).toBe(false)
    audio.dispatchEvent(new Event('canplay'))
    expect(player.status).toBe('ready')
    expect(player.isPlaying).toBe(false)
    audio.dispatchEvent(new Event('playing'))
    expect(player.isPlaying).toBe(true)
  })

  it('does not let an old rejected play request overwrite a newer track', async () => {
    const { player, audio } = await setup()
    let rejectOld!: (error: Error) => void
    audio.play = () =>
      new Promise<void>((_resolve, reject) => {
        rejectOld = reject
      })
    const oldAttempt = player.play()
    player.selectTrack(player.playableTracks[1]!, false)
    rejectOld(new DOMException('aborted', 'AbortError'))
    await oldAttempt
    expect(player.currentTrack.id).toBe('clean-soul')
    expect(player.status).toBe('loading')
    expect(player.errorMessage).toBe('')
  })

  it('removes every native event listener when the audio service is disposed', async () => {
    const { AudioService } = await import('../src/services/audio')
    const audio = new FakeAudio()
    const onEvent = vi.fn()
    const service = new AudioService(
      onEvent,
      audio as unknown as HTMLAudioElement,
    )
    audio.dispatchEvent(new Event('timeupdate'))
    expect(onEvent).toHaveBeenCalledTimes(1)
    service.dispose()
    audio.dispatchEvent(new Event('timeupdate'))
    expect(onEvent).toHaveBeenCalledTimes(1)
  })

  it('uses playlist order from a middle track and restores the library queue on library selection', async () => {
    const { player, audio } = await setup()
    const playlist = { id: 'night', name: '夜晚', trackIds: ['summer-day', 'envision', 'clean-soul'] }
    expect(player.startPlaylist(playlist, 'envision')).toBe(true)
    expect(player.queue.source).toBe('playlist')
    expect(player.queueCurrentIndex).toBe(1)
    expect(audio.src).toBe('/audio/envision.mp3')
    player.nextTrack()
    expect(player.currentTrack.id).toBe('clean-soul')
    player.previousTrack()
    expect(player.currentTrack.id).toBe('envision')
    player.selectLibraryTrack(player.tracks[3]!)
    expect(player.queue.source).toBe('library')
    player.nextTrack()
    expect(player.currentTrack.id).toBe(player.tracks[4]!.id)
    expect(FakeAudio.instances).toHaveLength(1)
  })

  it('keeps an active playlist queue snapshot when its source list changes or disappears', async () => {
    const { player } = await setup()
    const list = { id: 'night', name: '夜晚', trackIds: ['envision', 'clean-soul', 'summer-day'] }
    player.startPlaylist(list)
    list.trackIds.splice(1, 1)
    list.trackIds.reverse()
    player.nextTrack()
    expect(player.currentTrack.id).toBe('clean-soul')
    expect(player.queue.orderedTrackIds).toEqual(['envision', 'clean-soul', 'summer-day'])
    expect(player.startPlaylist({ id: 'empty', name: '空', trackIds: [] })).toBe(false)
    expect(player.currentTrack.id).toBe('clean-soul')
  })

  it('keeps the latest playlist source during rapid skips and stale play rejection', async () => {
    const { player, audio } = await setup()
    const rejects: Array<(error: Error) => void> = []
    audio.play = () => new Promise<void>((_resolve, reject) => { rejects.push(reject) })
    player.startPlaylist({ id: 'fast', name: '快速切歌', trackIds: ['envision', 'clean-soul', 'summer-day'] })
    player.nextTrack()
    player.nextTrack()
    expect(player.currentTrack.id).toBe('summer-day')
    expect(audio.src).toBe('/audio/summer-day.mp3')
    rejects[0]!(new DOMException('old source', 'AbortError'))
    await Promise.resolve()
    expect(player.status).toBe('loading')
    expect(player.errorMessage).toBe('')
    expect(FakeAudio.instances).toHaveLength(1)
  })

  it('applies repeat modes and shuffle only within the active playlist', async () => {
    const { player, audio } = await setup()
    player.startPlaylist({ id: 'short', name: '短', trackIds: ['envision', 'clean-soul'] }, 'clean-soul')
    audio.metadata(307)
    audio.finish()
    expect(player.currentTrack.id).toBe('clean-soul')
    expect(player.isPlaying).toBe(false)
    player.cycleRepeat()
    await player.play()
    audio.finish()
    expect(player.currentTrack.id).toBe('envision')
    player.cycleRepeat()
    audio.metadata(85)
    await player.play()
    audio.finish()
    expect(player.currentTrack.id).toBe('envision')
    expect(audio.currentTime).toBe(0)
    player.cycleRepeat()
    vi.spyOn(Math, 'random').mockReturnValue(0)
    player.toggleShuffle()
    player.nextTrack()
    expect(player.currentTrack.id).toBe('clean-soul')
    player.previousTrack()
    expect(player.currentTrack.id).toBe('envision')
    vi.restoreAllMocks()
  })
})
