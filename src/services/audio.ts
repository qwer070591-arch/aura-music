export type AudioEvent =
  | 'loadedmetadata'
  | 'timeupdate'
  | 'durationchange'
  | 'play'
  | 'playing'
  | 'pause'
  | 'ended'
  | 'waiting'
  | 'canplay'
  | 'error'

const events: AudioEvent[] = [
  'loadedmetadata',
  'timeupdate',
  'durationchange',
  'play',
  'playing',
  'pause',
  'ended',
  'waiting',
  'canplay',
  'error',
]

/** One Audio instance for the app. It lives outside serializable Pinia state. */
export class AudioService {
  readonly audio: HTMLAudioElement
  private readonly listeners: Array<[AudioEvent, EventListener]> = []

  constructor(onEvent: (event: AudioEvent) => void, audio = new Audio()) {
    this.audio = audio
    this.audio.preload = 'metadata'
    for (const event of events) {
      const listener = () => onEvent(event)
      this.audio.addEventListener(event, listener)
      this.listeners.push([event, listener])
    }
  }

  load(source?: string) {
    this.audio.pause()
    if (source) this.audio.src = source
    else this.audio.removeAttribute('src')
    this.audio.load()
  }

  matches(source?: string) {
    if (!source) return false
    const expected = new URL(source, document.baseURI).href
    // currentSrc may still be the previous file while a new source is loading.
    return (
      new URL(this.audio.src, document.baseURI).href === expected &&
      (!this.audio.currentSrc ||
        new URL(this.audio.currentSrc, document.baseURI).href === expected)
    )
  }

  dispose() {
    this.audio.pause()
    for (const [event, listener] of this.listeners) {
      this.audio.removeEventListener(event, listener)
    }
    this.listeners.length = 0
    this.audio.removeAttribute('src')
    this.audio.load()
  }
}
