<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, useId } from 'vue'

defineProps<{ title: string }>()
const emit = defineEmits<{ close: [] }>()
const dialog = ref<HTMLDialogElement | null>(null)
const titleId = useId()
let previousFocus: HTMLElement | null = null

onMounted(async () => {
  previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
  await nextTick()
  dialog.value?.showModal()
  const firstFocus = dialog.value?.querySelector<HTMLElement>('[autofocus]')
    ?? dialog.value?.querySelector<HTMLElement>('input, button')
  firstFocus?.focus()
})
onUnmounted(() => {
  if (previousFocus?.isConnected) previousFocus.focus()
})
</script>

<template>
  <dialog ref="dialog" class="aura-dialog" :aria-labelledby="titleId" @close="emit('close')">
    <div class="aura-dialog__header">
      <h2 :id="titleId">{{ title }}</h2>
      <button type="button" class="aura-dialog__close" aria-label="關閉視窗" @click="dialog?.close()">×</button>
    </div>
    <slot />
  </dialog>
</template>
