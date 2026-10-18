<script setup lang="ts">
import { ref } from 'vue'
import AppHeader from '../components/AppHeader.vue'
import AppIcon from '../components/AppIcon.vue'
import PlaylistNameDialog from '../components/PlaylistNameDialog.vue'
import { usePlaylistStore } from '../stores/playlists'
import { usePlayerStore } from '../stores/player'
import type { Playlist } from '../data/playlists'

const playlists = usePlaylistStore()
const player = usePlayerStore()
const creating = ref(false)

function coverFor(playlist: Playlist): string {
  return player.tracks.find((track) => track.id === playlist.trackIds[0])?.cover ?? '/covers/playlist-empty.svg'
}

function create(name: string) {
  if (playlists.createPlaylist(name)) creating.value = false
}
</script>

<template>
  <div class="playlists-view">
    <AppHeader home />
    <section class="playlist-page" aria-labelledby="playlists-heading">
      <RouterLink class="playlist-back" to="/library">← 返回音樂庫</RouterLink>
      <span class="eyebrow">AURA MUSIC</span>
      <div class="playlist-page__heading">
        <h1 id="playlists-heading">我的歌單</h1>
        <button type="button" class="aura-button aura-button--primary" @click="creating = true">建立歌單</button>
      </div>
      <p class="playlist-page__summary">{{ playlists.playlists.length }} 個歌單</p>
      <ul v-if="playlists.playlists.length" class="playlist-card-list">
        <li v-for="playlist in playlists.playlists" :key="playlist.id">
          <RouterLink class="playlist-card" :to="`/playlists/${playlist.id}`" :aria-label="`開啟歌單 ${playlist.name}，${playlist.trackIds.length} 首歌曲`">
            <img :src="coverFor(playlist)" :alt="`${playlist.name} 封面`" width="76" height="76" />
            <span class="playlist-card__copy"><strong>{{ playlist.name }}</strong><small>{{ playlist.trackIds.length }} 首歌曲</small></span>
            <AppIcon name="playlist" :size="20" />
          </RouterLink>
        </li>
      </ul>
      <div v-else class="library-empty playlist-empty">
        <AppIcon name="playlist" :size="32" />
        <p>還沒有歌單。建立一個歌單，收藏此刻想聽的歌曲。</p>
        <button type="button" @click="creating = true">建立第一個歌單</button>
      </div>
    </section>
    <PlaylistNameDialog v-if="creating" mode="create" @save="create" @close="creating = false" />
  </div>
</template>
