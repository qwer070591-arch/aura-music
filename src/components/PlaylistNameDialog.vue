<script setup lang="ts">
import { ref, watch } from 'vue'
import { normalizePlaylistName } from '../data/playlists'
import BaseDialog from './BaseDialog.vue'

const props = defineProps<{ mode: 'create' | 'rename'; initialName?: string }>()
const emit = defineEmits<{ save: [name: string]; close: [] }>()
const value = ref(props.initialName ?? '')
const error = ref('')

watch(value, () => { error.value = '' })

function submit() {
  if (!value.value.trim()) {
    error.value = '請輸入歌單名稱。'
    return
  }
  const name = normalizePlaylistName(value.value)
  if (!name) {
    error.value = '歌單名稱最多 40 個字元。'
    return
  }
  emit('save', name)
}
</script>

<template>
  <BaseDialog :title="mode === 'create' ? '建立歌單' : '重新命名歌單'" @close="emit('close')">
    <form class="playlist-form" @submit.prevent="submit">
      <label for="playlist-name-input">歌單名稱</label>
      <input id="playlist-name-input" v-model="value" type="text" autocomplete="off" autofocus aria-describedby="playlist-name-help playlist-name-error" />
      <p id="playlist-name-help" class="playlist-form__hint">最多 40 個字元，建立後仍可修改。</p>
      <p id="playlist-name-error" class="playlist-form__error" role="alert">{{ error }}</p>
      <div class="aura-dialog__actions">
        <button type="button" class="aura-button aura-button--secondary" @click="emit('close')">取消</button>
        <button type="submit" class="aura-button aura-button--primary">{{ mode === 'create' ? '建立' : '儲存' }}</button>
      </div>
    </form>
  </BaseDialog>
</template>
