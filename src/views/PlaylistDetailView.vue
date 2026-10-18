<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import TrackRow from '../components/TrackRow.vue'
import PlaylistNameDialog from '../components/PlaylistNameDialog.vue'
import BaseDialog from '../components/BaseDialog.vue'
import { usePlaylistStore } from '../stores/playlists'
import { usePlayerStore } from '../stores/player'
import type { Track } from '../types/track'

const route = useRoute()
const router = useRouter()
const playlists = usePlaylistStore()
const player = usePlayerStore()
const playlist = computed(() => playlists.byId(String(route.params.id)))
const tracks = computed(() => playlist.value?.trackIds
  .map((id) => player.playableTracks.find((track) => track.id === id))
  .filter((track): track is Track => Boolean(track)) ?? [])
const cover = computed(() => tracks.value[0]?.cover ?? '/covers/playlist-empty.svg')
const renaming = ref(false)
const deleting = ref(false)
const sorting = ref(false)
const dragId = ref<string | null>(null)
const dropId = ref<string | null>(null)
const sortMessage = ref('')

function move(trackId: string, targetId: string) {
  if (!playlist.value || !playlists.moveTrack(playlist.value.id, trackId, targetId)) return
  const track = tracks.value.find((item) => item.id === trackId)
  const position = tracks.value.findIndex((item) => item.id === trackId) + 1
  sortMessage.value = track ? `已將 ${track.title} 移至第 ${position} 首。` : ''
}

function onDragStart(event: PointerEvent, id: string) {
  if (event.button !== 0) return
  dragId.value = id
  dropId.value = null
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}

function onDragMove(event: PointerEvent) {
  if (!dragId.value) return
  const row = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-sort-id]')
  dropId.value = row?.dataset.sortId !== dragId.value ? row?.dataset.sortId ?? null : null
}

function onDragEnd() {
  if (dragId.value && dropId.value) move(dragId.value, dropId.value)
  dragId.value = null
  dropId.value = null
}

function onDragCancel() {
  dragId.value = null
  dropId.value = null
}

function rename(name: string) {
  if (playlist.value && playlists.renamePlaylist(playlist.value.id, name)) renaming.value = false
}

function remove(track: Track) {
  if (playlist.value) playlists.removeTrack(playlist.value.id, track.id)
}

async function confirmDelete() {
  if (!playlist.value) return
  if (playlists.deletePlaylist(playlist.value.id)) await router.push('/playlists')
  deleting.value = false
}
</script>

<template>
  <div class="playlist-detail-view">
    <AppHeader home />
    <section class="playlist-page" aria-label="歌單詳情">
      <RouterLink class="playlist-back" to="/playlists">← 返回我的歌單</RouterLink>
      <template v-if="playlist">
        <div class="playlist-hero">
          <img :src="cover" :alt="`${playlist.name} 封面`" width="112" height="112" />
          <div class="playlist-hero__copy"><span class="eyebrow">AURA MUSIC · 歌單</span>
            <h1>{{ playlist.name }}</h1>
            <p>{{ tracks.length }} 首歌曲</p>
          </div>
        </div>
        <div class="playlist-detail-actions">
          <button v-if="tracks.length" type="button" class="aura-button aura-button--primary" @click="player.startPlaylist(playlist)">播放全部</button>
          <button type="button" class="aura-button aura-button--secondary" @click="renaming = true">重新命名</button>
          <button type="button" class="aura-button aura-button--danger" @click="deleting = true">刪除歌單</button>
        </div>
        <div class="playlist-tracks-header">
          <h2 class="playlist-tracks-heading">歌曲</h2>
          <button v-if="tracks.length > 1" type="button" class="playlist-sort-toggle" :aria-pressed="sorting" @click="sorting = !sorting">
            {{ sorting ? '完成排序' : '調整順序' }}
          </button>
        </div>
        <ol v-if="tracks.length && sorting" class="playlist-sort-list" aria-label="調整歌單歌曲順序">
          <li v-for="(track, index) in tracks" :key="track.id" class="playlist-sort-row" :class="{ 'playlist-sort-row--target': dropId === track.id, 'playlist-sort-row--dragging': dragId === track.id }" :data-sort-id="track.id">
            <button type="button" class="playlist-sort-handle" :aria-label="`拖曳排序 ${track.title}`" @pointerdown="onDragStart($event, track.id)" @pointermove="onDragMove" @pointerup="onDragEnd" @pointercancel="onDragCancel">⠿</button>
            <img :src="track.cover" :alt="`${track.title} 的抽象封面`" width="42" height="42" />
            <span class="playlist-sort-copy"><strong>{{ track.displayTitle ?? track.title }}</strong><small>{{ track.artist }}</small></span>
            <div class="playlist-sort-actions">
              <button type="button" :aria-label="`上移 ${track.title}`" :disabled="index === 0" @click="move(track.id, tracks[index - 1]!.id)">↑</button>
              <button type="button" :aria-label="`下移 ${track.title}`" :disabled="index === tracks.length - 1" @click="move(track.id, tracks[index + 1]!.id)">↓</button>
            </div>
          </li>
        </ol>
        <p v-if="sorting" class="sr-only" role="status">{{ sortMessage }}</p>
        <ol v-else-if="tracks.length" class="track-list">
          <TrackRow v-for="(track, index) in tracks" :key="track.id" :track="track" :index="index" :playlist-context="playlist" remove-action @remove-from-playlist="remove" />
        </ol>
        <div v-else class="library-empty playlist-empty">
          <p>這個歌單還沒有歌曲。</p>
          <RouterLink to="/library">前往音樂庫加入歌曲</RouterLink>
        </div>
      </template>
      <div v-else class="library-empty playlist-empty" role="status">
        <p>找不到這個歌單，可能已被刪除。</p>
        <RouterLink to="/playlists">返回我的歌單</RouterLink>
      </div>
    </section>
    <PlaylistNameDialog v-if="renaming && playlist" mode="rename" :initial-name="playlist.name" @save="rename" @close="renaming = false" />
    <BaseDialog v-if="deleting && playlist" title="刪除歌單" @close="deleting = false">
      <p class="aura-dialog__intro">確定要刪除「{{ playlist.name }}」嗎？歌單內的歌曲仍會保留在音樂庫。</p>
      <div class="aura-dialog__actions">
        <button type="button" class="aura-button aura-button--secondary" @click="deleting = false">取消</button>
        <button type="button" class="aura-button aura-button--danger" @click="confirmDelete">確認刪除</button>
      </div>
    </BaseDialog>
  </div>
</template>
