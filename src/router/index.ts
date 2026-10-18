import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
      meta: { title: '首頁' },
    },
    {
      path: '/library',
      name: 'library',
      component: () => import('../views/LibraryView.vue'),
      meta: { title: '我的音樂庫' },
    },
    {
      path: '/search',
      name: 'search',
      component: () => import('../views/SearchView.vue'),
      meta: { title: '搜尋' },
    },
    {
      path: '/now-playing',
      name: 'now-playing',
      component: () => import('../views/NowPlayingView.vue'),
      meta: { title: '正在播放' },
    },
    {
      path: '/playlists',
      name: 'playlists',
      component: () => import('../views/PlaylistsView.vue'),
      meta: { title: '我的歌單' },
    },
    {
      path: '/playlists/:id',
      name: 'playlist-detail',
      component: () => import('../views/PlaylistDetailView.vue'),
      meta: { title: '歌單詳情' },
    },
  ],
})

router.afterEach((to) => {
  document.title = `${String(to.meta.title)} · AURA MUSIC`
})

export default router
