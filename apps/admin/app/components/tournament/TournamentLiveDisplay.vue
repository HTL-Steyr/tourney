<script setup lang="ts">
defineProps<{
  isLive: boolean
}>()
</script>

<template>
  <div
    v-if="isLive"
    class="ring-opacity-25 dark:bg-opacity-10 dark:ring-opacity-25 flex items-center space-x-1.5 rounded-md bg-transparent px-2 py-1 ring-1 ring-red-400 ring-inset dark:bg-neutral-900"
  >
    <span class="relative flex h-2 w-2">
      <span
        class="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"
      ></span>
      <span class="relative inline-flex h-2 w-2 rounded-full bg-red-400"></span>
    </span>
    <p class="text-xs font-medium text-red-400">Live</p>
  </div>
  <UBadge label="Inaktiv" color="neutral" variant="outline" v-else />
</template>
