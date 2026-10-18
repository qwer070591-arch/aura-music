<script setup lang="ts">
defineProps<{ cover: string; title: string; isPlaying: boolean }>()
</script>

<template>
  <div
    class="vinyl-record"
    :class="{ 'vinyl-record--playing': isPlaying }"
    role="img"
    :aria-label="`黑膠唱片中央為 ${title} 的抽象封面`"
  >
    <div class="vinyl-record__grooves"></div>
    <div class="vinyl-record__label">
      <img :src="cover" alt="" width="160" height="160" />
    </div>
    <div class="vinyl-record__hole"></div>
  </div>
</template>
