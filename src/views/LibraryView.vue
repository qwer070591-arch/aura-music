<script setup lang="ts">
import { computed, ref } from 'vue'
import { usePlayerStore } from '../stores/player'
import AppHeader from '../components/AppHeader.vue'
import TrackRow from '../components/TrackRow.vue'
import AppIcon from '../components/AppIcon.vue'
import { searchTracks } from '../data/searchTracks'
import AddToPlaylistDialog from '../components/AddToPlaylistDialog.vue'
import ArtistFilter from '../components/ArtistFilter.vue'
import type { Track } from '../types/track'

const player = usePlayerStore()
const filter = ref<'all' | 'favorites'>('all')
const artist = ref('')
const query = ref('')
const selectedTrack = ref<Track | null>(null)
const artists = computed(() => [...new Set(player.playableTracks.map((track) => track.artist))])
const visibleTracks = computed(() => searchTracks(player.playableTracks, query.value).filter((track) =>
  (filter.value !== 'favorites' || player.isFavorite(track.id)) &&
  (!artist.value || track.artist === artist.value),
))
</script>

<template>
  <div class="library-view">
    <AppHeader />
    <section class="library-section" aria-labelledby="library-tracks-heading">
      <div class="search-field library-search-field">
        <AppIcon name="search" :size="20" />
        <input v-model="query" type="search" aria-label="在音樂庫搜尋歌曲或歌手" placeholder="搜尋歌曲或歌手" autocomplete="off" />
      </div>
      <div class="filter-row" role="group" aria-label="音樂庫分類與篩選">
        <button class="filter-pill" :class="{ 'filter-pill--active': filter === 'all' }" type="button" :aria-pressed="filter === 'all'" @click="filter = 'all'">全部歌曲</button>
        <button class="filter-pill" :class="{ 'filter-pill--active': filter === 'favorites' }" type="button" :aria-pressed="filter === 'favorites'" @click="filter = 'favorites'">我的收藏</button>
        <RouterLink class="filter-pill filter-pill--link" to="/playlists">我的歌單</RouterLink>
        <ArtistFilter v-model="artist" :artists="artists" />
      </div>
      <div class="library-section__heading">
        <h2 id="library-tracks-heading">{{ filter === 'favorites' ? '我的收藏' : '最近加入' }}</h2>
        <span>{{ visibleTracks.length }} 首歌曲</span>
      </div>
      <p v-if="player.status === 'error'" class="playback-status library-playback-status" role="status">
        {{ player.errorMessage }}
        <button type="button" @click="player.play()">重試</button>
      </p>
      <ol v-if="visibleTracks.length" class="track-list">
        <TrackRow v-for="(track, index) in visibleTracks" :key="track.id" :track="track" :index="index" playlist-action @add-to-playlist="selectedTrack = $event" />
      </ol>
      <div v-else class="library-empty" role="status">
        <p>目前沒有符合條件的歌曲。</p>
        <button type="button" @click="filter = 'all'; artist = ''; query = ''">顯示全部歌曲</button>
      </div>
    </section>
    <AddToPlaylistDialog v-if="selectedTrack" :track="selectedTrack" @close="selectedTrack = null" />
  </div>
</template>
