<script setup lang="ts">
import { useIsPwa } from "~/composables/useIsPwa"
import getNavLinks from "../../utils/getNavLinks"

const links = getNavLinks(true)
const isPwa = useIsPwa()
</script>

<template>
  <nav
    :class="[
      'bg-opacity-70 dark:bg-opacity-70 fixed bottom-0 z-20 flex w-full justify-around border-t border-neutral-200 bg-neutral-50 backdrop-blur-lg dark:border-neutral-800 dark:bg-neutral-900',
      isPwa
        ? 'h-[calc(4rem+env(safe-area-inset-bottom)+0.5rem)] pt-1 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]'
        : 'h-16 py-1',
    ]"
  >
    <div v-for="link in links" :key="link.label">
      <NuxtLink :to="link.to" active-class="text-primary">
        <div class="flex flex-col items-center justify-center p-2 px-4">
          <UIcon :name="link.icon ?? ''" class="h-5 w-5" />
          <p class="text text-sm font-medium text-wrap">{{ link.label }}</p>
        </div>
      </NuxtLink>
    </div>
  </nav>
</template>
