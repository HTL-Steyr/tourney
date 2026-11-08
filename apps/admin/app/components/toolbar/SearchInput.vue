<script setup lang="ts">
const model = defineModel<string>()
const { placeholder = "Suchen..." } = defineProps<{
  placeholder?: string
}>()
</script>

<template>
  <UInput
    v-model="model"
    icon="i-heroicons-magnifying-glass-20-solid"
    :placeholder
    size="sm"
  />
</template>
