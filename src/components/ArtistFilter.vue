<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, useId } from 'vue'
import AppIcon from './AppIcon.vue'

const props = defineProps<{ artists: readonly string[] }>()
const selectedArtist = defineModel<string>({ default: '' })
const options = computed(() => [{ value: '', label: '全部歌手' }, ...props.artists.map(name => ({ value: name, label: name }))])
const selectedIndex = computed(() => Math.max(0, options.value.findIndex(option => option.value === selectedArtist.value)))
const id = useId()
const trigger = ref<HTMLButtonElement | null>(null)
const listbox = ref<HTMLElement | null>(null)
const expanded = ref(false)
const activeIndex = ref(0)
const popupStyle = ref<Record<string, string>>({})

function positionPopup() {
  if (!expanded.value || !trigger.value) return
  const bounds = trigger.value.getBoundingClientRect()
  const section = trigger.value.closest<HTMLElement>('.library-section')
  const sectionBounds = section?.getBoundingClientRect()
  const sectionStyle = section ? getComputedStyle(section) : null
  const contentLeft = Math.max(16, (sectionBounds?.left ?? 0) + Number.parseFloat(sectionStyle?.paddingLeft ?? '16'))
  const contentRight = Math.min(window.innerWidth - 16, (sectionBounds?.right ?? window.innerWidth) - Number.parseFloat(sectionStyle?.paddingRight ?? '16'))
  const width = Math.min(Math.max(bounds.width, 210), contentRight - contentLeft)
  const right = Math.min(Math.max(bounds.right, contentLeft + width), contentRight)
  const height = Math.min(options.value.length * 44 + 10, 256, window.innerHeight - 24)
  const below = window.innerHeight - bounds.bottom
  const top = below >= height + 8 || below >= bounds.top
    ? Math.min(bounds.bottom + 6, window.innerHeight - height - 12)
    : Math.max(12, bounds.top - height - 6)
  popupStyle.value = {
    left: `${right - width}px`,
    top: `${top}px`,
    width: `${width}px`,
    maxHeight: `${height}px`,
  }
}

async function open(initialIndex = selectedIndex.value) {
  activeIndex.value = initialIndex
  expanded.value = true
  await nextTick()
  positionPopup()
  listbox.value?.focus()
}

function close(restoreFocus = false) {
  expanded.value = false
  if (restoreFocus) nextTick(() => trigger.value?.focus())
}

function choose(index: number) {
  selectedArtist.value = options.value[index]?.value ?? ''
  close(true)
}

function onTriggerKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    void open(selectedIndex.value)
  }
}

function onListboxKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    const step = event.key === 'ArrowDown' ? 1 : -1
    activeIndex.value = (activeIndex.value + step + options.value.length) % options.value.length
  } else if (event.key === 'Home' || event.key === 'End') {
    event.preventDefault()
    activeIndex.value = event.key === 'Home' ? 0 : options.value.length - 1
  } else if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    choose(activeIndex.value)
  } else if (event.key === 'Escape') {
    event.preventDefault()
    close(true)
  } else if (event.key === 'Tab') {
    event.preventDefault()
    const focusable = [...document.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])')]
      .filter((element) => element !== listbox.value && element.getClientRects().length > 0)
    const current = focusable.indexOf(trigger.value!)
    const next = focusable[current + (event.shiftKey ? -1 : 1)]
    close()
    nextTick(() => next?.focus())
  }
}

function onPointerDown(event: PointerEvent) {
  if (!expanded.value) return
  const target = event.target as Node
  if (!trigger.value?.contains(target) && !listbox.value?.contains(target)) close()
}

onMounted(() => {
  document.addEventListener('pointerdown', onPointerDown)
  window.addEventListener('scroll', positionPopup, true)
  window.addEventListener('resize', positionPopup)
})
onUnmounted(() => {
  document.removeEventListener('pointerdown', onPointerDown)
  window.removeEventListener('scroll', positionPopup, true)
  window.removeEventListener('resize', positionPopup)
})
</script>

<template>
  <div class="artist-filter">
    <span class="artist-filter__label">歌手</span>
    <button
      ref="trigger"
      type="button"
      class="artist-filter__trigger"
      aria-label="依歌手篩選"
      aria-haspopup="listbox"
      :aria-expanded="expanded"
      :aria-controls="`${id}-listbox`"
      @click="expanded ? close() : open()"
      @keydown="onTriggerKeydown"
    >
      <span>{{ options[selectedIndex]?.label }}</span>
      <AppIcon name="chevron-down" :size="14" />
    </button>
    <Teleport to="body">
      <div
        v-if="expanded"
        :id="`${id}-listbox`"
        ref="listbox"
        class="artist-filter__listbox"
        role="listbox"
        aria-label="歌手"
        tabindex="-1"
        :aria-activedescendant="`${id}-option-${activeIndex}`"
        :style="popupStyle"
        @keydown="onListboxKeydown"
      >
        <div
          v-for="(option, index) in options"
          :id="`${id}-option-${index}`"
          :key="option.value"
          class="artist-filter__option"
          :class="{ 'artist-filter__option--active': activeIndex === index }"
          role="option"
          :aria-selected="selectedArtist === option.value"
          @pointermove="activeIndex = index"
          @click="choose(index)"
        >
          <span>{{ option.label }}</span>
          <span v-if="selectedArtist === option.value" aria-hidden="true" class="artist-filter__check">✓</span>
        </div>
      </div>
    </Teleport>
  </div>
</template>
