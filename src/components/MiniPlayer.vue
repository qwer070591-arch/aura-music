<script setup lang="ts">
import { useRouter } from 'vue-router'
import { usePlayerStore } from '../stores/player'
import AppIcon from './AppIcon.vue'

const router = useRouter()
const player = usePlayerStore()
</script>

<template>
  <aside class="mini-player" aria-label="目前歌曲">
    <div class="mini-player__progress" aria-hidden="true">
      <span :style="{ width: `${player.progress * 100}%` }"></span>
    </div>
    <button
      class="mini-player__open"
      type="button"
      aria-label="開啟正在播放"
      @click="router.push('/now-playing')"
    >
      <img
        :src="player.currentTrack.cover"
        :alt="`${player.currentTrack.title} 的抽象封面`"
        width="40"
        height="40"
      /><span class="mini-player__copy"
        ><span class="mini-player__title"><strong>{{ player.currentTrack.displayTitle ?? player.currentTrack.title }}</strong><AppIcon v-if="player.isFavorite(player.currentTrack.id)" name="heart" :size="12" filled /></span
        ><span>{{ player.currentTrack.artist }}</span></span
      ></button
    ><button
      class="mini-player__play"
      type="button"
      :aria-label="
        player.isPlaying
          ? '暫停'
          : player.status === 'error'
            ? '重試播放'
            : '播放'
      "
      :aria-pressed="player.isPlaying"
      @click="player.togglePlay()"
    >
      <AppIcon :name="player.isPlaying ? 'pause' : 'play'" :size="20" /></button
    ><button
      class="mini-player__next"
      type="button"
      aria-label="下一首"
      @click="player.nextTrack()"
    >
      <AppIcon name="next" :size="20" />
    </button>
  </aside>
</template>
