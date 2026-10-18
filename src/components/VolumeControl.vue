<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { usePlayerStore } from '../stores/player'
import AppIcon from './AppIcon.vue'

const props = defineProps<{ context: 'mini' | 'now-playing' }>()

const player = usePlayerStore()
const root = ref<HTMLElement | null>(null)
const trigger = ref<HTMLButtonElement | null>(null)
const slider = ref<HTMLInputElement | null>(null)
const open = ref(false)
const percentage = computed(() => player.isMuted ? 0 : Math.round(player.volume * 100))
const muteLabel = computed(() => player.isMuted ? '取消靜音' : '靜音')

async function togglePanel() {
  open.value = !open.value
  if (open.value) {
    await nextTick()
    slider.value?.focus()
  }
}

function onDocumentPointerDown(event: PointerEvent) {
  if (open.value && !root.value?.contains(event.target as Node)) open.value = false
}

function onDocumentKeyDown(event: KeyboardEvent) {
  if (open.value && event.key === 'Escape') {
    open.value = false
    trigger.value?.focus()
  }
}

function onVolumeInput(event: Event) {
  player.setVolume(Number((event.target as HTMLInputElement).value) / 100)
}

onMounted(() => {
  if (props.context === 'mini') {
    document.addEventListener('pointerdown', onDocumentPointerDown)
    document.addEventListener('keydown', onDocumentKeyDown)
  }
})
onUnmounted(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown)
  document.removeEventListener('keydown', onDocumentKeyDown)
})
</script>

<template>
  <div ref="root" class="volume-control" :class="`volume-control--${context}`">
    <button
      v-if="context === 'mini'"
      ref="trigger"
      class="volume-control__trigger"
      type="button"
      :aria-label="`音量設定，目前${percentage}%`"
      aria-controls="volume-panel"
      :aria-expanded="open"
      @click="togglePanel"
    >
      <AppIcon :name="percentage === 0 ? 'volume-off' : 'volume'" :size="20" />
    </button>
    <div class="volume-control__inline">
      <button class="volume-control__mute" type="button" :aria-label="muteLabel" :aria-pressed="player.isMuted" @click="player.toggleMute()">
        <AppIcon :name="percentage === 0 ? 'volume-off' : 'volume'" :size="20" />
      </button>
      <input
        class="volume-control__slider"
        type="range"
        min="0"
        max="100"
        step="1"
        :value="percentage"
        :style="{ '--volume-progress': `${percentage}%` }"
        aria-label="音量"
        :aria-valuetext="`${percentage}%`"
        @input="onVolumeInput"
      />
      <span class="volume-control__value" aria-hidden="true">{{ percentage }}%</span>
    </div>
    <div v-if="context === 'mini' && open" id="volume-panel" class="volume-control__panel" role="group" aria-label="音量設定">
      <strong class="volume-control__panel-value">{{ percentage }}%</strong>
      <input
        ref="slider"
        class="volume-control__slider volume-control__slider--vertical"
        type="range"
        min="0"
        max="100"
        step="1"
        :value="percentage"
        :style="{ '--volume-progress': `${percentage}%` }"
        aria-label="音量"
        aria-orientation="vertical"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-valuenow="percentage"
        :aria-valuetext="`${percentage}%`"
        @input="onVolumeInput"
      />
      <button class="volume-control__panel-mute" type="button" :aria-label="muteLabel" :aria-pressed="player.isMuted" :title="muteLabel" @click="player.toggleMute()">
        <AppIcon :name="percentage === 0 ? 'volume-off' : 'volume'" :size="20" />
      </button>
    </div>
  </div>
</template>
