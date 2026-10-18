<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import AppIcon from '../components/AppIcon.vue'
import TrackRow from '../components/TrackRow.vue'
import { usePlayerStore } from '../stores/player'
import type { Track } from '../types/track'

const router = useRouter()
const player = usePlayerStore()
const featuredTrack = computed(() =>
  player.playableTracks.find((track) => track.id === 'mesmerizing-galaxy') ?? player.playableTracks[0],
)
const recommendedIds = ['serious-play', 'hidden-glade', 'toronto', 'ice-flow']
const recommendedTracks = computed(() =>
  recommendedIds.map((id) => player.playableTracks.find((track) => track.id === id)).filter((track): track is Track => Boolean(track)),
)

function playTrack(track: Track) {
  player.selectLibraryTrack(track)
  void router.push('/now-playing')
}
</script>

<template>
  <div class="home-view">
    <AppHeader home />
    <div class="home-view__content">
      <div class="home-intro">
        <span class="eyebrow">AURA MUSIC</span>
        <h1>探索你的音樂世界</h1>
        <p>從此刻開始，找到陪伴你的聲音。</p>
      </div>

      <section class="home-section" aria-labelledby="home-featured-heading">
        <div class="home-section__heading">
          <h2 id="home-featured-heading">本週精選</h2>
          <span>細聽此刻</span>
        </div>
        <div v-if="featuredTrack" class="featured-track">
          <button
            class="featured-track__play"
            type="button"
            :aria-label="`立即播放 ${featuredTrack.title}，演出者 ${featuredTrack.artist}`"
            @click="playTrack(featuredTrack)"
          >
            <img :src="featuredTrack.cover" :alt="`${featuredTrack.title} 的抽象封面`" width="136" height="136" />
            <span class="featured-track__copy">
              <span class="featured-track__eyebrow">本週精選歌曲</span>
              <strong>{{ featuredTrack.displayTitle ?? featuredTrack.title }}</strong>
              <span class="featured-track__artist">{{ featuredTrack.artist }}</span>
              <span class="featured-track__action"><AppIcon name="play" :size="15" />立即播放</span>
            </span>
          </button>
          <button class="home-favorite icon-button" type="button"
            :aria-label="player.isFavorite(featuredTrack.id) ? `將 ${featuredTrack.title} 移出我的最愛` : `將 ${featuredTrack.title} 加入我的最愛`"
            :aria-pressed="player.isFavorite(featuredTrack.id)"
            @click="player.toggleFavorite(featuredTrack.id)">
            <AppIcon name="heart" :size="20" :filled="player.isFavorite(featuredTrack.id)" />
          </button>
        </div>
      </section>

      <section class="home-section" aria-labelledby="home-recommended-heading">
        <div class="home-section__heading">
          <h2 id="home-recommended-heading">為你推薦</h2>
          <span>音樂庫精選</span>
        </div>
        <ul class="recommended-tracks" aria-label="推薦歌曲，橫向捲動">
          <li v-for="track in recommendedTracks" :key="track.id">
            <div class="recommended-track">
              <button class="recommended-track__play" type="button"
                :aria-label="`播放 ${track.title}，演出者 ${track.artist}`"
                @click="playTrack(track)">
                <img :src="track.cover" :alt="`${track.title} 的抽象封面`" width="126" height="126" loading="lazy" />
                <strong>{{ track.displayTitle ?? track.title }}</strong>
                <span>{{ track.artist }}</span>
              </button>
              <button class="home-favorite icon-button" type="button"
                :aria-label="player.isFavorite(track.id) ? `將 ${track.title} 移出我的最愛` : `將 ${track.title} 加入我的最愛`"
                :aria-pressed="player.isFavorite(track.id)"
                @click="player.toggleFavorite(track.id)">
                <AppIcon name="heart" :size="18" :filled="player.isFavorite(track.id)" />
              </button>
            </div>
          </li>
        </ul>
      </section>

      <section class="home-section home-section--recent" aria-labelledby="home-recent-heading">
        <div class="home-section__heading">
          <h2 id="home-recent-heading">最近播放</h2>
          <span v-if="player.recentlyPlayedTracks.length">{{ player.recentlyPlayedTracks.length }} 首歌曲</span>
        </div>
        <ol v-if="player.recentlyPlayedTracks.length" class="track-list">
          <TrackRow
            v-for="(track, index) in player.recentlyPlayedTracks"
            :key="track.id"
            :track="track"
            :index="index"
          />
        </ol>
        <div v-else class="home-recent-empty">
          <p>還沒有播放紀錄。從喜歡的歌曲開始聆聽吧。</p>
          <RouterLink to="/library">前往音樂庫</RouterLink>
        </div>
      </section>

      <RouterLink v-if="player.recentlyPlayedTracks.length" class="home-library-link" to="/library">
        前往音樂庫 <AppIcon name="library" :size="18" />
      </RouterLink>
    </div>
  </div>
</template>
