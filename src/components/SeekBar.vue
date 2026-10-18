<script setup lang="ts">
import { computed, ref } from 'vue'
import { usePlayerStore } from '../stores/player'

const player = usePlayerStore()
const dragging = ref(false)
const preview = ref(0)
const shownTime = computed(() =>
  dragging.value ? preview.value : player.currentTime,
)
const shownProgress = computed(() =>
  player.duration > 0 ? shownTime.value / player.duration : 0,
)
const atEnd = computed(() => player.duration > 0 && shownTime.value >= player.duration)
const formatTime = (seconds: number, total = false) => {
  const whole = total ? Math.round(seconds) : Math.floor(seconds)
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`
}

function onInput(event: Event) {
  preview.value = Number((event.target as HTMLInputElement).value)
  if (!dragging.value) player.seek(preview.value)
}
function beginDrag() {
  dragging.value = true
  preview.value = player.currentTime
}
function commit() {
  if (!dragging.value) return
  dragging.value = false
  player.seek(preview.value)
}
</script>

<template>
  <div class="seek-bar">
    <input
      class="seek-bar__input"
      type="range"
      min="0"
      :max="player.duration"
      step="1"
      :value="shownTime"
      :disabled="!player.canSeek"
      :style="{ '--seek-progress': `${shownProgress * 100}%` }"
      :aria-valuetext="`${formatTime(shownTime, atEnd)}，總長 ${formatTime(player.duration, true)}`"
      aria-label="播放進度"
      @pointerdown="beginDrag"
      @pointerup="commit"
      @pointercancel="commit"
      @change="commit"
      @input="onInput"
    />
    <div class="time-row" aria-hidden="true">
      <span>{{ formatTime(shownTime, atEnd) }}</span>
      <span>{{ formatTime(player.duration, true) }}</span>
    </div>
  </div>
</template>
