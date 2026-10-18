<script setup lang="ts">
import { useRoute } from 'vue-router'
import AppIcon from './AppIcon.vue'

const route = useRoute()
const links = [
  { to: '/', label: '首頁', icon: 'home' },
  { to: '/search', label: '搜尋', icon: 'search' },
  { to: '/library', label: '音樂庫', icon: 'library' },
  { to: '/playlists', label: '我的歌單', icon: 'playlist' },
  { to: '/now-playing', label: '正在播放', icon: 'disc' },
] as const

function isActive(to: string) {
  return to === '/playlists' ? route.path.startsWith('/playlists') : route.path === to
}
</script>

<template>
  <aside class="desktop-sidebar" aria-label="桌面導覽">
    <div class="desktop-sidebar__brand"><span class="brand-mark" aria-hidden="true">✦</span><span>AURA<br /><small>MUSIC</small></span></div>
    <nav class="desktop-sidebar__nav" aria-label="主要導覽">
      <RouterLink v-for="link in links" :key="link.to" :to="link.to" class="desktop-sidebar__link"
        :class="{ 'desktop-sidebar__link--active': isActive(link.to) }" :aria-current="isActive(link.to) ? 'page' : undefined">
        <AppIcon :name="link.icon" :size="21" />
        <span>{{ link.label }}</span>
      </RouterLink>
    </nav>
    <p class="desktop-sidebar__caption">MIDNIGHT AURORA</p>
  </aside>
</template>
