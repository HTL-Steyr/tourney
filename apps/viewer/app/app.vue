<script setup lang="ts">
const colorMode = useColorMode()

if (import.meta.client && colorMode.preference === "system") {
  colorMode.preference = "light"
}

useHead({
  titleTemplate: (titleChunk: string | null | undefined) => {
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
  <UApp>
    <NuxtRouteAnnouncer />
    <NuxtLoadingIndicator />
    <NuxtPwaManifest />
    <NuxtLayout :name="layout">
      <NuxtPage />
    </NuxtLayout>
    <UToaster />
  </UApp>
</template>
