<script setup lang="ts">
import { usePlayerStore } from '../stores/player'
import AppIcon from './AppIcon.vue'

const player = usePlayerStore()
</script>

<template>
  <div class="playback-controls" aria-label="播放控制">
    <button
      class="playback-controls__skip"
      type="button"
      aria-label="上一首"
      @click="player.previousTrack()"
    >
      <AppIcon name="previous" :size="24" />
    </button>
    <button
      class="playback-controls__main"
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
      <AppIcon :name="player.isPlaying ? 'pause' : 'play'" :size="29" />
    </button>
    <button
      class="playback-controls__skip"
      type="button"
      aria-label="下一首"
      @click="player.nextTrack()"
    >
      <AppIcon name="next" :size="24" />
    </button>
  </div>
  <div class="playback-modes" aria-label="播放模式">
    <button
      type="button"
      :aria-pressed="player.shuffle"
      :class="{ 'is-active': player.shuffle }"
      aria-label="隨機播放"
      @click="player.toggleShuffle()"
    >
      隨機播放
    </button>
    <button
      type="button"
      :aria-label="`循環播放：${player.repeat === 'off' ? '關閉' : player.repeat === 'all' ? '全部循環' : '單曲循環'}；點選切換模式`"
      :aria-pressed="player.repeat !== 'off'"
      :class="{ 'is-active': player.repeat !== 'off' }"
      @click="player.cycleRepeat()"
    >
      {{ player.repeat === 'off' ? '循環關閉' : player.repeat === 'all' ? '全部循環' : '單曲循環' }}
    </button>
  </div>
</template>
