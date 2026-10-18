<script setup lang="ts">
import { useRouter } from 'vue-router'
import AppIcon from './AppIcon.vue'

defineProps<{ player?: boolean; home?: boolean }>()
const router = useRouter()
</script>

<template>
  <header class="app-header">
    <div class="app-header__inner">
      <div class="brand-line">
        <span class="brand-mark" aria-hidden="true">✦</span><span>AURA</span>
      </div>
      <span class="profile-mark" aria-hidden="true">A</span>
    </div>
  </header>
  <div v-if="player" class="player-strip">
    <button
      class="icon-button player-strip__back"
      type="button"
      aria-label="返回音樂庫"
      @click="router.push('/library')"
    >
      <AppIcon name="chevron-down" :size="22" />
    </button>
    <div class="player-strip__text">
      <span>正在播放</span
      ><small><i aria-hidden="true"></i> AURA MUSIC</small>
    </div>
    <span class="player-strip__spacer" aria-hidden="true"></span>
  </div>
  <div v-else-if="!home" class="library-header">
    <div class="library-header__heading">
      <div>
        <span class="eyebrow">AURA MUSIC</span>
        <h1>我的音樂庫</h1>
      </div>
      <span
        class="library-header__decor"
        aria-label="新增歌曲即將推出"
        >+<small>即將推出</small></span
      >
    </div>
  </div>
</template>
