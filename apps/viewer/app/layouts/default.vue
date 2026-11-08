<script setup lang="ts">
import { useIsPwa } from "~/composables/useIsPwa"

const isPwa = useIsPwa()
</script>

<template>
  <div class="flex h-dvh w-full flex-col">
    <TheMobileHeader />
    <main
      :class="[
        'mt-16 grow',
        isPwa ? 'pb-[calc(4rem+env(safe-area-inset-bottom)+0.5rem)]' : 'pb-16',
      ]"
    >
      <slot />
    </main>
    <TheNavigation />
  </div>
</template>
