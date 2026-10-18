import { beforeEach, describe, expect, it, vi } from 'vitest'

const saved = new Map<string, string>()

beforeEach(() => {
  vi.resetModules()
  vi.unstubAllGlobals()
  saved.clear()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => saved.get(key) ?? null,
    setItem: (key: string, value: string) => saved.set(key, value),
  })
})

async function setup() {
  const { createPinia, setActivePinia } = await import('pinia')
  const { usePlaylistStore } = await import('../src/stores/playlists')
  setActivePinia(createPinia())
  return usePlaylistStore()
}

describe('versioned playlist storage', () => {
  it('validates names and keeps IDs distinct from names', async () => {
    const store = await setup()
    expect(store.createPlaylist('   ')).toBeNull()
    expect(store.createPlaylist('x'.repeat(41))).toBeNull()
    const first = store.createPlaylist('  夜晚 2026  ')
    const second = store.createPlaylist('夜晚 2026')
    expect(first?.name).toBe('夜晚 2026')
    expect(first?.id).not.toBe(second?.id)
    expect(first?.id).not.toBe(first?.name)
    expect(store.renamePlaylist(first!.id, '  新名稱  ')).toBe(true)
    expect(store.byId(first!.id)?.name).toBe('新名稱')
    expect(store.renamePlaylist(first!.id, ' ')).toBe(false)
    expect(store.renamePlaylist(first!.id, 'x'.repeat(41))).toBe(false)
    expect(store.byId(first!.id)?.name).toBe('新名稱')
    expect(store.playlists).toHaveLength(2)
  })

  it('adds each licensed track once, removes it without touching other playlists, and persists', async () => {
    const store = await setup()
    const first = store.createPlaylist('第一個')!
    const second = store.createPlaylist('第二個')!
    expect(store.addTrack(first.id, 'envision')).toBe('added')
    expect(store.addTrack(first.id, 'envision')).toBe('exists')
    expect(store.addTrack(first.id, 'removed-song')).toBe('missing')
    expect(store.addTrack(second.id, 'clean-soul')).toBe('added')
    expect(store.byId(first.id)?.trackIds).toEqual(['envision'])
    expect(store.removeTrack(first.id, 'envision')).toBe(true)
    expect(store.removeTrack(first.id, 'envision')).toBe(false)
    expect(store.deletePlaylist(first.id)).toBe(true)
    expect(store.deletePlaylist(first.id)).toBe(false)
    expect(store.byId(second.id)?.trackIds).toEqual(['clean-soul'])
    const { PLAYLISTS_KEY } = await import('../src/data/playlists')
    expect(JSON.parse(saved.get(PLAYLISTS_KEY)!).version).toBe(1)
    const reloaded = await setup()
    expect(reloaded.playlists).toHaveLength(1)
    expect(reloaded.playlists[0]?.id).toBe(second.id)
  })

  it('tolerates corrupt storage and drops unknown, duplicate and malformed entries', async () => {
    const { PLAYLISTS_KEY } = await import('../src/data/playlists')
    saved.set(PLAYLISTS_KEY, '{broken')
    expect((await setup()).playlists).toEqual([])
    const now = new Date().toISOString()
    saved.set(PLAYLISTS_KEY, JSON.stringify({ version: 1, playlists: [
      { id: 'one', name: '可用歌單', trackIds: ['envision', 'deleted', 'envision', 42], createdAt: now, updatedAt: now },
      { id: 'one', name: '重複 ID', trackIds: [], createdAt: now, updatedAt: now },
      { id: 'bad', name: '  空白  ', trackIds: [], createdAt: now, updatedAt: now },
      { id: 'date', name: '錯誤日期', trackIds: [], createdAt: 'bad', updatedAt: now },
    ] }))
    expect((await setup()).playlists).toEqual([{ id: 'one', name: '可用歌單', trackIds: ['envision'], createdAt: now, updatedAt: now }])
    saved.set(PLAYLISTS_KEY, JSON.stringify({ version: 99, playlists: [] }))
    expect((await setup()).playlists).toEqual([])
  })

  it('reorders by stable track IDs and keeps the order after reload', async () => {
    const store = await setup()
    const list = store.createPlaylist('排序測試')!
    for (const id of ['envision', 'clean-soul', 'summer-day']) store.addTrack(list.id, id)
    expect(store.moveTrack(list.id, 'envision', 'summer-day')).toBe(true)
    expect(store.byId(list.id)?.trackIds).toEqual(['clean-soul', 'summer-day', 'envision'])
    expect(store.moveTrack(list.id, 'envision', 'clean-soul')).toBe(true)
    expect(store.byId(list.id)?.trackIds).toEqual(['envision', 'clean-soul', 'summer-day'])
    expect(store.moveTrack(list.id, 'envision', 'missing')).toBe(false)
    expect(store.moveTrack(list.id, 'envision', 'envision')).toBe(false)
    expect(store.byId(list.id)?.trackIds).toEqual(['envision', 'clean-soul', 'summer-day'])
    expect((await setup()).byId(list.id)?.trackIds).toEqual(['envision', 'clean-soul', 'summer-day'])
  })
})
