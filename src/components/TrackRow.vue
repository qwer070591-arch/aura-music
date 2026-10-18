<script setup lang="ts">
import { computed } from 'vue'
import { usePlayerStore } from '../stores/player'
import type { Track } from '../types/track'
import type { PlaylistQueueInput } from '../stores/player'
import AppIcon from './AppIcon.vue'

const props = withDefaults(defineProps<{ track: Track; index: number; playlistAction?: boolean; removeAction?: boolean; playlistContext?: PlaylistQueueInput }>(), {
  playlistAction: false,
  removeAction: false,
})
const emit = defineEmits<{ addToPlaylist: [track: Track]; removeFromPlaylist: [track: Track] }>()
const player = usePlayerStore()
const selected = computed(() => player.currentTrack.id === props.track.id)
const favorite = computed(() => player.isFavorite(props.track.id))
const formattedDuration = computed(() => {
  const seconds = player.durationForTrack(props.track.id)
  if (!Number.isFinite(seconds) || seconds <= 0) return '--:--'
  const whole = Math.round(seconds)
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`
})
function playTrack() {
  if (props.playlistContext) player.startPlaylist(props.playlistContext, props.track.id)
  else player.selectLibraryTrack(props.track)
}
</script>

<template>
  <li class="track-row" :class="{ 'track-row--selected': selected, 'track-row--actions': playlistAction || removeAction }">
    <button
      class="track-row__select"
      type="button"
      :aria-label="`播放 ${track.title}，演出者 ${track.artist}`"
      :aria-current="selected ? 'true' : undefined"
      @click="playTrack"
    >
      <span
        v-if="selected"
        class="track-row__equalizer"
        :class="{ 'track-row__equalizer--playing': player.isPlaying }"
        aria-hidden="true"
        ><i></i><i></i><i></i></span
      ><span v-else class="track-row__number">{{
        String(index + 1).padStart(2, '0')
      }}</span
      ><img
        class="track-row__cover"
        :src="track.cover"
        :alt="`${track.title} 的抽象封面`"
        width="48"
        height="48"
        loading="lazy"
      /><span class="track-row__copy"
        ><strong>{{ track.displayTitle ?? track.title }}</strong
        ><span>{{ track.artist }}</span></span
      ><span class="track-row__duration">{{ formattedDuration }}</span>
    </button>
    <button v-if="playlistAction" class="track-row__playlist icon-button" type="button"
      :aria-label="`將 ${track.title} 加入歌單`" @click="emit('addToPlaylist', track)">
      <AppIcon name="playlist" :size="19" />
    </button>
    <button v-if="removeAction" class="track-row__remove icon-button" type="button"
      :aria-label="`從歌單移除 ${track.title}`" @click="emit('removeFromPlaylist', track)">−</button>
    <button
      class="track-row__favorite icon-button"
      type="button"
      :aria-label="
        favorite
          ? `將 ${track.title} 移出我的最愛`
          : `將 ${track.title} 加入我的最愛`
      "
      :aria-pressed="favorite"
      @click="player.toggleFavorite(track.id)"
    >
      <AppIcon name="heart" :size="20" :filled="favorite" />
    </button>
  </li>
</template>
