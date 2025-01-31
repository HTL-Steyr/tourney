<script setup lang="ts">
useHead({
  titleTemplate: (titleChunk) => {
    return titleChunk ? `${titleChunk} - tourney` : "tourney"
  },
})

const device = useDevice()

// dynamically change layout
const layout = computed(() => {
  return device.isMobile ? "default" : "desktop"
})
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLoadingIndicator />
    <NuxtPwaManifest />
    <NuxtLayout :name="layout">
      <NuxtPage />
    </NuxtLayout>
    <UNotifications />
  </div>
</template>
