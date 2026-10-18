<script setup lang="ts">
import { computed } from 'vue'
import { usePlayerStore } from '../stores/player'
import AppIcon from './AppIcon.vue'

const player = usePlayerStore()
const favorite = computed(() => player.isFavorite(player.currentTrack.id))
</script>

<template>
  <div class="track-info">
    <div class="track-info__copy">
      <div class="track-info__title">
        <h1>{{ player.currentTrack.displayTitle ?? player.currentTrack.title }}</h1>
        <span>CC BY 4.0</span>
      </div>
      <p>{{ player.currentTrack.artist }}</p>
    </div>
    <button
      class="icon-button track-info__favorite"
      type="button"
      :aria-label="favorite ? '移出我的最愛' : '加入我的最愛'"
      :aria-pressed="favorite"
      @click="player.toggleFavorite(player.currentTrack.id)"
    >
      <AppIcon name="heart" :size="23" :filled="favorite" />
    </button>
  </div>
</template>
