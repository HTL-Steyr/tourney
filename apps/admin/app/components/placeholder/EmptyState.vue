<script setup lang="ts">
const search = defineModel<string | undefined>()
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <div class="mt-64 flex w-full items-center justify-center">
    <div class="max-w-96 space-y-3">
      <UIcon
        name="i-heroicons-face-frown"
        size="24"
        class="text-neutral-500 dark:text-neutral-400"
      />
      <p class="text-base font-semibold tracking-tight">{{ title }}</p>
      <p class="text-sm text-neutral-700 dark:text-neutral-500">
        {{ description }}
      </p>
      <UAlert
        v-if="search"
        icon="i-heroicons-adjustments-horizontal"
        color="secondary"
        variant="subtle"
        title="Gefiltere Ergebnisse"
        description="Es ist ein Filter aktiv. Leere die Suche, um ungefilterte Ergebnisse zu sehen."
      />
    </div>
  </div>
</template>
