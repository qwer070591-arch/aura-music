<script setup lang="ts">
import { ref } from 'vue'
import { usePlaylistStore } from '../stores/playlists'
import type { Track } from '../types/track'
import BaseDialog from './BaseDialog.vue'
import PlaylistNameDialog from './PlaylistNameDialog.vue'

const props = defineProps<{ track: Track }>()
const emit = defineEmits<{ close: [] }>()
const playlists = usePlaylistStore()
const creating = ref(false)
const message = ref('')

function add(playlistId: string) {
  const result = playlists.addTrack(playlistId, props.track.id)
  message.value = result === 'added' ? '已加入歌單。' : result === 'exists' ? '這首歌曲已在歌單中。' : '無法加入歌單。'
}

function create(name: string) {
  const playlist = playlists.createPlaylist(name)
  if (playlist) playlists.addTrack(playlist.id, props.track.id)
  emit('close')
}
</script>

<template>
  <BaseDialog v-if="!creating" :title="`將 ${track.displayTitle ?? track.title} 加入歌單`" @close="emit('close')">
    <p class="aura-dialog__intro">選擇歌單，歌曲會加入其中。</p>
    <div v-if="playlists.playlists.length" class="playlist-choice-list">
      <button v-for="playlist in playlists.playlists" :key="playlist.id" type="button"
        :disabled="playlist.trackIds.includes(track.id)" @click="add(playlist.id)">
        <span><strong>{{ playlist.name }}</strong><small>{{ playlist.trackIds.length }} 首歌曲</small></span>
        <span class="playlist-choice-list__state">{{ playlist.trackIds.includes(track.id) ? '已加入' : '加入' }}</span>
      </button>
    </div>
    <p v-else class="aura-dialog__intro">尚未建立歌單。可以先建立新歌單。</p>
    <p v-if="message" class="playlist-action-message" role="status">{{ message }}</p>
    <div class="aura-dialog__actions">
      <button type="button" class="aura-button aura-button--secondary" @click="emit('close')">完成</button>
      <button type="button" class="aura-button aura-button--primary" @click="creating = true">建立新歌單</button>
    </div>
  </BaseDialog>
  <PlaylistNameDialog v-else mode="create" @save="create" @close="creating = false" />
</template>
