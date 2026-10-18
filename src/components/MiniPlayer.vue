<script setup lang="ts">
import { useRouter } from 'vue-router'
import { usePlayerStore } from '../stores/player'
import AppIcon from './AppIcon.vue'
import SeekBar from './SeekBar.vue'
import VolumeControl from './VolumeControl.vue'

const router = useRouter()
const player = usePlayerStore()
</script>

<template>
  <aside class="mini-player" aria-label="目前歌曲">
    <div class="mini-player__progress" aria-hidden="true">
      <span :style="{ width: `${player.progress * 100}%` }"></span>
    </div>
    <div class="mini-player__left">
      <button class="mini-player__open" type="button" aria-label="開啟正在播放" @click="router.push('/now-playing')">
        <img :src="player.currentTrack.cover" :alt="`${player.currentTrack.title} 的抽象封面`" width="40" height="40" />
        <span class="mini-player__copy">
          <span class="mini-player__title"><strong>{{ player.currentTrack.displayTitle ?? player.currentTrack.title }}</strong><AppIcon v-if="player.isFavorite(player.currentTrack.id)" name="heart" :size="12" filled /></span>
          <span>{{ player.currentTrack.artist }}</span>
        </span>
      </button>
      <button class="mini-player__favorite" type="button"
        :aria-label="player.isFavorite(player.currentTrack.id) ? '取消收藏目前歌曲' : '收藏目前歌曲'"
        :aria-pressed="player.isFavorite(player.currentTrack.id)"
        @click="player.toggleFavorite(player.currentTrack.id)">
        <AppIcon name="heart" :size="20" :filled="player.isFavorite(player.currentTrack.id)" />
      </button>
    </div>
    <div class="mini-player__center">
      <div class="mini-player__transport">
        <button class="mini-player__previous" type="button" aria-label="上一首" @click="player.previousTrack()">
          <AppIcon name="previous" :size="20" />
        </button>
        <button class="mini-player__play" type="button"
          :aria-label="player.isPlaying ? '暫停' : player.status === 'error' ? '重試播放' : '播放'"
          :aria-pressed="player.isPlaying" @click="player.togglePlay()">
          <AppIcon :name="player.isPlaying ? 'pause' : 'play'" :size="20" />
        </button>
        <button class="mini-player__next" type="button" aria-label="下一首" @click="player.nextTrack()">
          <AppIcon name="next" :size="20" />
        </button>
      </div>
      <SeekBar class="mini-player__seek" />
    </div>
    <div class="mini-player__right">
      <VolumeControl context="mini" />
      <span class="mini-player__status">{{ player.status === 'error' ? '播放失敗' : player.status === 'loading' ? '載入中' : player.status === 'buffering' ? '緩衝中' : player.isPlaying ? '正在播放' : '已暫停' }}</span>
    </div>
  </aside>
</template>
