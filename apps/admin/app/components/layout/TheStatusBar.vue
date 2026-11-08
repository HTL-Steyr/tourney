<script setup lang="ts">
const runtimeConfig = useRuntimeConfig()
const appVersion = computed(() => runtimeConfig.public.clientVersion || "dev")
const isOnline = useOnline()

const { isSupported, memory } = useMemory()

const memoryLabel = computed(() => {
  if (!isSupported.value) {
    return "Nicht verfügbar"
  }

  const usedHeap = memory.value?.usedJSHeapSize

  if (typeof usedHeap !== "number") {
    return "Nicht verfügbar"
  }

  return size(usedHeap)
})

function size(v: number) {
  const kb = v / 1024 / 1024
  return `${kb.toFixed(2)} MB`
}
</script>

<template>
  <nav class="flex w-full items-center justify-between">
    <div
      class="flex w-full items-center justify-end gap-1 p-1 pr-0 font-mono tracking-tight"
    >
      <UBadge v-if="isOnline" color="success" variant="subtle"> Online </UBadge>
      <UBadge v-else color="error" variant="subtle"> Offline </UBadge>
      <UBadge color="secondary" variant="subtle">
        <NuxtTime
          :datetime="Date.now()"
          year="numeric"
          month="short"
          day="numeric"
          hour="2-digit"
          locale="de-DE"
          minute="2-digit"
        />
      </UBadge>
      <ClientOnly>
        <UBadge color="warning" variant="subtle">
          {{ memoryLabel }}
        </UBadge>
        <template #fallback>
          <USkeleton class="h-5 w-24" />
        </template>
      </ClientOnly>
      <UBadge color="neutral" variant="outline">
        tourney v{{ appVersion }}
      </UBadge>
    </div>
  </nav>
</template>
