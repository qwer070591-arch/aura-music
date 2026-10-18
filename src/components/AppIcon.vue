<script setup lang="ts">
defineProps<{
  name:
    | 'library'
    | 'disc'
    | 'playlist'
    | 'home'
    | 'search'
    | 'chevron-down'
    | 'heart'
    | 'play'
    | 'pause'
    | 'previous'
    | 'next'
    | 'music'
  size?: number
  filled?: boolean
}>()
</script>

<template>
  <svg
    :width="size ?? 24"
    :height="size ?? 24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <template v-if="name === 'library'">
      <path d="M3 5.5h4v13H3zM9 5.5h4v13H9zM15.5 7l3.3-.8 2.4 11.7-3.3.7z" />
    </template>
    <template v-else-if="name === 'disc'">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2" />
      <path d="M12 3a9 9 0 0 1 9 9" />
    </template>
    <template v-else-if="name === 'playlist'">
      <path d="M3 6h12M3 11h12M3 16h8M18 11v8a2 2 0 1 1-2-2c.7 0 1.4.2 2 .7" />
    </template>
    <path
      v-else-if="name === 'home'"
      d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"
    />
    <template v-else-if="name === 'search'">
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="m16 16 5 5" />
    </template>
    <path v-else-if="name === 'chevron-down'" d="m5 9 7 7 7-7" />
    <path
      v-else-if="name === 'heart'"
      d="M20.8 8.5c0 4.1-5.5 8.3-8.8 10.5-3.3-2.2-8.8-6.4-8.8-10.5a5 5 0 0 1 8.8-3.2 5 5 0 0 1 8.8 3.2Z"
      :fill="filled ? 'currentColor' : 'none'"
    />
    <path
      v-else-if="name === 'play'"
      d="m8 5 11 7-11 7z"
      fill="currentColor"
      stroke="none"
    />
    <template v-else-if="name === 'pause'">
      <rect
        x="6.5"
        y="5"
        width="4"
        height="14"
        rx="1"
        fill="currentColor"
        stroke="none"
      />
      <rect
        x="13.5"
        y="5"
        width="4"
        height="14"
        rx="1"
        fill="currentColor"
        stroke="none"
      />
    </template>
    <template v-else-if="name === 'previous'">
      <path d="M5 5v14M18 5 7 12l11 7z" fill="currentColor" stroke="none" />
    </template>
    <template v-else-if="name === 'next'">
      <path d="M19 5v14M6 5l11 7-11 7z" fill="currentColor" stroke="none" />
    </template>
    <template v-else-if="name === 'music'">
      <path
        d="M9 17V5l11-2v12M9 17a3 3 0 1 1-3-3c1 0 2 .3 3 1M20 15a3 3 0 1 1-3-3c1 0 2 .3 3 1"
      />
    </template>
  </svg>
</template>
