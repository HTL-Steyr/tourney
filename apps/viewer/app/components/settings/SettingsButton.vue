<script setup lang="ts">
const { size = "lg" } = defineProps<{
  size?: "xs" | "sm" | "md" | "lg" | "xl"
}>()
</script>

<template>
  <UButton
    variant="soft"
    color="neutral"
    to="/settings"
    :size="size"
    square
    icon="i-heroicons-cog-8-tooth"
  />
</template>
