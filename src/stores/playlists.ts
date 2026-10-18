import { defineStore } from 'pinia'
import { licensedTracks } from '../data/tracks'
import { normalizePlaylistName, readPlaylists, savePlaylists, type Playlist } from '../data/playlists'

const availableIds = licensedTracks.map((track) => track.id)

export const usePlaylistStore = defineStore('playlists', {
  state: (): { playlists: Playlist[] } => ({
    playlists: readPlaylists(availableIds),
  }),
  getters: {
    byId: (state) => (id: string) => state.playlists.find((playlist) => playlist.id === id),
  },
  actions: {
    createPlaylist(value: string): Playlist | null {
      const name = normalizePlaylistName(value)
      if (!name) return null
      const now = new Date().toISOString()
      const playlist: Playlist = {
        id: crypto.randomUUID(),
        name,
        trackIds: [],
        createdAt: now,
        updatedAt: now,
      }
      this.playlists.push(playlist)
      savePlaylists(this.playlists)
      return playlist
    },
    renamePlaylist(id: string, value: string): boolean {
      const playlist = this.byId(id)
      const name = normalizePlaylistName(value)
      if (!playlist || !name) return false
      if (playlist.name === name) return true
      playlist.name = name
      playlist.updatedAt = new Date().toISOString()
      savePlaylists(this.playlists)
      return true
    },
    deletePlaylist(id: string): boolean {
      const index = this.playlists.findIndex((playlist) => playlist.id === id)
      if (index < 0) return false
      this.playlists.splice(index, 1)
      savePlaylists(this.playlists)
      return true
    },
    addTrack(playlistId: string, trackId: string): 'added' | 'exists' | 'missing' {
      const playlist = this.byId(playlistId)
      if (!playlist || !availableIds.includes(trackId)) return 'missing'
      if (playlist.trackIds.includes(trackId)) return 'exists'
      playlist.trackIds.push(trackId)
      playlist.updatedAt = new Date().toISOString()
      savePlaylists(this.playlists)
      return 'added'
    },
    removeTrack(playlistId: string, trackId: string): boolean {
      const playlist = this.byId(playlistId)
      if (!playlist || !playlist.trackIds.includes(trackId)) return false
      playlist.trackIds = playlist.trackIds.filter((id) => id !== trackId)
      playlist.updatedAt = new Date().toISOString()
      savePlaylists(this.playlists)
      return true
    },
    moveTrack(playlistId: string, trackId: string, targetId: string): boolean {
      const playlist = this.byId(playlistId)
      if (!playlist || trackId === targetId) return false
      const from = playlist.trackIds.indexOf(trackId)
      const to = playlist.trackIds.indexOf(targetId)
      if (from < 0 || to < 0) return false
      playlist.trackIds.splice(from, 1)
      playlist.trackIds.splice(to, 0, trackId)
      playlist.updatedAt = new Date().toISOString()
      savePlaylists(this.playlists)
      return true
    },
  },
})
