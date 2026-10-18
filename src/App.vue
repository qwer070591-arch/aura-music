<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import BottomNavigation from './components/BottomNavigation.vue'
import DesktopSidebar from './components/DesktopSidebar.vue'
import MiniPlayer from './components/MiniPlayer.vue'

const route = useRoute()
const showMiniPlayer = computed(() => ['library', 'home', 'search', 'playlists', 'playlist-detail'].includes(String(route.name)))
</script>

<template>
  <div class="app-shell" :class="{ 'app-shell--with-mini': showMiniPlayer }">
    <DesktopSidebar />
    <main id="main-content"><RouterView /></main>
    <MiniPlayer v-if="showMiniPlayer" /><BottomNavigation />
  </div>
</template>
