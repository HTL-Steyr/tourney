<script setup lang="ts">
const colorMode = useColorMode()

if (import.meta.client && colorMode.preference === "system") {
  colorMode.preference = "light"
}

useHead({
  titleTemplate: (titleChunk) => {
    return titleChunk ? `${titleChunk} - tourney` : "tourney"
  },
})
</script>

<template>
  <UApp>
    <NuxtLoadingIndicator />
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <UToaster />
  </UApp>
</template>
