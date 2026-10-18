<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ progress: number }>()
const radius = 172
const circumference = 2 * Math.PI * radius
const offset = computed(
  () => circumference * (1 - Math.min(1, Math.max(0, props.progress))),
)
</script>

<template>
  <div
    class="circular-progress"
    role="progressbar"
    :aria-valuenow="Math.round(progress * 100)"
    aria-valuemin="0"
    aria-valuemax="100"
    aria-label="歌曲進度"
  >
    <svg
      class="circular-progress__ring"
      viewBox="0 0 380 380"
      aria-hidden="true"
    >
      <circle cx="190" cy="190" :r="radius" class="circular-progress__track" />
      <circle
        cx="190"
        cy="190"
        :r="radius"
        class="circular-progress__value"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="offset"
      />
    </svg>
    <div class="circular-progress__content"><slot /></div>
  </div>
</template>
