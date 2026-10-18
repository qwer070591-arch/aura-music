<script setup lang="ts">
import AppIcon from './AppIcon.vue'
</script>

<template>
  <nav class="bottom-nav" aria-label="主要導覽">
    <RouterLink
      to="/"
      class="bottom-nav__item"
      active-class="bottom-nav__item--active"
      aria-label="首頁"
      title="首頁"
      ><AppIcon name="home" :size="22"
    /></RouterLink>
    <RouterLink
      to="/search"
      class="bottom-nav__item"
      active-class="bottom-nav__item--active"
      aria-label="搜尋"
      title="搜尋"
      ><AppIcon name="search" :size="22"
    /></RouterLink>
    <RouterLink
      to="/library"
      class="bottom-nav__item"
      active-class="bottom-nav__item--active"
      aria-label="我的音樂庫"
      title="我的音樂庫"
      ><AppIcon name="library" :size="22"
    /></RouterLink>
    <RouterLink
      to="/now-playing"
      class="bottom-nav__item"
      active-class="bottom-nav__item--active"
      aria-label="正在播放"
      title="正在播放"
      ><AppIcon name="disc" :size="23"
    /></RouterLink>
  </nav>
</template>
