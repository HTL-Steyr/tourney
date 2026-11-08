<script lang="ts" setup>
const { title } = defineProps<{
  title?: string
}>()

const titleUppercase = computed(() => title?.toUpperCase() || "")
</script>

<template>
  <UDashboardNavbar
    :title="titleUppercase || undefined"
    :toggle="{ color: 'neutral', variant: 'ghost', size: 'sm' }"
    :ui="{
      root: '!h-auto min-h-0 rounded-t-md bg-white px-4 py-2 text-sm text-neutral-950 sm:px-6 dark:bg-neutral-900 dark:text-neutral-100',
      title: 'font-mono font-medium text-sm leading-none',
      left: 'gap-2',
      right: 'min-w-0 flex-1 justify-end gap-2',
    }"
  >
    <template #right>
      <slot />
    </template>
  </UDashboardNavbar>
</template>
