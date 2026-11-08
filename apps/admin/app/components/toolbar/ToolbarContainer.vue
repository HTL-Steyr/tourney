<script setup lang="ts">
const { enabled, collapsed } = useAiAssistant()
</script>

<template>
  <div class="relative flex items-center gap-2" :class="{ 'pr-10': enabled }">
    <slot />
    <UButton
      v-if="enabled"
      class="absolute top-1/2 right-0 -translate-y-1/2"
      :variant="collapsed ? 'subtle' : 'soft'"
      color="tertiary"
      size="sm"
      square
      icon="i-heroicons-sparkles"
      :aria-label="
        collapsed ? 'AI-Assistent einblenden' : 'AI-Assistent ausblenden'
      "
      @click="collapsed = !collapsed"
    />
  </div>
</template>
