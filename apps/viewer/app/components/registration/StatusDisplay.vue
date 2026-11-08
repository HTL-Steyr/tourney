<script setup lang="ts">
defineProps<{
  status: string
}>()
</script>

<template>
  <UBadge
    v-if="status === 'Ausstehend'"
    :label="status"
    color="neutral"
    variant="outline"
    class="!bg-white !text-neutral-700 ring-1 ring-neutral-200 dark:!bg-neutral-950 dark:!text-neutral-200 dark:ring-neutral-800"
  />
  <UBadge
    v-else-if="status === 'Abgesendet'"
    :label="status"
    color="warning"
    variant="subtle"
  />
  <UBadge
    v-else-if="status === 'Abgeschlossen'"
    :label="status"
    color="success"
    variant="subtle"
  />
  <UBadge v-else :label="status" color="error" variant="subtle" />
</template>
