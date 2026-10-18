<script setup lang="ts">
import { computed, ref } from 'vue'
import AppHeader from '../components/AppHeader.vue'
import AppIcon from '../components/AppIcon.vue'
import TrackRow from '../components/TrackRow.vue'
import { searchTracks } from '../data/searchTracks'
import { usePlayerStore } from '../stores/player'
import AddToPlaylistDialog from '../components/AddToPlaylistDialog.vue'
import type { Track } from '../types/track'

const player = usePlayerStore()
const query = ref('')
const selectedTrack = ref<Track | null>(null)
const results = computed(() => searchTracks(player.playableTracks, query.value))
</script>

<template>
  <div class="search-view">
    <AppHeader home />
    <section class="search-section" aria-labelledby="search-heading">
      <span class="eyebrow">AURA MUSIC</span>
      <h1 id="search-heading">搜尋歌曲</h1>
      <p class="search-section__intro">依歌曲或歌手名稱探索音樂。</p>
      <div class="search-field">
        <AppIcon name="search" :size="20" />
        <input v-model="query" type="search" aria-label="搜尋歌曲或歌手" placeholder="搜尋歌曲或歌手" autocomplete="off" />
      </div>
      <div class="library-section__heading">
        <h2>{{ query.trim() ? '搜尋結果' : '全部歌曲' }}</h2>
        <span>{{ results.length }} 首歌曲</span>
      </div>
      <ol v-if="results.length" class="track-list">
        <TrackRow v-for="(track, index) in results" :key="track.id" :track="track" :index="index" playlist-action @add-to-playlist="selectedTrack = $event" />
      </ol>
      <div v-else class="library-empty" role="status">
        <p>找不到符合「{{ query.trim() }}」的歌曲或歌手。</p>
        <button type="button" @click="query = ''">清除搜尋</button>
      </div>
    </section>
    <AddToPlaylistDialog v-if="selectedTrack" :track="selectedTrack" @close="selectedTrack = null" />
  </div>
</template>
