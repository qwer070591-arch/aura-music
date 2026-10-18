<script setup lang="ts">
import { usePlayerStore } from '../stores/player'
import AppHeader from '../components/AppHeader.vue'
import CircularProgress from '../components/CircularProgress.vue'
import SeekBar from '../components/SeekBar.vue'
import VinylRecord from '../components/VinylRecord.vue'
import TrackInfo from '../components/TrackInfo.vue'
import PlaybackControls from '../components/PlaybackControls.vue'

const player = usePlayerStore()
</script>

<template>
  <div class="now-playing-view">
    <AppHeader player />
    <section class="now-playing-view__content" aria-label="正在播放">
      <div class="record-stage" :style="{ '--cover-accent': player.currentTrack.accent }">
        <CircularProgress :progress="player.progress">
          <VinylRecord
            :cover="player.currentTrack.cover"
            :title="player.currentTrack.title"
            :is-playing="player.isPlaying"
          />
        </CircularProgress>
      </div>
      <SeekBar />
      <TrackInfo /><PlaybackControls />
      <p v-if="player.queue.source === 'playlist'" class="playing-source">來自：{{ player.queue.playlistName }}</p>
      <p v-if="player.status !== 'ready'" class="playback-status" role="status">
        {{
          player.status === 'loading'
            ? '載入中…'
            : player.status === 'buffering'
              ? '緩衝中…'
              : player.status === 'unavailable'
                ? '無可用音源'
                : player.errorMessage
        }}
        <button v-if="player.status === 'error'" type="button" @click="player.play()">重試</button>
      </p>
      <details class="music-credits">
        <summary>音樂授權資訊</summary>
        <p v-if="player.currentTrack.sourcePage">
          正式曲名：{{ player.currentTrack.title }} — {{ player.currentTrack.artist }}{{ player.currentTrack.sourcePage?.includes('incompetech.com') ? ' (incompetech.com)' : '' }}。
          授權：<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>；音檔未修改。
          <a :href="player.currentTrack.sourcePage" target="_blank" rel="noopener noreferrer">官方曲目頁</a>。
        </p>
      </details>
      <div class="player-utilities" aria-label="即將推出的功能">
        <span>歌詞 <small>即將推出</small></span>
        <span>接下來播放 <small>即將推出</small></span>
      </div>
    </section>
  </div>
</template>
